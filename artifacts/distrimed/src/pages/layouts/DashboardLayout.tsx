import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  LogOut, Package, Store, Users, Activity,
  ShoppingCart, Heart, ClipboardList, User, Menu, X,
  Map, Zap, BarChart3, Home, LayoutGrid, Bell,
  Settings, GitBranch, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { getAuthToken } from "@/lib/auth";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  color?: string;
}

const roleConfig = {
  superadmin: { label: "Super Admin", accent: "hsl(var(--primary))", hex: "#0099B8" },
  store: { label: "Propietario", accent: "hsl(25 95% 53%)", hex: "#f97316" },
  customer: { label: "Cliente", accent: "hsl(var(--primary))", hex: "#0099B8" },
};

export default function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { count } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setUnreadNotifs(data.filter((n: any) => !n.read).length);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getNavItems = (): NavItem[] => {
    const pHex = "#0099B8";
    const oHex = "#f97316";
    const vHex = "#7C3AED";
    const gHex = "#16A34A";
    const aHex = "#f59e0b";
    switch (user?.role) {
      case "superadmin":
        return [
          { label: "Inicio", icon: Home, href: "/admin", color: pHex },
          { label: "Panel Global", icon: BarChart3, href: "/admin/dashboard", color: pHex },
          { label: "Sucursales", icon: GitBranch, href: "/admin/branches", color: oHex },
          { label: "Documentos", icon: FolderOpen, href: "/admin/documents", color: vHex },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: aHex, badge: unreadNotifs },
          { label: "Configuración", icon: Settings, href: "/admin/settings", color: pHex },
          { label: "Mi Perfil", icon: User, href: "/profile", color: vHex },
        ];
      case "store":
        return [
          { label: "Inicio", icon: Home, href: "/store", color: oHex },
          { label: "Panel de Tienda", icon: BarChart3, href: "/store/dashboard", color: oHex },
          { label: "Sucursales", icon: GitBranch, href: "/store/branches", color: oHex },
          { label: "Documentos", icon: FolderOpen, href: "/store/documents", color: vHex },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: aHex, badge: unreadNotifs },
          { label: "Mi Perfil", icon: User, href: "/profile", color: vHex },
        ];
      case "customer":
        return [
          { label: "Inicio · Mapa", icon: Map, href: "/customer", color: pHex },
          { label: "Catálogo", icon: LayoutGrid, href: "/customer/catalog", color: pHex },
          { label: "Mis Pedidos", icon: ClipboardList, href: "/customer/orders", color: pHex },
          { label: "Lista de Deseos", icon: Heart, href: "/customer/wishlist", color: "#ec4899" },
          { label: "Carrito", icon: ShoppingCart, href: "/customer/cart", color: pHex, badge: count },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: aHex, badge: unreadNotifs },
          { label: "Mi Perfil", icon: User, href: "/profile", color: vHex },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const rc = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.customer;

  const isActiveHref = (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      const param = query.split("=")[1];
      return location === path && window.location.search === `?tab=${param}`;
    }
    return location === path && !window.location.search;
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div
        className="h-16 flex items-center px-5 flex-shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${rc.hex}18`, border: `1px solid ${rc.hex}40` }}
          >
            <Activity className="w-4 h-4" style={{ color: rc.hex }} />
          </div>
          <span className="font-mono font-black text-lg text-foreground tracking-widest">DISTRIMED</span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="px-3 py-2 rounded-xl"
          style={{ background: `${rc.hex}10`, border: `1px solid ${rc.hex}25` }}
        >
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Acceso</p>
          <p className="text-xs font-mono font-bold mt-0.5" style={{ color: rc.hex }}>{rc.label}</p>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">Navegación</p>
        {navItems.map((item) => {
          const active = isActiveHref(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
                style={active ? {
                  background: `${item.color || rc.hex}12`,
                  border: `1px solid ${item.color || rc.hex}30`,
                } : { border: "1px solid transparent" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={active ? {
                    background: `${item.color || rc.hex}18`,
                  } : { background: "hsl(var(--muted))" }}
                >
                  <item.icon
                    className="w-4 h-4"
                    style={{ color: active ? (item.color || rc.hex) : "hsl(var(--muted-foreground))" }}
                  />
                </div>
                <span className="flex-1 font-mono text-xs tracking-wide">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span
                    className="text-[10px] font-mono font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1"
                    style={{ background: item.color || rc.hex, color: "#fff" }}
                  >
                    {item.badge}
                  </span>
                )}
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color || rc.hex }} />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
            style={{
              background: `${rc.hex}15`,
              color: rc.hex,
              border: `1px solid ${rc.hex}35`
            }}
          >
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/8 font-mono text-xs border border-destructive/20 rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background pharma-grid">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div
        className="hidden lg:flex w-60 flex-col z-20 flex-shrink-0"
        style={{
          background: "hsl(var(--card))",
          borderRight: "1px solid hsl(var(--border))",
        }}
      >
        <SidebarContent />
      </div>

      {/* Sidebar mobile */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-60 flex flex-col z-40 transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "hsl(var(--card))",
          borderRight: "1px solid hsl(var(--border))",
        }}
      >
        <SidebarContent />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 z-10 flex-shrink-0"
          style={{
            background: "hsl(var(--card))",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-sm lg:text-base font-mono font-bold text-foreground tracking-widest uppercase">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "customer" && (
              <Link href="/customer/cart">
                <Button variant="ghost" size="sm" className="relative p-2 rounded-xl">
                  <ShoppingCart className="w-5 h-5" />
                  {count > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center text-white"
                      style={{ background: rc.hex }}
                    >
                      {count}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative p-2 rounded-xl">
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center text-white animate-pulse bg-amber-500">
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </Button>
            </Link>

            {/* Online indicator */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: `${rc.hex}10`,
                border: `1px solid ${rc.hex}25`,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-50" style={{ background: rc.hex }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: rc.hex }} />
              </span>
              <span className="text-[10px] font-mono hidden sm:block font-bold" style={{ color: rc.hex }}>EN LÍNEA</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
