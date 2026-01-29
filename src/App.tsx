import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import Loyalty from "./pages/Loyalty";
import Admin from "./pages/Admin";
import AdminCalendarPage from "./pages/AdminCalendar";
import AdminFinancialPage from "./pages/AdminFinancial";
import AdminClientsPage from "./pages/AdminClients";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/reservations" element={<Reservations />} />
            <Route path="/dashboard/loyalty" element={<Loyalty />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/calendar" element={<AdminCalendarPage />} />
            <Route path="/admin/financial" element={<AdminFinancialPage />} />
            <Route path="/admin/clients" element={<AdminClientsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
