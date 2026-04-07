import { useState, useMemo } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import { 
  useGetStoreStats, 
  useGetStoreProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  useGetStore,
  useUpdateStore,
  getGetStoreProductsQueryKey,
  getGetStoreStatsQueryKey,
  getGetStoreQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, MapPin, Edit, Trash2, Activity, Star, TrendingUp, AlertTriangle, BarChart3, Box } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/MapComponent";
import StoreMapWidget from "@/components/StoreMapWidget";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { cn } from "@/lib/utils";

type Tab = "overview" | "inventory" | "network";

const CATEGORY_COLORS = ["#00FFCC", "#A855F7", "#FF9900", "#22C55E", "#3B82F6", "#EC4899"];

export default function StoreDashboard() {
  const { user } = useAuth();
  const storeId = user?.storeId || 0;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: store, isLoading: storeLoading } = useGetStore(storeId, { query: { enabled: !!storeId } });
  const { data: stats, isLoading: statsLoading } = useGetStoreStats(storeId, { query: { enabled: !!storeId } });
  const { data: products, isLoading: productsLoading } = useGetStoreProducts(storeId, { query: { enabled: !!storeId } });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productSearch, setProductSearch] = useState("");

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreProductsQueryKey(storeId) });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey(storeId) });
        setIsProductModalOpen(false);
        toast({ title: "Producto creado", description: "El producto se añadió al catálogo." });
      }
    }
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreProductsQueryKey(storeId) });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey(storeId) });
        setIsProductModalOpen(false);
        toast({ title: "Producto actualizado", description: "Los datos del producto han sido guardados." });
      }
    }
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreProductsQueryKey(storeId) });
        queryClient.invalidateQueries({ queryKey: getGetStoreStatsQueryKey(storeId) });
        toast({ title: "Producto eliminado", description: "El producto ha sido borrado del sistema." });
      }
    }
  });

  const updateStore = useUpdateStore({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) });
        setIsMapModalOpen(false);
        toast({ title: "Ubicación actualizada", description: "Las coordenadas de la tienda han sido guardadas." });
      }
    }
  });

  const handleProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      category: formData.get("category") as string,
      imageUrl: formData.get("imageUrl") as string || undefined,
      storeId: storeId
    };
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data });
    } else {
      createProduct.mutate({ data });
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (confirm("¿Actualizar coordenadas de la tienda a esta ubicación?")) {
      updateStore.mutate({ id: storeId, data: { lat, lng } });
    }
  };

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    if (!products) return [];
    const counts: Record<string, number> = {};
    products.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  // Stock distribution for bar chart
  const stockData = useMemo(() => {
    if (!products) return [];
    return products
      .slice()
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 10)
      .map((p) => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name, stock: p.stock, price: p.price }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!productSearch) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Resumen", icon: BarChart3 },
    { id: "inventory", label: "Inventario", icon: Box },
    { id: "network", label: "Red / Mapa", icon: MapPin },
  ];

  if (!storeId) {
    return <DashboardLayout title="Error"><div>No tienes una tienda asignada.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Panel de Tienda">
      <div className="space-y-6">

        {/* Store Header */}
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
          {storeLoading ? (
            <Skeleton className="h-16 w-full bg-white/5" />
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-mono font-bold text-white uppercase">{store?.name}</h2>
                  <Badge className={cn("font-mono text-[10px] uppercase border", store?.active ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30")}>
                    {store?.active ? "En línea" : "Suspendida"}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />{store?.address}
                </p>
                <p className="text-xs font-mono text-muted-foreground/60 mt-0.5">
                  ID: #{store?.id.toString().padStart(4, "0")} · {store?.email} · {store?.phone}
                </p>
              </div>
              <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="font-mono text-xs border-orange-500/40 text-orange-400 hover:bg-orange-500/10 uppercase flex-shrink-0">
                    <MapPin className="w-4 h-4 mr-2" /> Configurar Ubicación
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] bg-[#0a0e1a] border-primary/50 text-white">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-primary uppercase">Ubicación de la Tienda</DialogTitle>
                  </DialogHeader>
                  <div className="h-[400px] w-full mt-4">
                    <MapComponent 
                      center={store?.lat ? [store.lat, store.lng] : [6.2442, -75.5812]} 
                      zoom={15}
                      userLocation={store?.lat ? [store.lat, store.lng] : undefined}
                      interactive={true}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-2">Haz clic en el mapa para establecer la nueva ubicación.</p>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Productos Activos" value={statsLoading ? "—" : `${stats?.activeProducts}`} sub={`de ${stats?.totalProducts ?? 0} totales`} color="#f97316" icon={<Package className="w-5 h-5" />} />
          <KpiCard label="Ventas Totales" value={statsLoading ? "—" : `$${(stats?.totalSales || 0).toLocaleString("es-CO")}`} sub="COP acumulado" color="#00FFCC" icon={<TrendingUp className="w-5 h-5" />} />
          <KpiCard label="Rating Promedio" value={statsLoading ? "—" : (stats?.avgRating || 0).toFixed(1)} sub="sobre 5 estrellas" color="#eab308" icon={<Star className="w-5 h-5" />} />
          <KpiCard label="Stock en Alerta" value={statsLoading ? "—" : `${stats?.lowStockProducts?.length ?? 0}`} sub="productos < 10 und." color="#ef4444" icon={<AlertTriangle className="w-5 h-5" />} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider border-b-2 transition-all",
                tab === t.id
                  ? "border-orange-400 text-orange-400"
                  : "border-transparent text-muted-foreground hover:text-white"
              )}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Low stock alert */}
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <p className="font-mono text-xs text-red-400 uppercase tracking-wider font-bold">Inventario Crítico</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.lowStockProducts.map((p) => (
                    <Badge key={p.id} className="font-mono text-xs bg-red-500/10 text-red-400 border border-red-500/30">
                      {p.name} — {p.stock} und
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stock por producto */}
              <Card className="bg-card/50 backdrop-blur-md border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase text-orange-400">Stock por Producto</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <Skeleton className="h-48 w-full bg-white/5" />
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stockData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                          <XAxis type="number" stroke="#ffffff30" tick={{ fill: "#aaa", fontSize: 9, fontFamily: "monospace" }} />
                          <YAxis type="category" dataKey="name" stroke="#ffffff30" tick={{ fill: "#aaa", fontSize: 9, fontFamily: "monospace" }} width={80} />
                          <RechartsTooltip
                            contentStyle={{ background: "#0a0e1a", border: "1px solid #f97316", fontFamily: "monospace", fontSize: 11 }}
                            itemStyle={{ color: "#f97316" }}
                          />
                          <Bar dataKey="stock" fill="#f97316" radius={[0, 4, 4, 0]} fillOpacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribución por categoría */}
              <Card className="bg-card/50 backdrop-blur-md border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase text-orange-400">Distribución por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <Skeleton className="h-48 w-full bg-white/5" />
                  ) : categoryData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((_, i) => (
                              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} fillOpacity={0.85} />
                            ))}
                          </Pie>
                          <Legend formatter={(v) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#aaa" }}>{v}</span>} />
                          <RechartsTooltip
                            contentStyle={{ background: "#0a0e1a", border: "1px solid #f97316", fontFamily: "monospace", fontSize: 11 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center">
                      <p className="font-mono text-xs text-muted-foreground">Sin datos de categorías</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rating breakdown */}
            <Card className="bg-card/50 backdrop-blur-md border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-sm uppercase text-orange-400 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" /> Rating de la Tienda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="font-mono text-5xl font-bold text-white">{(stats?.avgRating || 0).toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 justify-center mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-4 h-4" style={{ color: s <= Math.round(stats?.avgRating || 0) ? "#eab308" : "#ffffff20", fill: s <= Math.round(stats?.avgRating || 0) ? "#eab308" : "none" }} />
                      ))}
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground mt-1">promedio general</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map(star => {
                      const pct = (stats?.avgRating || 0) > 0
                        ? Math.max(0, Math.min(100, ((star / 5) * (stats?.avgRating || 0) / 5) * 100 + (star === Math.round(stats?.avgRating || 0) ? 40 : 0)))
                        : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground w-3">{star}</span>
                          <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" style={{ fill: "#eab308" }} />
                          <div className="flex-1 h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* INVENTORY TAB */}
        {tab === "inventory" && (
          <Card className="bg-card/50 backdrop-blur-md border-white/10">
            <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CardTitle className="font-mono text-sm uppercase text-orange-400">Catálogo de Productos</CardTitle>
                <div className="relative flex-1 max-w-xs">
                  <Input
                    placeholder="Buscar…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="bg-white/5 border-white/10 text-white font-mono text-xs h-8 rounded-lg pl-3"
                  />
                </div>
              </div>
              <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                    size="sm"
                    className="bg-orange-500/10 text-orange-400 border border-orange-500/40 hover:bg-orange-500 hover:text-black font-mono text-xs uppercase"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-[#0a0e1a] border-primary/50 text-white">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-primary uppercase">{editingProduct ? "Modificar Producto" : "Nuevo Producto"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">Nombre</Label>
                        <Input name="name" defaultValue={editingProduct?.name} required className="bg-black/50 border-primary/30 font-mono text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">Precio (COP)</Label>
                        <Input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="bg-black/50 border-primary/30 font-mono text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">Stock inicial</Label>
                        <Input name="stock" type="number" defaultValue={editingProduct?.stock} required className="bg-black/50 border-primary/30 font-mono text-white" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">Categoría</Label>
                        <Input name="category" defaultValue={editingProduct?.category} required className="bg-black/50 border-primary/30 font-mono text-white" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">URL Imagen (opcional)</Label>
                        <Input name="imageUrl" defaultValue={editingProduct?.imageUrl} className="bg-black/50 border-primary/30 font-mono text-white" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground uppercase">Descripción</Label>
                        <Textarea name="description" defaultValue={editingProduct?.description} required className="bg-black/50 border-primary/30 font-mono text-white" rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="ghost" onClick={() => setIsProductModalOpen(false)} className="font-mono text-xs text-muted-foreground">Cancelar</Button>
                      <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase">
                        {editingProduct ? "Actualizar" : "Guardar"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-[300px] w-full bg-primary/10" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase">Código</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase">Producto</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase hidden md:table-cell">Categoría</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase text-right">Precio</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase text-center">Stock</TableHead>
                        <TableHead className="font-mono text-[10px] text-muted-foreground uppercase text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-mono text-xs text-muted-foreground">P-{product.id.toString().padStart(4, "0")}</TableCell>
                          <TableCell>
                            <p className="font-mono text-sm text-white font-bold">{product.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground line-clamp-1">{product.description}</p>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground uppercase hidden md:table-cell">{product.category}</TableCell>
                          <TableCell className="font-mono text-sm text-white text-right font-bold">${Number(product.price).toLocaleString("es-CO")}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn("font-mono text-xs border",
                                product.stock > 10 ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : product.stock > 0 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                              )}
                            >
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                              className="text-orange-400 hover:bg-orange-500/10 h-8 w-8"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { if (confirm("¿Eliminar producto?")) deleteProduct.mutate({ id: product.id }); }}
                              disabled={deleteProduct.isPending}
                              className="text-red-400 hover:bg-red-500/10 h-8 w-8"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 font-mono text-muted-foreground">
                            {productSearch ? "Sin resultados para tu búsqueda" : "Catálogo vacío"}
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

        {/* NETWORK TAB */}
        {tab === "network" && (
          <div>
            <div className="mb-4">
              <h2 className="font-mono text-sm font-bold text-orange-400 uppercase tracking-wider">Red de Distribución · Medellín</h2>
              <p className="font-mono text-[11px] text-muted-foreground mt-0.5">Tu tienda resaltada en dorado. GPS activo para ver distancias en tiempo real.</p>
            </div>
            <StoreMapWidget height="500px" showWidgets={false} compact={false} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-white/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color }}>
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-mono font-bold text-white">{value}</h3>
        <p className="text-[10px] font-mono mt-1" style={{ color: `${color}80` }}>{sub}</p>
      </CardContent>
    </Card>
  );
}
