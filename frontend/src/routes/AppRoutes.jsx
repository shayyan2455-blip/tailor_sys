import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

function LoginShell() {
  return <div className="p-4">Login screen will be available in Phase 5.</div>;
}

function DashboardShell() {
  return <div className="p-4">Dashboard will be available in Phase 5.</div>;
}

function ProductionShell() {
  return <div className="p-4">Production Hub will be available in Phase 6.</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginShell />} />
      <Route element={<ProtectedRoute roles={['Admin', 'Manager']} />}>
        <Route path="/" element={<DashboardShell />} />
      </Route>
      <Route element={<ProtectedRoute roles={['Admin', 'Manager', 'Worker']} />}>
        <Route path="/production" element={<ProductionShell />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
