import { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LogOut, LayoutDashboard, Map, Package, Store, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children, title }: { children: ReactNode, title: string }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const getNavItems = () => {
    switch (user?.role) {
      case 'superadmin':
        return [
          { label: 'Panel Global', icon: Activity, href: '/admin' },
        ];
      case 'store':
        return [
          { label: 'Gestión de Tienda', icon: Store, href: '/store' },
        ];
      case 'customer':
        return [
          { label: 'Catálogo & Mapa', icon: Map, href: '/customer' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background cyber-grid">
      {/* Sidebar */}
      <div className="w-64 border-r border-primary/20 bg-card/80 backdrop-blur-sm flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-primary/20">
          <span className="font-mono font-bold text-xl text-white glow-text tracking-wider">
            DISTRIMED
          </span>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          {getNavItems().map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md font-mono text-sm uppercase transition-all cursor-pointer",
                  location === item.href
                    ? "bg-primary/20 text-primary border border-primary/30 glow-border"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-primary/20">
          <div className="mb-4 px-2">
            <p className="text-xs font-mono text-muted-foreground uppercase">Usuario Activo</p>
            <p className="text-sm font-bold truncate text-white">{user?.name}</p>
            <p className="text-xs text-primary font-mono">{user?.role}</p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-mono uppercase text-xs"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Desconectar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-primary/20 bg-card/50 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <h1 className="text-xl font-mono font-bold text-white tracking-widest uppercase">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-mono text-primary uppercase">Sistema En Línea</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-8 z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
