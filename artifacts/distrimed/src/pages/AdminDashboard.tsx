import DashboardLayout from "./layouts/DashboardLayout";
import { useGetGlobalStats, useGetStores, useGetUsers, useToggleStore, getGetStoresQueryKey, getGetGlobalStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, Store, Users, MapPin, Power, PowerOff } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();
  const { data: stores, isLoading: storesLoading } = useGetStores();
  const { data: users, isLoading: usersLoading } = useGetUsers();

  const toggleStore = useToggleStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoresQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGlobalStatsQueryKey() });
        toast({
          title: "Estado actualizado",
          description: "El estado de la tienda ha sido modificado.",
        });
      }
    }
  });

  const handleToggleStore = (id: number) => {
    toggleStore.mutate({ id });
  };

  return (
    <DashboardLayout title="Panel Global de Control">
      <div className="space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Tiendas Activas" value={stats?.activeStores ?? 0} total={stats?.totalStores ?? 0} icon={Store} loading={statsLoading} />
          <StatCard title="Productos Totales" value={stats?.totalProducts ?? 0} icon={Database} loading={statsLoading} />
          <StatCard title="Usuarios Registrados" value={stats?.totalUsers ?? 0} icon={Users} loading={statsLoading} />
          <StatCard title="Ventas Totales" value={`$${(stats?.totalSales ?? 0).toLocaleString()}`} icon={Activity} loading={statsLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Stores Chart */}
          <Card className="col-span-1 lg:col-span-2 bg-card/50 backdrop-blur-md border-primary/20 glow-border">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase text-primary">Top Tiendas por Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-[300px] w-full bg-primary/10" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.topStores ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00FFCC20" vertical={false} />
                      <XAxis dataKey="name" stroke="#00FFCC60" tick={{ fill: '#00FFCC', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#00FFCC60" tick={{ fill: '#00FFCC', fontSize: 10, fontFamily: 'monospace' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0a0e1a', borderColor: '#00FFCC', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#00FFCC' }}
                      />
                      <Bar dataKey="totalSales" fill="#00FFCC" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="col-span-1 bg-card/50 backdrop-blur-md border-primary/20 glow-border">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase text-primary">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full bg-primary/10" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex flex-col border-l-2 border-primary/50 pl-3 py-1">
                      <span className="text-xs font-mono text-primary/70">{new Date(activity.timestamp).toLocaleString()}</span>
                      <span className="text-sm font-mono text-white">{activity.description}</span>
                      <span className="text-xs text-muted-foreground">{activity.storeName}</span>
                    </div>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <div className="text-sm font-mono text-muted-foreground py-4 text-center">Sin actividad reciente</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stores Management Table */}
        <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-primary">Gestión de Red de Tiendas</CardTitle>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <Skeleton className="h-[200px] w-full bg-primary/10" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-primary/20 hover:bg-transparent">
                      <TableHead className="font-mono text-xs text-primary">ID / ENLACE</TableHead>
                      <TableHead className="font-mono text-xs text-primary">NOMBRE</TableHead>
                      <TableHead className="font-mono text-xs text-primary">CONTACTO</TableHead>
                      <TableHead className="font-mono text-xs text-primary text-center">ESTADO</TableHead>
                      <TableHead className="font-mono text-xs text-primary text-right">OPERACIÓN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores?.map((store) => (
                      <TableRow key={store.id} className="border-primary/10 hover:bg-primary/5">
                        <TableCell className="font-mono text-xs text-muted-foreground">#{store.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell className="font-mono text-sm text-white font-bold">{store.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {store.email}<br/>{store.phone}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={store.active ? "default" : "destructive"} className="font-mono uppercase text-[10px]">
                            {store.active ? "En Línea" : "Desconectado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={`font-mono text-xs uppercase ${store.active ? 'text-destructive hover:text-destructive hover:bg-destructive/20' : 'text-primary hover:text-primary hover:bg-primary/20'}`}
                            onClick={() => handleToggleStore(store.id)}
                            disabled={toggleStore.isPending}
                          >
                            {store.active ? <PowerOff className="w-4 h-4 mr-2" /> : <Power className="w-4 h-4 mr-2" />}
                            {store.active ? 'Suspender' : 'Activar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!stores || stores.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 font-mono text-muted-foreground">No hay tiendas registradas</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, total, icon: Icon, loading }: { title: string, value: string | number, total?: number, icon: any, loading?: boolean }) {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border">
      <CardContent className="p-6">
        {loading ? (
          <Skeleton className="h-16 w-full bg-primary/10" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-mono font-bold text-white glow-text">{value}</h3>
                {total !== undefined && <span className="text-sm font-mono text-primary/60">/ {total}</span>}
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
