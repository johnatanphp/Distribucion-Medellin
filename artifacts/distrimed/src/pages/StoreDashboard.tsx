import { useState } from "react";
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
import { Package, Plus, MapPin, Edit, Trash2, Activity, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MapComponent from "@/components/MapComponent";

export default function StoreDashboard() {
  const { user } = useAuth();
  const storeId = user?.storeId || 0;
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: store, isLoading: storeLoading } = useGetStore(storeId, { query: { enabled: !!storeId } });
  const { data: stats, isLoading: statsLoading } = useGetStoreStats(storeId, { query: { enabled: !!storeId } });
  const { data: products, isLoading: productsLoading } = useGetStoreProducts(storeId, { query: { enabled: !!storeId } });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
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

  const openNewProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (confirm("¿Actualizar coordenadas de la tienda a esta ubicación?")) {
      updateStore.mutate({ id: storeId, data: { lat, lng } });
    }
  };

  if (!storeId) {
    return <DashboardLayout title="Error"><div>No tienes una tienda asignada.</div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="Gestión de Tienda">
      <div className="space-y-6">
        
        {/* Store Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="col-span-1 lg:col-span-2 bg-primary/10 border-primary/30 glow-border">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              {storeLoading ? <Skeleton className="h-20 w-full bg-primary/20" /> : (
                <>
                  <div>
                    <h2 className="text-2xl font-mono font-bold text-white glow-text uppercase">{store?.name}</h2>
                    <p className="text-sm font-mono text-muted-foreground mt-1">{store?.address}</p>
                    <p className="text-xs font-mono text-primary mt-2">ID: #{store?.id.toString().padStart(4, '0')} | Estado: {store?.active ? 'En Línea' : 'Desconectado'}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="font-mono text-xs border-primary text-primary hover:bg-primary/20 uppercase">
                          <MapPin className="w-4 h-4 mr-2" />
                          Configurar Ubicación
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
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border">
            <CardContent className="p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Productos Activos</p>
              <h3 className="text-3xl font-mono font-bold text-white">{statsLoading ? '-' : stats?.activeProducts}</h3>
              <p className="text-xs font-mono text-primary/60 mt-1">De {stats?.totalProducts} totales</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border">
            <CardContent className="p-6">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Ventas Totales</p>
              <h3 className="text-3xl font-mono font-bold text-white">${statsLoading ? '-' : stats?.totalSales.toLocaleString()}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-mono text-yellow-500">{stats?.avgRating.toFixed(1)} Promedio</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {stats?.lowStockProducts && stats.lowStockProducts.length > 0 && (
          <Card className="bg-destructive/10 border-destructive/30 glow-border">
            <CardHeader className="py-3">
              <CardTitle className="font-mono text-sm uppercase text-destructive flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Alerta: Inventario Crítico
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3">
              <div className="flex flex-wrap gap-2">
                {stats.lowStockProducts.map(p => (
                  <Badge key={p.id} variant="destructive" className="font-mono text-xs">
                    {p.name} (Quedan {p.stock})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Catalog Management */}
        <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-sm uppercase text-primary">Catálogo de Productos</CardTitle>
            <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewProductModal} size="sm" className="bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase transition-all">
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-[#0a0e1a] border-primary/50 text-white">
                <DialogHeader>
                  <DialogTitle className="font-mono text-primary uppercase">{editingProduct ? 'Modificar Registro' : 'Inicializar Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Nombre del Producto</Label>
                      <Input name="name" defaultValue={editingProduct?.name} required className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Precio (COP)</Label>
                      <Input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Inventario Inicial</Label>
                      <Input name="stock" type="number" defaultValue={editingProduct?.stock} required className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Categoría</Label>
                      <Input name="category" defaultValue={editingProduct?.category} required className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">URL Imagen (Opcional)</Label>
                      <Input name="imageUrl" defaultValue={editingProduct?.imageUrl} className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground uppercase">Descripción</Label>
                      <Textarea name="description" defaultValue={editingProduct?.description} required className="bg-black/50 border-primary/30 font-mono text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsProductModalOpen(false)} className="font-mono text-xs uppercase text-muted-foreground">Cancelar</Button>
                    <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase">
                      {editingProduct ? 'Actualizar' : 'Guardar'}
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
                    <TableRow className="border-primary/20 hover:bg-transparent">
                      <TableHead className="font-mono text-xs text-primary">CÓDIGO</TableHead>
                      <TableHead className="font-mono text-xs text-primary">PRODUCTO</TableHead>
                      <TableHead className="font-mono text-xs text-primary">CATEGORÍA</TableHead>
                      <TableHead className="font-mono text-xs text-primary text-right">PRECIO</TableHead>
                      <TableHead className="font-mono text-xs text-primary text-center">STOCK</TableHead>
                      <TableHead className="font-mono text-xs text-primary text-right">OPERACIONES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id} className="border-primary/10 hover:bg-primary/5">
                        <TableCell className="font-mono text-xs text-muted-foreground">P-{product.id.toString().padStart(4, '0')}</TableCell>
                        <TableCell className="font-mono text-sm text-white font-bold">{product.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground uppercase">{product.category}</TableCell>
                        <TableCell className="font-mono text-sm text-white text-right">${product.price}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.stock > 10 ? "outline" : "destructive"} className={`font-mono text-xs ${product.stock > 10 ? 'text-primary border-primary/50' : ''}`}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditProductModal(product)} className="text-primary hover:bg-primary/20 hover:text-primary h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => { if(confirm("¿Eliminar producto?")) deleteProduct.mutate({ id: product.id }) }} disabled={deleteProduct.isPending} className="text-destructive hover:bg-destructive/20 hover:text-destructive h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!products || products.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 font-mono text-muted-foreground">Catálogo vacío</TableCell>
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
