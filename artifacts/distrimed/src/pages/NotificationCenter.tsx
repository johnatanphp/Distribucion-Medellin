import { useState, useEffect } from "react";
import DashboardLayout from "@/pages/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import {
  Bell, BellOff, MessageCircle, ShoppingBag, AlertTriangle,
  Info, CheckCircle, RefreshCw, Mail, Check, Filter,
  Smartphone, Globe,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Notification {
  id: number;
  userId: number | null;
  storeId: number | null;
  title: string;
  body: string;
  type: string;
  channel: string;
  read: boolean;
  data: string | null;
  sentAt: string;
}

const API = "/api";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` });

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  info: { label: "Info", icon: Info, color: "#38bdf8" },
  order: { label: "Pedido", icon: ShoppingBag, color: "#00FFCC" },
  alert: { label: "Alerta", icon: AlertTriangle, color: "#f59e0b" },
  whatsapp: { label: "WhatsApp", icon: MessageCircle, color: "#22c55e" },
  test: { label: "Prueba", icon: CheckCircle, color: "#a78bfa" },
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  in_app: { label: "App", icon: Smartphone },
  push: { label: "Push", icon: Globe },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  email: { label: "Email", icon: Mail },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins}m`;
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${days}d`;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/notifications`, { headers: headers() });
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las notificaciones", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function markRead(id: number) {
    await fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: headers() });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch(`${API}/notifications/read-all`, { method: "PUT", headers: headers() });
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
      toast({ title: "✅ Todas marcadas como leídas" });
    } finally { setMarkingAll(false); }
  }

  const filtered = notifications.filter(n => {
    const matchType = filterType === "all" || n.type === filterType;
    const matchRead = filterRead === "all" || (filterRead === "unread" && !n.read) || (filterRead === "read" && n.read);
    return matchType && matchRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout title="Notificaciones">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-2">
              <Bell className="w-5 h-5" style={{ color: "#f59e0b" }} />
              Centro de Notificaciones
              {unreadCount > 0 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: "#f59e0b", color: "#000" }}>
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{notifications.length} total · {unreadCount} sin leer</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchNotifications} variant="ghost" size="sm" className="text-white/50 hover:text-white font-mono text-xs border border-white/10">
              <RefreshCw className="w-3 h-3 mr-1.5" />Actualizar
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllRead} disabled={markingAll} size="sm" variant="outline" className="font-mono text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                <Check className="w-3 h-3 mr-1.5" />{markingAll ? "..." : "Marcar todas"}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["all", "unread", "read"] as const).map(f => (
              <button key={f} onClick={() => setFilterRead(f)}
                className="px-3 py-1 rounded-lg text-[11px] font-mono transition-all"
                style={filterRead === f ? { background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b30" }
                  : { color: "rgba(255,255,255,0.3)" }}>
                {f === "all" ? "Todas" : f === "unread" ? "No leídas" : "Leídas"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", ...Object.keys(TYPE_CONFIG)].map(t => {
              const cfg = TYPE_CONFIG[t];
              const active = filterType === t;
              return (
                <button key={t} onClick={() => setFilterType(t)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all"
                  style={active ? { background: `${cfg?.color ?? "#888"}20`, border: `1px solid ${cfg?.color ?? "#888"}40`, color: cfg?.color ?? "#888" }
                    : { border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                  {t === "all" ? "Todos los tipos" : cfg?.label ?? t}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BellOff className="w-12 h-12 mx-auto text-white/10" />
            <p className="text-white/30 font-mono text-sm">No hay notificaciones{filterRead !== "all" ? " en este filtro" : ""}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const typeCfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
              const channelCfg = CHANNEL_CONFIG[n.channel] ?? CHANNEL_CONFIG.in_app;
              const TypeIcon = typeCfg.icon;
              const ChannelIcon = channelCfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`flex items-start gap-3 p-4 rounded-xl transition-all ${!n.read ? "cursor-pointer hover:opacity-90" : ""}`}
                  style={{
                    background: n.read ? "rgba(255,255,255,0.02)" : `${typeCfg.color}08`,
                    border: `1px solid ${n.read ? "rgba(255,255,255,0.05)" : typeCfg.color + "25"}`,
                  }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}25` }}>
                    <TypeIcon className="w-4 h-4" style={{ color: typeCfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-mono font-bold truncate ${n.read ? "text-white/60" : "text-white"}`}>{n.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] font-mono text-white/25">{timeAgo(n.sentAt)}</span>
                        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeCfg.color }} />}
                      </div>
                    </div>
                    <p className={`text-xs font-mono mt-0.5 ${n.read ? "text-white/30" : "text-white/50"}`}>{n.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${typeCfg.color}15`, color: typeCfg.color }}>
                        {typeCfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-mono text-white/20">
                        <ChannelIcon className="w-2.5 h-2.5" />{channelCfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PWA push notifications info */}
        <div className="rounded-2xl p-4 text-xs font-mono space-y-2" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
          <p className="font-bold text-sky-300 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />Notificaciones Push PWA</p>
          <p className="text-white/40">Las notificaciones push requieren que la app esté instalada como PWA en tu dispositivo.</p>
          <p className="text-white/40">Las órdenes nuevas, alertas de stock y mensajes de WhatsApp llegan automáticamente.</p>
          {user?.role !== "customer" && (
            <Button size="sm" variant="outline" className="text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 mt-2"
              onClick={async () => {
                if (!("Notification" in window)) { toast({ title: "No soportado", description: "Tu navegador no soporta notificaciones", variant: "destructive" }); return; }
                const perm = await Notification.requestPermission();
                if (perm === "granted") toast({ title: "✅ Notificaciones activadas", description: "Recibirás alertas de nuevos pedidos y stock" });
                else toast({ title: "Permiso denegado", description: "Activa los permisos en la configuración del navegador", variant: "destructive" });
              }}>
              <Bell className="w-3 h-3 mr-1.5" />Activar notificaciones push
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
