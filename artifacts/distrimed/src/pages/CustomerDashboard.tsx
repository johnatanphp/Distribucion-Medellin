import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import {
  useGetProducts,
  useCreateRating,
  useGetStores,
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
import { Slider } from "@/components/ui/slider";
import {
  Search, MapPin, Star, Package, ShoppingCart, Heart, Map, LayoutGrid,
  Store, SlidersHorizontal, X, Footprints, Navigation
} from "lucide-react";
import StoreMapWidget from "@/components/StoreMapWidget";
import WalkingModeOverlay from "@/components/WalkingModeOverlay";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { addToWishlist, removeFromWishlist, isInWishlist } from "./CustomerWishlist";
import { useGeo } from "@/contexts/GeoContext";
import { cn } from "@/lib/utils";

const PRICE_MAX_DEFAULT = 200000;

export default function CustomerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { status: geoStatus, setWalkingMode } = useGeo();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [view, setView] = useState<"catalog" | "map">("map");
  const [showCatalogFilters, setShowCatalogFilters] = useState(true);
  const [walkingOverlay, setWalkingOverlay] = useState(false);

  const { data: products, isLoading: productsLoading } = useGetProducts({ maxPrice });
  const { data: stores } = useGetStores();

  const createRating = useCreateRating({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
        toast({ title: "Valoración enviada", description: "Gracias por tu opinión." });
      }
    }
  });

  const categories = ["all", ...Array.from(new Set(products?.map((p) => p.category) ?? []))];

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.storeName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const hasActiveFilters = searchTerm || selectedCategory !== "all" || maxPrice !== undefined;

  const handleOpenWalkingMode = () => {
    setWalkingMode(true);
    setWalkingOverlay(true);
  };

  const handleCloseWalkingMode = () => {
    setWalkingMode(false);
    setWalkingOverlay(false);
  };

  return (
    <DashboardLayout title={view === "map" ? "Mapa de Tiendas" : "Catálogo"}>
      {walkingOverlay && <WalkingModeOverlay onClose={handleCloseWalkingMode} />}

      <div className="space-y-4">
        {/* Tab switcher + Walking Mode button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setView("catalog")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all",
              view === "catalog"
                ? "text-primary-foreground border-transparent bg-primary"
                : "text-muted-foreground border-border hover:text-foreground hover:border-border/60"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Catálogo
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all",
              view === "map"
                ? "text-primary-foreground border-transparent bg-primary"
                : "text-muted-foreground border-border hover:text-foreground hover:border-border/60"
            )}
          >
            <Map className="w-4 h-4" /> Mapa
          </button>

          {/* Walking Mode CTA */}
          <button
            onClick={handleOpenWalkingMode}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all",
              "ml-1 walking-pulse"
            )}
            style={{
              background: geoStatus === "granted" ? "hsl(162 60% 40% / 0.12)" : "hsl(var(--muted))",
              border: `1px solid ${geoStatus === "granted" ? "hsl(162 60% 40% / 0.35)" : "hsl(var(--border))"}`,
              color: geoStatus === "granted" ? "#16a34a" : "hsl(var(--muted-foreground))",
            }}
          >
            <Footprints className="w-4 h-4" />
            Modo Caminata
            {geoStatus === "granted" && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot" />
            )}
          </button>

          {view === "catalog" && (
            <>
              <button
                onClick={() => setShowCatalogFilters(v => !v)}
                className="flex items-center gap-1.5 ml-auto px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all border"
                style={{
                  background: hasActiveFilters ? "hsl(var(--primary) / 0.10)" : "hsl(var(--muted))",
                  border: `1px solid ${hasActiveFilters ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
                  color: hasActiveFilters ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {hasActiveFilters ? "Filtros activos" : "Filtros"}
              </button>
              <span className="text-[10px] font-mono text-muted-foreground">
                {filteredProducts?.length ?? 0} productos
              </span>
            </>
          )}
          {view === "map" && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              Área Metropolitana · Medellín
            </span>
          )}
        </div>

        {/* ── MAP VIEW ── */}
        {view === "map" && (
          <StoreMapWidget height="540px" showWidgets />
        )}

        {/* ── CATALOG VIEW ── */}
        {view === "catalog" && (
          <>
            {showCatalogFilters && (
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto, categoría o tienda..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background border-border focus:border-primary/50 h-11 rounded-xl font-mono text-sm"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-52 bg-background border-border h-11 rounded-xl font-mono text-xs uppercase">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-mono text-xs uppercase">
                          {cat === "all" ? "Todas las categorías" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Precio máximo
                    </label>
                    <span className="font-mono text-xs font-bold text-primary">
                      {maxPrice !== undefined ? `$${maxPrice.toLocaleString("es-CO")} COP` : "Sin límite"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Slider
                      min={0}
                      max={PRICE_MAX_DEFAULT}
                      step={5000}
                      value={[maxPrice ?? PRICE_MAX_DEFAULT]}
                      onValueChange={([v]) => setMaxPrice(v >= PRICE_MAX_DEFAULT ? undefined : v)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Libre"
                      value={maxPrice || ""}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-28 bg-background border-border h-9 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setMaxPrice(undefined); }}
                      className="flex items-center gap-1 text-[10px] font-mono text-destructive hover:text-destructive/80 border border-destructive/20 hover:bg-destructive/5 px-3 py-1 rounded-lg transition-all"
                    >
                      <X className="w-3 h-3" /> Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-[300px] w-full rounded-2xl" />
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
                  <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-border">
                    <Package className="w-16 h-16 text-muted-foreground/25 mx-auto mb-4" />
                    <p className="font-mono text-muted-foreground text-sm">Sin resultados para tu búsqueda</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setMaxPrice(undefined); }}
                      className="mt-3 text-primary font-mono text-xs"
                    >
                      Limpiar filtros
                    </Button>
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
  product, onRate, isRating, onAddToCart,
}: {
  product: any; onRate: (stars: number, comment?: string) => void; isRating: boolean; onAddToCart: () => void;
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

  const stockColor = product.stock > 10 ? "#16a34a" : product.stock > 0 ? "#d97706" : "#ef4444";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col group transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="h-36 relative overflow-hidden bg-muted/40">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(var(--card)) 0%, transparent 50%)" }} />
        <div className="absolute top-2 left-2">
          <span
            className="px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold"
            style={{
              background: "hsl(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              border: "1px solid hsl(var(--primary) / 0.25)"
            }}
          >
            {product.category}
          </span>
        </div>
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: wishlisted ? "#fce7f320" : "hsl(var(--card) / 0.80)",
            border: wishlisted ? "1px solid #ec489980" : "1px solid hsl(var(--border))",
            backdropFilter: "blur(4px)",
          }}
        >
          <Heart
            className="w-3.5 h-3.5"
            style={{ color: wishlisted ? "#ec4899" : "hsl(var(--muted-foreground))", fill: wishlisted ? "#ec4899" : "none" }}
          />
        </button>
        <div className="absolute bottom-2 right-2">
          <span className="font-mono font-black text-sm text-primary drop-shadow-sm">
            ${product.price?.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-mono text-sm font-bold text-foreground leading-snug mb-0.5 line-clamp-2">{product.name}</h4>
        <p className="font-mono text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
          <Store className="w-2.5 h-2.5 flex-shrink-0" />{product.storeName}
        </p>
        <p className="text-xs text-muted-foreground font-mono line-clamp-2 flex-1 mb-3">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                className="w-3 h-3"
                style={{
                  color: s <= Math.round(product.avgRating || 0) ? "#f59e0b" : "hsl(var(--muted-foreground) / 0.3)",
                  fill: s <= Math.round(product.avgRating || 0) ? "#f59e0b" : "none"
                }}
              />
            ))}
            <span className="font-mono text-[10px] text-muted-foreground ml-1">({product.totalRatings ?? 0})</span>
          </div>
          <span className="font-mono text-[9px] font-bold uppercase" style={{ color: stockColor }}>
            {product.stock > 0 ? `${product.stock} und` : "Agotado"}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.stock === 0}
            className="flex-1 font-mono text-xs uppercase rounded-xl h-9 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Agregar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs h-9 w-9 p-0 rounded-xl"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px]">
              <DialogHeader>
                <DialogTitle className="font-mono text-primary text-sm uppercase">Valorar Producto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <p className="font-mono text-xs text-muted-foreground truncate">{product.name}</p>
                <div className="flex items-center gap-2 justify-center py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)}>
                      <Star
                        className="w-9 h-9 hover:scale-110 transition-transform"
                        style={{
                          color: star <= rating ? "#f59e0b" : "hsl(var(--muted-foreground) / 0.3)",
                          fill: star <= rating ? "#f59e0b" : "none"
                        }}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="resize-none"
                  placeholder="Comentario opcional..."
                  rows={3}
                />
                <Button type="submit" disabled={isRating} className="w-full font-mono text-xs uppercase">
                  Enviar Valoración
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
