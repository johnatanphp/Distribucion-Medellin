import DashboardLayout from "./layouts/DashboardLayout";
import { useGetGlobalStats, useGetStores, useGetProducts } from "@workspace/api-client-react";
import StoreMapWidget from "@/components/StoreMapWidget";
import {
  Store, Users, Package, DollarSign, TrendingUp,
  Activity, BarChart2, MapPin, Zap, ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

function buildSalesTimeline(recentActivity: any[] = []) {
  const days: Record<string, number> = {};
  recentActivity.forEach((a) => {
    const date = new Date(a.timestamp).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
    const amount = parseFloat((a.description.match(/\$([\d,.]+)/) || [])[1]?.replace(/,/g, "") || "0");
    days[date] = (days[date] || 0) + amount;
  });
  return Object.entries(days).map(([date, amount]) => ({ date, amount })).slice(-10);
}

function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: any; color: string; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-0.5">{label}</p>
        <p className="text-xl font-black text-white">{value ?? "–"}</p>
        {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminHome() {
  const { data: stats, isLoading } = useGetGlobalStats();
  const { data: stores = [] } = useGetStores();
  const { data: products = [] } = useGetProducts({});

  const salesData = buildSalesTimeline(stats?.recentActivity);
  const activeStores = (stores as any[]).filter((s: any) => s.active).length;
  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <DashboardLayout title="Panel Global">
      <div className="space-y-5">
        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Store className="w-5 h-5" />}
              label="Tiendas activas"
              value={activeStores}
              color="#00FFCC"
              sub={`de ${(stores as any[]).length} total`}
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Usuarios"
              value={stats?.totalUsers ?? 0}
              color="#A855F7"
            />
            <StatCard
              icon={<Package className="w-5 h-5" />}
              label="Productos"
              value={(products as any[]).length}
              color="#FF9900"
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Ingresos"
              value={`$${(totalRevenue / 1000).toFixed(0)}k`}
              color="#22C55E"
              sub="COP acumulado"
            />
          </div>
        )}

        {/* Sales Trend */}
        {salesData.length > 1 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4" style={{ color: "#00FFCC" }} />
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Tendencia de Ventas</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00FFCC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#ffffff40", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0a0e1a", border: "1px solid rgba(0,255,204,0.2)", borderRadius: 8, fontFamily: "monospace", fontSize: 11 }}
                  labelStyle={{ color: "#00FFCC" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="amount" stroke="#00FFCC" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Map */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: "#00FFCC" }} />
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Red de Distribución — Medellín</h3>
            </div>
            <Link href="/admin?tab=stores">
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide cursor-pointer" style={{ color: "#00FFCC" }}>
                Gestionar <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <StoreMapWidget height="420px" showWidgets={false} compact />
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" style={{ color: "#A855F7" }} />
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Actividad Reciente</h3>
            </div>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 6).map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#A855F7", boxShadow: "0 0 4px #A855F7" }} />
                  <p className="text-xs text-white/60 flex-1 truncate">{a.description}</p>
                  <p className="text-[10px] text-white/30 flex-shrink-0">
                    {new Date(a.timestamp).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
