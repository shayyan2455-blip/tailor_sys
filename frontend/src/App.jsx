import { Suspense } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <Suspense fallback={<div className="p-3 small text-muted">Loading...</div>}>
      <AppRoutes />
    </Suspense>
  );
}
