import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PlatformAdmin } from "./pages/PlatformAdmin";

// Auth Pages
import { Login } from "./pages/auth/Login";
import { RegisterCompany } from "./pages/auth/RegisterCompany";

// Employee Pages
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { EmployeeProfile } from "./pages/employee/EmployeeProfile";
import { GiveFeedback } from "./pages/employee/GiveFeedback";
import { FeedbackHistory } from "./pages/employee/FeedbackHistory";
import { Resources } from "./pages/employee/Resources";
import { HelpSupport } from "./pages/employee/HelpSupport";

// HR Pages
import { HRDashboard } from "./pages/hr/HRDashboard";
import { EmployeeDirectory } from "./pages/hr/EmployeeDirectory";
import { FeedbackExplorer } from "./pages/hr/FeedbackExplorer";
import { AttritionInsights } from "./pages/hr/AttritionInsights";
import { HRManagement } from "./pages/hr/HRManagement";
import { CompanyOverview } from "./pages/hr/CompanyOverview";
import { Settings } from "./pages/hr/Settings";

// Role-based route guard
const ProtectedRoute = ({ allowedRole, children }) => {
  const { isLoggedIn, role } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Cross-role access protection
    return <Navigate to={role === "platformAdmin" ? "/admin/dashboard" : role === "hr" ? "/hr/dashboard" : "/employee/dashboard"} replace />;
  }

  return children;
};

// Root index redirect based on role
const RootRedirect = () => {
  const { isLoggedIn, role } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === "platformAdmin" ? "/admin/dashboard" : role === "hr" ? "/hr/dashboard" : "/employee/dashboard"} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Root Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register-company" element={<RegisterCompany />} />

      {/* Legacy Route Aliases for backward compatibility */}
      <Route path="/signIn" element={<Navigate to="/login" replace />} />
      <Route path="/signUp" element={<Navigate to="/login" replace />} />
      <Route path="/form" element={<Navigate to="/register-company" replace />} />
      <Route path="/HRHome" element={<Navigate to="/hr/dashboard" replace />} />
      <Route path="/feedback" element={<Navigate to="/employee/feedback" replace />} />
      <Route path="/HrPage" element={<Navigate to="/hr/dashboard" replace />} />
      <Route path="/empFeedback" element={<Navigate to="/hr/feedback" replace />} />

      {/* Protected Employee Portal Routes */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRole="employee">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="feedback" element={<GiveFeedback />} />
        <Route path="history" element={<FeedbackHistory />} />
        <Route path="resources" element={<Resources />} />
        <Route path="support" element={<HelpSupport />} />
      </Route>

      {/* Protected HR Portal Routes */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute allowedRole="hr">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/hr/dashboard" replace />} />
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="employees" element={<EmployeeDirectory />} />
        <Route path="feedback" element={<FeedbackExplorer />} />
        <Route path="attrition" element={<AttritionInsights />} />
        <Route path="management" element={<HRManagement />} />
        <Route path="company" element={<CompanyOverview />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Platform Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="platformAdmin">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PlatformAdmin />} />
      </Route>
      {/* Catch-all Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
