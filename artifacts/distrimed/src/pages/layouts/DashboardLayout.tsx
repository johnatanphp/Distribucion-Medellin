import { ReactNode, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  LogOut, LayoutDashboard, Map, Package, Store, Users, Activity,
  ShoppingCart, Heart, ClipboardList, User, Menu, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

export default function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { count } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case "superadmin":
        return [
          { label: "Panel Global", icon: Activity, href: "/admin" },
          { label: "Gestión de Tiendas", icon: Store, href: "/admin?tab=stores" },
          { label: "Usuarios", icon: Users, href: "/admin?tab=users" },
          { label: "Mi Perfil", icon: User, href: "/profile" },
        ];
      case "store":
        return [
          { label: "Panel de Tienda", icon: Store, href: "/store" },
          { label: "Inventario", icon: Package, href: "/store?tab=products" },
          { label: "Estadísticas", icon: Activity, href: "/store?tab=stats" },
          { label: "Mi Perfil", icon: User, href: "/profile" },
        ];
      case "customer":
        return [
          { label: "Catálogo", icon: Package, href: "/customer" },
          { label: "Mapa de Tiendas", icon: Map, href: "/customer?tab=map" },
          { label: "Mis Pedidos", icon: ClipboardList, href: "/customer/orders" },
          { label: "Lista de Deseos", icon: Heart, href: "/customer/wishlist" },
          { label: "Carrito", icon: ShoppingCart, href: "/customer/cart", badge: count },
          { label: "Mi Perfil", icon: User, href: "/profile" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-primary/20 flex-shrink-0">
        <span className="font-mono font-bold text-xl text-white glow-text tracking-wider">DISTRIMED</span>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-3 mb-3">
          {user?.role === "superadmin" ? "Administración" : user?.role === "store" ? "Gestión" : "Cliente"}
        </p>
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href.split("?")[0]) && !item.href.includes("?tab=") && !location.includes("?"));
          const exactActive = location === item.href.split("?")[0] && !item.href.includes("?tab=") || location + (window.location.search || "") === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all cursor-pointer relative",
                  location.split("?")[0] === item.href.split("?")[0] && (!item.href.includes("?tab=") || location + window.location.search === item.href)
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <Badge className="bg-primary text-black text-[10px] h-4 min-w-[16px] px-1">
                    {item.badge}
                  </Badge>
                )}
                <ChevronRight className="w-3 h-3 opacity-30" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-primary/20 flex-shrink-0">
        <div className="mb-3 px-2 py-2 bg-primary/5 rounded-md border border-primary/10">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Sesión activa</p>
          <p className="text-sm font-bold truncate text-white mt-0.5">{user?.name}</p>
          <p className="text-[10px] text-primary font-mono uppercase">{user?.role}</p>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-mono uppercase text-xs"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Desconectar
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background cyber-grid">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <div className="hidden lg:flex w-56 border-r border-primary/20 bg-card/90 backdrop-blur-sm flex-col z-20 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Sidebar - mobile */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-56 border-r border-primary/20 bg-card/95 backdrop-blur-sm flex flex-col z-40 transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-14 border-b border-primary/20 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-primary p-1"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-base lg:text-xl font-mono font-bold text-white tracking-widest uppercase truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "customer" && (
              <Link href="/customer/cart">
                <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-primary p-2">
                  <ShoppingCart className="w-4 h-4" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-mono text-primary uppercase hidden sm:block">En Línea</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
