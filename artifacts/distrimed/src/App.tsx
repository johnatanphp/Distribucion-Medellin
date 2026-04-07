import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAuthToken } from "@/lib/auth";

import PWAInstallBanner from "@/components/PWAInstallBanner";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import StoreDashboard from "@/pages/StoreDashboard";
import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerOrders from "@/pages/CustomerOrders";
import CustomerWishlist from "@/pages/CustomerWishlist";
import CustomerCart from "@/pages/CustomerCart";
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
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/store" component={StoreDashboard} />
      <Route path="/customer" component={CustomerDashboard} />
      <Route path="/customer/orders" component={CustomerOrders} />
      <Route path="/customer/wishlist" component={CustomerWishlist} />
      <Route path="/customer/cart" component={CustomerCart} />
      <Route path="/profile" component={ProfilePage} />
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
        <CartProvider>
          <AppRouter />
          <Toaster />
          <PWAInstallBanner />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
