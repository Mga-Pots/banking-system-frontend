import { useEffect, useRef, useState } from "react";
import Amount from "../../components/ui/Amount";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import ReadOnlyField from "../../components/ui/ReadOnlyField";
import Select from "../../components/ui/Select";
import Skeleton from "../../components/ui/Skeleton";
import { LockIcon } from "../../components/ui/Icons";
import { useToast } from "../../components/ui/Toast";
import AmountPresets from "../../components/customer/AmountPresets";
import CashInSuccess from "../../components/customer/CashInSuccess";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationsContext";
import { usePrivacy } from "../../context/PrivacyContext";
import { getMyAccount } from "../../api/accounts";
import { cashIn } from "../../api/transactions";
import { formatAccountNumber, maskAccountNumber } from "../../utils/formatAccountNumber";
import { formatPeso } from "../../utils/formatPeso";
import { pesosToCentavos, sanitizeAmountInput } from "../../utils/parseAmount";

const PRESETS = [50000, 100000, 500000, 1000000]; // ₱500, ₱1,000, ₱5,000, ₱10,000

// The most that can be added in one cash in (₱50,000). The page enforces it and shows it
// to the customer. To be confirmed with the backend (see docs/alignment-fixes.md).
const CASH_IN_LIMIT = 5000000;
const LIMIT_TEXT = formatPeso(CASH_IN_LIMIT).replace(/\.00$/, "");

const messageOf = (err) => err.response?.data?.message ?? err.message;

// Turns what was typed into centavos plus the reason it can't be used yet, if any.
// A trailing point ("12.") is fine while the customer is still typing.
const readAmount = (text) => {
  if (text === "")
    return {
      centavos: null,
      problem: "Enter an amount to continue.",
      typing: true,
    };
  const centavos = pesosToCentavos(text.replace(/\.$/, ""));
  if (centavos === null)
    return {
      centavos: null,
      problem: "Enter a valid amount, like 1,000 or 250.50.",
    };
  if (centavos <= 0)
    return { centavos: null, problem: "Enter an amount greater than ₱0.00." };
  if (centavos > CASH_IN_LIMIT)
    return {
      centavos: null,
      problem: `Cash in is limited to ${LIMIT_TEXT} at a time.`,
    };
  return { centavos, problem: "" };
};

// Loads the account and returns the page's load state; it never throws.
const fetchAccount = () =>
  getMyAccount().then(
    (res) => ({ status: "ready", account: res.data, error: "" }),
    (err) => ({ status: "error", account: null, error: messageOf(err) }),
  );

const blockedMessage = {
  frozen:
    "Your account is frozen. Cash in is paused until staff reactivate it. Please contact sinop staff for help.",
  closed: "This account is closed, so funds can’t be added.",
};

