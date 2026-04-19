import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Loader2, Check, Edit3, LogOut, ArrowRight, User, Mail, Crown, ShoppingBag,
  Wallet, Star, Trophy, Gift, Clock, ChevronRight, Shield, Sparkles, Heart, TrendingUp
} from "lucide-react";
import { pickLang as L } from "@/utils/langPick";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const TIER_CONFIG = {
  bronze: { label: "Bronze", color: "from-orange-500 to-amber-600", bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", icon: Star },
  silver: { label: "Silver", color: "from-gray-300 to-gray-400", bg: "bg-gray-400/10", text: "text-gray-300", border: "border-gray-400/20", icon: Shield },
  gold: { label: "Gold", color: "from-yellow-400 to-amber-500", bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", icon: Crown },
  platinum: { label: "Platinum", color: "from-purple-400 to-violet-500", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", icon: Trophy },
  diamond: { label: "Diamond", color: "from-cyan-400 to-blue-500", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", icon: Sparkles },
};

export default function Profile() {
  const { i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const lang = i18n.language || "fr";

  useEffect(() => { if (!authLoading && !user) navigate("/login"); }, [user, authLoading, navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/user/profile`, { withCredentials: true });
      setProfile(data);
      setNameInput(data.name || "");
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (user) fetchProfile(); }, [user, fetchProfile]);

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      await axios.put(`${API}/user/profile`, { name: nameInput.trim() }, { withCredentials: true });
      setProfile((p) => ({ ...p, name: nameInput.trim() }));
      setEditingName(false);
    } catch {}
    setSaving(false);
  };

  if (authLoading || loading) return (
    <div className="max-w-lg mx-auto px-5 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
    </div>
  );
  if (!profile) return null;

  const tierKey = profile.loyalty_tier?.tier || "bronze";
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.bronze;
  const TierIcon = tier.icon;
  const progress = profile.next_tier
    ? Math.min(100, ((profile.loyalty_points - (profile.loyalty_tier?.min_points || 0)) / (profile.next_tier.min_points - (profile.loyalty_tier?.min_points || 0))) * 100)
    : 100;

  const initials = (profile.name || profile.email || "U").charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb-purple" style={{ top: "-15%", right: "-10%" }} />
      <div className="orb-pink" style={{ bottom: "30%", left: "-8%" }} />

      <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4">

          {/* Profile Header Card */}
          <div className="glass backdrop-blur-xl rounded-2xl border border-border overflow-hidden">
            {/* Gradient Banner */}
            <div className={`h-20 bg-gradient-to-r ${tier.color} opacity-20`} />
            
            <div className="px-6 pb-6 -mt-10">
              {/* Avatar */}
              <div className="flex items-end gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-accent/20 border-2 border-bg`}>
                  {initials}
                </div>
                <div className="flex-1 pb-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                        className="bg-bg/50 border-border text-t-primary h-9 rounded-lg text-[14px] max-w-[200px] focus:border-accent/50"
                        autoFocus onKeyDown={(e) => e.key === "Enter" && saveName()} />
                      <button onClick={saveName} disabled={saving} className="text-accent hover:text-accent-hover transition-colors">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-t-primary font-semibold text-lg">{profile.name || L({ fr: "Utilisateur", en: "User", es: "Usuario", pt: "Usuário", de: "Benutzer", tr: "Kullanıcı", nl: "Gebruiker", ar: "مستخدم" }, lang)}</h1>
                      <button onClick={() => setEditingName(true)} className="text-t-muted hover:text-accent transition-colors">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Tier Badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${tier.bg} border ${tier.border}`}>
                  <TierIcon className={`h-3.5 w-3.5 ${tier.text}`} />
                  <span className={`text-xs font-semibold ${tier.text}`}>{tier.label}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-t-muted text-sm">
                <Mail className="h-3.5 w-3.5" />
                <span>{profile.email}</span>
              </div>

              {/* Member Since */}
              {profile.created_at && (
                <div className="flex items-center gap-2 text-t-muted/60 text-xs mt-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{L({ fr: "Membre depuis", en: "Member since", es: "Miembro desde", pt: "Membro desde", de: "Mitglied seit", tr: "Üyelik", nl: "Lid sinds", ar: "عضو منذ" }, lang)} {new Date(profile.created_at).toLocaleDateString(lang, { year: 'numeric', month: 'long' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: L({ fr: "Commandes", en: "Orders", es: "Pedidos", pt: "Pedidos", de: "Bestellungen", tr: "Siparişler", nl: "Bestellingen", ar: "الطلبات" }, lang), value: profile.completed_orders, icon: ShoppingBag, color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: L({ fr: "Dépensé", en: "Spent", es: "Gastado", pt: "Gasto", de: "Ausgegeben", tr: "Harcanan", nl: "Uitgegeven", ar: "المُنفق" }, lang), value: `${profile.total_spent || 0}€`, icon: Wallet, color: "text-green", bg: "bg-green/10" },
              { label: "Points", value: profile.loyalty_points || 0, icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="glass backdrop-blur-xl rounded-xl border border-border p-4 text-center">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-t-primary font-bold text-xl tabular-nums">{s.value}</p>
                <p className="text-t-muted text-[11px] mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Loyalty Progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass backdrop-blur-xl rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg ${tier.bg} flex items-center justify-center`}>
                  <TrendingUp className={`h-4 w-4 ${tier.text}`} />
                </div>
                <div>
                  <span className="text-t-primary text-sm font-medium">{L({ fr: "Progression fidélité", en: "Loyalty Progress", es: "Progreso fidelidad", pt: "Progresso fidelidade", de: "Treue-Fortschritt", tr: "Sadakat ilerlemesi", nl: "Loyaliteitsvoortgang", ar: "تقدم الولاء" }, lang)}</span>
                  {profile.loyalty_tier?.discount > 0 && (
                    <span className="ml-2 text-green text-xs font-semibold bg-green/10 px-1.5 py-0.5 rounded">-{profile.loyalty_tier.discount}%</span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium ${tier.text}`}>{profile.loyalty_points} pts</span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2.5 bg-white/[0.04] rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${tier.color} rounded-full`}
              />
            </div>

            {profile.next_tier ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-t-muted">{tier.label}</span>
                <span className="text-t-muted">
                  {profile.points_to_next} pts {L({ fr: "avant", en: "until", es: "hasta", pt: "até", de: "bis", tr: "öncesi", nl: "tot", ar: "حتى" }, lang)} <span className="text-t-secondary font-medium">{profile.next_tier.name}</span>
                </span>
              </div>
            ) : (
              <p className="text-center text-xs text-t-muted">{L({ fr: "Niveau maximum atteint !", en: "Max level reached!", es: "¡Nivel máximo alcanzado!", pt: "Nível máximo atingido!", de: "Höchstes Level erreicht!", tr: "En yüksek seviyeye ulaşıldı!", nl: "Maximaal niveau bereikt!", ar: "تم الوصول إلى الحد الأقصى!" }, lang)}</p>
            )}
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass backdrop-blur-xl rounded-2xl border border-border divide-y divide-white/[0.04] overflow-hidden">
            <Link to="/history" className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <span className="text-t-primary text-sm font-medium">{L({ fr: "Mes commandes", en: "My orders", es: "Mis pedidos", pt: "Meus pedidos", de: "Meine Bestellungen", tr: "Siparişlerim", nl: "Mijn bestellingen", ar: "طلباتي" }, lang)}</span>
                <p className="text-t-muted text-[11px]">{L({ fr: "Voir l'historique complet", en: "View full history", es: "Ver historial completo", pt: "Ver histórico completo", de: "Vollständigen Verlauf anzeigen", tr: "Tüm geçmişi gör", nl: "Volledige geschiedenis bekijken", ar: "عرض السجل الكامل" }, lang)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-t-muted group-hover:text-t-secondary transition-colors" />
            </Link>

            <Link to="/offers" className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <span className="text-t-primary text-sm font-medium">{L({ fr: "Acheter des liens", en: "Buy links", es: "Comprar enlaces", pt: "Comprar links", de: "Links kaufen", tr: "Bağlantı satın al", nl: "Links kopen", ar: "شراء الروابط" }, lang)}</span>
                <p className="text-t-muted text-[11px]">{L({ fr: "Découvrir nos offres", en: "Explore our offers", es: "Explora nuestras ofertas", pt: "Explore nossas ofertas", de: "Unsere Angebote entdecken", tr: "Tekliflerimizi keşfet", nl: "Ontdek onze aanbiedingen", ar: "استكشف عروضنا" }, lang)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-t-muted group-hover:text-t-secondary transition-colors" />
            </Link>

            <Link to="/gift-cards" className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-pink-400" />
              </div>
              <div className="flex-1">
                <span className="text-t-primary text-sm font-medium">{L({ fr: "Cartes cadeau", en: "Gift cards", es: "Tarjetas regalo", pt: "Cartões presente", de: "Geschenkkarten", tr: "Hediye kartları", nl: "Cadeaukaarten", ar: "بطاقات الهدية" }, lang)}</span>
                <p className="text-t-muted text-[11px]">{L({ fr: "Offrir Deezer Premium", en: "Gift Deezer Premium", es: "Regalar Deezer Premium", pt: "Presentear Deezer Premium", de: "Deezer Premium verschenken", tr: "Deezer Premium hediye et", nl: "Deezer Premium cadeau geven", ar: "إهداء Deezer Premium" }, lang)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-t-muted group-hover:text-t-secondary transition-colors" />
            </Link>
          </motion.div>

          {/* Logout */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <button onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center justify-center gap-2 text-t-muted hover:text-red-400 text-sm py-3.5 transition-colors rounded-xl hover:bg-red-500/5">
              <LogOut className="h-4 w-4" />
              {L({ fr: "Déconnexion", en: "Sign out", es: "Cerrar sesión", pt: "Sair", de: "Abmelden", tr: "Çıkış", nl: "Uitloggen", ar: "تسجيل الخروج" }, lang)}
            </button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
