import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Star, Package, ShoppingCart, Heart, Map, LayoutGrid } from "lucide-react";
import MapComponent from "@/components/MapComponent";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { addToWishlist, removeFromWishlist, isInWishlist } from "./CustomerWishlist";
import { cn } from "@/lib/utils";

export default function CustomerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [view, setView] = useState<"catalog" | "map">("catalog");
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
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          toast({ title: "Ubicación fijada", description: "Mostrando tiendas cercanas." });
        },
        () => toast({ title: "Error", description: "No se pudo obtener la ubicación.", variant: "destructive" })
      );
    }
  };

  const categories = ["all", ...Array.from(new Set(products?.map((p) => p.category) ?? []))];

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.storeName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout title="Catálogo">
      <div className="space-y-6">
        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("catalog")}
            className={cn(
              "font-mono text-xs uppercase border",
              view === "catalog"
                ? "text-primary border-primary/40 bg-primary/10"
                : "text-muted-foreground border-primary/10 hover:text-primary"
            )}
          >
            <LayoutGrid className="w-3 h-3 mr-2" /> Catálogo
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("map")}
            className={cn(
              "font-mono text-xs uppercase border",
              view === "map"
                ? "text-primary border-primary/40 bg-primary/10"
                : "text-muted-foreground border-primary/10 hover:text-primary"
            )}
          >
            <Map className="w-3 h-3 mr-2" /> Mapa
          </Button>
        </div>

        {/* Map View */}
        {view === "map" && (
          <Card className="bg-card/50 backdrop-blur-md border-primary/20 overflow-hidden">
            <div className="h-[500px] w-full relative">
              <MapComponent
                center={userLocation || [6.2442, -75.5812]}
                zoom={13}
                userLocation={userLocation}
                stores={stores?.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, description: s.address }))}
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
                <h4 className="font-mono text-xs text-primary uppercase mb-1 flex items-center">
                  <Package className="w-3 h-3 mr-1" /> Red Distrimed
                </h4>
                <p className="font-mono text-[10px] text-muted-foreground">{stores?.length || 0} Nodos en línea</p>
              </div>
            </div>
          </Card>
        )}

        {/* Catalog View */}
        {view === "catalog" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  placeholder="Buscar producto, categoría o tienda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-44 bg-black/50 border-primary/30 text-white font-mono h-11 text-xs uppercase">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0e1a] border-primary/30">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-mono text-xs uppercase text-white focus:bg-primary/20 focus:text-primary">
                      {cat === "all" ? "Todas" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-36">
                <span className="absolute left-3 top-3 text-primary/70 font-mono text-xs">Max $</span>
                <Input
                  type="number"
                  placeholder="Precio..."
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="pl-14 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                />
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-muted-foreground uppercase">
                {filteredProducts?.length ?? 0} producto{filteredProducts?.length !== 1 ? "s" : ""} encontrado{filteredProducts?.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Product Grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 8].map((i) => (
                  <Skeleton key={i} className="h-[280px] w-full bg-primary/10 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onRate={(stars, comment) =>
                      createRating.mutate({ data: { productId: product.id, stars, comment } })
                    }
                    isRating={createRating.isPending}
                    onAddToCart={() => {
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        storeId: product.storeId,
                        storeName: product.storeName || "Tienda",
                        imageUrl: product.imageUrl,
                        category: product.category,
                      });
                      toast({ title: "Agregado al carrito", description: product.name });
                    }}
                  />
                ))}
                {(!filteredProducts || filteredProducts.length === 0) && (
                  <div className="col-span-full py-16 text-center border border-dashed border-primary/20 rounded-md">
                    <Package className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-3" />
                    <p className="font-mono text-muted-foreground uppercase text-sm">
                      No se encontraron productos
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProductCard({
  product,
  onRate,
  isRating,
  onAddToCart,
}: {
  product: any;
  onRate: (stars: number, comment?: string) => void;
  isRating: boolean;
  onAddToCart: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(() => isInWishlist(product.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRate(rating, comment);
    setOpen(false);
  };

  const handleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(product.id);
      setWishlisted(false);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        storeName: product.storeName || "",
        storeId: product.storeId,
        imageUrl: product.imageUrl,
        avgRating: product.avgRating,
        totalRatings: product.totalRatings,
      });
      setWishlisted(true);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all duration-300 group flex flex-col overflow-hidden">
      <div className="h-36 bg-black/40 relative border-b border-primary/10 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover w-full h-full opacity-70 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <Package className="w-12 h-12 text-primary/20 group-hover:text-primary/40 transition-colors" />
        )}
        <div className="absolute top-2 left-2">
          <Badge
            variant="outline"
            className="bg-black/60 border-primary/50 text-primary font-mono text-[10px] backdrop-blur uppercase"
          >
            {product.category}
          </Badge>
        </div>
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              wishlisted ? "text-red-400 fill-red-400" : "text-muted-foreground"
            )}
          />
        </button>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-mono text-sm font-bold text-white uppercase leading-tight flex-1 pr-2 truncate">
            {product.name}
          </h4>
          <span className="font-mono text-primary font-bold text-sm flex-shrink-0">
            ${product.price?.toLocaleString("es-CO")}
          </span>
        </div>

        <p className="text-[10px] text-muted-foreground font-mono uppercase mb-1">{product.storeName}</p>
        <p className="text-xs text-muted-foreground font-mono mb-3 line-clamp-2 flex-1">{product.description}</p>

        <div className="flex items-center justify-between mb-3 pt-2 border-t border-primary/10">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-mono text-yellow-500">
              {product.avgRating != null ? Number(product.avgRating).toFixed(1) : "—"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">({product.totalRatings ?? 0})</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono",
              product.stock > 10
                ? "border-green-500/30 text-green-400"
                : product.stock > 0
                ? "border-yellow-500/30 text-yellow-400"
                : "border-red-500/30 text-red-400"
            )}
          >
            {product.stock > 0 ? `${product.stock} und` : "Sin stock"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.stock === 0}
            className="flex-1 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono text-xs uppercase"
          >
            <ShoppingCart className="w-3 h-3 mr-1" /> Carrito
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-primary border border-primary/20 hover:border-primary/40 font-mono text-xs uppercase px-2"
              >
                <Star className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-[#0a0e1a] border-primary/50 text-white">
              <DialogHeader>
                <DialogTitle className="font-mono text-primary uppercase text-sm">Valorar Producto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <p className="font-mono text-xs text-muted-foreground">{product.name}</p>
                <div className="flex items-center gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)}>
                      <Star
                        className={cn(
                          "w-8 h-8 hover:scale-110 transition-transform",
                          star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-black/50 border-primary/30 font-mono text-white resize-none"
                  placeholder="Comentario opcional..."
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={isRating}
                  className="w-full bg-primary/20 text-primary border border-primary hover:bg-primary hover:text-black font-mono text-xs uppercase"
                >
                  Enviar Valoración
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
