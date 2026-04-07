import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import {
  useGetGlobalStats, useGetStores, useGetUsers,
  useToggleStore, useCreateStore, useCreateUser, useDeleteUser, useUpdateUser,
  getGetStoresQueryKey, getGetGlobalStatsQueryKey, getGetUsersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Store, Users, Power, PowerOff, Plus, Trash2, Edit, BarChart2, ShieldCheck, Map } from "lucide-react";
import StoreMapWidget from "@/components/StoreMapWidget";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
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

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

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
          <StatCard title="Tiendas Activas" value={stats?.activeStores ?? 0} total={stats?.totalStores ?? 0} icon={Store} loading={statsLoading} />
          <StatCard title="Productos" value={stats?.totalProducts ?? 0} icon={Activity} loading={statsLoading} />
          <StatCard title="Usuarios" value={stats?.totalUsers ?? 0} icon={Users} loading={statsLoading} />
          <StatCard title="Ventas $" value={`${(stats?.totalSales ?? 0).toLocaleString("es-CO")}` } icon={ShieldCheck} loading={statsLoading} />
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

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-md border-primary/20">
              <CardHeader>
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
                        />
                        <Bar dataKey="totalSales" fill="#00FFCC" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-md border-primary/20">
              <CardHeader>
                <CardTitle className="font-mono text-sm uppercase text-primary">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full bg-primary/10" />)}</div>
                ) : (
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {stats?.recentActivity?.map((a) => (
                      <div key={a.id} className="flex flex-col border-l-2 border-primary/40 pl-3 py-1">
                        <span className="text-[10px] font-mono text-primary/70">{new Date(a.timestamp).toLocaleString("es-CO")}</span>
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
        )}

        {/* Stores Tab */}
        {tab === "stores" && (
          <Card className="bg-card/50 backdrop-blur-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-mono text-sm uppercase text-primary">Gestión de Tiendas</CardTitle>
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
                        <TableHead className="font-mono text-[10px] text-primary uppercase">Nombre</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase hidden md:table-cell">Contacto</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-center">Estado</TableHead>
                        <TableHead className="font-mono text-[10px] text-primary uppercase text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores?.map((store) => (
                        <TableRow key={store.id} className="border-primary/10 hover:bg-primary/5">
                          <TableCell className="font-mono text-xs text-muted-foreground">#{store.id.toString().padStart(4, "0")}</TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-white font-bold">{store.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{store.address}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                            {store.email}<br />{store.phone}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn("font-mono uppercase text-[10px] border",
                                store.active
                                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                                  : "bg-red-500/10 text-red-400 border-red-500/30"
                              )}
                            >
                              {store.active ? "Activa" : "Suspendida"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "font-mono text-xs uppercase",
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
                      {(!stores || stores.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 font-mono text-muted-foreground">
                            No hay tiendas registradas
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

        {/* Users Tab */}
        {tab === "users" && (
          <Card className="bg-card/50 backdrop-blur-md border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-mono text-sm uppercase text-primary">Gestión de Usuarios</CardTitle>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((u) => (
                        <TableRow key={u.id} className="border-primary/10 hover:bg-primary/5">
                          <TableCell className="font-mono text-xs text-muted-foreground">#{u.id.toString().padStart(4, "0")}</TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-white font-bold">{u.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{u.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "font-mono text-[10px] uppercase border",
                              u.role === "superadmin" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : u.role === "store" ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                                : "bg-green-500/10 text-green-400 border-green-500/30"
                            )}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "font-mono text-[10px] uppercase border",
                              u.active
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            )}>
                              {u.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!users || users.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 font-mono text-muted-foreground">
                            No hay usuarios registrados
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

        {/* Mapa Tab */}
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

function StatCard({ title, value, total, icon: Icon, loading }: {
  title: string; value: string | number; total?: number; icon: any; loading?: boolean;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-primary/20">
      <CardContent className="p-5">
        {loading ? (
          <Skeleton className="h-14 w-full bg-primary/10" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-mono font-bold text-white">{value}</h3>
                {total !== undefined && <span className="text-xs font-mono text-primary/60">/{total}</span>}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
              <Icon className="w-5 h-5 text-primary" />
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
