
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeManager from './pages/EmployeeManager';
import AttendanceManager from './pages/AttendanceManager';
import FundManager from './pages/FundManager';
import ReportManager from './pages/ReportManager';
import EvaluationManager from './pages/EvaluationManager';
import ProposalManager from './pages/ProposalManager';
import ShiftManager from './pages/ShiftManager';
import { UserRole } from './types';

// Layout wrapper that requires authentication
const AuthenticatedLayout = () => {
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Đang tải...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <Layout user={user} onLogout={logout}>
      <Outlet />
    </Layout>
  );
};

// Route guard based on user roles
const RoleGuard = ({ allowedRoles }: { allowedRoles: UserRole[] }) => {
  const { user, hasRole } = useAuth();
  
  if (user && !hasRole(allowedRoles)) {
     return (
       <div className="flex flex-col items-center justify-center h-full p-8 text-center">
         <h2 className="text-2xl font-bold text-gray-800 mb-2">Truy cập bị từ chối</h2>
         <p className="text-gray-500">Bạn không có quyền truy cập vào trang này.</p>
       </div>
     );
  }
  return <Outlet />;
};

// Login wrapper to handle redirection if already logged in
const LoginWrapper = () => {
  const { login, user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Login onLogin={login} />;
};

const App = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          
          <Route element={<AuthenticatedLayout />}>
             <Route path="/" element={<Dashboard />} />
             <Route path="/attendance" element={<AttendanceManager />} />
             <Route path="/reports" element={<ReportManager />} />
             <Route path="/proposals" element={<ProposalManager />} />
             <Route path="/shifts" element={<ShiftManager />} />
             
             {/* Admin & Manager Only Routes */}
             <Route element={<RoleGuard allowedRoles={['admin', 'manager']} />}>
                <Route path="/employees" element={<EmployeeManager />} />
                <Route path="/funds" element={<FundManager />} />
                <Route path="/evaluation" element={<EvaluationManager />} />
             </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
