import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, RefreshCw, TrendingUp, MousePointer, Eye, CheckCircle2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

// Known experiments. Add more here when you launch new ones.
const EXPERIMENTS = [
  {
    key: "best_value_label",
    title: "Badge label — pack_10",
    description: "A/B test on the 'Best value' badge wording on the Business pack.",
    variants: {
      a: "Best value / Meilleur prix",
      b: "Most chosen / Le plus choisi",
    },
  },
];

// Two-proportion z-test — returns {uplift_pct, z, pvalue, significant}
function twoPropZTest(xA, nA, xB, nB) {
  if (nA < 30 || nB < 30) return { significant: false, insufficient: true };
  const pA = xA / nA;
  const pB = xB / nB;
  const pPool = (xA + xB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  if (se === 0) return { significant: false, insufficient: true };
  const z = (pB - pA) / se;
  // two-sided normal approximation
  const pvalue = 2 * (1 - normalCdf(Math.abs(z)));
  const uplift_pct = pA > 0 ? ((pB - pA) / pA) * 100 : null;
  return {
    uplift_pct,
    z,
    pvalue,
    significant: pvalue < 0.05,
    winner: pvalue < 0.05 ? (pB > pA ? "b" : "a") : null,
    insufficient: false,
  };
}
function normalCdf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
      <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-violet-300" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 font-semibold">{label}</div>
        <div className="text-xl font-display font-bold text-white tracking-tight">{value}</div>
        {sub && <div className="text-[11px] text-white/40 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function VariantCard({ letter, name, data, isWinner }) {
  return (
    <div className={`relative rounded-2xl p-6 border ${
      isWinner
        ? "bg-gradient-to-b from-violet-900/30 to-[#0a0a0e] border-violet-500/50"
        : "bg-[#0f0f14] border-white/[0.06]"
    }`}>
      {isWinner && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500 text-black text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" /> Winner
          </span>
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
          letter === "A" ? "bg-violet-500/20 text-violet-300 border border-violet-500/40" : "bg-pink-500/20 text-pink-300 border border-pink-500/40"
        }`}>
          {letter}
        </span>
        <span className="text-white/50 text-[13px] font-mono">{name}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Views</div>
          <div className="text-lg font-display font-bold text-white">{data.view}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Clicks</div>
          <div className="text-lg font-display font-bold text-white">{data.click}</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Conv.</div>
          <div className="text-lg font-display font-bold text-white">{data.conversion}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">CTR</div>
          <div className="text-base font-display font-bold text-violet-300">{data.ctr?.toFixed(2) ?? "0.00"}%</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Conv. rate</div>
          <div className="text-base font-display font-bold text-green-400">{data.cr?.toFixed(2) ?? "0.00"}%</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAB() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const results = {};
      for (const exp of EXPERIMENTS) {
        const r = await axios.get(`${API}/ab/stats/${exp.key}`);
        results[exp.key] = r.data;
      }
      setStats(results);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, []);

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

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8" data-testid="admin-ab-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-[13px] mb-2 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to admin
            </Link>
            <h1 className="display-md text-white">A/B experiments</h1>
            <p className="text-white/50 text-[14px] mt-1">Live traffic stats · refreshes every 15s</p>
          </div>
          <button onClick={fetchAll} className="btn-secondary !py-2 !px-4 !text-[13px]" data-testid="refresh-ab-btn">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Experiments */}
        <div className="space-y-10">
          {EXPERIMENTS.map((exp) => {
            const s = stats[exp.key];
            if (!s) return null;
            const totalViews = s.variant_a.view + s.variant_b.view;
            const totalClicks = s.variant_a.click + s.variant_b.click;
            const totalConv = s.variant_a.conversion + s.variant_b.conversion;

            // Significance on conversion rate
            const sig = twoPropZTest(
              s.variant_a.conversion, s.variant_a.view,
              s.variant_b.conversion, s.variant_b.view,
            );

            return (
              <section key={exp.key} data-testid={`experiment-${exp.key}`}>
                <div className="mb-5">
                  <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                    <h2 className="text-white font-display font-bold text-xl tracking-tight">{exp.title}</h2>
                    <code className="text-[11px] text-violet-400/80 font-mono">{exp.key}</code>
                  </div>
                  <p className="text-white/50 text-[14px]">{exp.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <Stat icon={Eye} label="Total views" value={totalViews.toLocaleString()} />
                  <Stat icon={MousePointer} label="Total clicks" value={totalClicks.toLocaleString()}
                        sub={totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}% CTR` : "—"} />
                  <Stat icon={CheckCircle2} label="Conversions" value={totalConv.toLocaleString()}
                        sub={totalViews > 0 ? `${((totalConv / totalViews) * 100).toFixed(2)}% CR` : "—"} />
                  <Stat
                    icon={TrendingUp}
                    label="Uplift (B vs A)"
                    value={sig.insufficient ? "—" : `${sig.uplift_pct > 0 ? "+" : ""}${sig.uplift_pct?.toFixed(1) ?? "0.0"}%`}
                    sub={
                      sig.insufficient
                        ? "Need 30+ views per variant"
                        : sig.significant
                          ? `p = ${sig.pvalue.toFixed(4)} · 95% confident`
                          : `p = ${sig.pvalue.toFixed(4)} · not significant`
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <VariantCard
                    letter="A"
                    name={exp.variants.a}
                    data={s.variant_a}
                    isWinner={!sig.insufficient && sig.significant && sig.winner === "a"}
                  />
                  <VariantCard
                    letter="B"
                    name={exp.variants.b}
                    data={s.variant_b}
                    isWinner={!sig.insufficient && sig.significant && sig.winner === "b"}
                  />
                </div>

                {/* Verdict */}
                <div className="mt-5 rounded-xl bg-[#0a0a0e] border border-white/[0.06] p-4 text-[13.5px] text-white/70">
                  <span className="text-white/50 font-semibold mr-2">Verdict:</span>
                  {sig.insufficient && (
                    <span>Not enough data yet. Keep the test running until each variant has at least 30 views.</span>
                  )}
                  {!sig.insufficient && sig.significant && sig.winner === "a" && (
                    <span>Variant <b className="text-violet-300">A</b> wins with a {Math.abs(sig.uplift_pct).toFixed(1)}% relative lift over B on conversion rate (p={sig.pvalue.toFixed(4)}).</span>
                  )}
                  {!sig.insufficient && sig.significant && sig.winner === "b" && (
                    <span>Variant <b className="text-pink-300">B</b> wins with a +{sig.uplift_pct.toFixed(1)}% relative lift over A on conversion rate (p={sig.pvalue.toFixed(4)}).</span>
                  )}
                  {!sig.insufficient && !sig.significant && (
                    <span>No statistically significant difference yet (p={sig.pvalue.toFixed(4)}). Keep collecting data.</span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
