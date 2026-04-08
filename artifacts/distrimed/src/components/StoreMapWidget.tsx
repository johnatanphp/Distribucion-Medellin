import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetStores, useGetProducts } from "@workspace/api-client-react";
import { useAuth } from "@/components/AuthProvider";
import { useGeo } from "@/contexts/GeoContext";
import {
  Store, Search, MapPin, Navigation, X,
  Activity, AlertCircle, Package,
  Layers, Filter, Phone, LocateFixed, LocateOff, ChevronDown,
} from "lucide-react";

interface StoreItem {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  lat?: number | null;
  lng?: number | null;
  active: boolean;
  description?: string;
  open_hours?: string;
  productCount?: number;
}

const ZONES = [
  { key: "all", label: "Toda la Ciudad", color: "#0099B8" },
  { key: "norte", label: "Norte", color: "#0066CC" },
  { key: "centro", label: "Centro", color: "#F97316" },
  { key: "occidente", label: "Occidente", color: "#8B5CF6" },
  { key: "sur", label: "Sur", color: "#16A34A" },
];

function getZone(lat?: number | null, lng?: number | null): string {
  if (!lat || !lng) return "centro";
  if (lat > 6.28) return "norte";
  if (lat < 6.22) return "sur";
  if (lng < -75.585) return "occidente";
  return "centro";
}

function getZoneColor(lat?: number | null, lng?: number | null): string {
  const z = getZone(lat, lng);
  return ZONES.find((z2) => z2.key === z)?.color ?? "#0099B8";
}

function makeStoreIcon(color: string, size: number, pulse = false, isOwn = false) {
  const shadowColor = color + "80";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 36 36">
    ${pulse ? `<circle cx="18" cy="18" r="16" fill="${color}" fill-opacity="0.10">
      <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.10;0;0.10" dur="2s" repeatCount="indefinite"/>
    </circle>` : ""}
    <circle cx="18" cy="18" r="${isOwn ? 14 : 12}" fill="white" stroke="${color}" stroke-width="${isOwn ? 2.5 : 2}"/>
    <path d="M18 10 L25 15 L25 26 L11 26 L11 15 Z" fill="${color}" fill-opacity="0.15"/>
    <path d="M18 10 L25 15 L25 26 L11 26 L11 15 Z" fill="none" stroke="${color}" stroke-width="1.5"/>
    <rect x="15" y="19" width="3.5" height="7" fill="${color}" rx="0.5"/>
    <rect x="18.5" y="19" width="3" height="7" fill="${color}" rx="0.5" opacity="0.4"/>
    <polyline points="11,15 18,10 25,15" fill="none" stroke="${color}" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4]
  });
}

function makeUserIcon() {
  const color = "#0099B8";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="16" fill="${color}" fill-opacity="0.10">
      <animate attributeName="r" values="16;24;16" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.10;0;0.10" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="22" r="9" fill="${color}" fill-opacity="0.20"/>
    <circle cx="22" cy="22" r="6" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="22" cy="22" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
}

