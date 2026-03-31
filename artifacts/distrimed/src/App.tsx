import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

// Pages
import Login from "@/pages/Login";
import CustomerDashboard from "@/pages/CustomerDashboard";
import StoreDashboard from "@/pages/StoreDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ path, component: Component, allowedRoles }: { path: string, component: any, allowedRoles: string[] }) {
  const { user, token } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!token || !user) {
      setLocation("/");
    } else if (!allowedRoles.includes(user.role)) {
      if (user.role === 'customer') setLocation("/customer");
      else if (user.role === 'store') setLocation("/store");
      else if (user.role === 'superadmin') setLocation("/admin");
    }
  }, [user, token, location, setLocation, allowedRoles]);

  if (!token || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user && location === "/") {
      if (user.role === 'customer') setLocation("/customer");
      else if (user.role === 'store') setLocation("/store");
      else if (user.role === 'superadmin') setLocation("/admin");
    }
  }, [user, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Login} />
      <ProtectedRoute path="/customer" component={CustomerDashboard} allowedRoles={['customer']} />
      <ProtectedRoute path="/store" component={StoreDashboard} allowedRoles={['store']} />
      <ProtectedRoute path="/admin" component={AdminDashboard} allowedRoles={['superadmin']} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service worker registration failed', err);
      });
    }
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <div className="min-h-[100dvh] bg-background text-foreground cyber-grid">
              <Router />
            </div>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
