import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import axios from "axios";
import CartSlidePanel from "@/components/CartSlidePanel";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, X, ShoppingCart, User, LogIn, Sparkles, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, loading: authLoading, logout } = useAuth();
  const { getTotalItems, showCartNotif } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/check-ip`, { withCredentials: true })
      .then((r) => { setIsAdmin(r.data.is_admin); if (r.data.is_admin) axios.post(`${API}/admin/auto-login`, {}, { withCredentials: true }).catch(() => {}); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const active = (p) => location.pathname === p;
  const totalItems = getTotalItems();
  const lang = i18n.language || "fr";

  const isLoggedIn = user && user !== false && user.email;
  const isAdminUser = isLoggedIn && user.role === "admin";
  const isRegularUser = isLoggedIn && user.role !== "admin";

  const navLinks = [
    { to: "/", label: lang === "fr" ? "Accueil" : "Home" },
    { to: "/offers", label: lang === "fr" ? "Offres" : "Pricing" },
    { to: "/gift-cards", label: lang === "fr" ? "Cartes" : "Gift Cards" },
    ...(isRegularUser ? [{ to: "/history", label: lang === "fr" ? "Historique" : "Orders" }] : []),
  ];

  return (
    <>
      <div className="sticky top-0 z-40 pt-3 sm:pt-5 px-3 sm:px-6">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className={`max-w-6xl mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 rounded-full transition-all duration-300 border ${
            scrolled
              ? "bg-[rgba(10,10,14,0.88)] border-white/10 backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)]"
              : "bg-[rgba(10,10,14,0.55)] border-white/[0.06] backdrop-blur-lg"
          } pl-2 pr-2 sm:pl-3 sm:pr-3 py-1.5 sm:py-2`}
          data-testid="main-header"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 pl-1 pr-1 shrink-0 group" data-testid="logo-link">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-violet-700 flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(139,92,246,0.7)] group-hover:scale-105 transition-transform">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-violet-500/40 blur-xl -z-10" />
            </div>
            <span className="text-white font-display font-bold text-[16px] sm:text-[18px] tracking-tight">
              deez<span className="text-violet-400">link</span>
            </span>
          </Link>

          {/* Desktop Nav — centered */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.to.replace(/\//g, "") || "home"}`}
                className={`text-[13.5px] font-medium px-4 py-2 rounded-full transition-all ${
                  active(l.to)
                    ? "text-white bg-white/[0.06]"
                    : "text-white/65 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-1.5 justify-self-end">
            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.04] transition-all"
              data-testid="cart-btn"
            >
              <ShoppingCart className="h-[17px] w-[17px]" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.8)]"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>

            {/* Lang */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex text-white/60 hover:text-white text-[11px] items-center gap-1 outline-none px-2 py-2 rounded-full hover:bg-white/[0.04] transition-all"
                data-testid="lang-btn"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{i18n.language?.toUpperCase()?.slice(0, 2)}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0f0f14] border border-white/10 min-w-[80px] rounded-xl backdrop-blur-xl">
                {["fr", "en", "es", "pt", "de", "tr", "nl", "ar"].map((lng) => (
                  <DropdownMenuItem
                    key={lng}
                    onClick={() => changeLang(lng)}
                    className={`text-xs cursor-pointer rounded-md ${i18n.language === lng ? "text-violet-400" : "text-white/70"}`}
                  >
                    {lng.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User / login */}
            {authLoading ? (
              <div className="w-9 h-9 rounded-full bg-white/[0.05] animate-pulse" />
            ) : !isLoggedIn ? (
              <Link
                to="/login"
                data-testid="login-btn"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                {lang === "fr" ? "Connexion" : "Sign in"}
              </Link>
            ) : isAdminUser ? (
              <Link to="/admin" data-testid="admin-btn" className="p-1">
                <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-all">
                  <Shield className="h-4 w-4" />
                </div>
              </Link>
            ) : (
              <Link to="/profile" data-testid="profile-btn" className="p-1">
                <div className="w-9 h-9 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 hover:bg-violet-500/25 transition-all">
                  <User className="h-4 w-4" />
                </div>
              </Link>
            )}

            {/* Primary CTA on desktop */}
            <button
              onClick={() => navigate("/offers")}
              className="hidden lg:inline-flex btn-primary !py-2 !px-4 !text-[13px]"
              data-testid="header-cta-btn"
            >
              {lang === "fr" ? "Commencer" : "Get Started"}
            </button>

            {/* Mobile menu */}
            <button
              className="md:hidden p-2 rounded-full text-white/70 hover:text-white hover:bg-white/[0.04]"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </motion.header>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden max-w-6xl mx-auto mt-2 rounded-3xl bg-[rgba(10,10,14,0.92)] backdrop-blur-xl border border-white/10 p-3"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    data-testid={`mobile-nav-${l.to.replace(/\//g, "") || "home"}`}
                    className={`px-4 py-3 rounded-2xl text-[14px] font-medium transition-all ${
                      active(l.to) ? "bg-white/[0.06] text-white" : "text-white/70 hover:bg-white/[0.03]"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                {!isLoggedIn && !authLoading && (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    data-testid="mobile-login-btn"
                    className="mt-2 px-4 py-3 rounded-2xl bg-white text-black font-semibold text-[14px] text-center"
                  >
                    {lang === "fr" ? "Connexion" : "Sign in"}
                  </Link>
                )}
                <Link
                  to="/offers"
                  onClick={() => setMobileOpen(false)}
                  data-testid="mobile-cta-btn"
                  className="btn-primary w-full mt-1 justify-center"
                >
                  {lang === "fr" ? "Commencer" : "Get Started"}
                </Link>
                {isLoggedIn && (
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    data-testid="mobile-logout-btn"
                    className="mt-2 px-4 py-3 rounded-2xl bg-white/[0.03] text-red-400 font-semibold text-[14px] text-left"
                  >
                    {lang === "fr" ? "Déconnexion" : "Sign out"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart notification */}
        <AnimatePresence>
          {showCartNotif && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-4 px-4 py-3 rounded-full bg-[#0f0f14] border border-green-500/25 z-50 shadow-[0_8px_32px_-8px_rgba(34,197,94,0.4)]"
            >
              <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                <span className="pill-dot" /> {lang === "fr" ? "Ajouté au panier" : "Added to cart"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CartSlidePanel isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
