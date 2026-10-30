import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Skeleton from "../../components/ui/Skeleton";
import Weave from "../../components/ui/Weave";
import { SearchIcon } from "../../components/ui/Icons";
import { useToast } from "../../components/ui/Toast";
import Pagination from "../../components/customer/Pagination";
import TransactionDetailsModal from "../../components/customer/TransactionDetailsModal";
import TransactionRow from "../../components/customer/TransactionRow";
import { useNotifications } from "../../context/NotificationsContext";
import { getMyAccount, getRecentRecipients } from "../../api/accounts";
import { cancelTransaction, getMyTransactions } from "../../api/transactions";
import { formatLongDate } from "../../utils/formatDate";

const messageOf = (err) => err.response?.data?.message ?? err.message;

// The filter bar is one row of dropdowns, like the staff and admin pages: each one's
// name sits in its "All" option. The count shows in the summary line under the bar.
const STATUSES = [
  { value: "", label: "Status: All" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "flagged", label: "Flagged" },
];
const TYPES = [
  { value: "", label: "Type: All" },
  { value: "cash_in", label: "Cash in" },
  { value: "transfer", label: "Transfer" },
];
const PERIODS = [
  { value: "", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "3m", label: "Last 3 months" },
  { value: "custom", label: "Custom range" },
];
const isKnown = (options, value) => options.some((o) => o.value === value);

// "YYYY-MM-DD" for a day, which is what <input type="date"> reads and writes.
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const dayParam = (value) => (DAY.test(value ?? "") ? value : "");
const toISODay = (date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, "0")).join("-");

const SEARCH_DELAY_MS = 300;

