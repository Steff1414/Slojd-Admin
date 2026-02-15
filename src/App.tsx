import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import Teachers from "./pages/Teachers";
import CreateCustomer from "./pages/CreateCustomer";
import CreateContact from "./pages/CreateContact";
import CreateTeacher from "./pages/CreateTeacher";
import AuditLog from "./pages/AuditLog";
import MergeContacts from "./pages/MergeContacts";
import RelationsExplorer from "./pages/RelationsExplorer";
import ApiDocs from "./pages/ApiDocs";
import ImportCenter from "./pages/ImportCenter";
import OrganisationGraph from "./pages/OrganisationGraph";
import Schools from "./pages/Schools";
import Payers from "./pages/Payers";
import EmailTemplates from "./pages/EmailTemplates";
import Account from "./pages/Account";
import AllowedEmails from "./pages/AllowedEmails";
import Norce from "./pages/Norce";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-primary/20" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/customers/new" element={<ProtectedRoute><CreateCustomer /></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
      <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
      <Route path="/payers" element={<ProtectedRoute><Payers /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/contacts/new" element={<ProtectedRoute><CreateContact /></ProtectedRoute>} />
      <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetail /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
      <Route path="/teachers/new" element={<ProtectedRoute><CreateTeacher /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute><AuditLog /></ProtectedRoute>} />
      <Route path="/merge-contacts" element={<ProtectedRoute><MergeContacts /></ProtectedRoute>} />
      <Route path="/relations" element={<ProtectedRoute><RelationsExplorer /></ProtectedRoute>} />
      <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
      <Route path="/import" element={<ProtectedRoute><ImportCenter /></ProtectedRoute>} />
      <Route path="/organisation-graph" element={<ProtectedRoute><OrganisationGraph /></ProtectedRoute>} />
      <Route path="/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
      <Route path="/allowed-emails" element={<ProtectedRoute><AllowedEmails /></ProtectedRoute>} />
      <Route path="/norce" element={<ProtectedRoute><Norce /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
