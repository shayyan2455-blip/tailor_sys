import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

const Login = lazy(() => import('../pages/Login.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const CustomerList = lazy(() => import('../pages/customers/CustomerList.jsx'));
const WorkerList = lazy(() => import('../pages/workers/WorkerList.jsx'));
const DesignList = lazy(() => import('../pages/designs/DesignList.jsx'));
const FabricList = lazy(() => import('../pages/fabrics/FabricList.jsx'));

function ProductionShell() {
  return <div className="p-4">Production Hub will be available in Phase 6.</div>;
}

function ComingSoon({ title }) {
  return <div className="p-3 bg-white border rounded-2">{title} will be available in the next phase.</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute roles={['Admin', 'Manager']} />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/workers" element={<WorkerList />} />
          <Route path="/designs" element={<DesignList />} />
          <Route path="/fabrics" element={<FabricList />} />
          <Route path="/orders" element={<ComingSoon title="Orders" />} />
          <Route path="/orders/new" element={<ComingSoon title="Order booking" />} />
          <Route path="/delivery" element={<ComingSoon title="Delivery" />} />
          <Route path="/billing" element={<ComingSoon title="Billing" />} />
          <Route path="/expenses" element={<ComingSoon title="Expenses" />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute roles={['Admin', 'Manager', 'Worker']} />}>
        <Route element={<MainLayout />}>
          <Route path="/production" element={<ProductionShell />} />
          <Route path="/utility/change-password" element={<ComingSoon title="Change password" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
