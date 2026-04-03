import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import axios from "axios";
import CartSlidePanel from "@/components/CartSlidePanel";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, X, ShoppingCart, User, Gift, Home, Tag, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { getTotalItems, showCartNotif } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/check-ip`, { withCredentials: true })
      .then((r) => { setIsAdmin(r.data.is_admin); if (r.data.is_admin) axios.post(`${API}/admin/auto-login`, {}, { withCredentials: true }).catch(() => {}); })
      .catch(() => {});
  }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  };

  const active = (p) => location.pathname === p;
  const totalItems = getTotalItems();
  const lang = i18n.language || "fr";

  return (
    <>
      <header className="sticky top-0 z-40 glass backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img src="/logo.png" alt="DeezLink" className="h-8 sm:h-9 w-auto drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]" />
            <span className="text-t-primary font-bold text-[17px] sm:text-[19px] tracking-tight leading-none">
              Deez<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link to="/" className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg ${active("/") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
              <Home className="h-4 w-4" />
              {t("nav_home") || (lang === "fr" ? "Accueil" : "Home")}
            </Link>
            <Link to="/offers" className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg ${active("/offers") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
              <Tag className="h-4 w-4" />
              {t("nav_offers")}
            </Link>
            <Link to="/gift-cards" className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg ${active("/gift-cards") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
              <Gift className="h-4 w-4" />
              {t("nav_gift_card")}
            </Link>
            {user && user.role !== "admin" && (
              <Link to="/history" className={`text-[13px] font-medium transition-colors px-3 py-2 rounded-lg ${active("/history") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                {t("nav_history")}
              </Link>
            )}
            {isAdmin && user && user.role === "admin" && (
              <Link to="/admin" className={`text-[13px] font-medium transition-colors px-3 py-2 rounded-lg ${active("/admin") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                Admin
              </Link>
            )}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="relative p-1.5" data-testid="cart-btn">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="text-t-secondary hover:text-t-primary transition-colors">
                <ShoppingCart className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                {totalItems > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
            </button>

            {/* User / Login Icon */}
            {!user ? (
              <Link to="/login" className="p-1.5" data-testid="login-btn">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-all">
                  <LogIn className="h-4 w-4" />
                </motion.div>
              </Link>
            ) : user.role !== "admin" ? (
              <Link to="/profile" className="p-1.5" data-testid="profile-btn">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors">
                  <User className="h-4 w-4" />
                </motion.div>
              </Link>
            ) : null}

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-t-muted hover:text-t-secondary text-xs flex items-center gap-1 outline-none p-1.5">
                <Globe className="h-4 w-4" /> <span className="hidden sm:inline">{i18n.language?.toUpperCase()}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass border-border min-w-[60px] backdrop-blur-xl">
                {["fr", "en", "es", "pt", "de", "tr", "nl", "ar"].map((lng) => (
                  <DropdownMenuItem key={lng} onClick={() => changeLang(lng)}
                    className={`text-xs cursor-pointer ${i18n.language === lng ? "text-accent" : "text-t-secondary"}`}>
                    {lng.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout (desktop) */}
            {user && user.role !== "admin" && (
              <button onClick={logout} className="hidden md:block text-xs text-t-muted hover:text-t-secondary transition-colors">
                {t("nav_logout")}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-t-secondary hover:text-t-primary transition-colors p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Cart notification */}
        <AnimatePresence>
          {showCartNotif && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 glass backdrop-blur-xl px-4 py-3 rounded-xl border border-green/20 bg-green-dim z-50">
              <p className="text-sm text-green font-semibold flex items-center gap-2">
                <span className="text-lg">✓</span> {lang === "fr" ? "Ajoute au panier" : "Added to cart"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border glass backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                <Link to="/" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                  <Home className="h-4 w-4" /> {t("nav_home") || (lang === "fr" ? "Accueil" : "Home")}
                </Link>
                <Link to="/offers" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/offers") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                  <Tag className="h-4 w-4" /> {t("nav_offers")}
                </Link>
                <Link to="/gift-cards" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/gift-cards") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                  <Gift className="h-4 w-4" /> {lang === "fr" ? "Carte Cadeau" : "Gift Card"}
                </Link>
                {user && user.role !== "admin" && (
                  <>
                    <Link to="/history" onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/history") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                      {t("nav_history")}
                    </Link>
                    <Link to="/profile" onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/profile") ? "text-t-primary bg-white/[0.05]" : "text-t-secondary hover:text-t-primary hover:bg-white/[0.03]"}`}>
                      <User className="h-4 w-4" /> {t("nav_profile")}
                    </Link>
                    <div className="border-t border-white/[0.06] pt-2 mt-2">
                      <button onClick={() => { logout(); setMobileOpen(false); }}
                        className="flex items-center gap-3 py-3 px-3 text-sm text-red-400/80 hover:text-red-400 rounded-lg transition-colors w-full text-left">
                        {t("nav_logout")}
                      </button>
                    </div>
                  </>
                )}
                {!user && (
                  <Link to="/login" onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 py-3 px-3 text-sm rounded-lg transition-colors ${active("/login") ? "text-accent bg-accent/5" : "text-accent/80 hover:text-accent hover:bg-accent/5"}`}>
                    <LogIn className="h-4 w-4" /> {t("nav_login")}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartSlidePanel isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
