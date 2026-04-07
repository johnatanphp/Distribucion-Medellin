import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import {
  useGetGlobalStats, useGetStores, useGetUsers,
  useToggleStore, useCreateStore, useCreateUser, useDeleteUser, useUpdateUser,
  getGetStoresQueryKey, getGetGlobalStatsQueryKey, getGetUsersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity, Store, Users, Power, PowerOff, Plus, Trash2, Edit,
  BarChart2, ShieldCheck, Map, TrendingUp, Package, DollarSign, Search, X
} from "lucide-react";
import StoreMapWidget from "@/components/StoreMapWidget";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tab = "overview" | "stores" | "users" | "mapa";

// Synthetic daily sales data from recent activity
function buildSalesTimeline(recentActivity: any[] = []) {
  const days: Record<string, number> = {};
  recentActivity.forEach((a) => {
    const date = new Date(a.timestamp).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
    const amount = parseFloat((a.description.match(/\$([\d,.]+)/) || [])[1]?.replace(/,/g, "") || "0");
    days[date] = (days[date] || 0) + amount;
  });
  return Object.entries(days)
    .map(([date, amount]) => ({ date, amount }))
    .slice(-14);
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: stores, isLoading: storesLoading } = useGetStores();
  const { data: users, isLoading: usersLoading } = useGetUsers();

  const toggleStore = useToggleStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoresQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
        toast({ title: "Estado actualizado", description: "El estado de la tienda ha sido modificado." });
      }
    }
  });

  const deleteUser = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
        toast({ title: "Usuario eliminado" });
      }
    }
  });

  const salesTimeline = buildSalesTimeline(stats?.recentActivity);

  const filteredStores = stores?.filter((s) =>
    !storeSearch ||
    s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.address?.toLowerCase().includes(storeSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  const filteredUsers = users?.filter((u) =>
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Resumen", icon: BarChart2 },
    { id: "stores", label: "Tiendas", icon: Store },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "mapa", label: "Mapa", icon: Map },
  ];

  return (
    <DashboardLayout title="Panel de Control">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tiendas Activas"
            value={stats?.activeStores ?? 0}
            total={stats?.totalStores ?? 0}
            icon={Store}
            loading={statsLoading}
            color="#00FFCC"
          />
          <StatCard
            title="Productos"
            value={stats?.totalProducts ?? 0}
            icon={Package}
            loading={statsLoading}
            color="#A855F7"
          />
          <StatCard
            title="Usuarios"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            loading={statsLoading}
            color="#3B82F6"
          />
          <StatCard
            title="Ventas Totales"
            value={`$${((stats?.totalSales ?? 0) / 1000).toFixed(0)}K`}
            icon={DollarSign}
            loading={statsLoading}
            color="#22C55E"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-primary/20 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 transition-all",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales by store */}
              <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-md border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase text-primary">Top Tiendas por Ventas</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-[260px] w-full bg-primary/10" />
                  ) : (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.topStores ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#00FFCC20" vertical={false} />
                          <XAxis dataKey="name" stroke="#00FFCC60" tick={{ fill: "#00FFCC", fontSize: 10, fontFamily: "monospace" }} />
                          <YAxis stroke="#00FFCC60" tick={{ fill: "#00FFCC", fontSize: 10, fontFamily: "monospace" }} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: "#0a0e1a", borderColor: "#00FFCC", fontFamily: "monospace" }}
                            itemStyle={{ color: "#00FFCC" }}
                            formatter={(v: any) => [`$${Number(v).toLocaleString("es-CO")}`, "Ventas"]}
                          />
                          <Bar dataKey="totalSales" fill="#00FFCC" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-card/50 backdrop-blur-md border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase text-primary">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-primary/10" />)}</div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {stats?.recentActivity?.map((a) => (
                        <div key={a.id} className="flex flex-col border-l-2 border-primary/40 pl-3 py-1">
                          <span className="text-[9px] font-mono text-primary/70">{new Date(a.timestamp).toLocaleString("es-CO")}</span>
                          <span className="text-xs font-mono text-white">{a.description}</span>
                          <span className="text-[10px] text-muted-foreground">{a.storeName}</span>
                        </div>
                      ))}
                      {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                        <p className="text-xs font-mono text-muted-foreground py-4 text-center">Sin actividad reciente</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ventas en el tiempo */}
            {salesTimeline.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-md border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase text-primary flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Tendencia de Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesTimeline} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00FFCC" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#00FFCC15" vertical={false} />
                        <XAxis dataKey="date" stroke="#00FFCC40" tick={{ fill: "#aaa", fontSize: 9, fontFamily: "monospace" }} />
                        <YAxis stroke="#00FFCC40" tick={{ fill: "#aaa", fontSize: 9, fontFamily: "monospace" }} />
                        <RechartsTooltip
                          contentStyle={{ background: "#0a0e1a", border: "1px solid #00FFCC40", fontFamily: "monospace", fontSize: 11 }}
                          itemStyle={{ color: "#00FFCC" }}
                          formatter={(v: any) => [`$${Number(v).toLocaleString("es-CO")}`, "Ventas"]}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#00FFCC" strokeWidth={2} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* STORES TAB */}
        {tab === "stores" && (
          <Card className="bg-card/50 backdrop-blur-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CardTitle className="font-mono text-sm uppercase text-primary">Gestión de Tiendas</CardTitle>
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tienda…"
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white font-mono text-xs h-9 rounded-lg"
                  />
                </div>
              </div>
              <CreateStoreDialog onCreated={() => {
                queryClient.invalidateQueries({ queryKey: getGetStoresQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
                toast({ title: "Tienda creada", description: "La tienda fue registrada exitosamente." });
              }} />
            </CardHeader>
            <CardContent>
              {storesLoading ? (
                <Skeleton className="h-[200px] w-full bg-primary/10" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/20 hover:bg-transparent">
                        <TableHead className="font-mono text-[10px] text-primary uppercase">ID</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase">Tienda</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase hidden md:table-cell">Contacto</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase hidden lg:table-cell">Ventas</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-center">Estado</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStores?.map((store) => (
                        <TableRow key={store.id} className="border-primary/10 hover:bg-primary/5">
                          <TableCell className="font-mono text-xs text-muted-foreground">#{store.id.toString().padStart(4, "0")}</TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-white font-bold">{store.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{store.address}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                            {store.email}<br />{store.phone}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-white hidden lg:table-cell">
                            ${Number(store.totalSales || 0).toLocaleString("es-CO")}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("font-mono uppercase text-[10px] border",
                              store.active
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            )}>
                              {store.active ? "Activa" : "Suspendida"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn("font-mono text-xs uppercase",
                                store.active
                                  ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                  : "text-primary hover:text-primary hover:bg-primary/10"
                              )}
                              onClick={() => toggleStore.mutate({ id: store.id })}
                              disabled={toggleStore.isPending}
                            >
                              {store.active ? <PowerOff className="w-3.5 h-3.5 mr-1.5" /> : <Power className="w-3.5 h-3.5 mr-1.5" />}
                              {store.active ? "Suspender" : "Activar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredStores || filteredStores.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 font-mono text-muted-foreground">
                            {storeSearch ? "Sin resultados para tu búsqueda" : "No hay tiendas registradas"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <Card className="bg-card/50 backdrop-blur-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CardTitle className="font-mono text-sm uppercase text-primary">Gestión de Usuarios</CardTitle>
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuario…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-white font-mono text-xs h-9 rounded-lg"
                  />
                </div>
              </div>
              <CreateUserDialog onCreated={() => {
                queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
                toast({ title: "Usuario creado", description: "El usuario fue registrado exitosamente." });
              }} />
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-[200px] w-full bg-primary/10" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/20 hover:bg-transparent">
                        <TableHead className="font-mono text-[10px] text-primary uppercase">ID</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase">Usuario</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase">Rol</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-center">Estado</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u) => (
                        <TableRow key={u.id} className="border-primary/10 hover:bg-primary/5">
                          <TableCell className="font-mono text-xs text-muted-foreground">#{u.id.toString().padStart(4, "0")}</TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-white font-bold">{u.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{u.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("font-mono text-[10px] uppercase border",
                              u.role === "superadmin" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                              : u.role === "store" ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                              : "bg-green-500/10 text-green-400 border-green-500/30"
                            )}>
                              {u.role === "superadmin" ? "Admin" : u.role === "store" ? "Tienda" : "Cliente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("font-mono text-[10px] uppercase border",
                              u.active
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            )}>
                              {u.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 h-8 w-8"
                              onClick={() => {
                                if (confirm(`¿Eliminar al usuario ${u.name}? Esta acción no se puede deshacer.`)) {
                                  deleteUser.mutate({ id: u.id });
                                }
                              }}
                              disabled={deleteUser.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredUsers || filteredUsers.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 font-mono text-muted-foreground">
                            {userSearch ? "Sin resultados para tu búsqueda" : "No hay usuarios registrados"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* MAPA TAB */}
        {tab === "mapa" && (
          <div>
            <div className="mb-4">
              <h2 className="font-mono text-sm font-bold text-primary uppercase tracking-wider mb-1">Cobertura del Área Metropolitana</h2>
              <p className="font-mono text-[11px] text-muted-foreground">Visualiza todas las sucursales activas e inactivas. Filtra por zona y monitorea la distribución geográfica de la red.</p>
            </div>
            <StoreMapWidget height="580px" showWidgets />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, total, icon: Icon, loading, color = "#00FFCC" }: {
  title: string; value: string | number; total?: number; icon: any; loading?: boolean; color?: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-white/10">
      <CardContent className="p-5">
        {loading ? (
          <Skeleton className="h-14 w-full bg-primary/10" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-mono font-bold text-white">{value}</h3>
                {total !== undefined && <span className="text-xs font-mono" style={{ color: `${color}60` }}>/{total}</span>}
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateStoreDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", lat: "6.2442", lng: "-75.5812", description: "" });

  const createStore = useCreateStore({
    mutation: { onSuccess: () => { setOpen(false); onCreated(); setForm({ name: "", address: "", phone: "", email: "", lat: "6.2442", lng: "-75.5812", description: "" }); } }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStore.mutate({ data: { ...form, lat: Number(form.lat), lng: Number(form.lng) } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono text-xs uppercase">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nueva Tienda
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0e1a] border-primary/50 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary uppercase text-sm">Registrar Nueva Tienda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "name", label: "Nombre", placeholder: "Tienda Centro" },
              { key: "email", label: "Correo", placeholder: "tienda@distri.co" },
              { key: "phone", label: "Teléfono", placeholder: "+57 300..." },
              { key: "address", label: "Dirección", placeholder: "Calle 10 #5-20" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase">{label}</Label>
                <Input
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-muted-foreground uppercase">Descripción</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción de la tienda..."
              required
              className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-mono text-[10px] text-muted-foreground uppercase">Latitud</Label>
              <Input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9" />
            </div>
            <div className="space-y-1">
              <Label className="font-mono text-[10px] text-muted-foreground uppercase">Longitud</Label>
              <Input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9" />
            </div>
          </div>
          <Button type="submit" disabled={createStore.isPending} className="w-full bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase">
            {createStore.isPending ? "Registrando..." : "Registrar Tienda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" as "superadmin" | "store" | "customer" });

  const createUser = useCreateUser({
    mutation: { onSuccess: () => { setOpen(false); onCreated(); setForm({ name: "", email: "", password: "", role: "customer" }); } }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ data: form });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono text-xs uppercase">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0a0e1a] border-primary/50 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary uppercase text-sm">Crear Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          {[
            { key: "name", label: "Nombre completo", placeholder: "Juan Pérez", type: "text" },
            { key: "email", label: "Correo electrónico", placeholder: "juan@distri.co", type: "email" },
            { key: "password", label: "Contraseña", placeholder: "••••••••", type: "password" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} className="space-y-1">
              <Label className="font-mono text-[10px] text-muted-foreground uppercase">{label}</Label>
              <Input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required
                className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9"
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="font-mono text-[10px] text-muted-foreground uppercase">Rol</Label>
            <Select value={form.role} onValueChange={(v: any) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger className="bg-black/50 border-primary/30 text-white font-mono text-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0e1a] border-primary/30">
                <SelectItem value="customer" className="font-mono text-xs text-white focus:bg-primary/20 focus:text-primary">Cliente</SelectItem>
                <SelectItem value="store" className="font-mono text-xs text-white focus:bg-primary/20 focus:text-primary">Tienda</SelectItem>
                <SelectItem value="superadmin" className="font-mono text-xs text-white focus:bg-primary/20 focus:text-primary">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createUser.isPending} className="w-full bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase">
            {createUser.isPending ? "Creando..." : "Crear Usuario"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
