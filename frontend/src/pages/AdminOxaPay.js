import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, RefreshCw, Webhook, AlertTriangle, CheckCircle2, XCircle, Clock, Copy, RotateCw,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

function statusBadge(wh) {
  const s = wh.status;
  const err = wh.processing_error;
  if (err) return <span className="pill !py-1 !px-2 !text-[10px] bg-red-500/15 border-red-500/30 text-red-300">Error</span>;
  if (s === "Paid" || s === "Confirmed") return <span className="pill !py-1 !px-2 !text-[10px] bg-green-500/15 border-green-500/30 text-green-300">Paid</span>;
  if (s === "Expired") return <span className="pill !py-1 !px-2 !text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-300">Expired</span>;
  if (s === "Failed") return <span className="pill !py-1 !px-2 !text-[10px] bg-red-500/15 border-red-500/30 text-red-300">Failed</span>;
  return <span className="pill !py-1 !px-2 !text-[10px]">{s || "—"}</span>;
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminOxaPay() {
  const { user } = useAuth();
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryOrder, setRetryOrder] = useState("");
  const [retryResult, setRetryResult] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const fetchHooks = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await axios.get(`${API}/admin/oxapay/webhooks?limit=100`, { withCredentials: true });
      setHooks(r.data.webhooks || []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHooks();
    const t = setInterval(fetchHooks, 15000);
    return () => clearInterval(t);
  }, []);

  const handleRetry = async (e) => {
    e?.preventDefault?.();
    if (!retryOrder.trim()) return;
    setRetryLoading(true);
    setRetryResult(null);
    try {
      const r = await axios.post(`${API}/admin/orders/${retryOrder.trim()}/retry`, {}, { withCredentials: true });
      setRetryResult({ ok: true, data: r.data });
    } catch (err) {
      setRetryResult({ ok: false, error: err.response?.data?.detail || err.message });
    } finally {
      setRetryLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="min-h-screen px-6 py-20">
        <div className="max-w-md mx-auto card-surface p-8 text-center">
          <div className="text-white/70 mb-4">Admin access required.</div>
          <Link to="/admin/login" className="btn-primary">Sign in as admin</Link>
        </div>
      </div>
    );
  }

  const counts = hooks.reduce((acc, w) => {
    if (w.processing_error) acc.error++;
    else if (w.status === "Paid" || w.status === "Confirmed") acc.paid++;
    else if (w.status === "Failed" || w.status === "Expired") acc.failed++;
    else acc.other++;
    return acc;
  }, { paid: 0, failed: 0, error: 0, other: 0 });

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8" data-testid="admin-oxapay-page">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-[13px] mb-2 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to admin
            </Link>
            <h1 className="display-md text-white">OxaPay monitoring</h1>
            <p className="text-white/50 text-[14px] mt-1">Live webhook log · refreshes every 15s</p>
          </div>
          <button onClick={fetchHooks} className="btn-secondary !py-2 !px-4 !text-[13px]" data-testid="refresh-hooks-btn">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Paid", value: counts.paid, Icon: CheckCircle2, color: "text-green-400 bg-green-500/15 border-green-500/30" },
            { label: "Failed / Expired", value: counts.failed, Icon: XCircle, color: "text-red-400 bg-red-500/15 border-red-500/30" },
            { label: "Errors", value: counts.error, Icon: AlertTriangle, color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
            { label: "Other", value: counts.other, Icon: Clock, color: "text-violet-300 bg-violet-500/15 border-violet-500/30" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${c.color}`}>
                <c.Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold">{c.label}</div>
                <div className="text-xl font-display font-bold text-white">{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Retry form */}
        <form onSubmit={handleRetry} className="card-surface p-5 mb-8 flex flex-col sm:flex-row items-stretch sm:items-end gap-3" data-testid="retry-form">
          <div className="flex-1">
            <label className="block text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold mb-2">
              Retry order delivery (assigns missing links + resends email)
            </label>
            <input
              type="text"
              value={retryOrder}
              onChange={(e) => setRetryOrder(e.target.value)}
              placeholder="order_id (e.g. ord_abc123)"
              className="w-full bg-[#0a0a0e] border border-white/10 rounded-full px-4 py-2.5 text-white text-[14px] outline-none focus:border-violet-500/60"
              data-testid="retry-order-input"
            />
          </div>
          <button type="submit" disabled={retryLoading || !retryOrder.trim()} className="btn-primary whitespace-nowrap" data-testid="retry-btn">
            <RotateCw className={`h-4 w-4 ${retryLoading ? "animate-spin" : ""}`} />
            Retry
          </button>
        </form>
        {retryResult && (
          <div className={`rounded-xl p-4 mb-8 text-[13px] ${
            retryResult.ok ? "bg-green-500/10 border border-green-500/30 text-green-300" : "bg-red-500/10 border border-red-500/30 text-red-300"
          }`}>
            {retryResult.ok
              ? <>Order <b>{retryResult.data.order_id}</b>: {retryResult.data.status} · {retryResult.data.links_total}/{retryResult.data.links_required} links assigned · email {retryResult.data.email_sent ? "sent" : "not sent"}</>
              : <>Error: {retryResult.error}</>
            }
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">{error}</div>
        )}

        {/* Webhook log */}
        <div className="card-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <Webhook className="h-4 w-4 text-violet-300" />
            <h3 className="text-white font-semibold text-[14px]">Recent webhooks</h3>
            <span className="text-white/40 text-[12px] ml-auto">{hooks.length} entries</span>
          </div>
          {hooks.length === 0 ? (
            <div className="p-10 text-center text-white/40 text-[14px]">No webhook received yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {hooks.map((w, i) => (
                <div key={i} className="px-5 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="shrink-0 pt-0.5">{statusBadge(w)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-[12px] font-mono text-violet-300">{w.order_id || "—"}</code>
                      {w.track_id && <span className="text-[11px] text-white/40 font-mono">track: {w.track_id}</span>}
                      {w.order_id && (
                        <button
                          onClick={() => navigator.clipboard?.writeText(w.order_id)}
                          className="text-white/40 hover:text-white/70 transition-colors"
                          title="Copy order ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {w.details && (
                      <div className="text-[12px] text-white/55 mt-1">
                        {w.details.new_status && <>status → <b className="text-white/80">{w.details.new_status}</b></>}
                        {w.details.links_assigned !== undefined && <> · {w.details.links_assigned} links assigned</>}
                        {w.details.email_sent !== undefined && <> · email {w.details.email_sent ? "✓" : "✗"}</>}
                        {w.details.note && <> · {w.details.note}</>}
                      </div>
                    )}
                    {w.processing_error && (
                      <div className="text-[12px] text-red-400 mt-1 font-mono">{w.processing_error}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-[11px] text-white/40 whitespace-nowrap">
                    {timeAgo(w.received_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
