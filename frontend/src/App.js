import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { useEffect } from "react";
import { initSecurity } from "@/utils/security";
import telemetryService from "@/utils/telemetryService";
import AnimatedBackground from "@/components/AnimatedBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Offers from "@/pages/Offers";
import GiftCards from "@/pages/GiftCards";
import CustomQuantity from "@/pages/CustomQuantity";
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

function App() {
  // Initialize security + telemetry service on load
  useEffect(() => {
    initSecurity();
    // Initialize telemetry session (token rotation)
    telemetryService.init();
    
    return () => {
      telemetryService.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-[#050505] flex flex-col relative">
            {/* Violet halo background + subtle grid */}
            <AnimatedBackground />

            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/gift-cards" element={<GiftCards />} />
                  <Route path="/custom-quantity" element={<CustomQuantity />} />
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
              </main>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
