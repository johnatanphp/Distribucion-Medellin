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
  Phone, Store, Navigation, Layers, Filter, X, SlidersHorizontal
} from "lucide-react";
import StoreMapWidget from "@/components/StoreMapWidget";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { addToWishlist, removeFromWishlist, isInWishlist } from "./CustomerWishlist";
import { cn } from "@/lib/utils";

const PRICE_MAX_DEFAULT = 200000;

export default function CustomerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [searchTerm, setSearchTerm] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [view, setView] = useState<"catalog" | "map">("map");
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [showCatalogFilters, setShowCatalogFilters] = useState(true);

  const { data: products, isLoading: productsLoading } = useGetProducts({ maxPrice });
  const { data: stores, isLoading: storesLoading } = useGetStores();

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

  return (
    <DashboardLayout title={view === "map" ? "Mapa de Tiendas" : "Catálogo"}>
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("catalog")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all",
              view === "catalog"
                ? "text-black font-bold border-transparent"
                : "text-muted-foreground border-white/10 hover:text-white hover:border-white/20"
            )}
            style={view === "catalog" ? { background: "#00FFCC" } : {}}
          >
            <LayoutGrid className="w-4 h-4" /> Catálogo
          </button>
          <button
            onClick={() => setView("map")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all",
              view === "map"
                ? "text-black font-bold border-transparent"
                : "text-muted-foreground border-white/10 hover:text-white hover:border-white/20"
            )}
            style={view === "map" ? { background: "#00FFCC" } : {}}
          >
            <Map className="w-4 h-4" /> Mapa
          </button>

          {view === "catalog" && (
            <>
              <button
                onClick={() => setShowCatalogFilters(v => !v)}
                className="flex items-center gap-1.5 ml-2 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all flex-shrink-0"
                style={{
                  background: hasActiveFilters ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${hasActiveFilters ? "rgba(0,255,204,0.4)" : "rgba(255,255,255,0.1)"}`,
                  color: hasActiveFilters ? "#00FFCC" : "#aaa",
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {hasActiveFilters ? "Filtros activos" : "Filtros"}
              </button>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
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
          <StoreMapWidget height="560px" showWidgets />
        )}

        {/* ── CATALOG VIEW ── */}
        {view === "catalog" && (
          <>
            {/* Filters Panel */}
            {showCatalogFilters && (
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Row 1: search + category */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                    <Input
                      placeholder="Buscar producto, categoría o tienda..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 focus:border-primary/40 text-white font-mono h-11 rounded-xl"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white font-mono h-11 text-xs uppercase rounded-xl">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0e1a] border-white/10">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="font-mono text-xs uppercase text-white focus:bg-primary/20 focus:text-primary">
                          {cat === "all" ? "Todas las categorías" : cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Row 2: price range */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Precio máximo
                    </label>
                    <span className="font-mono text-xs font-bold" style={{ color: "#00FFCC" }}>
                      {maxPrice !== undefined ? `$${maxPrice.toLocaleString("es-CO")}` : "Sin límite"}
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
                    <div className="relative w-28">
                      <span className="absolute left-3 top-2.5 text-primary/60 font-mono text-xs">$</span>
                      <Input
                        type="number"
                        placeholder="Libre"
                        value={maxPrice || ""}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="pl-7 bg-white/5 border-white/10 focus:border-primary/40 text-white font-mono h-9 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setSearchTerm(""); setSelectedCategory("all"); setMaxPrice(undefined); }}
                      className="flex items-center gap-1 text-[10px] font-mono text-red-400 hover:text-red-300 border border-red-400/20 hover:bg-red-400/10 px-3 py-1 rounded-lg transition-all"
                    >
                      <X className="w-3 h-3" /> Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Products grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-[300px] w-full rounded-2xl bg-white/5" />
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
                  <div className="col-span-full py-20 text-center rounded-2xl border border-dashed border-white/10">
                    <Package className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-4" />
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

  const stockColor = product.stock > 10 ? "#22c55e" : product.stock > 0 ? "#eab308" : "#ef4444";

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col group transition-all hover:scale-[1.01]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="h-40 relative overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-14 h-14 text-white/10" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,14,26,0.8) 0%, transparent 60%)" }} />
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold" style={{ background: "rgba(0,255,204,0.2)", color: "#00FFCC", border: "1px solid rgba(0,255,204,0.3)" }}>
            {product.category}
          </span>
        </div>
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ background: wishlisted ? "rgba(236,72,153,0.2)" : "rgba(0,0,0,0.5)", border: wishlisted ? "1px solid rgba(236,72,153,0.4)" : "1px solid rgba(255,255,255,0.1)" }}
        >
          <Heart
            className="w-3.5 h-3.5"
            style={{ color: wishlisted ? "#ec4899" : "rgba(255,255,255,0.5)", fill: wishlisted ? "#ec4899" : "none" }}
          />
        </button>
        <div className="absolute bottom-2 right-2">
          <span className="font-mono font-black text-sm" style={{ color: "#00FFCC", textShadow: "0 0 8px rgba(0,255,204,0.5)" }}>
            ${product.price?.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-mono text-sm font-bold text-white leading-snug mb-0.5 line-clamp-2">{product.name}</h4>
        <p className="font-mono text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
          <Store className="w-2.5 h-2.5 flex-shrink-0" />{product.storeName}
        </p>
        <p className="text-xs text-muted-foreground/70 font-mono line-clamp-2 flex-1 mb-3">{product.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className="w-3 h-3" style={{ color: s <= Math.round(product.avgRating || 0) ? "#eab308" : "rgba(255,255,255,0.15)", fill: s <= Math.round(product.avgRating || 0) ? "#eab308" : "none" }} />
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
            className="flex-1 font-mono text-xs uppercase rounded-xl h-9 transition-all"
            style={{ background: "rgba(0,255,204,0.1)", color: "#00FFCC", border: "1px solid rgba(0,255,204,0.3)" }}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Agregar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="font-mono text-xs h-9 w-9 p-0 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[380px] bg-[#0a0e1a] border-white/10 text-white rounded-2xl">
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
                        style={{ color: star <= rating ? "#eab308" : "rgba(255,255,255,0.2)", fill: star <= rating ? "#eab308" : "none" }}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-white/5 border-white/10 font-mono text-white resize-none rounded-xl"
                  placeholder="Comentario opcional..."
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={isRating}
                  className="w-full font-mono text-xs uppercase rounded-xl"
                  style={{ background: "rgba(0,255,204,0.1)", color: "#00FFCC", border: "1px solid rgba(0,255,204,0.3)" }}
                >
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