export default function CashIn() {
  const { showToast } = useToast();
  const { refresh: refreshNotifications } = useNotifications();
  const { user } = useAuth();
  const { hidden } = usePrivacy();
  const [load, setLoad] = useState({
    status: "loading",
    account: null,
    error: "",
  });
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null); // { amount, balance, referenceNumber }
  const [addingMore, setAddingMore] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetchAccount().then((next) => active && setLoad(next));
    return () => {
      active = false;
    };
  }, []);

  const { account } = load;
  const loading = load.status === "loading";
  const blocked = Boolean(account) && account.status !== "active";
  const { centavos, problem, typing } = readAmount(amountText);
  const canSubmit = centavos !== null && !loading && !blocked && !submitting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      inputRef.current?.focus();
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await cashIn({ amount: centavos });
      // The response is the transaction, so ask for the account again to show the real balance.
      let balance = account.balance + centavos;
      try {
        balance = (await getMyAccount()).data.balance;
      } catch {
        // keep the computed balance; the overview will refresh it
      }
      setLoad((current) => ({
        ...current,
        account: { ...current.account, balance },
      }));
      setResult({
        amount: centavos,
        balance,
        referenceNumber: res.data.referenceNumber,
      });
      showToast(`Naidagdag na. Ref ${res.data.referenceNumber}`);
      refreshNotifications();
    } catch (err) {
      setSubmitError(messageOf(err));
    } finally {
      setSubmitting(false);
    }
  };

  const addMore = () => {
    setResult(null);
    setAmountText("");
    setAddingMore(true);
  };

  return (
    <div>
      {/* The page title ("Cash in") is shown in the header */}
      <p className="text-[15px] text-muted">
        Add simulated funds to your account. No real money moves.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,560px)_300px]">
        <Card aria-busy={loading}>
          {load.status === "error" ? (
            <div role="alert">
              <p className="text-[15px] font-semibold text-text">
                We couldn’t load your account
              </p>
              <p className="mt-1 mb-4 text-sm text-muted">{load.error}</p>
              <Button
                onClick={() => {
                  setLoad({ status: "loading", account: null, error: "" });
                  fetchAccount().then(setLoad);
                }}
              >
                Try again
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {blocked && (
                <div
                  role="status"
                  className="mb-5 flex items-start gap-3 rounded-2xl bg-status-flagged px-4 py-3 text-sm font-semibold text-status-flagged-text"
                >
                  <LockIcon size={18} className="mt-0.5 shrink-0" />
                  <p>
                    {blockedMessage[account.status] ??
                      "This account can’t receive funds right now."}
                  </p>
                </div>
              )}

              <fieldset
                disabled={blocked || submitting}
                className="min-w-0 border-0 p-0"
              >
                <legend className="sr-only">Cash in details</legend>

                {/* Every customer has exactly one account, so there is nothing to choose */}
                <ReadOnlyField
                  id="cash-in-account"
                  label="Account Details"
                  hint={
                    loading ? (
                      <Skeleton className="h-5 w-44" />
                    ) : (
                      <>
                        Current balance:{" "}
                        <Amount
                          centavos={account.balance}
                          sensitive
                          className="font-bold text-ink"
                        />
                      </>
                    )
                  }
                >
                  {loading ? (
                    <Skeleton className="h-5 w-56" />
                  ) : (
                    `${user?.name} · ${
                      hidden
                        ? maskAccountNumber(account.accountNumber)
                        : formatAccountNumber(account.accountNumber)
                    }`
                  )}
                </ReadOnlyField>

                <div className="mt-5">
                  <Input
                    ref={inputRef}
                    id="cash-in-amount"
                    label="Amount"
                    prefix="₱"
                    inputMode="decimal"
                    autoComplete="off"
                    autoFocus={addingMore}
                    maxLength={12}
                    placeholder="0.00"
                    value={amountText}
                    onChange={(e) =>
                      setAmountText(sanitizeAmountInput(e.target.value))
                    }
                    error={!typing && problem ? problem : undefined}
                  />
                </div>

                <p className="mt-2 text-sm text-muted">
                  Transfer limit: {LIMIT_TEXT} per cash in
                </p>

                <div className="mt-4">
                  <AmountPresets
                    presets={PRESETS}
                    value={centavos}
                    onSelect={(preset) => setAmountText(String(preset / 100))}
                    disabled={blocked || submitting}
                  />
                </div>

                {/* There is no real source of money: the funds are simulated */}
                <div className="mt-5">
                  <Select
                    id="cash-in-from"
                    label="From"
                    hint="Simulated funds, so no real money moves."
                  >
                    <option value="simulated">Simulated funds</option>
                  </Select>
                </div>

                {submitError && (
                  <p
                    role="alert"
                    className="mt-4 text-sm font-semibold text-error"
                  >
                    {submitError}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="mt-5 w-full"
                  disabled={!canSubmit}
                  aria-describedby="cash-in-reason"
                >
                  {submitting ? "Adding funds…" : "Add funds"}
                </Button>
                <p
                  id="cash-in-reason"
                  className="mt-2 min-h-5 text-center text-xs text-muted"
                >
                  {blocked || loading || canSubmit || submitting ? "" : problem}
                </p>
              </fieldset>
            </form>
          )}
        </Card>

        <Card as="aside" aria-labelledby="how-title">
          <h2 id="how-title" className="text-base font-bold text-text">
            How cash in works
          </h2>
          <ul className="mt-3 space-y-3 text-sm text-label">
            <li>
              These are simulated funds. No real money moves, and nothing is
              linked to a real bank.
            </li>
            <li>The amount is added to your account right away.</li>
            <li>You’ll see it under Recent transactions on your overview.</li>
          </ul>
        </Card>
      </div>

      {result && (
        <CashInSuccess
          amount={result.amount}
          referenceNumber={result.referenceNumber}
          onClose={addMore}
        />
      )}
    </div>
  );
}
