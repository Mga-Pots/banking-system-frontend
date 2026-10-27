import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Amount from "../../components/ui/Amount";
import Skeleton from "../../components/ui/Skeleton";
import Weave from "../../components/ui/Weave";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  PlusIcon,
} from "../../components/ui/Icons";
import { useToast } from "../../components/ui/Toast";
import CopyButton from "../../components/ui/CopyButton";
import Sensitive from "../../components/ui/Sensitive";
import AccountCard from "../../components/customer/AccountCard";
import CardDetailsModal from "../../components/customer/CardDetailsModal";
import CardPlaceholder from "../../components/customer/CardPlaceholder";
import MonthSummary from "../../components/customer/MonthSummary";
import QuickTransfer from "../../components/customer/QuickTransfer";
import TransactionDetailsModal from "../../components/customer/TransactionDetailsModal";
import TransactionRow from "../../components/customer/TransactionRow";
import TransferReviewModal from "../../components/customer/TransferReviewModal";
import { formatAccountNumber, lastFour } from "../../utils/formatAccountNumber";
import { useAuth } from "../../context/AuthContext";
import { usePrivacy } from "../../context/PrivacyContext";
import { getMyAccount, getRecentRecipients } from "../../api/accounts";
import { cancelTransaction, getMyTransactions } from "../../api/transactions";

