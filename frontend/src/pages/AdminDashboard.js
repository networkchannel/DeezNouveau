import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { securePost } from "@/utils/secureApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminPresence from "@/components/AdminPresence";
import {
  DollarSign, Package, Link2, TrendingUp, Loader2, Trash2, Plus, Upload,
  Shield, Users, Globe, AlertTriangle, Ban, CheckCircle, BarChart3,
  Clock, Eye, RefreshCw, Activity, Zap, Server, Hash, ExternalLink,
  Play, Square, Settings, Cpu, Target, Gauge, RotateCcw, Database
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [links, setLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [blockedList, setBlockedList] = useState({ blocked_ips: [], blocked_emails: [] });
  const [analytics, setAnalytics] = useState(null);
  const [usersByCountry, setUsersByCountry] = useState({});
  const [importText, setImportText] = useState("");
  const [singleLink, setSingleLink] = useState("");
  const [blockIpInput, setBlockIpInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Generator state
  const [genStatus, setGenStatus] = useState(null);
  const [genWorkers, setGenWorkers] = useState(5);
  const [genStarting, setGenStarting] = useState(false);
  const [genStopping, setGenStopping] = useState(false);
  const [autoRestockEnabled, setAutoRestockEnabled] = useState(false);
  const [autoRestockThreshold, setAutoRestockThreshold] = useState(0);
  const [autoRestockTarget, setAutoRestockTarget] = useState(20);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false);
  const genPollRef = useRef(null);

  // Manual order creation
  const [manualEmail, setManualEmail] = useState("");
  const [manualPackId, setManualPackId] = useState("single");
  const [manualQty, setManualQty] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [manualStatus, setManualStatus] = useState("completed");
  const [manualSendEmail, setManualSendEmail] = useState(true);
  const [manualAssignLinks, setManualAssignLinks] = useState(true);
  const [manualExplicitLinks, setManualExplicitLinks] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualLang, setManualLang] = useState("fr");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    setRefreshing(true);
    try {
      const [statsRes, ordersRes, linksRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/admin/orders?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/links?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/users?limit=100`, { withCredentials: true }),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders || []);
      setLinks(linksRes.data.links || []);
      setUsers(usersRes.data.users || []);
    } catch (err) { console.error("fetch err", err); }
    setRefreshing(false);
  }, [user]);

  const fetchSecurityData = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [logsRes, blockedRes] = await Promise.all([
        axios.get(`${API}/admin/security/logs?limit=50`, { withCredentials: true }),
        axios.get(`${API}/admin/security/blocked`, { withCredentials: true }),
      ]);
      setSecurityLogs(logsRes.data.logs || []);
      setBlockedList(blockedRes.data);
    } catch {}
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [analyticsRes, countryRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`, { withCredentials: true }),
        axios.get(`${API}/admin/users/by-country`, { withCredentials: true }),
      ]);
      setAnalytics(analyticsRes.data);
      setUsersByCountry(analyticsRes.data?.countries || countryRes.data.countries || {});
    } catch {}
  }, [user]);

  const fetchAutoCheckStatus = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    try {
      const res = await axios.get(`${API}/admin/stock/auto-check/status`, { withCredentials: true });
      setAutoCheckEnabled(res.data.enabled);
    } catch {}
  }, [user]);

  const fetchGenStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/generator/status`, { withCredentials: true });
      setGenStatus(data);
      if (data.auto_restock) {
        setAutoRestockEnabled(data.auto_restock.enabled);
        setAutoRestockThreshold(data.auto_restock.threshold);
        setAutoRestockTarget(data.auto_restock.target);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchData();
      fetchSecurityData();
      fetchAnalytics();
      fetchGenStatus();
      fetchAutoCheckStatus();
    }
  }, [user, fetchData, fetchSecurityData, fetchAnalytics, fetchGenStatus, fetchAutoCheckStatus]);

  // Poll generator status when on generator tab
  useEffect(() => {
    if (activeTab === "generator" && user?.role === "admin") {
      fetchGenStatus();
      genPollRef.current = setInterval(fetchGenStatus, 3000);
    }
    return () => { if (genPollRef.current) clearInterval(genPollRef.current); };
  }, [activeTab, user, fetchGenStatus]);

  const handleGenStart = async () => {
    setGenStarting(true);
    try {
      await axios.post(`${API}/admin/generator/start`, { workers: genWorkers }, { withCredentials: true });
      await fetchGenStatus();
    } catch (err) { setMsg(err.response?.data?.detail || "Error"); }
    setGenStarting(false);
  };

  const handleGenStop = async () => {
    setGenStopping(true);
    try {
      await axios.post(`${API}/admin/generator/stop`, {}, { withCredentials: true });
      await fetchGenStatus();
    } catch (err) { setMsg(err.response?.data?.detail || "Error"); }
    setGenStopping(false);
  };

  const handleAutoRestock = async () => {
    try {
      const newEnabled = !autoRestockEnabled;
      await axios.post(`${API}/admin/generator/auto-restock`, {
        enabled: newEnabled,
        threshold: autoRestockThreshold,
        target: autoRestockTarget,
      }, { withCredentials: true });
      setAutoRestockEnabled(newEnabled);
      setMsg(newEnabled ? "Auto-restock activé" : "Auto-restock désactivé");
    } catch {}
  };

  const handleImport = async () => {
    const linksList = importText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (linksList.length === 0) return;
    setImporting(true); setMsg("");
    try {
      const { data } = await axios.post(`${API}/admin/links/import`, { links: linksList }, { withCredentials: true });
      setMsg(`${data.imported} liens importes`);
      setImportText(""); fetchData();
    } catch (err) { setMsg(err.response?.data?.detail || "Erreur"); }
    setImporting(false);
  };

  const handleAddSingle = async () => {
    if (!singleLink.trim()) return;
    setAdding(true); setMsg("");
    try {
      await axios.post(`${API}/admin/links/add`, { link: singleLink.trim() }, { withCredentials: true });
      setSingleLink(""); setMsg("Lien ajouté"); fetchData();
    } catch (err) { setMsg(err.response?.data?.detail || "Erreur"); }
    setAdding(false);
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Supprimer cette commande ?")) return;
    try { await axios.delete(`${API}/admin/orders/${orderId}`, { withCredentials: true }); fetchData(); } catch {}
  };

  const handleManualOrder = async (e) => {
    e?.preventDefault?.();
    if (!manualEmail.trim() || !manualEmail.includes("@")) {
      setMsg("Email invalide"); return;
    }
    const payload = {
      email: manualEmail.trim(),
      status: manualStatus,
      send_email: manualSendEmail,
      assign_links: manualAssignLinks,
      language: manualLang,
      notes: manualNotes || undefined,
    };
    if (manualPackId === "custom") {
      const q = parseInt(manualQty, 10);
      if (!q || q < 1) { setMsg("Quantité invalide pour un pack custom"); return; }
      payload.quantity = q;
    } else {
      payload.pack_id = manualPackId;
    }
    if (manualPrice.trim()) {
      const p = parseFloat(manualPrice);
      if (Number.isFinite(p) && p >= 0) payload.price = p;
    }
    if (manualExplicitLinks.trim()) {
      payload.links = manualExplicitLinks
        .split("\n").map((l) => l.trim()).filter(Boolean);
      payload.assign_links = false;
    }

    setManualSubmitting(true); setMsg("");
    try {
      const { data } = await axios.post(
        `${API}/admin/orders/manual-create`, payload,
        { withCredentials: true },
      );
      setMsg(
        `Commande créée (${data.order_id?.slice(0, 8)}) — ${data.status} · ` +
        `${data.links_assigned}/${data.quantity} liens${data.email_sent ? " · email envoyé" : ""}`
      );
      // Reset light fields, keep email/pack for batch entries
      setManualExplicitLinks("");
      setManualNotes("");
      fetchData();
    } catch (err) {
      setMsg("Erreur: " + (err.response?.data?.detail || err.message));
    }
    setManualSubmitting(false);
  };

  const handleBlockIp = async () => {
    if (!blockIpInput.trim()) return;
    try {
      await axios.post(`${API}/admin/security/block-ip`, { ip: blockIpInput.trim(), duration: 3600 }, { withCredentials: true });
      setMsg(`IP ${blockIpInput} bloquée`); setBlockIpInput(""); fetchSecurityData();
    } catch {}
  };

  const handleUnblockIp = async (ip) => {
    try {
      await axios.post(`${API}/admin/security/unblock-ip`, { ip }, { withCredentials: true });
      setMsg(`IP ${ip} débloquée`); fetchSecurityData();
    } catch {}
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  );

  const statusColor = {
    completed: "bg-green/10 text-green border-green/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    payment_error: "bg-red-500/10 text-red-400 border-red-400/20",
    failed: "bg-red-500/10 text-red-400 border-red-400/20",
  };

  const realLinks = links.filter(l => !l.url?.startsWith("https://deezer.com/premium/activate/"));
  const isRunning = genStatus?.running;

  return (
    <div className="min-h-screen py-20" data-testid="admin-dashboard">
      {/* Real-time admin presence */}
      <AdminPresence currentTab={activeTab} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="font-bold text-2xl sm:text-3xl text-t-primary flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                Dashboard Admin
              </h1>
              <p className="text-t-muted text-sm mt-1">Gestion et monitoring en temps réel</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/ab" className="btn-secondary !py-2 !px-3 !text-[12px]" data-testid="admin-ab-link">
                A/B stats
              </Link>
              <Link to="/admin/oxapay" className="btn-secondary !py-2 !px-3 !text-[12px]" data-testid="admin-oxapay-link">
                OxaPay
              </Link>
              <Button onClick={() => { fetchData(); fetchSecurityData(); fetchAnalytics(); fetchGenStatus(); }}
                variant="outline" className="border-border text-t-secondary hover:bg-surface-2" disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />Actualiser
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
              {[
                { label: "Revenus", value: `${stats.total_revenue?.toFixed(2) || 0}\u20ac`, icon: DollarSign, color: "text-green", bg: "bg-green/10" },
                { label: "Commandes", value: stats.total_orders, icon: Package, color: "text-purple-400", bg: "bg-purple-500/10" },
                { label: "Liens dispo", value: stats.available_links, icon: Link2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                { label: "Vendus", value: stats.sold_links, icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10" },
                { label: "Utilisateurs", value: stats.total_users, icon: Users, color: "text-accent", bg: "bg-accent/10" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass backdrop-blur-xl rounded-xl border border-border p-4">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                  <span className="font-bold text-2xl text-t-primary block tabular-nums">{s.value}</span>
                  <span className="text-t-muted text-xs">{s.label}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Message */}
          <AnimatePresence>
            {msg && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-green/10 border border-green/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green shrink-0" />
                <span className="text-green text-sm">{msg}</span>
                <button onClick={() => setMsg("")} className="ml-auto text-t-muted hover:text-t-secondary text-xs">x</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs — with icons + better mobile */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <TabsList className="bg-surface border border-border inline-flex p-1 gap-0.5 min-w-max">
                {[
                  { value: "overview", icon: BarChart3, label: "Aperçu" },
                  { value: "generator", icon: Cpu, label: "Générer" },
                  { value: "orders", icon: Package, label: "Commandes" },
                  { value: "links", icon: Link2, label: "Liens" },
                  { value: "users", icon: Users, label: "Users" },
                  { value: "security", icon: Shield, label: "Sécurité" },
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}
                    className="data-[state=active]:bg-surface-3 data-[state=active]:text-white text-t-secondary text-xs px-3 py-2 flex items-center gap-1.5 whitespace-nowrap">
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ═══ OVERVIEW ═══ */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="glass rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-t-primary"><TrendingUp className="h-4 w-4 text-green" />Top Clients</h3>
                  <div className="space-y-2">
                    {analytics?.top_customers?.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-white/[0.02] rounded-lg">
                        <div className="flex items-center gap-2"><span className="text-t-muted text-xs font-mono w-5">#{i + 1}</span><span className="text-sm text-t-secondary truncate">{c._id}</span></div>
                        <Badge className="bg-green/10 text-green border-green/20">{c.total_spent?.toFixed(2)}€</Badge>
                      </div>
                    )) || <p className="text-t-muted text-sm text-center py-4">Aucune donnee</p>}
                  </div>
                </div>
                <div className="glass rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-t-primary"><Globe className="h-4 w-4 text-accent" />Par Pays</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {Object.entries(usersByCountry).sort((a, b) => b[1].count - a[1].count).slice(0, 10).map(([code, data]) => (
                      <div key={code} className="flex justify-between items-center p-2.5 bg-white/[0.02] rounded-lg">
                        <span className="text-sm text-t-secondary">{data.country_name || code}</span>
                        <Badge className="bg-accent/10 text-accent border-accent/20">{data.count}</Badge>
                      </div>
                    ))}
                    {Object.keys(usersByCountry).length === 0 && <p className="text-t-muted text-sm text-center py-4">Aucune donnee</p>}
                  </div>
                </div>
                <div className="glass rounded-xl border border-border p-5 lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-t-primary"><Activity className="h-4 w-4 text-red-400" />Événements Récents</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {securityLogs.slice(0, 10).map((log, i) => (
                      <div key={i} className="flex flex-wrap justify-between items-center p-2.5 bg-white/[0.02] rounded-lg text-xs gap-2">
                        <Badge className="bg-gray-500/10 text-gray-400">{log.event?.replace(/_/g, ' ')}</Badge>
                        <span className="text-t-muted">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                    {securityLogs.length === 0 && <p className="text-t-muted text-sm text-center py-4">Aucun événement</p>}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══ GENERATOR TAB ═══ */}
            <TabsContent value="generator">
              <div className="space-y-5">
                {/* Generator Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Main Control Card */}
                  <div className="glass rounded-2xl border border-border p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isRunning ? 'bg-green/20 border border-green/30' : 'bg-zinc-800 border border-zinc-700'}`}>
                        <Cpu className={`h-6 w-6 ${isRunning ? 'text-green animate-pulse' : 'text-zinc-500'}`} />
                      </div>
                      <div>
                        <h3 className="text-t-primary font-semibold text-lg">Générateur de Stock</h3>
                        <p className="text-t-muted text-xs">
                          {isRunning
                            ? `En cours — ${genStatus?.workers || 0} workers actifs`
                            : "Arrêté — Cliquez sur Démarrer"}
                        </p>
                      </div>
                      <div className={`ml-auto px-3 py-1.5 rounded-full text-xs font-semibold ${isRunning ? 'bg-green/20 text-green border border-green/30' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                        {isRunning ? "ACTIF" : "INACTIF"}
                      </div>
                    </div>

                    {/* Workers Slider */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-t-secondary flex items-center gap-2"><Server className="h-3.5 w-3.5" />Threads</label>
                        <span className="text-accent font-bold text-lg tabular-nums">{genWorkers}</span>
                      </div>
                      <input type="range" min="1" max="50" value={genWorkers} onChange={(e) => setGenWorkers(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-accent"
                        disabled={isRunning} />
                      <div className="flex justify-between text-[10px] text-t-muted mt-1"><span>1</span><span>10</span><span>25</span><span>50</span></div>
                    </div>

                    {/* Start/Stop Buttons */}
                    <div className="flex gap-3">
                      {!isRunning ? (
                        <Button onClick={handleGenStart} disabled={genStarting}
                          className="flex-1 bg-green/20 hover:bg-green/30 text-green border border-green/20 rounded-xl py-6 text-base font-semibold">
                          {genStarting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                          Demarrer
                        </Button>
                      ) : (
                        <Button onClick={handleGenStop} disabled={genStopping}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl py-6 text-base font-semibold">
                          {genStopping ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Square className="h-5 w-5 mr-2" />}
                          Arrêter
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Live Stats */}
                  <div className="space-y-3">
                    {[
                      { label: "Checks", value: genStatus?.stats?.checks || 0, icon: Target, color: "text-accent", bg: "bg-accent/10" },
                      { label: "Hits", value: genStatus?.stats?.hits || 0, icon: CheckCircle, color: "text-green", bg: "bg-green/10" },
                      { label: "Fails", value: genStatus?.stats?.fails || 0, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
                      { label: "Retries", value: genStatus?.stats?.retries || 0, icon: RotateCcw, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                      { label: "Vitesse", value: `${genStatus?.cpm || 0}/min`, icon: Gauge, color: "text-cyan-400", bg: "bg-cyan-500/10" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-xl border border-border p-3 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                        <div className="flex-1"><span className="text-t-muted text-[11px]">{s.label}</span><span className={`block font-bold text-lg tabular-nums ${s.color}`}>{s.value}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Status */}
                {genStatus?.stock && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Stock Disponible", value: genStatus.stock.available, color: "text-green", bg: "bg-green/10" },
                      { label: "Stock Généré", value: genStatus.stock.total, color: "text-accent", bg: "bg-accent/10" },
                      { label: "Vendus", value: genStatus.stock.sold, color: "text-orange-400", bg: "bg-orange-500/10" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-xl border border-border p-4 text-center">
                        <span className={`block font-bold text-3xl tabular-nums ${s.color}`}>{s.value}</span>
                        <span className="text-t-muted text-xs">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Auto-Restock */}
                <div className="glass rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-t-primary">
                      <RefreshCw className="h-4 w-4 text-accent" />Auto-Restock
                    </h3>
                    <button onClick={handleAutoRestock}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${autoRestockEnabled
                        ? 'bg-green/20 text-green border border-green/30 hover:bg-green/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'}`}>
                      {autoRestockEnabled ? "ACTIF" : "INACTIF"}
                    </button>
                  </div>
                  <p className="text-t-muted text-xs mb-4">Demarre automatiquement le generateur quand le stock tombe a 0</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-t-muted mb-1 block">Seuil (stock min)</label>
                      <Input type="number" value={autoRestockThreshold} onChange={(e) => setAutoRestockThreshold(parseInt(e.target.value) || 0)}
                        className="bg-bg/50 border-border text-t-primary" min={0} />
                    </div>
                    <div>
                      <label className="text-xs text-t-muted mb-1 block">Objectif (stop a)</label>
                      <Input type="number" value={autoRestockTarget} onChange={(e) => setAutoRestockTarget(parseInt(e.target.value) || 20)}
                        className="bg-bg/50 border-border text-t-primary" min={1} />
                    </div>
                  </div>
                </div>

                {/* Live Terminal */}
                <div className="glass rounded-xl border border-border overflow-hidden">
                  <div className="bg-zinc-900/80 border-b border-border px-4 py-3 flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-t-primary">
                      <Activity className="h-4 w-4 text-green" />
                      Terminal en Direct
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {genStatus?.recent_hits?.length || 0} liens générés
                    </Badge>
                  </div>
                  <div className="bg-black/60 p-4 font-mono text-xs h-80 overflow-y-auto scrollbar-thin">
                    {!genStatus?.recent_hits || genStatus.recent_hits.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-t-muted">
                        <div className="text-center">
                          <Server className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>En attente de génération...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {genStatus.recent_hits.map((hit, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-2 text-[11px] leading-relaxed hover:bg-white/5 px-2 py-1 rounded transition-colors"
                          >
                            <span className="text-t-muted shrink-0 select-none">
                              [{new Date(hit.timestamp).toLocaleTimeString()}]
                            </span>
                            <CheckCircle className="h-3 w-3 text-green shrink-0 mt-0.5" />
                            <span className="text-green-400/90">HIT</span>
                            <span className="text-white/60">→</span>
                            <span className="text-cyan-400 break-all flex-1">{hit.url}</span>
                          </motion.div>
                        ))}
                        {isRunning && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="flex items-center gap-2 text-amber-400/70 px-2 py-1"
                          >
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Génération en cours... ({genStatus?.cpm || 0} checks/min)</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="bg-zinc-900/60 border-t border-border px-4 py-2.5 flex items-center justify-between text-[10px]">
                    <span className="text-t-muted">
                      <span className="text-green font-semibold">{genStatus?.stats?.hits || 0}</span> hits ·{" "}
                      <span className="text-red-400 font-semibold">{genStatus?.stats?.fails || 0}</span> fails ·{" "}
                      <span className="text-accent font-semibold">{genStatus?.stats?.checks || 0}</span> checks
                    </span>
                    <span className="text-t-muted">
                      {isRunning ? "🟢 Actif" : "🔴 Arrêté"}
                    </span>
                  </div>
                </div>

                {/* Stock Management Actions */}
                <div className="glass rounded-xl border border-border p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-t-primary">
                    <Database className="h-5 w-5 text-accent" />
                    Gestion du Stock
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      onClick={async () => {
                        if (!window.confirm("⚠️ ATTENTION: Supprimer TOUS les liens de la base de données ? Cette action est irréversible !")) return;
                        try {
                          setMsg("");
                          const res = await securePost("/admin/stock/nuke");
                          setMsg(res.message || "Base de données vidée");
                          fetchData();
                          fetchGenStatus();
                        } catch (err) {
                          setMsg("Erreur: " + (err.response?.data?.detail || err.message));
                        }
                      }}
                      variant="outline"
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 hover:border-red-500/40"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Nuke Database
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          setMsg("");
                          const res = await securePost("/admin/stock/recheck");
                          setMsg(res.message || "Vérification lancée");
                          fetchGenStatus();
                        } catch (err) {
                          setMsg("Erreur: " + (err.response?.data?.detail || err.message));
                        }
                      }}
                      variant="outline"
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-500/40"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Recheck Stock
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          setMsg("");
                          const res = await securePost("/admin/stock/auto-check/toggle");
                          setAutoCheckEnabled(res.enabled);
                          setMsg(res.message || "Auto-check modifié");
                          fetchGenStatus();
                        } catch (err) {
                          setMsg("Erreur: " + (err.response?.data?.detail || err.message));
                        }
                      }}
                      variant="outline"
                      className={`${autoCheckEnabled ? 'bg-green/10 hover:bg-green/20 text-green border-green/30' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30 hover:border-purple-500/40'}`}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Auto Check-Stock <span className="ml-2 font-bold">{autoCheckEnabled ? 'ON' : 'OFF'}</span>
                    </Button>

                    <Button
                      onClick={() => {
                        fetchData();
                        fetchGenStatus();
                        setMsg("Stock actualisé");
                      }}
                      variant="outline"
                      className="bg-green/10 hover:bg-green/20 text-green border-green/30 hover:border-green/40"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  <p className="text-t-muted text-xs mt-4">
                    <strong>Nuke:</strong> Supprime tous les liens · <strong>Recheck:</strong> Vérifie et retire les invalides · <strong>Auto-check:</strong> Vérification périodique automatique
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ═══ ORDERS ═══ */}
            <TabsContent value="orders">
              {/* Manual order creation */}
              <div className="glass rounded-xl border border-border p-5 mb-5" data-testid="manual-order-card">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 text-t-primary">
                  <Plus className="h-4 w-4 text-accent" />
                  Ajouter une commande manuelle
                </h3>
                <form onSubmit={handleManualOrder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs text-t-muted block mb-1">Email client</label>
                    <Input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="bg-surface border-border text-sm"
                      data-testid="manual-order-email"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-t-muted block mb-1">Pack</label>
                    <select
                      value={manualPackId}
                      onChange={(e) => setManualPackId(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md text-sm text-t-primary px-3 py-2 outline-none focus:border-accent"
                      data-testid="manual-order-pack"
                    >
                      <option value="single">Starter · 1 lien · 5€</option>
                      <option value="pack_3">Essential · 3 liens · 12€</option>
                      <option value="pack_5">Premium · 5 liens · 20€</option>
                      <option value="pack_10">Business · 10 liens · 35€</option>
                      <option value="custom">Sur mesure (qty perso)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-t-muted block mb-1">
                      {manualPackId === "custom" ? "Quantité *" : "Quantité (auto)"}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={manualQty}
                      onChange={(e) => setManualQty(e.target.value)}
                      placeholder={manualPackId === "custom" ? "ex. 15" : "auto"}
                      disabled={manualPackId !== "custom"}
                      className="bg-surface border-border text-sm disabled:opacity-60"
                      data-testid="manual-order-qty"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-t-muted block mb-1">Prix (€) — laisse vide pour auto</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      placeholder="auto"
                      className="bg-surface border-border text-sm"
                      data-testid="manual-order-price"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-t-muted block mb-1">Langue email</label>
                    <select
                      value={manualLang}
                      onChange={(e) => setManualLang(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md text-sm text-t-primary px-3 py-2 outline-none focus:border-accent"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="pt">Português</option>
                      <option value="de">Deutsch</option>
                      <option value="tr">Türkçe</option>
                      <option value="nl">Nederlands</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-t-muted block mb-1">Statut</label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value)}
                      className="w-full bg-surface border border-border rounded-md text-sm text-t-primary px-3 py-2 outline-none focus:border-accent"
                      data-testid="manual-order-status"
                    >
                      <option value="completed">Complétée (assigner + envoyer)</option>
                      <option value="pending">En attente (pas d'assignation)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-t-muted block mb-1">
                      Liens explicites (optionnel — un par ligne, remplace l'assignation auto)
                    </label>
                    <textarea
                      value={manualExplicitLinks}
                      onChange={(e) => setManualExplicitLinks(e.target.value)}
                      placeholder="https://www.deezer.com/…&#10;https://www.deezer.com/…"
                      rows={3}
                      className="w-full bg-surface border border-border rounded-md text-sm text-t-primary px-3 py-2 outline-none focus:border-accent font-mono"
                      data-testid="manual-order-links"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-t-muted block mb-1">Notes internes (optionnel)</label>
                    <Input
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="ex: vente via Telegram, remboursement compensation…"
                      className="bg-surface border-border text-sm"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-t-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualSendEmail}
                        onChange={(e) => setManualSendEmail(e.target.checked)}
                        className="accent-accent"
                      />
                      Envoyer email de livraison
                    </label>
                    <label className="flex items-center gap-2 text-xs text-t-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={manualAssignLinks}
                        onChange={(e) => setManualAssignLinks(e.target.checked)}
                        className="accent-accent"
                      />
                      Assigner depuis le stock
                    </label>
                    <Button
                      type="submit"
                      disabled={manualSubmitting}
                      className="ml-auto bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30"
                      data-testid="manual-order-submit"
                    >
                      {manualSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Créer la commande
                    </Button>
                  </div>
                </form>
              </div>

              <div className="glass rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-t-muted text-xs">ID</TableHead>
                        <TableHead className="text-t-muted text-xs">Email</TableHead>
                        <TableHead className="text-t-muted text-xs">Pack</TableHead>
                        <TableHead className="text-t-muted text-xs">Montant</TableHead>
                        <TableHead className="text-t-muted text-xs">Statut</TableHead>
                        <TableHead className="text-t-muted text-xs">Date</TableHead>
                        <TableHead className="text-t-muted text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.order_id} className="border-border hover:bg-white/[0.02]">
                          <TableCell className="font-mono text-xs"><Link to={`/order/${order.order_id}`} className="text-accent hover:underline flex items-center gap-1"><Hash className="h-3 w-3" />{order.order_id?.slice(0, 8)}</Link></TableCell>
                          <TableCell className="text-sm text-t-secondary">{order.email}</TableCell>
                          <TableCell className="text-sm text-t-muted">{order.pack_id} ({order.quantity})</TableCell>
                          <TableCell className="font-semibold text-t-primary">{order.price}€</TableCell>
                          <TableCell><Badge className={statusColor[order.status] || statusColor.pending}>{order.status}</Badge></TableCell>
                          <TableCell className="text-xs text-t-muted">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell><button onClick={() => handleDeleteOrder(order.order_id)} className="text-t-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                        </TableRow>
                      ))}
                      {orders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-t-muted"><Package className="h-8 w-8 mx-auto mb-2 opacity-30" />Aucune commande</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ═══ LINKS ═══ */}
            <TabsContent value="links">
              <div className="space-y-5">
                {/* Manual link add + bulk import */}
                <div className="glass rounded-xl border border-border p-5 grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="manual-links-card">
                  {/* Single link add */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-t-primary">
                      <Plus className="h-4 w-4 text-green" />
                      Ajouter un lien
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        value={singleLink}
                        onChange={(e) => setSingleLink(e.target.value)}
                        placeholder="https://www.deezer.com/…"
                        className="bg-surface border-border text-sm flex-1 font-mono"
                        data-testid="manual-link-single"
                      />
                      <Button
                        onClick={handleAddSingle}
                        disabled={adding || !singleLink.trim()}
                        className="bg-green/20 hover:bg-green/30 text-green border border-green/30"
                        data-testid="manual-link-single-submit"
                      >
                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-t-muted text-[11px] mt-2">
                      Ajoute un lien d&apos;activation au stock (statut: available).
                    </p>
                  </div>

                  {/* Bulk import */}
                  <div>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-t-primary">
                      <Upload className="h-4 w-4 text-cyan-400" />
                      Importer en masse
                    </h3>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Un lien par ligne&#10;https://…&#10;https://…"
                      rows={4}
                      className="w-full bg-surface border border-border rounded-md text-sm text-t-primary px-3 py-2 outline-none focus:border-accent font-mono resize-none"
                      data-testid="manual-link-import"
                    />
                    <div className="flex items-center justify-between mt-2 gap-3">
                      <span className="text-t-muted text-[11px]">
                        {importText.split("\n").filter((l) => l.trim()).length} ligne(s)
                      </span>
                      <Button
                        onClick={handleImport}
                        disabled={importing || !importText.trim()}
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                        data-testid="manual-link-import-submit"
                      >
                        {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                        Importer
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-3 border-b border-border"><h3 className="text-sm font-medium text-t-primary flex items-center gap-2"><Link2 className="h-4 w-4 text-cyan-400" />Liens ({realLinks.length})</h3></div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="text-t-muted text-xs">URL</TableHead><TableHead className="text-t-muted text-xs">Statut</TableHead><TableHead className="text-t-muted text-xs">Source</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {realLinks.map((link, i) => (
                          <TableRow key={link.id || link.url || i} className="border-border hover:bg-white/[0.02]">
                            <TableCell className="font-mono text-xs text-t-secondary max-w-[400px]"><div className="flex items-center gap-1.5 truncate"><ExternalLink className="h-3 w-3 text-t-muted shrink-0" /><span className="truncate">{link.url}</span></div></TableCell>
                            <TableCell><Badge className={link.status === "available" ? "bg-green/10 text-green border-green/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>{link.status === "available" ? "Dispo" : "Vendu"}</Badge></TableCell>
                            <TableCell><Badge className={link.source === "generator" ? "bg-accent/10 text-accent border-accent/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>{link.source || "import"}</Badge></TableCell>
                          </TableRow>
                        ))}
                        {realLinks.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-12 text-t-muted"><Link2 className="h-8 w-8 mx-auto mb-2 opacity-30" /><p>Aucun lien</p></TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ═══ USERS ═══ */}
            <TabsContent value="users">
              <div className="glass rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead className="text-t-muted text-xs">Email</TableHead><TableHead className="text-t-muted text-xs">Fidélité</TableHead><TableHead className="text-t-muted text-xs">IP</TableHead><TableHead className="text-t-muted text-xs">Inscrit</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {users.map((u, i) => (
                        <TableRow key={u.id || u.email || i} className="border-border hover:bg-white/[0.02]">
                          <TableCell className="text-sm"><div className="flex items-center gap-2">{u.role === "admin" && <Shield className="h-3.5 w-3.5 text-red-400" />}<span className="text-t-primary">{u.email}</span></div></TableCell>
                          <TableCell><Badge className="bg-accent/10 text-accent border-accent/20">{u.loyalty_tier?.name || "Bronze"} ({u.loyalty_points || 0}pts)</Badge></TableCell>
                          <TableCell className="font-mono text-xs text-t-muted">{u.last_ip || "-"}</TableCell>
                          <TableCell className="text-xs text-t-muted">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-t-muted"><Users className="h-8 w-8 mx-auto mb-2 opacity-30" />Aucun utilisateur</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ═══ SECURITY ═══ */}
            <TabsContent value="security">
              <div className="space-y-5">
                {stats?.security && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "IPs Bloquées", value: stats.security.blocked_ips, icon: Ban, color: "text-red-400", bg: "bg-red-500/10" },
                      { label: "Échecs (24h)", value: stats.security.failed_logins_24h, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
                      { label: "Events (24h)", value: stats.security.recent_events_24h, icon: Activity, color: "text-accent", bg: "bg-accent/10" },
                      { label: "Rate Limits", value: stats.security.active_rate_limits, icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10" },
                    ].map((s, i) => (
                      <div key={i} className="glass rounded-xl border border-border p-4">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                        <span className={`font-bold text-2xl ${s.color}`}>{s.value}</span><p className="text-t-muted text-xs mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="glass rounded-xl border border-border p-5">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-t-primary"><Ban className="h-4 w-4 text-red-400" />Bloquer IP</h3>
                  <div className="flex gap-2">
                    <Input value={blockIpInput} onChange={(e) => setBlockIpInput(e.target.value)} placeholder="192.168.1.1" className="bg-bg/50 border-border text-t-primary max-w-sm" onKeyDown={(e) => e.key === "Enter" && handleBlockIp()} />
                    <Button onClick={handleBlockIp} disabled={!blockIpInput.trim()} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-lg px-4"><Ban className="h-4 w-4 mr-2" />Bloquer</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="glass rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-t-primary"><Ban className="h-4 w-4 text-red-400" />IPs Bloquées</h3>
                    <div className="space-y-2">{blockedList.blocked_ips?.map((item) => (<div key={item.ip} className="flex justify-between items-center p-2.5 bg-red-500/5 rounded-lg border border-red-500/10"><span className="font-mono text-sm text-red-400">{item.ip}</span><button onClick={() => handleUnblockIp(item.ip)} className="text-green hover:text-green/80 p-1"><CheckCircle className="h-4 w-4" /></button></div>))}{(!blockedList.blocked_ips || blockedList.blocked_ips.length === 0) && <p className="text-t-muted text-sm text-center py-3">Aucune IP bloquée</p>}</div>
                  </div>
                  <div className="glass rounded-xl border border-border p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-t-primary"><Eye className="h-4 w-4 text-accent" />Journal Sécurité</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">{securityLogs.slice(0, 10).map((log, i) => (<div key={log.id || `${log.event}-${log.ip}-${log.created_at || i}`} className="flex flex-wrap justify-between items-center p-2 bg-white/[0.02] rounded-lg text-xs gap-1"><Badge className="bg-gray-500/10 text-gray-400">{log.event?.replace(/_/g, ' ')}</Badge><span className="text-t-muted">{log.ip}</span></div>))}{securityLogs.length === 0 && <p className="text-t-muted text-sm text-center py-3">Aucun log</p>}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