export default function History() {
  const { showToast } = useToast();
  const { refresh: refreshNotifications } = useNotifications();
  const [params, setParams] = useSearchParams();

  // Everything the customer chose lives in the URL, so refresh and back/forward work.
  const status = isKnown(STATUSES, params.get("status")) ? params.get("status") : "";
  const type = isKnown(TYPES, params.get("type")) ? params.get("type") : "";
  const q = params.get("q") ?? "";
  const period = isKnown(PERIODS, params.get("period")) ? params.get("period") : "";
  const from = period === "custom" ? dayParam(params.get("from")) : "";
  const to = period === "custom" ? dayParam(params.get("to")) : "";
  const today = toISODay(new Date());
  const rangeError = from && to && from > to ? "Start date must be on or before the end date." : "";
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);

  // Changes some params and keeps the rest (like ?scenario=). An empty value removes it.
  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) => {
            if (value) next.set(key, String(value));
            else next.delete(key);
          });
          return next;
        },
        { replace },
      );
    },
    [setParams],
  );

  // Search: typing updates the box at once, the list follows after a short pause.
  const [term, setTerm] = useState(q);
  const committed = useRef(q);
  useEffect(() => {
    // The URL changed on its own (back/forward): follow it.
    if (q !== committed.current) {
      committed.current = q;
      setTerm(q);
    }
  }, [q]);
  useEffect(() => {
    const wanted = term.trim();
    if (wanted === committed.current) return;
    const timer = setTimeout(() => {
      committed.current = wanted;
      update({ q: wanted, page: "" }, { replace: true });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [term, update]);

  // The customer's account and the people they sent to (for "To Pedro G." rows).
  const [meta, setMeta] = useState({ account: null, names: {}, error: "" });
  const loadMeta = useCallback(async () => {
    try {
      const [account, recipients] = await Promise.all([
        getMyAccount(),
        // Names are a nice-to-have: rows fall back to the account number without them.
        getRecentRecipients().catch(() => ({ data: [] })),
      ]);
      setMeta({
        account: account.data,
        names: Object.fromEntries(recipients.data.map((r) => [r.accountNumber, r.displayName])),
        error: "",
      });
    } catch (err) {
      setMeta((current) => ({ ...current, error: messageOf(err) }));
    }
  }, []);
  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // The list. `result.key` says which request the data belongs to, so while it
  // doesn't match the current one we are loading, and the old rows stay on screen.
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, history: null, error: "" });
  const key = [status, type, q, period, from, to, page, reloadKey].join("|");
  useEffect(() => {
    if (rangeError) return; // wait for a valid range; the old rows stay on screen
    let active = true; // false once these filters are replaced, so late answers are ignored
    getMyTransactions({ status, type, search: q, period, from, to, page })
      .then((res) => {
        if (!active) return;
        const { totalPages } = res.data.pagination;
        if (totalPages > 0 && page > totalPages) {
          // Past the last page (an old link, or the last row on it was just removed)
          update({ page: totalPages > 1 ? totalPages : "" }, { replace: true });
          return;
        }
        setResult({ key, history: res.data, error: "" });
      })
      .catch((err) => {
        if (active) setResult((current) => ({ ...current, key, error: messageOf(err) }));
      });
    return () => {
      active = false;
    };
  }, [key, rangeError, status, type, q, period, from, to, page, update]);

  const [openTx, setOpenTx] = useState(null);
  const listRef = useRef(null);

  const { account, names } = meta;
  const { history } = result;
  const loading = !rangeError && result.key !== key;
  const transactions = history?.transactions ?? [];
  const pagination = history?.pagination;
  // "Custom range" with no dates picked yet doesn't filter anything
  const dateActive = Boolean(period) && (period !== "custom" || Boolean(from || to));
  const hasFilters = Boolean(status || type || q || dateActive);
  const frozen = account?.status === "frozen";

  const retry = () => {
    if (meta.error) loadMeta();
    setReloadKey((n) => n + 1);
  };

  const clearFilters = () => {
    setTerm("");
    committed.current = "";
    update({ status: "", type: "", q: "", period: "", from: "", to: "", page: "" });
  };

  const goToPage = (next) => {
    update({ page: next > 1 ? next : "" });
    listRef.current?.scrollIntoView({ block: "start" });
  };

  const handleCancel = async (tx) => {
    await cancelTransaction(tx._id);
    setOpenTx(null);
    showToast("Transfer cancelled. The money was refunded to your account.");
    setReloadKey((n) => n + 1);
    refreshNotifications();
  };

  const error = meta.error || (!loading && result.error);
  if (error && !(account && history)) {
    return (
      <Card role="alert">
        <h2 className="text-xl font-bold text-text">We couldn’t load your transactions</h2>
        <p className="mt-1 mb-4 text-muted">{error}</p>
        <Button onClick={retry}>Try again</Button>
      </Card>
    );
  }

  const labelOf = (options, value) => options.find((o) => o.value === value)?.label;
  const dayLabel = (iso) => formatLongDate(`${iso}T00:00:00`);
  const periodLabel =
    period === "custom"
      ? from && to
        ? `${dayLabel(from)} to ${dayLabel(to)}`
        : from
          ? `From ${dayLabel(from)}`
          : to
            ? `Until ${dayLabel(to)}`
            : "Custom range"
      : labelOf(PERIODS, period);
  const activeFilters = [
    dateActive && periodLabel,
    type && labelOf(TYPES, type),
    status && labelOf(STATUSES, status),
    q && `“${q}”`,
  ].filter(Boolean);

  const firstLoad = !history || !account;
  const announcement = loading
    ? ""
    : pagination?.total
      ? `${pagination.total} ${pagination.total === 1 ? "transaction" : "transactions"} found. Page ${pagination.page} of ${pagination.totalPages}.`
      : "No transactions found.";

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-status-failed px-5 py-4 text-sm font-semibold text-status-failed-text"
        >
          <span>Couldn’t refresh: {error}</span>
          <button type="button" onClick={retry} className="-my-3 cursor-pointer py-3 underline">
            Try again
          </button>
        </div>
      )}

      <Card ref={listRef} aria-label="All transactions" aria-busy={loading} className="scroll-mt-4">
        <p role="status" className="sr-only">
          {announcement}
        </p>

        {/* One filter row from xl. Narrower, the dropdowns need room for "Status: All · 11":
            three across under the search from lg, Type and Status paired from sm, and
            every control on its own line on phones. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_11rem_11rem_11rem]">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
            <Input
              id="history-search"
              type="search"
              label="Search"
              hideLabel
              placeholder="Reference, account or amount"
              autoComplete="off"
              prefix={<SearchIcon size={16} />}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <Select
            id="history-type"
            label="Type"
            hideLabel
            value={type}
            onChange={(e) => update({ type: e.target.value, page: "" })}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <Select
            id="history-status"
            label="Status"
            hideLabel
            value={status}
            onChange={(e) => update({ status: e.target.value, page: "" })}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2 lg:col-span-1">
            <Select
              id="history-period"
              label="Date"
              hideLabel
              value={period}
              onChange={(e) => update({ period: e.target.value, from: "", to: "", page: "" })}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {period === "custom" && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input
              id="history-from"
              type="date"
              label="From"
              max={to || today}
              value={from}
              error={rangeError}
              onChange={(e) => update({ from: e.target.value, page: "" })}
            />
            <Input
              id="history-to"
              type="date"
              label="To"
              min={from || undefined}
              max={today}
              value={to}
              onChange={(e) => update({ to: e.target.value, page: "" })}
            />
          </div>
        )}

        {pagination && pagination.total > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <p className="min-w-0 text-muted">
              <span className="font-bold text-text">
                {pagination.total} {pagination.total === 1 ? "transaction" : "transactions"}
              </span>
              {activeFilters.length > 0 && ` · ${activeFilters.join(" · ")}`}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="-my-3 shrink-0 cursor-pointer py-3 font-bold text-wallet hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wallet"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        <div className="mt-4">
          {firstLoad ? (
            <div className="space-y-3 pt-2">
              {[0, 1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-[72px]" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            !hasFilters ? (
              <div className="relative flex flex-col items-center gap-3 overflow-hidden py-12 text-center">
                <Weave
                  className="text-ink [mask-image:radial-gradient(closest-side,black,transparent)]"
                  opacity={0.14}
                />
                <p className="relative text-[15px] font-semibold text-text">No transactions yet</p>
                <p className="relative max-w-xs text-sm text-muted">
                  <span lang="fil">Simulan natin:</span> add some simulated funds to your account.
                </p>
                <Button to="/customer/cash-in" disabled={frozen} className="relative">
                  Make your first cash in
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-[15px] font-semibold text-text">No transactions match your filters</p>
                <p className="max-w-xs text-sm text-muted">
                  Try a different search, or clear the filters to see everything.
                </p>
                {hasFilters && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )
          ) : (
            <ul className={`divide-y divide-divider transition-opacity ${loading || rangeError ? "opacity-50" : ""}`}>
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
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex justify-center border-t border-divider pt-4">
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={goToPage} />
          </div>
        )}
      </Card>

      {openTx && (
        <TransactionDetailsModal
          tx={openTx}
          myAccountId={account._id}
          names={names}
          onClose={() => setOpenTx(null)}
          onCancel={handleCancel}
          onUpdated={(updated) => {
            setOpenTx(updated);
            setReloadKey((n) => n + 1);
          }}
        />
      )}
    </>
  );
}
