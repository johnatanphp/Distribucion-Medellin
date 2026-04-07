import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetStores, useGetProducts } from "@workspace/api-client-react";
import { useAuth } from "@/components/AuthProvider";
import {
  Store, Search, MapPin, Navigation, X,
  Activity, AlertCircle, Package,
  Layers, Filter, Phone, LocateFixed, LocateOff, ChevronDown,
} from "lucide-react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
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
  productCount?: number;
}

// ─── ZONAS DE MEDELLÍN ────────────────────────────────────────────────────────
const ZONES = [
  { key: "all", label: "Toda la Ciudad", color: "#00FFCC" },
  { key: "norte", label: "Norte", color: "#00BFFF" },
  { key: "centro", label: "Centro", color: "#FF9900" },
  { key: "occidente", label: "Occidente", color: "#A855F7" },
  { key: "sur", label: "Sur", color: "#22C55E" },
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
  return ZONES.find((z2) => z2.key === z)?.color ?? "#00FFCC";
}

// ─── ÍCONOS ───────────────────────────────────────────────────────────────────
function makeStoreIcon(color: string, size: number, pulse = false, isOwn = false) {
  const glow = isOwn ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 4px ${color})`;
  const ring = pulse
    ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5">
        <animate attributeName="r" values="14;20;14" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" style="filter:${glow}">
    ${ring}
    <circle cx="16" cy="16" r="10" fill="${color}" fill-opacity="${isOwn ? "0.25" : "0.15"}"/>
    <circle cx="16" cy="16" r="${isOwn ? 7 : 6}" fill="${color}" fill-opacity="0.85"/>
    <path d="M16 9 L22 14 L22 23 L10 23 L10 14 Z" fill="white" fill-opacity="0.9"/>
    <rect x="13" y="17" width="3" height="6" fill="${color}" rx="0.5"/>
    <rect x="16" y="17" width="3" height="6" fill="${color}" rx="0.5" opacity="0.4"/>
    <polyline points="10,14 16,9 22,14" fill="none" stroke="white" stroke-width="1.2" opacity="0.9"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2) - 4] });
}

function makeUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="14" fill="#00FFCC" fill-opacity="0.12">
      <animate attributeName="r" values="14;20;14" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.12;0;0.12" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="20" cy="20" r="8" fill="#00FFCC" fill-opacity="0.25"/>
    <circle cx="20" cy="20" r="5" fill="#00FFCC"/>
    <circle cx="20" cy="20" r="2.5" fill="white"/>
    <line x1="20" y1="4" x2="20" y2="10" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="20" y1="30" x2="20" y2="36" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="4" y1="20" x2="10" y2="20" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="30" y1="20" x2="36" y2="20" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [40, 40], iconAnchor: [20, 20] });
}

// ─── AUTO-PAN AL USUARIO ──────────────────────────────────────────────────────
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
    map.fitBounds(L.latLngBounds(pts).pad(0.18));
    fitted.current = true;
  }, [stores, map]);
  return null;
}

// ─── DISTANCIA HAVERSINE ──────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── TIPOS DE PROPS ───────────────────────────────────────────────────────────
interface Props {
  height?: string;
  showWidgets?: boolean;
  compact?: boolean;
}

export default function StoreMapWidget({ height = "480px", showWidgets = true, compact = false }: Props) {
  const { user } = useAuth();
  const role = user?.role ?? "customer";

  const { data: storesRaw = [] } = useGetStores();
  const stores: StoreItem[] = (storesRaw as StoreItem[]).filter((s) => s.active);

  const { data: productsRaw = [] } = useGetProducts({});
  const products = productsRaw as any[];

  // ── Estado de filtros ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [showInactive, setShowInactive] = useState(role === "superadmin");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Categorías disponibles ─────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p: any) => p.category).filter(Boolean)));
    return ["all", ...cats];
  }, [products]);

  // ── IDs de tiendas que cumplen filtros de producto ─────────────────────────
  const storeIdsMatchingProduct = useMemo(() => {
    if (filterCategory === "all" && !maxPrice) return null; // sin filtro de producto
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

  // ── Filtrar tiendas ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return stores
      .filter((s) => {
        const matchZone = zone === "all" || getZone(s.lat, s.lng) === zone;
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.address || "").toLowerCase().includes(search.toLowerCase());
        const matchActive = showInactive || s.active;
        const matchProduct = !storeIdsMatchingProduct || storeIdsMatchingProduct.has(s.id);
        return matchZone && matchSearch && matchActive && matchProduct;
      })
      .sort((a, b) => {
        if (!userPos) return 0;
        const da = a.lat && a.lng ? haversine(userPos.lat, userPos.lng, a.lat, a.lng) : 999;
        const db = b.lat && b.lng ? haversine(userPos.lat, userPos.lng, b.lat, b.lng) : 999;
        return da - db;
      });
  }, [stores, zone, search, showInactive, storeIdsMatchingProduct, userPos]);

  // ── Solicitar ubicación automáticamente ───────────────────────────────────
  const requestLocation = () => {
    if (!navigator.geolocation) { setLocStatus("denied"); return; }
    setLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("granted");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const distKm = (s: StoreItem) => {
    if (!userPos || !s.lat || !s.lng) return null;
    return haversine(userPos.lat, userPos.lng, s.lat, s.lng);
  };

  const getStoreIcon = (s: StoreItem) => {
    const isOwn = role === "store" && s.id === user?.storeId;
    const color = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
    const size = isOwn ? 40 : s.active ? 32 : 24;
    const pulse = s.active && (isOwn || role !== "store");
    return makeStoreIcon(color, size, pulse, isOwn);
  };

  const ownStore = role === "store" ? stores.find((s) => s.id === user?.storeId) : null;
  const totalActive = stores.filter((s) => s.active).length;
  const zonesWithStores = new Set(stores.filter((s) => s.active).map((s) => getZone(s.lat, s.lng))).size;
  const hasProductFilter = filterCategory !== "all" || !!maxPrice;

  return (
    <div className="flex flex-col gap-4">
      {/* ── STATS (solo superadmin/store) ──────────────────────── */}
      {showWidgets && !compact && role !== "customer" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Store className="w-4 h-4" />} label="Tiendas activas" value={totalActive} color="#00FFCC" />
          <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Zonas cubiertas" value={zonesWithStores} color="#A855F7" />
          <StatCard icon={<Package className="w-4 h-4" />} label="En el mapa" value={filtered.length} color="#FF9900" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Productos" value={products.length} color="#22C55E" />
        </div>
      )}

      {/* ── BANNER UBICACIÓN ───────────────────────────────────── */}
      {locStatus === "idle" || locStatus === "requesting" ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(0,255,204,0.08)", border: "1px solid rgba(0,255,204,0.2)" }}>
          <LocateFixed className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-primary flex-1">
            {locStatus === "requesting" ? "Obteniendo tu ubicación..." : "Solicitando permisos de ubicación..."}
          </span>
        </div>
      ) : locStatus === "denied" ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
          <LocateOff className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-mono text-xs text-red-400 flex-1">Ubicación no disponible — distancias desactivadas</span>
          <button onClick={requestLocation} className="font-mono text-[10px] px-2 py-1 rounded-lg text-primary border border-primary/30 hover:bg-primary/10 transition-all">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.15)" }}>
          <LocateFixed className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-mono text-xs text-primary flex-1">Ubicación activa — mostrando tiendas más cercanas primero</span>
          {filtered.length > 0 && filtered[0].lat && filtered[0].lng && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Más cercana: {(() => { const d = distKm(filtered[0]); return d ? (d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`) : "–"; })()}
            </span>
          )}
        </div>
      )}

      {/* ── PANEL DE FILTROS ───────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Barra principal de búsqueda */}
        <div className="flex flex-col gap-2 p-3">
          <div className="flex gap-2">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tienda o dirección…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-muted-foreground outline-none focus:border-primary/40"
              />
            </div>
            {/* Botón filtros de producto */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wide transition-all flex-shrink-0"
              style={{
                background: hasProductFilter ? "rgba(0,255,204,0.12)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${hasProductFilter ? "rgba(0,255,204,0.4)" : "rgba(255,255,255,0.1)"}`,
                color: hasProductFilter ? "#00FFCC" : "#aaa",
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              {hasProductFilter ? "Filtros activos" : "Filtros"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filtros expandibles de producto/precio */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/5">
              {/* Categoría */}
              <div className="flex-1">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Categoría de producto</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-primary/40"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0e1a]">
                      {cat === "all" ? "Todas las categorías" : cat}
                    </option>
                  ))}
                </select>
              </div>
              {/* Precio máximo */}
              <div className="w-full sm:w-40">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Precio máximo</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-primary/60 font-mono text-xs">$</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Sin límite"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              {/* Limpiar filtros */}
              {hasProductFilter && (
                <button
                  onClick={() => { setFilterCategory("all"); setMaxPrice(""); }}
                  className="self-end px-3 py-2 rounded-xl text-[10px] font-mono text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
                >
                  Limpiar
                </button>
              )}
            </div>
          )}

          {/* Pills de zona */}
          <div className="flex gap-1.5 flex-wrap">
            {ZONES.map((z) => (
              <button
                key={z.key}
                onClick={() => setZone(z.key)}
                className="px-3 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  background: zone === z.key ? z.color + "25" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${zone === z.key ? z.color + "60" : "rgba(255,255,255,0.08)"}`,
                  color: zone === z.key ? z.color : "#aaa",
                }}
              >
                {z.label}
              </button>
            ))}
            {role === "superadmin" && (
              <button
                onClick={() => setShowInactive((v) => !v)}
                className="flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  background: showInactive ? "rgba(255,68,68,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${showInactive ? "rgba(255,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: showInactive ? "#FF6666" : "#aaa",
                }}
              >
                <Filter className="w-3 h-3" /> {showInactive ? "Mostrando inactivas" : "Ver inactivas"}
              </button>
            )}
          </div>
        </div>

        {/* ── MAPA ──────────────────────────────────────────────── */}
        <div style={{ height, position: "relative" }}>
          <MapContainer
            center={[6.2442, -75.5812]}
            zoom={12}
            style={{ height: "100%", width: "100%", background: "#0A0E1A" }}
            zoomControl={false}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={20}
            />
            <ZoomControl position="bottomright" />

            {/* Auto-pan a ubicación del usuario */}
            <PanToUser pos={userPos} />

            {/* Si no hay ubicación, ajusta bounds a las tiendas */}
            {!userPos && <FitBoundsToStores stores={filtered.length ? filtered : stores} />}

            {/* Marcador de usuario con radio de proximidad */}
            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", color: "#fff" }}>
                      <span className="font-bold" style={{ color: "#00FFCC" }}>📍 Tu ubicación</span>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={1500}
                  pathOptions={{ color: "#00FFCC", fillColor: "#00FFCC", fillOpacity: 0.04, weight: 1, opacity: 0.2 }}
                />
              </>
            )}

            {/* Marcadores de tiendas */}
            {filtered.map((s) => {
              if (!s.lat || !s.lng) return null;
              const isOwn = role === "store" && s.id === user?.storeId;
              const zoneColor = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
              const dist = distKm(s);
              const storeProducts = products.filter((p: any) => p.storeId === s.id);
              const avgPrice = storeProducts.length > 0
                ? storeProducts.reduce((acc: number, p: any) => acc + (p.price || 0), 0) / storeProducts.length
                : null;
              return (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={getStoreIcon(s)}
                  eventHandlers={{ click: () => setSelected(s) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", minWidth: 210, color: "#fff", background: "transparent" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: zoneColor, boxShadow: `0 0 6px ${zoneColor}` }} />
                        <span className="font-bold text-sm" style={{ color: zoneColor }}>{s.name}</span>
                      </div>
                      <p className="text-xs opacity-70 mb-1">{s.address}</p>
                      {s.phone && <p className="text-xs opacity-60">📞 {s.phone}</p>}
                      {dist !== null && (
                        <p className="text-xs mt-1 font-bold" style={{ color: "#00FFCC" }}>
                          📍 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} de ti
                        </p>
                      )}
                      {storeProducts.length > 0 && (
                        <p className="text-xs mt-1 opacity-70">
                          🛍 {storeProducts.length} producto{storeProducts.length !== 1 ? "s" : ""}
                          {avgPrice ? ` · $${Math.round(avgPrice).toLocaleString("es-CO")} promedio` : ""}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Radio tienda propia (store owner) */}
            {ownStore?.lat && ownStore?.lng && (
              <Circle
                center={[ownStore.lat, ownStore.lng]}
                radius={800}
                pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.06, weight: 1.5, opacity: 0.5 }}
              />
            )}
          </MapContainer>

          {/* Badge flotante conteo */}
          <div className="absolute top-3 left-3 z-[1000] pointer-events-none flex gap-2">
            <div className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold" style={{ background: "rgba(10,14,26,0.92)", border: "1px solid rgba(0,255,204,0.3)", color: "#00FFCC", backdropFilter: "blur(12px)" }}>
              {filtered.length} tienda{filtered.length !== 1 ? "s" : ""} {hasProductFilter ? "· filtradas" : "· " + (zone === "all" ? "Medellín" : ZONES.find((z) => z.key === zone)?.label)}
            </div>
          </div>

          {/* Leyenda zonas */}
          {!compact && (
            <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1 pointer-events-none">
              {ZONES.slice(1).map((z) => (
                <div key={z.key} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-mono" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: z.color, boxShadow: `0 0 4px ${z.color}` }} />
                  <span style={{ color: z.color }}>{z.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LISTA DE TIENDAS CERCANAS ───────────────────────────── */}
      {!compact && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              {userPos ? "Tiendas más cercanas" : "Puntos de distribución"}
            </h2>
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">{filtered.length} disponibles</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s, idx) => {
              const isOwn = role === "store" && s.id === user?.storeId;
              const zoneColor = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
              const dist = distKm(s);
              const zoneName = ZONES.find((z) => z.key === getZone(s.lat, s.lng))?.label ?? "Centro";
              const storeProducts = products.filter((p: any) => p.storeId === s.id);
              const matchedProducts = storeProducts.filter((p: any) => {
                const catOk = filterCategory === "all" || p.category === filterCategory;
                const priceOk = !maxPrice || (p.price != null && p.price <= Number(maxPrice));
                return catOk && priceOk;
              });
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01] relative"
                  style={{
                    background: isOwn ? "rgba(255,215,0,0.06)" : "rgba(10,14,26,0.85)",
                    border: `1px solid ${selected?.id === s.id ? zoneColor + "60" : isOwn ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.07)"}`,
                    boxShadow: selected?.id === s.id ? `0 0 16px ${zoneColor}20` : "none",
                  }}
                >
                  {/* Badge de distancia */}
                  {userPos && dist !== null && idx < 3 && (
                    <div className="absolute top-3 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: zoneColor + "20", color: zoneColor, border: `1px solid ${zoneColor}40` }}>
                      #{idx + 1} más cerca
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: zoneColor + "18", border: `1px solid ${zoneColor}30` }}>
                      <Store className="w-4 h-4" style={{ color: zoneColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-white leading-tight truncate pr-16">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{zoneName}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-2 line-clamp-1">{s.address}</p>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground flex-wrap">
                    {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                    {storeProducts.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {hasProductFilter ? `${matchedProducts.length}/${storeProducts.length}` : storeProducts.length} productos
                      </span>
                    )}
                    {dist !== null && (
                      <span className="flex items-center gap-1 ml-auto font-bold" style={{ color: zoneColor }}>
                        <Navigation className="w-3 h-3" />
                        {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-white/10">
                <Package className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-3" />
                <p className="font-mono text-muted-foreground text-sm">Sin tiendas para estos filtros</p>
                <button
                  onClick={() => { setZone("all"); setFilterCategory("all"); setMaxPrice(""); setSearch(""); }}
                  className="mt-2 font-mono text-xs text-primary hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PANEL DETALLE TIENDA SELECCIONADA ─────────────────── */}
      {selected && (
        <div
          className="fixed inset-x-4 bottom-4 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-80 z-[1001] rounded-2xl p-5"
          style={{ background: "rgba(10,14,26,0.97)", border: `1px solid ${getZoneColor(selected.lat, selected.lng)}40`, boxShadow: `0 0 32px ${getZoneColor(selected.lat, selected.lng)}18`, backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: getZoneColor(selected.lat, selected.lng) + "18", border: `1px solid ${getZoneColor(selected.lat, selected.lng)}30` }}>
                <Store className="w-4 h-4" style={{ color: getZoneColor(selected.lat, selected.lng) }} />
              </div>
              <div>
                <p className="font-mono text-sm font-bold text-white leading-tight">{selected.name}</p>
                <p className="text-[10px] font-mono" style={{ color: getZoneColor(selected.lat, selected.lng) }}>
                  {ZONES.find((z) => z.key === getZone(selected.lat, selected.lng))?.label}
                </p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground mb-3 leading-relaxed">{selected.description ?? selected.address}</p>
          <div className="space-y-1.5 mb-3">
            <DetailRow icon={<MapPin className="w-3 h-3" />} text={selected.address} />
            {selected.phone && <DetailRow icon={<Phone className="w-3 h-3" />} text={selected.phone} />}
            {(() => {
              const d = distKm(selected);
              return d !== null ? (
                <DetailRow icon={<Navigation className="w-3 h-3" />} text={d < 1 ? `${Math.round(d * 1000)} metros de tu ubicación` : `${d.toFixed(2)} km de tu ubicación`} color={getZoneColor(selected.lat, selected.lng)} />
              ) : null;
            })()}
            {(() => {
              const sp = products.filter((p: any) => p.storeId === selected.id);
              const mp = sp.filter((p: any) => {
                const catOk = filterCategory === "all" || p.category === filterCategory;
                const priceOk = !maxPrice || (p.price != null && p.price <= Number(maxPrice));
                return catOk && priceOk;
              });
              return sp.length > 0 ? (
                <DetailRow icon={<Package className="w-3 h-3" />} text={hasProductFilter ? `${mp.length} de ${sp.length} productos coinciden` : `${sp.length} productos disponibles`} color={hasProductFilter ? "#00FFCC" : undefined} />
              ) : null;
            })()}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-3 py-1 rounded-full font-mono font-bold" style={{ background: selected.active ? "rgba(0,255,100,0.12)" : "rgba(255,68,68,0.12)", color: selected.active ? "#00CC55" : "#FF5555" }}>
              {selected.active ? "● Tienda Activa" : "○ Inactiva"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUBCOMPONENTES ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15", border: `1px solid ${color}30` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="font-mono text-xl font-bold text-white leading-none">{value}</p>
        <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function DetailRow({ icon, text, color }: { icon: React.ReactNode; text: string; color?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground mt-0.5 flex-shrink-0" style={color ? { color } : {}}>{icon}</span>
      <span className="font-mono text-[11px]" style={color ? { color } : { color: "#ccc" }}>{text}</span>
    </div>
  );
}
