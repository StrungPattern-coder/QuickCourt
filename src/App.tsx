import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// Components
import Footer from "./components/Footer";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Venues from "./pages/Venues";
import VenuesPage from "./pages/VenuesPage";
import VenueDetail from "./pages/VenueDetail";
import VenueDetailsPage from "./pages/VenueDetailsPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OtpLogin from "./pages/OtpLogin";
// If the file is named differently, update the import path accordingly, e.g.:
// import Login from "./pages/LoginPage";
// import Login from "./pages/login";
// import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";
import BookingPage from "./pages/BookingPage";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

// Component to conditionally render footer
const ConditionalFooter = () => {
  const location = useLocation();
  
  // Pages where footer should NOT be shown
  const authPages = [
    '/login',
    '/signup', 
    '/otp-login',
    '/forgot-password',
    '/reset-password'
  ];
  
  // Don't show footer on auth pages
  if (authPages.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

const AppContent = () => (
  <div className="min-h-screen flex flex-col">
    <div className="flex-1">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/play" element={<VenuesPage />} />
        <Route path="/book" element={<VenuesPage />} />
        <Route path="/train" element={<VenuesPage />} />
        <Route path="/venues" element={<Venues />} />
        <Route path="/venues-search" element={<VenuesPage />} />
        <Route path="/venue/:id" element={<VenueDetail />} />
        <Route path="/venue-details/:id" element={<VenueDetailsPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp-login" element={<OtpLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/book/:venueId/:courtId" element={<BookingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    <ConditionalFooter />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;