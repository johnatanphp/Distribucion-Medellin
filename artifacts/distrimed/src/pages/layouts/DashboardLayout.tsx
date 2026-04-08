import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  LogOut, Package, Store, Users, Activity,
  ShoppingCart, Heart, ClipboardList, User, Menu, X,
  Map, Zap, BarChart3, Home, LayoutGrid, Bell,
  Settings, GitBranch, FolderOpen, MessageCircle,
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
    switch (user?.role) {
      case "superadmin":
        return [
          { label: "Inicio", icon: Home, href: "/admin", color: "#00FFCC" },
          { label: "Panel Global", icon: BarChart3, href: "/admin/dashboard", color: "#00FFCC" },
          { label: "Sucursales", icon: GitBranch, href: "/admin/branches", color: "#f97316" },
          { label: "Documentos", icon: FolderOpen, href: "/admin/documents", color: "#a78bfa" },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: "#f59e0b", badge: unreadNotifs },
          { label: "Configuración", icon: Settings, href: "/admin/settings", color: "#00FFCC" },
          { label: "Mi Perfil", icon: User, href: "/profile", color: "#8b5cf6" },
        ];
      case "store":
        return [
          { label: "Inicio", icon: Home, href: "/store", color: "#f97316" },
          { label: "Panel de Tienda", icon: BarChart3, href: "/store/dashboard", color: "#f97316" },
          { label: "Sucursales", icon: GitBranch, href: "/store/branches", color: "#f97316" },
          { label: "Documentos", icon: FolderOpen, href: "/store/documents", color: "#a78bfa" },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: "#f59e0b", badge: unreadNotifs },
          { label: "Mi Perfil", icon: User, href: "/profile", color: "#8b5cf6" },
        ];
      case "customer":
        return [
          { label: "Inicio · Mapa", icon: Map, href: "/customer", color: "#00FFCC" },
          { label: "Catálogo", icon: LayoutGrid, href: "/customer/catalog", color: "#00FFCC" },
          { label: "Mis Pedidos", icon: ClipboardList, href: "/customer/orders", color: "#00FFCC" },
          { label: "Lista de Deseos", icon: Heart, href: "/customer/wishlist", color: "#ec4899" },
          { label: "Carrito", icon: ShoppingCart, href: "/customer/cart", color: "#00FFCC", badge: count },
          { label: "Notificaciones", icon: Bell, href: "/notifications", color: "#f59e0b", badge: unreadNotifs },
          { label: "Mi Perfil", icon: User, href: "/profile", color: "#8b5cf6" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const roleConfig = {
    superadmin: { label: "Super Admin", accent: "#00FFCC", bg: "rgba(0,255,204,0.1)" },
    store: { label: "Propietario", accent: "#f97316", bg: "rgba(249,115,22,0.1)" },
    customer: { label: "Cliente", accent: "#00FFCC", bg: "rgba(0,255,204,0.1)" },
  };
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
      <div className="h-16 flex items-center px-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: rc.bg, border: `1px solid ${rc.accent}40` }}>
            <Zap className="w-4 h-4" style={{ color: rc.accent }} />
          </div>
          <span className="font-mono font-black text-lg text-white tracking-widest">DISTRIMED</span>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="px-3 py-2 rounded-lg" style={{ background: rc.bg, border: `1px solid ${rc.accent}20` }}>
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: `${rc.accent}80` }}>Acceso</p>
          <p className="text-xs font-mono font-bold mt-0.5" style={{ color: rc.accent }}>{rc.label}</p>
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
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer relative group",
                  active ? "text-white" : "text-muted-foreground hover:text-white"
                )}
                style={active ? {
                  background: `${item.color || rc.accent}15`,
                  border: `1px solid ${item.color || rc.accent}30`,
                } : { border: "1px solid transparent" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={active ? {
                    background: `${item.color || rc.accent}20`,
                    boxShadow: `0 0 12px ${item.color || rc.accent}30`,
                  } : { background: "rgba(255,255,255,0.05)" }}
                >
                  <item.icon className="w-5 h-5 transition-all" style={{ color: active ? (item.color || rc.accent) : "inherit" }} />
                </div>
                <span className="flex-1 font-mono text-xs tracking-wide">{item.label}</span>
                {(item.badge ?? 0) > 0 && (
                  <span
                    className="text-[10px] font-mono font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1"
                    style={{ background: item.color || rc.accent, color: "#000" }}
                  >
                    {item.badge}
                  </span>
                )}
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color || rc.accent }} />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* User footer */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
            style={{ background: rc.bg, color: rc.accent, border: `1px solid ${rc.accent}40` }}
          >
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-white truncate">{user?.name}</p>
            <p className="text-[10px] font-mono truncate" style={{ color: `${rc.accent}80` }}>{user?.email}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono text-xs border border-red-500/20 rounded-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background cyber-grid">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex w-60 border-r border-white/5 bg-card/80 backdrop-blur-xl flex-col z-20 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Sidebar mobile */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-60 border-r border-white/5 bg-card/95 backdrop-blur-xl flex flex-col z-40 transition-transform duration-300 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-white/5 bg-card/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-muted-foreground hover:text-white p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="text-sm lg:text-base font-mono font-bold text-white tracking-widest uppercase">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "customer" && (
              <Link href="/customer/cart">
                <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5">
                  <ShoppingCart className="w-5 h-5" />
                  {count > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center"
                      style={{ background: rc.accent, color: "#000" }}
                    >
                      {count}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/5">
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse"
                    style={{ background: "#f59e0b", color: "#000" }}
                  >
                    {unreadNotifs > 9 ? "9+" : unreadNotifs}
                  </span>
                )}
              </Button>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ background: rc.accent }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: rc.accent }} />
              </span>
              <span className="text-[10px] font-mono hidden sm:block" style={{ color: rc.accent }}>EN LÍNEA</span>
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
