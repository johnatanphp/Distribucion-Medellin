import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { GeoProvider } from "@/contexts/GeoContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";

import PWAInstallBanner from "@/components/PWAInstallBanner";
import Login from "@/pages/Login";

import CustomerHome from "@/pages/CustomerHome";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerOrders from "@/pages/CustomerOrders";
import CustomerWishlist from "@/pages/CustomerWishlist";
import CustomerCart from "@/pages/CustomerCart";

import AdminHome from "@/pages/AdminHome";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminSettings from "@/pages/AdminSettings";

import StoreHome from "@/pages/StoreHome";
import StoreDashboard from "@/pages/StoreDashboard";

import BranchManager from "@/pages/BranchManager";
import DocumentCenter from "@/pages/DocumentCenter";
import NotificationCenter from "@/pages/NotificationCenter";

import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

setAuthTokenGetter(() => getAuthToken() || "");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRouter() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      {/* ── CUSTOMER ── */}
      <Route path="/customer" component={CustomerHome} />
      <Route path="/customer/catalog" component={CustomerDashboard} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/wishlist" component={CustomerWishlist} />
      <Route path="/customer/cart" component={CustomerCart} />

      {/* ── ADMIN ── */}
      <Route path="/admin" component={AdminHome} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/branches" component={BranchManager} />
      <Route path="/admin/documents" component={DocumentCenter} />

      {/* ── STORE ── */}
      <Route path="/store" component={StoreHome} />
      <Route path="/store/dashboard" component={StoreDashboard} />
      <Route path="/store/branches" component={BranchManager} />
      <Route path="/store/documents" component={DocumentCenter} />

      {/* ── SHARED ── */}
      <Route path="/notifications" component={NotificationCenter} />
      <Route path="/profile" component={ProfilePage} />

      {/* ── ROOT REDIRECT BY ROLE ── */}
      <Route path="/">
        {user.role === "superadmin" ? (
          <Redirect to="/admin" />
        ) : user.role === "store" ? (
          <Redirect to="/store" />
        ) : (
          <Redirect to="/customer" />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GeoProvider>
          <CartProvider>
            <AppRouter />
            <Toaster />
            <PWAInstallBanner />
          </CartProvider>
        </GeoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
