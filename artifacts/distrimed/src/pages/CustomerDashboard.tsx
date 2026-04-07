import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import {
  useGetProducts,
  useCreateRating,
  getGetProductsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, MapPin, Star, Package, ShoppingCart, Heart, Map, LayoutGrid, Phone, Store
} from "lucide-react";
import StoreMapWidget from "@/components/StoreMapWidget";
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

  const { data: products, isLoading: productsLoading } = useGetProducts({ maxPrice });
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

  return (
    <DashboardLayout title={view === "map" ? "Mapa de Tiendas" : "Catálogo"}>
      <div className="space-y-5">
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
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              {filteredProducts?.length ?? 0} productos
            </span>
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
        {false && (
          <div className="hidden">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                      placeholder="Buscar tienda..."
                      className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-xs w-44 placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGetLocation}
                    className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono text-[10px] uppercase h-8 px-3 rounded-lg"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" /> Localizar
                  </Button>
                </div>
              </div>

              {/* Map + sidebar layout */}
              <div className="flex h-[480px]">
                {/* Store list sidebar */}
                <div className="w-56 border-r border-white/5 flex flex-col bg-black/30 overflow-hidden hidden sm:flex">
                  <div className="p-3 border-b border-white/5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                      {filteredStoreMarkers.length} tienda{filteredStoreMarkers.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {storesLoading ? (
                      <div className="p-3 space-y-2">
                        {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg bg-white/5" />)}
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {filteredStoreMarkers.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => handleStoreClick(store)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-lg transition-all border",
                              selectedStore?.id === store.id
                                ? "border-primary/40 bg-primary/10"
                                : "border-transparent hover:bg-white/5 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.2)" }}
                              >
                                <Store className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-mono text-xs font-bold text-white truncate">{store.name}</p>
                                <p className="font-mono text-[9px] text-muted-foreground truncate mt-0.5">{store.address || store.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                        {filteredStoreMarkers.length === 0 && (
                          <div className="p-4 text-center">
                            <p className="font-mono text-[10px] text-muted-foreground">Sin resultados</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                  <MapComponent
                    center={mapCenter}
                    zoom={selectedStore ? 16 : 13}
                    userLocation={userLocation}
                    stores={filteredStoreMarkers}
                    selectedStoreId={selectedStore?.id}
                    onStoreClick={handleStoreClick}
                  />
                  {/* Legend overlay */}
                  <div className="absolute bottom-3 right-3 z-[400] rounded-lg px-3 py-2 text-[9px] font-mono space-y-1" style={{ background: "rgba(5,8,16,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: "#00FFCC", boxShadow: "0 0 6px #00FFCC" }} />
                      <span className="text-muted-foreground">Tienda activa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: "#8b5cf6", boxShadow: "0 0 6px #8b5cf6" }} />
                      <span className="text-muted-foreground">Tu ubicación</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected store detail */}
            {selectedStore && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)" }}>
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono font-bold text-white text-base">{selectedStore.name}</h3>
                        <Badge className="text-[10px] font-mono uppercase border-primary/30 bg-primary/10 text-primary">Activa</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-mono text-muted-foreground">
                        {selectedStore.address && (
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-primary flex-shrink-0" /> {selectedStore.address}</span>
                        )}
                        {selectedStore.phone && (
                          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary flex-shrink-0" /> {selectedStore.phone}</span>
                        )}
                        {selectedStore.description && (
                          <span className="col-span-full text-muted-foreground/70 mt-1">{selectedStore.description}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStore(null)}
                      className="text-muted-foreground hover:text-white text-xs font-mono flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Store cards grid below map */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">Nodos de Distribución</h2>
                <span className="ml-auto text-[10px] font-mono text-muted-foreground">{stores?.length ?? 0} activos</span>
              </div>
              {storesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-xl bg-white/5" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores?.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        handleStoreClick({ id: store.id, name: store.name, lat: store.lat, lng: store.lng, description: store.description, address: store.address, phone: store.phone, active: store.active });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-left rounded-2xl p-5 border transition-all hover:scale-[1.01] group"
                      style={selectedStore?.id === store.id ? {
                        background: "rgba(0,255,204,0.08)",
                        border: "1px solid rgba(0,255,204,0.3)",
                        boxShadow: "0 0 24px rgba(0,255,204,0.1)"
                      } : {
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                          style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.2)" }}
                        >
                          <Store className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono font-bold text-white text-sm truncate">{store.name}</h3>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" style={{ boxShadow: "0 0 6px #00FFCC" }} />
                          </div>
                          {store.address && (
                            <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 mb-1 truncate">
                              <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {store.address}
                            </p>
                          )}
                          {store.phone && (
                            <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                              <Phone className="w-2.5 h-2.5 flex-shrink-0" /> {store.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-mono text-[10px] text-muted-foreground/60 mt-3 line-clamp-2">{store.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[9px] font-mono text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Navigation className="w-2.5 h-2.5" /> Ver en mapa
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CATALOG VIEW ── */}
        {view === "catalog" && (
          <>
            {/* Filters */}
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
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white font-mono h-11 text-xs uppercase rounded-xl">
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
              <div className="relative w-full sm:w-36">
                <span className="absolute left-3 top-3 text-primary/60 font-mono text-xs">Max $</span>
                <Input
                  type="number"
                  placeholder="Precio..."
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="pl-14 bg-white/5 border-white/10 focus:border-primary/40 text-white font-mono h-11 rounded-xl"
                />
              </div>
            </div>

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
      {/* Image */}
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
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,14,26,0.8) 0%, transparent 60%)" }} />
        {/* Category chip */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md font-mono text-[9px] uppercase font-bold" style={{ background: "rgba(0,255,204,0.2)", color: "#00FFCC", border: "1px solid rgba(0,255,204,0.3)" }}>
            {product.category}
          </span>
        </div>
        {/* Wishlist btn */}
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
        {/* Price at bottom of image */}
        <div className="absolute bottom-2 right-2">
          <span className="font-mono font-black text-sm" style={{ color: "#00FFCC", textShadow: "0 0 8px rgba(0,255,204,0.5)" }}>
            ${product.price?.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-mono text-sm font-bold text-white leading-snug mb-0.5 line-clamp-2">{product.name}</h4>
        <p className="font-mono text-[10px] text-muted-foreground mb-1">{product.storeName}</p>
        <p className="text-xs text-muted-foreground/70 font-mono line-clamp-2 flex-1 mb-3">{product.description}</p>

        {/* Rating + stock */}
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

        {/* Actions */}
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
