import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { useEffect } from "react";
import { initSecurity } from "@/utils/security";
import telemetryService from "@/utils/telemetryService";
import { initSmoothScroll, destroySmoothScroll } from "@/utils/smoothScroll";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Offers from "@/pages/Offers";
import GiftCards from "@/pages/GiftCards";
import CustomQuantity from "@/pages/CustomQuantity";
import LegalNotice from "@/pages/LegalNotice";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Refund from "@/pages/Refund";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderHistory from "@/pages/OrderHistory";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminAB from "@/pages/AdminAB";
import AdminOxaPay from "@/pages/AdminOxaPay";
import Profile from "@/pages/Profile";
import ScrollToTop from "@/components/ScrollToTop";
import ScrollProgress from "@/components/ScrollProgress";
import PageTransition from "@/components/PageTransition";
import FloatingCTA from "@/components/FloatingCTA";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageTransition>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/gift-cards" element={<GiftCards />} />
        <Route path="/custom-quantity" element={<CustomQuantity />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="/conditions" element={<Terms />} />
        <Route path="/confidentialite" element={<Privacy />} />
        <Route path="/remboursement" element={<Refund />} />
        <Route path="/checkout/:packId" element={<Checkout />} />
        <Route path="/order/:orderId" element={<OrderConfirmation />} />
        <Route path="/history" element={<OrderHistory />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/ab" element={<AdminAB />} />
        <Route path="/admin/oxapay" element={<AdminOxaPay />} />
      </Routes>
    </PageTransition>
  );
}

function App() {
  // Initialize security + telemetry + Lenis smooth scroll on load
  useEffect(() => {
    initSecurity();
    telemetryService.init();
    initSmoothScroll();

    return () => {
      telemetryService.destroy();
      destroySmoothScroll();
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <ScrollProgress />
          <div className="min-h-screen bg-black flex flex-col relative">
            {/* Violet halo background + subtle grid */}
            <AnimatedBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              {/* Spacer to compensate for fixed header height */}
              <div aria-hidden="true" className="h-[68px] sm:h-[84px] shrink-0" />
              <main className="flex-1 flex flex-col">
                <AnimatedRoutes />
              </main>
              <Footer />
              <FloatingCTA />
            </div>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
