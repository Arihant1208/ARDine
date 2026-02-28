
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import LandingView from '@/features/landing/LandingView';
import AuthView from '@/features/auth/AuthView';
import OwnerGuard from '@/shared/components/OwnerGuard';
import OwnerSetupView from '@/features/owner/OwnerSetupView';
import OwnerDashboardView from '@/features/owner/OwnerDashboardView';
import CustomerMenuView from '@/features/customer/CustomerMenuView';
import CustomerCartView from '@/features/customer/CustomerCartView';

const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? '';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route element={<App />}>
            {/* Public routes */}
            <Route index element={<LandingView />} />
            <Route path="auth" element={<AuthView />} />

            {/* Customer routes (no auth) */}
            <Route path="menu/:userId" element={<CustomerMenuView />} />
            <Route path="menu/:userId/cart" element={<CustomerCartView />} />

            {/* Owner routes (auth required) */}
            <Route path="owner" element={<OwnerGuard />}>
              <Route path="setup" element={<OwnerSetupView />} />
              <Route path="dashboard" element={<OwnerDashboardView />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
