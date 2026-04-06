import { useState, useEffect } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Package, Star } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export interface WishlistItem {
  productId: number;
  name: string;
  price: number;
  category: string;
  storeName: string;
  storeId: number;
  imageUrl?: string | null;
  avgRating?: number | null;
  totalRatings?: number;
}

const WISHLIST_KEY = "distrimed_wishlist";

export function getWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToWishlist(item: WishlistItem) {
  const list = getWishlist();
  if (!list.find((i) => i.productId === item.productId)) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify([...list, item]));
  }
}

export function removeFromWishlist(productId: number) {
  const list = getWishlist().filter((i) => i.productId !== productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

export function isInWishlist(productId: number): boolean {
  return getWishlist().some((i) => i.productId === productId);
}

export default function CustomerWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(getWishlist());
  const { addItem } = useCart();
  const { toast } = useToast();

  const refresh = () => setItems(getWishlist());

  const handleRemove = (productId: number) => {
    removeFromWishlist(productId);
    refresh();
  };

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      storeId: item.storeId,
      storeName: item.storeName,
      imageUrl: item.imageUrl,
      category: item.category,
    });
    toast({ title: "Agregado al carrito", description: item.name });
  };

  const handleClear = () => {
    localStorage.removeItem(WISHLIST_KEY);
    setItems([]);
  };

  if (items.length === 0) {
    return (
      <DashboardLayout title="Lista de Deseos">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Heart className="w-20 h-20 text-muted-foreground mb-6 opacity-20" />
          <h2 className="text-2xl font-mono font-bold text-white mb-2">Lista Vacía</h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Guarda productos que te interesen para comprar después
          </p>
          <Link href="/customer">
            <Button className="bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono uppercase">
              <Package className="w-4 h-4 mr-2" /> Explorar Catálogo
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Lista de Deseos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-white">Lista de Deseos</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {items.length} producto{items.length !== 1 ? "s" : ""} guardado{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-mono text-xs uppercase"
          >
            <Trash2 className="w-3 h-3 mr-2" /> Limpiar todo
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <Card
              key={item.productId}
              className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-all group"
            >
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="w-full h-32 bg-primary/5 rounded-md flex items-center justify-center border border-primary/10 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-12 h-12 text-primary/20" />
                  )}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                  </button>
                </div>

                <div className="flex-1">
                  <p className="font-mono text-sm font-bold text-white leading-tight">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">{item.category}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.storeName}</p>
                  {item.avgRating != null && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {Number(item.avgRating).toFixed(1)} ({item.totalRatings ?? 0})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-primary/10">
                  <span className="font-mono text-primary font-bold text-sm">
                    ${item.price.toLocaleString("es-CO")}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono text-xs uppercase"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" /> Carrito
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 border border-destructive/20 p-2"
                    onClick={() => handleRemove(item.productId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
