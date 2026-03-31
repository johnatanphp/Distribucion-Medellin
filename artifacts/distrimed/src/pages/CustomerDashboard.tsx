import { useState, useEffect } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { 
  useGetProducts, 
  useGetStores, 
  useCreateRating,
  getGetProductsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Filter, Package } from "lucide-react";
import MapComponent from "@/components/MapComponent";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CustomerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const { data: stores } = useGetStores({ active: true });
  const { data: products, isLoading: productsLoading } = useGetProducts({ maxPrice });

  const createRating = useCreateRating({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        toast({ title: "Valoración enviada", description: "Gracias por tu opinión." });
      }
    }
  });

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          toast({ title: "Ubicación fijada", description: "Mostrando tiendas cercanas." });
        },
        () => {
          toast({ title: "Error", description: "No se pudo obtener la ubicación.", variant: "destructive" });
        }
      );
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Portal de Cliente">
      <div className="space-y-6">
        
        {/* Map Section */}
        <Card className="bg-card/50 backdrop-blur-md border-primary/20 glow-border overflow-hidden">
          <div className="h-[300px] w-full relative">
            <MapComponent 
              center={userLocation || [6.2442, -75.5812]} 
              zoom={13} 
              userLocation={userLocation}
              stores={stores?.map(s => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, description: s.address }))}
            />
            <div className="absolute top-4 right-4 z-[400]">
              <Button 
                onClick={handleGetLocation} 
                className="bg-primary/20 backdrop-blur text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase shadow-lg"
              >
                <MapPin className="w-4 h-4 mr-2" /> Localizar
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 z-[400] bg-black/80 backdrop-blur p-3 rounded border border-primary/30">
              <h4 className="font-mono text-xs text-primary uppercase mb-1 flex items-center"><Package className="w-3 h-3 mr-1"/> Red Distrimed</h4>
              <p className="font-mono text-[10px] text-muted-foreground">{stores?.length || 0} Nodos en línea</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
            <Input 
              placeholder="Buscar por producto, categoría o tienda..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative w-40">
              <span className="absolute left-3 top-3 text-primary/70 font-mono text-xs">Max $</span>
              <Input 
                type="number"
                placeholder="Precio..." 
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                className="pl-14 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
              />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          <h3 className="font-mono text-sm uppercase text-primary mb-4 flex items-center">
            <Database className="w-4 h-4 mr-2" /> Catálogo Global
          </h3>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-[250px] w-full bg-primary/10 rounded-md" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts?.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onRate={(stars, comment) => createRating.mutate({ data: { productId: product.id, stars, comment }})} 
                  isRating={createRating.isPending}
                />
              ))}
              {(!filteredProducts || filteredProducts.length === 0) && (
                <div className="col-span-full py-12 text-center border border-dashed border-primary/20 rounded-md">
                  <p className="font-mono text-muted-foreground uppercase text-sm">No se encontraron registros en el catálogo</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

function Database(props: any) {
  return <Package {...props} />;
}

function ProductCard({ product, onRate, isRating }: { product: any, onRate: (stars: number, comment?: string) => void, isRating: boolean }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRate(rating, comment);
    setOpen(false);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/60 transition-colors duration-300 group flex flex-col overflow-hidden">
      <div className="h-32 bg-black/40 relative border-b border-primary/10 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full opacity-60 group-hover:opacity-100 transition-opacity" />
        ) : (
          <Package className="w-12 h-12 text-primary/20 group-hover:text-primary/40 transition-colors" />
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="outline" className="bg-black/60 border-primary/50 text-primary font-mono text-[10px] backdrop-blur uppercase">
            {product.category}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-mono text-sm font-bold text-white uppercase truncate pr-2">{product.name}</h4>
          <span className="font-mono text-primary font-bold">${product.price}</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono mb-3 line-clamp-2 flex-1">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-primary/10">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Enlace: {product.storeName}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-mono text-yellow-500">{product.avgRating.toFixed(1)} <span className="text-muted-foreground">({product.totalRatings})</span></span>
            </div>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] font-mono uppercase text-primary hover:bg-primary/20">
                Evaluar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-[#0a0e1a] border-primary/50 text-white">
              <DialogHeader>
                <DialogTitle className="font-mono text-primary uppercase">Emitir Valoración</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  {[1,2,3,4,5].map(star => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none focus:ring-0">
                      <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} hover:scale-110 transition-transform`} />
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="font-mono text-xs text-muted-foreground uppercase">Registro de Observaciones (Opcional)</span>
                  <Textarea 
                    value={comment} 
                    onChange={e => setComment(e.target.value)}
                    className="bg-black/50 border-primary/30 font-mono text-white resize-none"
                    placeholder="Ingrese comentarios..."
                  />
                </div>
                <Button type="submit" disabled={isRating} className="w-full bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase">
                  Transmitir Datos
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
