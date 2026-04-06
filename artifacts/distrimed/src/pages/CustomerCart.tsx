import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CustomerCart() {
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const token = localStorage.getItem("distrimed_token");
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error("Error placing order");
      setPlaced(true);
      clearCart();
      toast({ title: "¡Pedido confirmado!", description: "Tu pedido ha sido procesado exitosamente." });
      setTimeout(() => setLocation("/customer/orders"), 2000);
    } catch {
      toast({ title: "Error", description: "No se pudo procesar el pedido.", variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <DashboardLayout title="Carrito">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <CheckCircle className="w-20 h-20 text-primary mb-6 animate-pulse" />
          <h2 className="text-2xl font-mono font-bold text-white mb-2">¡Pedido Confirmado!</h2>
          <p className="text-muted-foreground font-mono text-sm">Redirigiendo a tus pedidos...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (items.length === 0) {
    return (
      <DashboardLayout title="Carrito">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShoppingCart className="w-20 h-20 text-muted-foreground mb-6 opacity-30" />
          <h2 className="text-2xl font-mono font-bold text-white mb-2">Carrito Vacío</h2>
          <p className="text-muted-foreground font-mono text-sm mb-6">
            Agrega productos desde el catálogo
          </p>
          <Link href="/customer">
            <Button className="bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono uppercase">
              <Package className="w-4 h-4 mr-2" /> Ver Catálogo
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const groupedByStore = items.reduce((acc, item) => {
    if (!acc[item.storeName]) acc[item.storeName] = [];
    acc[item.storeName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <DashboardLayout title="Carrito">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(groupedByStore).map(([storeName, storeItems]) => (
            <Card key={storeName} className="bg-card/50 backdrop-blur-md border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="font-mono text-xs uppercase text-primary flex items-center gap-2">
                  <Package className="w-4 h-4" /> {storeName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {storeItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 p-3 bg-black/20 rounded-md border border-primary/10"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center text-2xl flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <Package className="w-6 h-6 text-primary/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">{item.category}</p>
                      <p className="text-primary font-mono text-sm font-bold mt-1">
                        ${(item.price * item.quantity).toLocaleString("es-CO")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 text-muted-foreground hover:text-primary border border-primary/20 rounded-md"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="font-mono text-white text-sm w-5 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-7 h-7 p-0 text-muted-foreground hover:text-primary border border-primary/20 rounded-md"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="bg-card/50 backdrop-blur-md border-primary/20 sticky top-0">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase text-primary">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span className="truncate flex-1 mr-2">{item.name} ×{item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString("es-CO")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/20 pt-3 flex justify-between items-center">
                <span className="font-mono text-sm text-muted-foreground uppercase">Total</span>
                <span className="font-mono text-xl font-bold text-primary">${total.toLocaleString("es-CO")}</span>
              </div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>{count} artículo{count !== 1 ? "s" : ""}</span>
                <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">
                  Pendiente
                </Badge>
              </div>
              <Button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono uppercase tracking-widest"
              >
                {placing ? "Procesando..." : (
                  <>Confirmar Pedido <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={clearCart}
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-mono text-xs uppercase"
              >
                <Trash2 className="w-3 h-3 mr-2" /> Vaciar Carrito
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
