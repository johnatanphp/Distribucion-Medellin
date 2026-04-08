import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import {
  useGetStore, useGetStoreStats, useGetStoreProducts,
} from "@workspace/api-client-react";
import {
  Package, TrendingUp, Star, AlertTriangle, MapPin, Phone,
  DollarSign, ShoppingBag, BarChart3, ArrowRight, Layers,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import MapComponent from "@/components/MapComponent";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({ icon, label, value, color, sub }: {
  icon: React.ReactNode; label: string; value: any; color: string; sub?: string;
}) {
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

export default function StoreHome() {
  const { user } = useAuth();
  const storeId = user?.storeId || 0;

  const { data: store, isLoading: storeLoading } = useGetStore(storeId, { query: { enabled: !!storeId } });
  const { data: stats, isLoading: statsLoading } = useGetStoreStats(storeId, { query: { enabled: !!storeId } });
  const { data: products = [], isLoading: productsLoading } = useGetStoreProducts(storeId, { query: { enabled: !!storeId } });

  const productsArr = products as any[];
  const lowStock = productsArr.filter((p) => p.stock <= 5 && p.stock > 0);
  const outOfStock = productsArr.filter((p) => p.stock === 0);

  const categoryData = (() => {
    const cats: Record<string, number> = {};
    productsArr.forEach((p) => {
      cats[p.category] = (cats[p.category] || 0) + 1;
    });
    return Object.entries(cats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  })();

  const isLoading = storeLoading || statsLoading;

  return (
    <DashboardLayout title="Mi Tienda">
      <div className="space-y-5">
        {/* Store info card */}
        {isLoading ? (
          <Skeleton className="h-28 rounded-2xl bg-white/5" />
        ) : store ? (
          <div
            className="rounded-2xl p-5"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(249,115,22,0.2)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: (store as any).active ? "#22C55E" : "#ef4444", boxShadow: `0 0 6px ${(store as any).active ? "#22C55E" : "#ef4444"}` }}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: (store as any).active ? "#22C55E" : "#ef4444" }}>
                    {(store as any).active ? "En línea" : "Inactiva"}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mb-1">{(store as any).name}</h2>
                {(store as any).address && (
                  <p className="text-xs text-white/50 flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />{(store as any).address}
                  </p>
                )}
                {(store as any).phone && (
                  <p className="text-xs text-white/50 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0" />{(store as any).phone}
                  </p>
                )}
              </div>
              <Link href="/store/dashboard">
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase" style={{ color: "#f97316" }}>
                  Editar <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>
        ) : null}

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Package className="w-5 h-5" />} label="Productos" value={productsArr.length} color="#f97316" />
            <StatCard icon={<ShoppingBag className="w-5 h-5" />} label="Pedidos totales" value={(stats as any)?.totalOrders ?? 0} color="#00FFCC" />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Ingresos" value={`$${(((stats as any)?.totalRevenue ?? 0) / 1000).toFixed(0)}k`} color="#22C55E" sub="COP" />
            <StatCard icon={<Star className="w-5 h-5" />} label="Valoración" value={((stats as any)?.avgRating ?? 0).toFixed(1)} color="#eab308" sub="/ 5.0" />
          </div>
        )}

        {/* Alerts */}
        {!productsLoading && (lowStock.length > 0 || outOfStock.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outOfStock.length > 0 && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-300">{outOfStock.length} sin stock</p>
                  <p className="text-[11px] text-red-400/60 truncate">{outOfStock.slice(0, 2).map((p: any) => p.name).join(", ")}</p>
                </div>
                <Link href="/store/dashboard">
                  <span className="ml-auto text-[10px] font-mono text-red-400 flex items-center gap-1 flex-shrink-0">
                    Ver <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-yellow-300">{lowStock.length} con poco stock</p>
                  <p className="text-[11px] text-yellow-400/60 truncate">{lowStock.slice(0, 2).map((p: any) => p.name).join(", ")}</p>
                </div>
                <Link href="/store/dashboard">
                  <span className="ml-auto text-[10px] font-mono text-yellow-400 flex items-center gap-1 flex-shrink-0">
                    Ver <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Categories chart */}
        {categoryData.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" style={{ color: "#f97316" }} />
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Productos por Categoría</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#ffffff40", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#ffffff40", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0a0e1a", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 8, fontFamily: "monospace", fontSize: 11 }}
                  labelStyle={{ color: "#f97316" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" fill="#f97316" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Store on Map */}
        {store && (store as any).lat && (store as any).lng && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(249,115,22,0.2)" }}>
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Layers className="w-4 h-4" style={{ color: "#f97316" }} />
              <h3 className="font-mono text-xs uppercase tracking-widest text-white/70">Ubicación de tu Tienda</h3>
            </div>
            <div style={{ height: 280 }}>
              <MapComponent
                center={[(store as any).lat, (store as any).lng]}
                zoom={15}
                stores={[{
                  id: storeId,
                  name: (store as any).name,
                  lat: (store as any).lat,
                  lng: (store as any).lng,
                  address: (store as any).address,
                  phone: (store as any).phone,
                  active: (store as any).active,
                }]}
              />
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/store/dashboard", icon: <Package className="w-5 h-5" />, label: "Gestionar Inventario", color: "#f97316" },
            { href: "/store/dashboard", icon: <TrendingUp className="w-5 h-5" />, label: "Ver Estadísticas", color: "#00FFCC" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: `${item.color}0d`, border: `1px solid ${item.color}25` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18`, color: item.color }}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-white">{item.label}</span>
                <ArrowRight className="w-4 h-4 ml-auto" style={{ color: item.color }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
