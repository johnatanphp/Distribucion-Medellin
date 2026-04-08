import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeo } from "@/contexts/GeoContext";
import { useGetStores, useGetProducts } from "@workspace/api-client-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  X, Navigation, MapPin, Store, Package, ShoppingCart, Zap,
  ChevronRight, ChevronDown, ChevronUp, Radio, Signal, LocateFixed, Footprints
} from "lucide-react";

interface Props {
  onClose: () => void;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeWalkingUserIcon(heading: number | null, accuracy: number) {
  const color = "#0099B8";
  const arrow = heading !== null
    ? `<line x1="24" y1="24" x2="${24 + 16 * Math.sin((heading * Math.PI) / 180)}" y2="${24 - 16 * Math.cos((heading * Math.PI) / 180)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="${color}" fill-opacity="0.10">
      <animate attributeName="r" values="18;26;18" dur="2.4s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.10;0;0.10" dur="2.4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="24" cy="24" r="10" fill="${color}" fill-opacity="0.20"/>
    <circle cx="24" cy="24" r="7" fill="${color}"/>
    <circle cx="24" cy="24" r="3.5" fill="white"/>
    ${arrow}
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [48, 48], iconAnchor: [24, 24] });
}

function makeStoreWalkingIcon(dist: number, hasPromoProducts: boolean) {
  const color = dist < 300 ? "#16a34a" : dist < 800 ? "#0099B8" : dist < 2000 ? "#d97706" : "#9ca3af";
  const glow = dist < 300 ? `drop-shadow(0 0 6px ${color})` : "";
  const size = dist < 300 ? 44 : dist < 800 ? 36 : 28;
  const badge = hasPromoProducts
    ? `<circle cx="${size - 8}" cy="8" r="6" fill="#ef4444"/><text x="${size - 8}" y="12" text-anchor="middle" font-size="8" fill="white" font-weight="bold">!</text>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 44 44" style="filter:${glow}">
    ${dist < 300 ? `<circle cx="22" cy="22" r="20" fill="${color}" fill-opacity="0.12">
      <animate attributeName="r" values="20;28;20" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.12;0;0.12" dur="1.8s" repeatCount="indefinite"/>
    </circle>` : ""}
    <circle cx="22" cy="22" r="13" fill="${color}" fill-opacity="${dist < 800 ? 0.2 : 0.1}"/>
    <circle cx="22" cy="22" r="9" fill="${color}" fill-opacity="0.9"/>
    <path d="M22 14 L30 20 L30 30 L14 30 L14 20 Z" fill="white" fill-opacity="0.95"/>
    <rect x="19" y="23" width="3.5" height="7" fill="${color}" rx="0.5"/>
    <rect x="22.5" y="23" width="3.5" height="7" fill="${color}" rx="0.5" opacity="0.4"/>
    <polyline points="14,20 22,14 30,20" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
    ${badge}
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2) - 4] });
}

function LiveMapUpdater({ pos }: { pos: { lat: number; lng: number } }) {
  const map = useMap();
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!lastPos.current) {
      map.setView([pos.lat, pos.lng], 16, { animate: true });
    } else {
      map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 });
    }
    lastPos.current = pos;
  }, [pos, map]);
  return null;
}

