import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Package, ChevronDown, ChevronUp, Calendar, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  storeId: number;
  productName: string;
  storeName: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

function useMyOrders() {
  return useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const token = localStorage.getItem("distrimed_token");
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor: Record<string, string> = {
    completed: "bg-green-500/10 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  const statusLabel: Record<string, string> = {
    completed: "Completado",
    pending: "Pendiente",
    cancelled: "Cancelado",
  };

  return (
    <Card className="bg-card/50 backdrop-blur-md border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-0">
        <button
          className="w-full text-left p-4 flex items-center gap-4"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-muted-foreground">#ORD-{String(order.id).padStart(4, "0")}</span>
              <Badge className={`text-[10px] border ${statusColor[order.status] || statusColor.completed}`}>
                {statusLabel[order.status] || order.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm font-bold text-primary">
                ${order.total.toLocaleString("es-CO")}
              </span>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Package className="w-3 h-3" /> {order.items.length} artículo{order.items.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 ml-auto">
                <Calendar className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleDateString("es-CO", {
                  day: "2-digit", month: "short", year: "numeric"
                })}
              </span>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 space-y-2">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Detalle del Pedido</p>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-black/20 rounded-md border border-primary/10"
              >
                <div>
                  <p className="font-mono text-sm text-white">{item.productName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {item.storeName} · ×{item.quantity} · ${item.unitPrice.toLocaleString("es-CO")} c/u
                  </p>
                </div>
                <span className="font-mono text-sm text-primary font-bold">
                  ${(item.unitPrice * item.quantity).toLocaleString("es-CO")}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-primary/10">
              <span className="font-mono text-xs text-muted-foreground uppercase">Total del pedido</span>
              <span className="font-mono text-primary font-bold text-lg">${order.total.toLocaleString("es-CO")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerOrders() {
  const { data: orders, isLoading, error } = useMyOrders();

  return (
    <DashboardLayout title="Mis Pedidos">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-lg font-bold text-white">Historial de Pedidos</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {orders ? `${orders.length} pedido${orders.length !== 1 ? "s" : ""} registrado${orders.length !== 1 ? "s" : ""}` : "Cargando..."}
            </p>
          </div>
          <Link href="/customer">
            <Button
              variant="ghost"
              className="text-primary border border-primary/30 hover:bg-primary/10 font-mono text-xs uppercase"
            >
              <Package className="w-4 h-4 mr-2" /> Ver Catálogo
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full bg-primary/10 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-4 text-center">
              <p className="font-mono text-sm text-destructive">Error cargando pedidos</p>
            </CardContent>
          </Card>
        )}

        {orders && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ClipboardList className="w-20 h-20 text-muted-foreground mb-6 opacity-20" />
            <h3 className="text-xl font-mono font-bold text-white mb-2">Sin Pedidos</h3>
            <p className="text-muted-foreground font-mono text-sm mb-6">Aún no has realizado ningún pedido</p>
            <Link href="/customer">
              <Button className="bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono uppercase">
                <Package className="w-4 h-4 mr-2" /> Explorar Catálogo
              </Button>
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