function PanToUser({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  const pannedRef = useRef(false);
  useEffect(() => {
    if (pos && !pannedRef.current) {
      map.setView([pos.lat, pos.lng], 14, { animate: true });
      pannedRef.current = true;
    }
  }, [pos, map]);
  return null;
}

function FitBoundsToStores({ stores }: { stores: StoreItem[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    const pts = stores.filter((s) => s.lat && s.lng).map((s) => [s.lat!, s.lng!] as [number, number]);
    if (pts.length < 2) { map.setView([6.2442, -75.5812], 12); return; }
    map.fitBounds(L.latLngBounds(pts).pad(0.15));
    fitted.current = true;
  }, [stores, map]);
  return null;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  height?: string;
  showWidgets?: boolean;
  compact?: boolean;
  initialCategory?: string;
  initialMaxPrice?: string;
}

export default function StoreMapWidget({
  height = "480px",
  showWidgets = true,
  compact = false,
  initialCategory = "all",
  initialMaxPrice = "",
}: Props) {
  const { user } = useAuth();
  const role = user?.role ?? "customer";
  const { position: userPos, status: locStatus, retry: requestLocation } = useGeo();

  const { data: storesRaw = [] } = useGetStores();
  const stores: StoreItem[] = (storesRaw as StoreItem[]).filter((s) => s.active);

  const { data: productsRaw = [] } = useGetProducts({});
  const products = productsRaw as any[];

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [showFilters, setShowFilters] = useState(false);

  const allStores: StoreItem[] = showInactive
    ? (storesRaw as StoreItem[])
    : (storesRaw as StoreItem[]).filter((s) => s.active);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    return ["all", ...cats];
  }, [products]);

  const storeIdsMatchingProduct = useMemo(() => {
    if (filterCategory === "all" && !maxPrice) return null;
    return new Set(
      products
        .filter((p: any) => {
          const catOk = filterCategory === "all" || p.category === filterCategory;
          const priceOk = !maxPrice || (p.price != null && p.price <= Number(maxPrice));
          return catOk && priceOk;
        })
        .map((p: any) => p.storeId)
    );
  }, [products, filterCategory, maxPrice]);

  const filtered = useMemo(() => {
    return allStores
      .filter((s) => {
        const matchZone = zone === "all" || getZone(s.lat, s.lng) === zone;
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.address || "").toLowerCase().includes(search.toLowerCase());
        const matchProduct = !storeIdsMatchingProduct || storeIdsMatchingProduct.has(s.id);
        return matchZone && matchSearch && matchProduct;
      })
      .sort((a, b) => {
        if (!userPos) return 0;
        const da = a.lat && a.lng ? haversine(userPos.lat, userPos.lng, a.lat, a.lng) : 999;
        const db = b.lat && b.lng ? haversine(userPos.lat, userPos.lng, b.lat, b.lng) : 999;
        return da - db;
      });
  }, [allStores, zone, search, storeIdsMatchingProduct, userPos]);

  const distKm = (s: StoreItem) => {
    if (!userPos || !s.lat || !s.lng) return null;
    return haversine(userPos.lat, userPos.lng, s.lat, s.lng);
  };

  const getStoreIcon = (s: StoreItem) => {
    const isOwn = role === "store" && s.id === (user as any)?.storeId;
    const color = isOwn ? "#f59e0b" : s.active ? getZoneColor(s.lat, s.lng) : "#9ca3af";
    const size = isOwn ? 42 : s.active ? 34 : 26;
    const pulse = s.active && role === "customer";
    return makeStoreIcon(color, size, pulse, isOwn);
  };

  const ownStore = role === "store" ? allStores.find((s) => s.id === (user as any)?.storeId) : null;
  const hasProductFilter = filterCategory !== "all" || !!maxPrice;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI row for admin/store */}
      {showWidgets && !compact && role !== "customer" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Tiendas activas", val: stores.length, color: "#0099B8" },
            { label: "Zonas cubiertas", val: new Set(stores.filter(s => s.active).map(s => getZone(s.lat, s.lng))).size, color: "#8B5CF6" },
            { label: "En el mapa", val: filtered.length, color: "#F97316" },
            { label: "Productos", val: products.length, color: "#16A34A" },
          ].map(({ label, val, color }) => (
            <div key={label} className="px-4 py-3 rounded-xl"
              style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
              <p className="font-mono text-[9px] uppercase tracking-widest mb-1" style={{ color: `${color}aa` }}>{label}</p>
              <p className="font-mono text-xl font-bold" style={{ color }}>{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* GPS Banner */}
      {locStatus === "requesting" || locStatus === "idle" ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "hsl(var(--primary) / 0.07)", border: "1px solid hsl(var(--primary) / 0.20)" }}>
          <LocateFixed className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-primary">Obteniendo tu ubicación GPS…</span>
        </div>
      ) : locStatus === "denied" ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "hsl(var(--destructive) / 0.07)", border: "1px solid hsl(var(--destructive) / 0.20)" }}>
          <LocateOff className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="font-mono text-xs text-destructive flex-1">Ubicación no disponible — distancias desactivadas</span>
          <button onClick={requestLocation}
            className="font-mono text-[10px] px-2 py-1 rounded-lg text-primary border border-primary/30 hover:bg-primary/10 transition-all flex-shrink-0">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{ background: "hsl(162 60% 40% / 0.07)", border: "1px solid hsl(162 60% 40% / 0.20)" }}>
          <LocateFixed className="w-4 h-4 flex-shrink-0" style={{ color: "#16a34a" }} />
          <span className="font-mono text-xs flex-1" style={{ color: "#16a34a" }}>
            GPS activo · mostrando tiendas más cercanas primero
          </span>
          {filtered.length > 0 && (() => {
            const d = distKm(filtered[0]);
            return d ? (
              <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0">
                Más cercana: {d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`}
              </span>
            ) : null;
          })()}
        </div>
      )}

      {/* Map container */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid hsl(var(--border))" }}>
        {/* Filter bar */}
        <div className="p-3 space-y-2.5"
          style={{ background: "hsl(var(--card))", borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tienda o dirección…"
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-foreground placeholder-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all flex-shrink-0"
              style={{
                background: hasProductFilter ? "hsl(var(--primary) / 0.10)" : "hsl(var(--muted))",
                border: `1px solid ${hasProductFilter ? "hsl(var(--primary) / 0.35)" : "hsl(var(--border))"}`,
                color: hasProductFilter ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              {hasProductFilter ? "Filtros ON" : "Filtrar"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-border">
              <div className="flex-1">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Categoría</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/50"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat === "all" ? "Todas las categorías" : cat}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-44">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Precio máximo (COP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-primary font-mono text-xs">$</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Sin límite"
                    className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              {hasProductFilter && (
                <button
                  onClick={() => { setFilterCategory("all"); setMaxPrice(""); }}
                  className="self-end px-3 py-2 rounded-xl text-[10px] font-mono text-destructive border border-destructive/20 hover:bg-destructive/5 transition-all"
                >
                  <X className="w-3 h-3 inline mr-1" />Limpiar
                </button>
              )}
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap">
            {ZONES.map((z) => (
              <button
                key={z.key}
                onClick={() => setZone(z.key)}
                className="px-3 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  background: zone === z.key ? `${z.color}18` : "hsl(var(--muted))",
                  border: `1px solid ${zone === z.key ? `${z.color}50` : "hsl(var(--border))"}`,
                  color: zone === z.key ? z.color : "hsl(var(--muted-foreground))",
                }}
              >
                {z.label}
              </button>
            ))}
            {role === "superadmin" && (
              <button
                onClick={() => setShowInactive(v => !v)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  background: showInactive ? "hsl(var(--destructive) / 0.08)" : "hsl(var(--muted))",
                  border: `1px solid ${showInactive ? "hsl(var(--destructive) / 0.30)" : "hsl(var(--border))"}`,
                  color: showInactive ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
                }}
              >
                <Filter className="w-3 h-3" /> {showInactive ? "Mostrando inactivas" : "Ver inactivas"}
              </button>
            )}
          </div>
        </div>

        {/* MAP */}
        <div style={{ height, position: "relative" }}>
          <MapContainer
            center={[6.2442, -75.5812]}
            zoom={12}
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
            <PanToUser pos={userPos} />
            {!userPos && <FitBoundsToStores stores={filtered.length ? filtered : allStores} />}

            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
                  <Popup>
                    <div style={{ fontFamily: "monospace" }}>
                      <p className="font-bold text-sm text-primary">📍 Tu ubicación</p>
                      {userPos.accuracy && <p className="text-xs text-muted-foreground">Precisión: {Math.round(userPos.accuracy)}m</p>}
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={1000}
                  pathOptions={{ color: "#0099B8", fillColor: "#0099B8", fillOpacity: 0.03, weight: 1.5, opacity: 0.20 }}
                />
              </>
            )}

            {filtered.map((s) => {
              if (!s.lat || !s.lng) return null;
              const dist = distKm(s);
              const storeProducts = products.filter((p: any) => p.storeId === s.id);
              const avgPrice = storeProducts.length > 0
                ? storeProducts.reduce((acc: number, p: any) => acc + Number(p.price || 0), 0) / storeProducts.length
                : null;
              return (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={getStoreIcon(s)}
                  eventHandlers={{ click: () => setSelected(s) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", minWidth: 220 }}>
                      <p className="font-bold text-sm" style={{ color: getZoneColor(s.lat, s.lng) }}>{s.name}</p>
                      <p className="text-xs text-muted-foreground mb-1">{s.address}</p>
                      {s.phone && <p className="text-xs text-muted-foreground">📞 {s.phone}</p>}
                      {s.open_hours && <p className="text-xs text-muted-foreground">🕐 {s.open_hours}</p>}
                      {dist !== null && (
                        <p className="text-xs mt-1 font-bold text-primary">
                          📍 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} de ti
                        </p>
                      )}
                      {storeProducts.length > 0 && (
                        <p className="text-xs mt-0.5 text-muted-foreground">
                          🛍 {storeProducts.length} productos
                          {avgPrice ? ` · $${Math.round(avgPrice).toLocaleString("es-CO")} promedio` : ""}
                        </p>
                      )}
                      {!s.active && <p className="text-xs text-destructive font-bold mt-1">⚠ Sucursal suspendida</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {ownStore?.lat && ownStore?.lng && (
              <Circle
                center={[ownStore.lat, ownStore.lng]}
                radius={600}
                pathOptions={{ color: "#f59e0b", fillColor: "#f59e0b", fillOpacity: 0.05, weight: 2, opacity: 0.4 }}
              />
            )}
          </MapContainer>

          {/* Node counter overlay */}
          <div
            className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2"
            style={{
              background: "hsl(var(--card) / 0.92)",
              border: "1px solid hsl(var(--border))",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-bold">{filtered.length}</span>
            <span className="text-muted-foreground">tiendas</span>
            {hasProductFilter && (
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                filtradas
              </span>
            )}
          </div>
        </div>

        {/* Store list below map */}
        {showWidgets && filtered.length > 0 && (
          <div style={{ background: "hsl(var(--card))", borderTop: "1px solid hsl(var(--border))" }}>
            <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 px-1 mb-2">
                {userPos ? "Ordenadas por distancia" : "Nodos de distribución"}
              </p>
              {filtered.map((s) => {
                const dist = distKm(s);
                const storeProds = products.filter((p: any) => p.storeId === s.id);
                const isSelected = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s)}
                    className="w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 hover:bg-muted/60"
                    style={{
                      background: isSelected ? "hsl(var(--primary) / 0.08)" : "transparent",
                      border: `1px solid ${isSelected ? "hsl(var(--primary) / 0.25)" : "transparent"}`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.active ? getZoneColor(s.lat, s.lng) : "#9ca3af" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold text-foreground truncate">{s.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{s.address}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      {dist !== null && (
                        <p className="font-mono text-[10px] font-bold text-primary">
                          {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                        </p>
                      )}
                      {storeProds.length > 0 && (
                        <p className="font-mono text-[9px] text-muted-foreground">{storeProds.length} prod.</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected store detail */}
            {selected && (
              <div className="mx-3 mb-3 p-3 rounded-xl"
                style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.18)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-mono font-bold text-foreground text-sm">{selected.name}</span>
                      {!selected.active && (
                        <span className="font-mono text-[9px] text-destructive border border-destructive/20 px-1.5 rounded">Suspendida</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 text-[10px] font-mono text-muted-foreground">
                      {selected.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />{selected.address}
                        </span>
                      )}
                      {selected.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-primary flex-shrink-0" />{selected.phone}
                        </span>
                      )}
                      {selected.open_hours && (
                        <span className="col-span-2 text-primary/70">🕐 {selected.open_hours}</span>
                      )}
                      {(() => {
                        const d = distKm(selected);
                        return d ? (
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <Navigation className="w-3 h-3 flex-shrink-0" />
                            {d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`} de distancia
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {selected.description && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 line-clamp-2">{selected.description}</p>
                    )}
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