export default function WalkingModeOverlay({ onClose }: Props) {
  const { position, status, positionHistory } = useGeo();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [maxWalkDist, setMaxWalkDist] = useState(1500);
  const [showPanel, setShowPanel] = useState(true);
  const [panelPage, setPanelPage] = useState<"stores" | "products">("stores");

  const { data: storesRaw = [] } = useGetStores();
  const { data: productsRaw = [] } = useGetProducts({});
  const stores = storesRaw as any[];
  const products = productsRaw as any[];

  const categories = useMemo(() =>
    ["all", ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)))],
    [products]
  );

  const storesWithDist = useMemo(() => {
    if (!position) return [];
    return stores
      .filter((s) => s.active && s.lat && s.lng)
      .map((s) => ({
        ...s,
        dist: haversine(position.lat, position.lng, s.lat, s.lng),
        products: products.filter((p: any) => p.storeId === s.id && p.active !== false),
      }))
      .sort((a, b) => a.dist - b.dist);
  }, [stores, products, position]);

  const nearbyStores = useMemo(() =>
    storesWithDist.filter((s) => s.dist <= maxWalkDist),
    [storesWithDist, maxWalkDist]
  );

  const nearbyProducts = useMemo(() => {
    const storeIds = new Set(nearbyStores.map((s) => s.id));
    return products.filter((p: any) => {
      const inStore = storeIds.has(p.storeId);
      const catOk = filterCategory === "all" || p.category === filterCategory;
      return inStore && catOk && p.stock > 0;
    }).sort((a: any, b: any) => a.price - b.price);
  }, [nearbyStores, products, filterCategory]);

  const selectedStoreProducts = useMemo(() => {
    if (!selectedStore) return [];
    return products.filter((p: any) => {
      const catOk = filterCategory === "all" || p.category === filterCategory;
      return p.storeId === selectedStore.id && catOk && p.stock > 0;
    });
  }, [selectedStore, products, filterCategory]);

  const distLabel = (m: number) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;

  const handleAddToCart = (product: any, storeName: string, storeId: number) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      storeId,
      storeName,
      category: product.category,
    });
    toast({
      title: "Agregado al carrito",
      description: `${product.name} — $${Number(product.price).toLocaleString("es-CO")}`,
    });
  };

  const speedKmh = position?.speed ? Math.round(position.speed * 3.6) : null;
  const accuracy = position?.accuracy ? Math.round(position.accuracy) : null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Top Bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: "hsl(var(--primary) / 0.08)",
          borderBottom: "1px solid hsl(var(--primary) / 0.20)"
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Footprints className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-foreground leading-none">Modo Caminata</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {status === "granted"
                ? `GPS activo · ${nearbyStores.length} tienda${nearbyStores.length !== 1 ? "s" : ""} cercanas`
                : status === "requesting" ? "Obteniendo GPS…"
                : "GPS no disponible"}
            </p>
          </div>
        </div>

        {/* GPS stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {accuracy !== null && (
            <div className="text-right hidden sm:block">
              <p className="font-mono text-[9px] text-muted-foreground uppercase">Precisión</p>
              <p className="font-mono text-xs font-bold text-primary">{accuracy}m</p>
            </div>
          )}
          {speedKmh !== null && speedKmh > 0 && (
            <div className="text-right hidden sm:block">
              <p className="font-mono text-[9px] text-muted-foreground uppercase">Vel.</p>
              <p className="font-mono text-xs font-bold text-primary">{speedKmh}km/h</p>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: status === "granted" ? "hsl(162 60% 40% / 0.12)" : "hsl(var(--muted))" }}>
            <div className={`w-2 h-2 rounded-full live-dot ${status === "granted" ? "bg-green-500" : "bg-muted-foreground"}`} />
            <span className="font-mono text-[10px] font-bold" style={{ color: status === "granted" ? "#16a34a" : undefined }}>
              {status === "granted" ? "EN VIVO" : "BUSCANDO"}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 flex-shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <span className="font-mono text-[10px] text-muted-foreground uppercase flex-shrink-0">Radio:</span>
        {[300, 500, 1000, 1500, 3000].map((d) => (
          <button
            key={d}
            onClick={() => setMaxWalkDist(d)}
            className="px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase flex-shrink-0 transition-all"
            style={{
              background: maxWalkDist === d ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
              color: maxWalkDist === d ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              border: `1px solid ${maxWalkDist === d ? "hsl(var(--primary) / 0.40)" : "transparent"}`,
            }}
          >
            {d < 1000 ? `${d}m` : `${d / 1000}km`}
          </button>
        ))}
        <span className="font-mono text-[10px] text-muted-foreground uppercase flex-shrink-0 ml-2">Cat:</span>
        {categories.slice(0, 5).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className="px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase flex-shrink-0 transition-all"
            style={{
              background: filterCategory === cat ? "hsl(var(--secondary) / 0.15)" : "hsl(var(--muted))",
              color: filterCategory === cat ? "hsl(var(--secondary))" : "hsl(var(--muted-foreground))",
              border: `1px solid ${filterCategory === cat ? "hsl(var(--secondary) / 0.35)" : "transparent"}`,
            }}
          >
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {/* Map + Side Panel */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* MAP */}
        <div className="flex-1 relative min-h-0">
          {position ? (
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />
              <ZoomControl position="bottomright" />
              <LiveMapUpdater pos={position} />

              {/* User position */}
              <Marker
                position={[position.lat, position.lng]}
                icon={makeWalkingUserIcon(position.heading ?? null, position.accuracy ?? 20)}
                zIndexOffset={1000}
              />
              {position.accuracy && (
                <Circle
                  center={[position.lat, position.lng]}
                  radius={position.accuracy}
                  pathOptions={{ color: "#0099B8", fillColor: "#0099B8", fillOpacity: 0.06, weight: 1.5, opacity: 0.4 }}
                />
              )}
              {/* Radius ring */}
              <Circle
                center={[position.lat, position.lng]}
                radius={maxWalkDist}
                pathOptions={{ color: "#0099B8", fillColor: "#0099B8", fillOpacity: 0.03, weight: 1.5, opacity: 0.25, dashArray: "6 6" }}
              />

              {/* Store markers */}
              {storesWithDist.map((s) => {
                const hasLowStock = s.products.some((p: any) => p.stock <= 3 && p.stock > 0);
                return (
                  <Marker
                    key={s.id}
                    position={[s.lat, s.lng]}
                    icon={makeStoreWalkingIcon(s.dist, hasLowStock)}
                    eventHandlers={{ click: () => { setSelectedStore(s); setPanelPage("products"); } }}
                    zIndexOffset={s.dist < 300 ? 100 : 0}
                  >
                    <Popup>
                      <div style={{ fontFamily: "monospace", minWidth: 200 }}>
                        <p className="font-bold text-sm" style={{ color: "#0099B8" }}>{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.address}</p>
                        <p className="text-xs font-bold mt-1" style={{ color: s.dist < 300 ? "#16a34a" : s.dist < 800 ? "#0099B8" : "#d97706" }}>
                          📍 {distLabel(s.dist)}
                          {s.dist < 300 ? " · ¡Estás aquí!" : s.dist < 800 ? " · Muy cerca" : ""}
                        </p>
                        <p className="text-xs mt-0.5">{s.products.length} producto{s.products.length !== 1 ? "s" : ""}</p>
                        <button
                          onClick={() => { setSelectedStore(s); setPanelPage("products"); setShowPanel(true); }}
                          className="mt-2 w-full text-xs font-mono font-bold px-3 py-1.5 rounded-lg text-white"
                          style={{ background: "#0099B8" }}
                        >
                          Ver productos →
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <LocateFixed className="w-16 h-16 text-primary animate-pulse" />
              <div className="text-center">
                <p className="font-mono font-bold text-foreground text-lg">Obteniendo tu ubicación</p>
                <p className="font-mono text-sm text-muted-foreground mt-1">
                  {status === "denied" ? "Permiso GPS denegado — actívalo en tu navegador" : "Espera un momento…"}
                </p>
              </div>
            </div>
          )}

          {/* Nearby stores badge overlay (bottom left of map) */}
          {position && nearbyStores.length > 0 && (
            <div
              className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-1 max-w-[200px]"
              style={{ pointerEvents: "none" }}
            >
              {nearbyStores.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="px-3 py-1.5 rounded-xl flex items-center gap-2"
                  style={{
                    background: "hsl(var(--card) / 0.92)",
                    border: "1px solid hsl(var(--primary) / 0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.dist < 300 ? "#16a34a" : "#0099B8" }} />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold text-foreground truncate">{s.name}</p>
                    <p className="font-mono text-[9px] text-muted-foreground">{distLabel(s.dist)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <div
          className={`md:w-88 w-full flex-shrink-0 flex flex-col min-h-0 transition-all ${showPanel ? "" : "hidden md:flex"}`}
          style={{
            background: "hsl(var(--card))",
            borderLeft: "1px solid hsl(var(--border))",
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          {/* Panel tabs */}
          <div className="flex border-b border-border flex-shrink-0">
            <button
              onClick={() => { setPanelPage("stores"); setSelectedStore(null); }}
              className="flex-1 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all border-b-2"
              style={{
                borderColor: panelPage === "stores" ? "hsl(var(--primary))" : "transparent",
                color: panelPage === "stores" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Store className="w-3.5 h-3.5 inline mr-1.5" />
              Tiendas ({nearbyStores.length})
            </button>
            <button
              onClick={() => setPanelPage("products")}
              className="flex-1 px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all border-b-2"
              style={{
                borderColor: panelPage === "products" ? "hsl(var(--primary))" : "transparent",
                color: panelPage === "products" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Package className="w-3.5 h-3.5 inline mr-1.5" />
              {selectedStore ? `${selectedStore.name.split(" ")[0]}` : "Productos"}
              {selectedStore ? ` (${selectedStoreProducts.length})` : ` (${nearbyProducts.length})`}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {panelPage === "stores" && (
              <>
                {nearbyStores.length === 0 ? (
                  <div className="py-12 text-center">
                    <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-mono text-sm text-muted-foreground">
                      {!position ? "Esperando GPS…" : `No hay tiendas en ${distLabel(maxWalkDist)}`}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground/60 mt-1">Amplía el radio de búsqueda</p>
                  </div>
                ) : (
                  storesWithDist.slice(0, 20).map((s) => {
                    const isNearby = s.dist <= maxWalkDist;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedStore(s); setPanelPage("products"); }}
                        className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.005]"
                        style={{
                          background: isNearby
                            ? s.dist < 300 ? "hsl(162 60% 40% / 0.08)" : "hsl(var(--primary) / 0.06)"
                            : "hsl(var(--muted) / 0.5)",
                          border: `1px solid ${isNearby
                            ? s.dist < 300 ? "hsl(162 60% 40% / 0.30)" : "hsl(var(--primary) / 0.20)"
                            : "hsl(var(--border))"}`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: s.dist < 300 ? "hsl(162 60% 40% / 0.15)" : "hsl(var(--primary) / 0.10)",
                            }}
                          >
                            <Store className="w-4 h-4" style={{ color: s.dist < 300 ? "#16a34a" : "hsl(var(--primary))" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono text-sm font-bold text-foreground truncate">{s.name}</p>
                              <span
                                className="font-mono text-xs font-bold flex-shrink-0"
                                style={{ color: s.dist < 300 ? "#16a34a" : s.dist < 800 ? "hsl(var(--primary))" : "#d97706" }}
                              >
                                {distLabel(s.dist)}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{s.address}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                style={{ background: "hsl(var(--primary) / 0.10)", color: "hsl(var(--primary))" }}>
                                {s.products.length} prod.
                              </span>
                              {s.dist < 300 && (
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                  style={{ background: "hsl(162 60% 40% / 0.12)", color: "#16a34a" }}>
                                  ¡Estás aquí!
                                </span>
                              )}
                              {s.open_hours && (
                                <span className="font-mono text-[9px] text-muted-foreground truncate">{s.open_hours}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center" />
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}

            {panelPage === "products" && (
              <>
                {selectedStore && (
                  <div className="rounded-xl p-3 mb-1 flex items-center gap-2"
                    style={{ background: "hsl(var(--primary) / 0.07)", border: "1px solid hsl(var(--primary) / 0.20)" }}>
                    <Store className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold text-foreground truncate">{selectedStore.name}</p>
                      <p className="font-mono text-[9px] text-muted-foreground">{distLabel(selectedStore.dist)} · {selectedStore.products.length} productos</p>
                    </div>
                    <button onClick={() => setSelectedStore(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {(selectedStore ? selectedStoreProducts : nearbyProducts).length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-mono text-sm text-muted-foreground">
                      {!position ? "Esperando GPS…" : selectedStore ? "Sin productos en esta categoría" : "Sin productos en el área"}
                    </p>
                  </div>
                ) : (
                  (selectedStore ? selectedStoreProducts : nearbyProducts).map((product: any) => {
                    const store = storesWithDist.find((s) => s.id === product.storeId);
                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-xl transition-all"
                        style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-bold text-foreground leading-tight">{product.name}</p>
                            {!selectedStore && store && (
                              <p className="font-mono text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Store className="w-2.5 h-2.5" />
                                {store.name} · {distLabel(store.dist)}
                              </p>
                            )}
                            <p className="font-mono text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="font-mono text-xs font-black" style={{ color: "hsl(var(--primary))" }}>
                                ${Number(product.price).toLocaleString("es-CO")}
                              </span>
                              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                                {product.category}
                              </span>
                              <span
                                className="font-mono text-[9px] font-bold"
                                style={{ color: product.stock > 10 ? "#16a34a" : product.stock > 0 ? "#d97706" : "#ef4444" }}
                              >
                                {product.stock > 0 ? `${product.stock} und` : "Agotado"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddToCart(
                              product,
                              store?.name ?? selectedStore?.name ?? "Tienda",
                              product.storeId
                            )}
                            disabled={product.stock === 0}
                            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                            style={{
                              background: "hsl(var(--primary) / 0.12)",
                              border: "1px solid hsl(var(--primary) / 0.30)",
                              color: "hsl(var(--primary))",
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Bottom: Cart hint */}
          <div
            className="p-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
          >
            <p className="font-mono text-[10px] text-muted-foreground">
              {nearbyProducts.length} productos disponibles en tu área
            </p>
            <button
              onClick={onClose}
              className="font-mono text-xs font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Ir al carrito →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