const messageOf = (err) => err.response?.data?.message ?? err.message;
const emptySummary = { moneyInThisMonth: 0, moneyOutThisMonth: 0 };

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { hidden, toggle } = usePrivacy();

  const [data, setData] = useState({
    status: "loading",
    account: null,
    history: null,
    recipients: [],
    error: "",
  });
  const [openTx, setOpenTx] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [review, setReview] = useState(null); // { recipientAccountNumber, amount }
  const [transferKey, setTransferKey] = useState(0); // changing it resets Quick transfer

  const load = useCallback(async () => {
    try {
      const [account, history, recipients] = await Promise.all([
        getMyAccount(),
        getMyTransactions({ limit: 5 }),
        // Recent recipients are a nice-to-have: the dashboard works without them.
        getRecentRecipients().catch(() => ({ data: [] })),
      ]);
      setData({
        status: "ready",
        account: account.data,
        history: history.data,
        recipients: recipients.data,
        error: "",
      });
    } catch (err) {
      setData((current) => ({
        ...current,
        status: "error",
        error: messageOf(err),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setData((current) => ({ ...current, status: "loading", error: "" }));
    load();
  };

  const { account, history, recipients } = data;
  const loading = data.status === "loading";

  if (data.status === "error" && !account) {
    return (
      <Card role="alert">
        <h1 className="text-xl font-bold text-text">
          We couldn’t load your dashboard
        </h1>
        <p className="mt-1 mb-4 text-muted">{data.error}</p>
        <Button onClick={retry}>Try again</Button>
      </Card>
    );
  }

  const frozen = account?.status === "frozen";
  const verified = Boolean(user?.isVerified);
  const transactions = history?.transactions ?? [];
  const onHold = history?.counts?.pending ?? 0;
  // People we know by account number, so rows can say "To Pedro G." instead of a number
  const names = Object.fromEntries(
    recipients.map((r) => [r.accountNumber, r.displayName]),
  );

  // Cancels a pending transfer from the details dialog, then refreshes the balance,
  // the on-hold count and the list. A failure goes back to the dialog to show.
  const handleCancel = async (tx) => {
    await cancelTransaction(tx._id);
    setOpenTx(null);
    showToast("Transfer cancelled. The money was refunded to your account.");
    load();
  };

  const handleSent = (tx) => {
    setReview(null);
    setTransferKey((key) => key + 1);
    showToast(
      tx.status === "pending"
        ? "Naipadala na. Held for staff review ang transfer."
        : `Naipadala na. Ref ${tx.referenceNumber}`,
    );
    load();
  };

  return (
    <>
      <h1 className="sr-only">Overview</h1>

      {frozen && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl bg-status-flagged px-5 py-4 text-sm font-semibold text-status-flagged-text"
        >
          <LockIcon size={18} className="mt-0.5 shrink-0" />
          <p>
            Your account is frozen. Cash in and transfers are paused until staff
            reactivate it. Please contact sinop staff for help.
          </p>
        </div>
      )}

      {data.status === "error" && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-failed px-5 py-4 text-sm font-semibold text-status-failed-text"
        >
          <span>Couldn’t refresh: {data.error}</span>
          <button
            type="button"
            onClick={retry}
            className="-my-3 cursor-pointer py-3 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section
            aria-label="Account balance"
            aria-busy={loading}
            className="relative isolate grid gap-6 overflow-hidden rounded-[20px] bg-ink p-6 text-white md:grid-cols-2 md:items-center"
          >
            <Weave
              className="text-white [mask-image:linear-gradient(to_left,black,transparent_80%)]"
              opacity={0.1}
            />
            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-[13px] text-white/70">Account number</p>
                  {loading ? (
                    <Skeleton className="mt-1 h-7 w-48 bg-white/10" />
                  ) : (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-xl font-semibold tracking-[0.06em] whitespace-nowrap tabular-nums">
                        <Sensitive
                          mask={`•••• •••• ${lastFour(account.accountNumber)}`}
                        >
                          {formatAccountNumber(account.accountNumber)}
                        </Sensitive>
                      </p>
                      <CopyButton
                        value={account.accountNumber}
                        label="Copy account number"
                        onCopied={() => showToast("Account number copied")}
                        className="text-white hover:bg-white/15"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] text-white/80">Available balance</p>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={
                      hidden
                        ? "Show balance and account details"
                        : "Hide balance and account details"
                    }
                    className="relative flex size-8 cursor-pointer items-center justify-center rounded-full text-white transition before:absolute before:-inset-1.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {hidden ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {loading ? (
                  <Skeleton className="mt-2 h-12 w-56 bg-white/10" />
                ) : (
                  <p className="mt-2 font-brand text-[38px] leading-none font-bold tracking-[-0.01em] text-white">
                    <Amount
                      centavos={account.balance}
                      sensitive
                      split
                      mask="₱ ••••••"
                    />
                  </p>
                )}
                {onHold > 0 && (
                  <p className="mt-3 inline-block rounded-full bg-status-pending px-3 py-1 text-xs font-bold text-status-pending-text">
                    {onHold} {onHold === 1 ? "transfer" : "transfers"} on hold
                    for review
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  to="/customer/cash-in"
                  disabled={loading || frozen}
                >
                  <PlusIcon size={16} /> Cash in
                </Button>
                <Button
                  variant="accent"
                  size="lg"
                  to="/customer/transfer"
                  disabled={loading || frozen}
                >
                  Transfer <ArrowRightIcon size={16} />
                </Button>
              </div>
            </div>

            {loading ? (
              <Skeleton className="relative min-h-[190px] bg-white/10" />
            ) : verified ? (
              <AccountCard
                account={account}
                holder={user?.name ?? ""}
                onViewDetails={() => setDetailsOpen(true)}
              />
            ) : (
              <CardPlaceholder />
            )}
          </section>

          <Card aria-labelledby="recent-title" aria-busy={loading}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 id="recent-title" className="text-xl font-bold text-text">
                Recent transactions
              </h2>
              <Link
                to="/customer/history"
                className="-my-3 inline-flex items-center py-3 text-sm font-bold text-wallet hover:underline"
              >
                See all
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 pt-2">
                <Skeleton className="h-[72px]" />
                <Skeleton className="h-[72px]" />
                <Skeleton className="h-[72px]" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="relative flex flex-col items-center gap-3 overflow-hidden py-12 text-center">
                <Weave
                  className="text-ink [mask-image:radial-gradient(closest-side,black,transparent)]"
                  opacity={0.14}
                />
                <p className="relative text-[15px] font-semibold text-text">
                  No transactions yet
                </p>
                <p className="relative max-w-xs text-sm text-muted">
                  <span lang="fil">Simulan natin:</span> add some simulated
                  funds to your account.
                </p>
                <Button
                  to="/customer/cash-in"
                  disabled={frozen}
                  className="relative"
                >
                  Make your first cash in
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-divider">
                {transactions.map((tx) => (
                  <li key={tx._id}>
                    <TransactionRow
                      tx={tx}
                      myAccountId={account._id}
                      names={names}
                      onSelect={setOpenTx}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <MonthSummary
            summary={history?.summary ?? emptySummary}
            loading={loading}
          />
          {loading ? (
            <Card aria-busy="true" className="space-y-4">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-13 rounded-full" />
            </Card>
          ) : (
            <QuickTransfer
              key={transferKey}
              recipients={recipients}
              available={account.balance}
              frozen={frozen}
              onReview={setReview}
            />
          )}
        </div>
      </div>

      {openTx && (
        <TransactionDetailsModal
          tx={openTx}
          myAccountId={account._id}
          names={names}
          onClose={() => setOpenTx(null)}
          onCancel={handleCancel}
        />
      )}
      {detailsOpen && (
        <CardDetailsModal
          account={account}
          holder={user?.name ?? ""}
          onClose={() => setDetailsOpen(false)}
        />
      )}
      {review && (
        <TransferReviewModal
          recipientAccountNumber={review.recipientAccountNumber}
          amount={review.amount}
          fromAccount={account}
          onClose={() => setReview(null)}
          onSent={handleSent}
        />
      )}
    </>
  );
}
