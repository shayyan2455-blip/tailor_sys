import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';

const Login = lazy(() => import('../pages/Login.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const CustomerList = lazy(() => import('../pages/customers/CustomerList.jsx'));
const WorkerList = lazy(() => import('../pages/workers/WorkerList.jsx'));
const WorkerPaymentEntry = lazy(() => import('../pages/workers/WorkerPaymentEntry.jsx'));
const DesignList = lazy(() => import('../pages/designs/DesignList.jsx'));
const FabricList = lazy(() => import('../pages/fabrics/FabricList.jsx'));
const OrderBooking = lazy(() => import('../pages/orders/OrderBooking.jsx'));
const OrderDetail = lazy(() => import('../pages/orders/OrderDetail.jsx'));
const ProductionHub = lazy(() => import('../pages/production/ProductionHub.jsx'));
const DeliveryList = lazy(() => import('../pages/delivery/DeliveryList.jsx'));
const BillingList = lazy(() => import('../pages/billing/BillingList.jsx'));
const ExpenseEntry = lazy(() => import('../pages/expenses/ExpenseEntry.jsx'));
const PendingOrders = lazy(() => import('../pages/reports/PendingOrders.jsx'));
const ReadyOrders = lazy(() => import('../pages/reports/ReadyOrders.jsx'));
const DeliveredOrders = lazy(() => import('../pages/reports/DeliveredOrders.jsx'));
const RecoveryReport = lazy(() => import('../pages/reports/RecoveryReport.jsx'));
const WorkerLedger = lazy(() => import('../pages/reports/WorkerLedger.jsx'));
const ProfitReport = lazy(() => import('../pages/reports/ProfitReport.jsx'));
const BackupUtility = lazy(() => import('../pages/utility/BackupUtility.jsx'));
const ChangePassword = lazy(() => import('../pages/utility/ChangePassword.jsx'));
const SystemConfig = lazy(() => import('../pages/system/SystemConfig.jsx'));
const UserManagement = lazy(() => import('../pages/system/UserManagement.jsx'));

function ComingSoon({ title }) {
  return <div className="p-3 bg-white border rounded-2">{title} will be available in the next phase.</div>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute roles={['Admin']} />}>
        <Route element={<MainLayout />}>
          <Route path="/reports/profit" element={<ProfitReport />} />
          <Route path="/system/users" element={<UserManagement />} />
          <Route path="/utility/backup" element={<BackupUtility />} />
          <Route path="/system/config" element={<SystemConfig />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute roles={['Admin', 'Manager']} />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/workers" element={<WorkerList />} />
          <Route path="/workers/payments" element={<WorkerPaymentEntry />} />
          <Route path="/designs" element={<DesignList />} />
          <Route path="/fabrics" element={<FabricList />} />
          <Route path="/orders" element={<BillingList />} />
          <Route path="/orders/new" element={<OrderBooking />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/delivery" element={<DeliveryList />} />
          <Route path="/billing" element={<BillingList />} />
          <Route path="/expenses" element={<ExpenseEntry />} />
          <Route path="/reports/pending" element={<PendingOrders />} />
          <Route path="/reports/ready" element={<ReadyOrders />} />
          <Route path="/reports/delivered" element={<DeliveredOrders />} />
          <Route path="/reports/recovery" element={<RecoveryReport />} />
          <Route path="/reports/worker-ledger" element={<WorkerLedger />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute roles={['Admin', 'Manager', 'Worker']} />}>
        <Route element={<MainLayout />}>
          <Route path="/production" element={<ProductionHub />} />
          <Route path="/utility/change-password" element={<ChangePassword />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
