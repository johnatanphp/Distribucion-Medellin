import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetStores, useGetProducts } from "@workspace/api-client-react";
import { useAuth } from "@/components/AuthProvider";
import { useGeo } from "@/contexts/GeoContext";
import {
  Store, Search, MapPin, Navigation, X,
  Activity, AlertCircle, Package,
  Layers, Filter, Phone, LocateFixed, LocateOff, ChevronDown,
  Map as MapIcon, Satellite, Route, ExternalLink, Target, RefreshCw,
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
  productCount?: number;
}

const ZONES = [
  { key: "all", label: "Toda la Ciudad", color: "#00FFCC" },
  { key: "norte", label: "Norte", color: "#00BFFF" },
  { key: "centro", label: "Centro", color: "#FF9900" },
  { key: "occidente", label: "Occidente", color: "#A855F7" },
  { key: "sur", label: "Sur", color: "#22C55E" },
];

const TILE_LAYERS = {
  dark: {
    label: "Oscuro",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
  },
  streets: {
    label: "Calles",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: "abc",
  },
  topo: {
    label: "Mapa",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
  },
};

type TileKey = keyof typeof TILE_LAYERS;

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

function makeUserIcon(heading?: number | null) {
  const rotate = heading != null ? `transform="rotate(${heading}, 20, 20)"` : "";
  const arrow = heading != null
    ? `<polygon points="20,4 23,12 20,10 17,12" fill="#00FFCC" opacity="0.9" ${rotate}/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="18" fill="#00FFCC" fill-opacity="0.08">
      <animate attributeName="r" values="18;26;18" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.08;0;0.08" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="22" r="10" fill="#00FFCC" fill-opacity="0.2"/>
    <circle cx="22" cy="22" r="6" fill="#00FFCC"/>
    <circle cx="22" cy="22" r="3" fill="white"/>
    ${arrow}
    <line x1="22" y1="4" x2="22" y2="10" stroke="#00FFCC" stroke-width="1.5" opacity="0.4"/>
    <line x1="22" y1="34" x2="22" y2="40" stroke="#00FFCC" stroke-width="1.5" opacity="0.4"/>
    <line x1="4" y1="22" x2="10" y2="22" stroke="#00FFCC" stroke-width="1.5" opacity="0.4"/>
    <line x1="34" y1="22" x2="40" y2="22" stroke="#00FFCC" stroke-width="1.5" opacity="0.4"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
}

function CenterControl({ userPos, tileKey, setTileKey }: {
  userPos: { lat: number; lng: number } | null;
  tileKey: TileKey;
  setTileKey: (k: TileKey) => void;
}) {
  const map = useMap();

  const flyToUser = useCallback(() => {
    if (userPos) {
      map.flyTo([userPos.lat, userPos.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [map, userPos]);

  return (
    <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-2">
      {userPos && (
        <button
          onClick={flyToUser}
          title="Centrar en mi ubicación"
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-105"
          style={{ background: "rgba(0,255,204,0.15)", border: "1.5px solid rgba(0,255,204,0.5)", backdropFilter: "blur(10px)" }}
        >
          <Target className="w-4 h-4 text-primary" />
        </button>
      )}
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}
      >
        {(Object.keys(TILE_LAYERS) as TileKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTileKey(k)}
            title={TILE_LAYERS[k].label}
            className="w-10 h-8 flex items-center justify-center text-[9px] font-mono uppercase tracking-wide transition-all"
            style={{
              background: tileKey === k ? "rgba(0,255,204,0.2)" : "rgba(10,14,26,0.85)",
              color: tileKey === k ? "#00FFCC" : "#888",
              borderBottom: k !== "topo" ? "1px solid rgba(255,255,255,0.07)" : undefined,
            }}
          >
            {k === "dark" ? <MapIcon className="w-3.5 h-3.5" /> : k === "streets" ? <Route className="w-3.5 h-3.5" /> : <Satellite className="w-3.5 h-3.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanToUser({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  const pannedRef = useRef(false);
  useEffect(() => {
    if (pos && !pannedRef.current) {
      map.flyTo([pos.lat, pos.lng], 15, { animate: true, duration: 1.5 });
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
    map.fitBounds(L.latLngBounds(pts).pad(0.2));
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

function formatDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function openGoogleMaps(lat: number, lng: number, fromLat?: number, fromLng?: number) {
  const dest = `${lat},${lng}`;
  const url = fromLat && fromLng
    ? `https://www.google.com/maps/dir/${fromLat},${fromLng}/${dest}`
    : `https://www.google.com/maps/search/?api=1&query=${dest}`;
  window.open(url, "_blank");
}

function openWaze(lat: number, lng: number) {
  window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank");
}

function NominatimSearch({ onResult }: { onResult: (lat: number, lng: number, label: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ lat: string; lon: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", Medellín, Colombia")}&format=json&limit=5&countrycodes=co`;
        const res = await fetch(url, { headers: { "Accept-Language": "es" } });
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 600);
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Buscar dirección en Medellín…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-muted-foreground outline-none focus:border-primary/40 transition-all"
          />
          {loading && (
            <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/60 animate-spin" />
          )}
        </div>
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="px-2 rounded-xl text-muted-foreground hover:text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1 w-full rounded-xl overflow-hidden z-[2000] shadow-2xl"
          style={{ background: "rgba(10,14,26,0.97)", border: "1px solid rgba(0,255,204,0.2)" }}
        >
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                onResult(Number(r.lat), Number(r.lon), r.display_name);
                setQuery(r.display_name.split(",").slice(0, 2).join(","));
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-primary/10 transition-all border-b border-white/5 last:border-0"
            >
              <MapPin className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
              <span className="font-mono text-[10px] text-white/80 leading-relaxed">{r.display_name.split(",").slice(0, 3).join(", ")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchLocationMarker({ pos, label }: { pos: [number, number] | null; label: string }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { animate: true, duration: 1.2 });
  }, [pos, map]);
  if (!pos) return null;
  const icon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0 C6.3 0 0 6.3 0 14 C0 24.5 14 36 14 36 C14 36 28 24.5 28 14 C28 6.3 21.7 0 14 0 Z" fill="#FF9900" fill-opacity="0.9"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
      <circle cx="14" cy="14" r="3" fill="#FF9900"/>
    </svg>`,
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
  return (
    <Marker position={pos} icon={icon}>
      <Popup>
        <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#FF9900" }}>
          📍 {label.split(",").slice(0, 2).join(", ")}
        </div>
      </Popup>
    </Marker>
  );
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
  const [showInactive, setShowInactive] = useState(role === "superadmin");
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice);
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [showFilters, setShowFilters] = useState(false);
  const [tileKey, setTileKey] = useState<TileKey>("dark");
  const [searchPos, setSearchPos] = useState<[number, number] | null>(null);
  const [searchLabel, setSearchLabel] = useState("");

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
  const tile = TILE_LAYERS[tileKey];

  const handleNominatimResult = (lat: number, lng: number, label: string) => {
    setSearchPos([lat, lng]);
    setSearchLabel(label);
  };

  return (
    <div className="flex flex-col gap-4">
      {showWidgets && !compact && role !== "customer" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Store className="w-4 h-4" />} label="Tiendas activas" value={totalActive} color="#00FFCC" />
          <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Zonas cubiertas" value={zonesWithStores} color="#A855F7" />
          <StatCard icon={<Package className="w-4 h-4" />} label="En el mapa" value={filtered.length} color="#FF9900" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Productos" value={products.length} color="#22C55E" />
        </div>
      )}

      {/* GPS Status Banner */}
      {locStatus === "idle" || locStatus === "requesting" ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(0,255,204,0.08)", border: "1px solid rgba(0,255,204,0.2)" }}>
          <LocateFixed className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
          <span className="font-mono text-xs text-primary flex-1">
            {locStatus === "requesting" ? "Obteniendo tu ubicación GPS en tiempo real..." : "Iniciando GPS..."}
          </span>
        </div>
      ) : locStatus === "denied" ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
          <LocateOff className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-mono text-xs text-red-400 flex-1">Ubicación no disponible — distancias desactivadas</span>
          <button onClick={requestLocation} className="font-mono text-[10px] px-2 py-1 rounded-lg text-primary border border-primary/30 hover:bg-primary/10 transition-all flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.15)" }}>
          <LocateFixed className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-mono text-xs text-primary flex-1">
            GPS activo · seguimiento en tiempo real
            {userPos?.accuracy && <span className="text-muted-foreground ml-2">± {Math.round(userPos.accuracy)}m</span>}
          </span>
          {filtered.length > 0 && filtered[0].lat && filtered[0].lng && (
            <span className="font-mono text-[10px] text-muted-foreground">
              Más cercana: {(() => { const d = distKm(filtered[0]); return d ? formatDist(d) : "–"; })()}
            </span>
          )}
        </div>
      )}

      {/* Filter Panel */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex flex-col gap-2 p-3">
          {/* Nominatim address search */}
          <NominatimSearch onResult={handleNominatimResult} />

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nombre de tienda…"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-muted-foreground outline-none focus:border-primary/40"
              />
            </div>
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
              {hasProductFilter ? "Activos" : "Filtros"}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-white/5">
              <div className="flex-1">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Categoría</label>
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
              <div className="w-full sm:w-44">
                <label className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Precio máximo (COP)</label>
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
              {hasProductFilter && (
                <button
                  onClick={() => { setFilterCategory("all"); setMaxPrice(""); }}
                  className="self-end px-3 py-2 rounded-xl text-[10px] font-mono text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-all"
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

        {/* MAP */}
        <div style={{ height, position: "relative" }}>
          <MapContainer
            center={[6.2442, -75.5812]}
            zoom={12}
            style={{ height: "100%", width: "100%", background: "#0A0E1A" }}
            zoomControl={false}
            scrollWheelZoom
          >
            <TileLayer
              key={tileKey}
              attribution={tile.attribution}
              url={tile.url}
              subdomains={tile.subdomains as any}
              maxZoom={20}
            />
            <ZoomControl position="bottomright" />
            <CenterControl userPos={userPos} tileKey={tileKey} setTileKey={setTileKey} />

            <PanToUser pos={userPos} />
            {!userPos && <FitBoundsToStores stores={filtered.length ? filtered : stores} />}

            {searchPos && <SearchLocationMarker pos={searchPos} label={searchLabel} />}

            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon(userPos.heading)} zIndexOffset={1000}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", color: "#fff", minWidth: 160 }}>
                      <p className="font-bold mb-1" style={{ color: "#00FFCC" }}>📍 Tu ubicación actual</p>
                      <p className="text-xs opacity-60">
                        {userPos.lat.toFixed(6)}, {userPos.lng.toFixed(6)}
                      </p>
                      {userPos.accuracy && (
                        <p className="text-xs opacity-50">Precisión: ±{Math.round(userPos.accuracy)}m</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
                {userPos.accuracy && userPos.accuracy < 5000 && (
                  <Circle
                    center={[userPos.lat, userPos.lng]}
                    radius={userPos.accuracy}
                    pathOptions={{ color: "#00FFCC", fillColor: "#00FFCC", fillOpacity: 0.05, weight: 1, opacity: 0.3, dashArray: "4 4" }}
                  />
                )}
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={1500}
                  pathOptions={{ color: "#00FFCC", fillColor: "#00FFCC", fillOpacity: 0.03, weight: 1, opacity: 0.15 }}
                />
              </>
            )}

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
                  <Popup maxWidth={260}>
                    <div style={{ fontFamily: "monospace", minWidth: 220, color: "#fff", background: "transparent" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: zoneColor, boxShadow: `0 0 6px ${zoneColor}` }} />
                        <span className="font-bold text-sm" style={{ color: zoneColor }}>{s.name}</span>
                        {isOwn && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700" }}>MI TIENDA</span>}
                      </div>
                      {s.description && <p className="text-[10px] opacity-60 mb-1 leading-relaxed">{s.description}</p>}
                      <p className="text-xs opacity-70 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{s.address}</p>
                      {s.phone && (
                        <p className="text-xs opacity-60 flex items-center gap-1 mb-2">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <a href={`tel:${s.phone}`} style={{ color: zoneColor }}>{s.phone}</a>
                        </p>
                      )}
                      {dist !== null && (
                        <p className="text-xs mb-1 font-bold flex items-center gap-1" style={{ color: "#00FFCC" }}>
                          <Navigation className="w-3 h-3" /> {formatDist(dist)} de ti
                        </p>
                      )}
                      {storeProducts.length > 0 && (
                        <p className="text-xs mb-2 opacity-60">
                          🛍 {storeProducts.length} producto{storeProducts.length !== 1 ? "s" : ""}
                          {avgPrice ? ` · $${Math.round(avgPrice).toLocaleString("es-CO")} prom.` : ""}
                        </p>
                      )}
                      <div className="flex gap-1.5 mt-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => openGoogleMaps(s.lat!, s.lng!, userPos?.lat, userPos?.lng)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-mono transition-all"
                          style={{ background: "rgba(66,133,244,0.2)", border: "1px solid rgba(66,133,244,0.4)", color: "#4285F4" }}
                        >
                          <ExternalLink className="w-3 h-3" /> Google Maps
                        </button>
                        <button
                          onClick={() => openWaze(s.lat!, s.lng!)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-mono transition-all"
                          style={{ background: "rgba(0,211,164,0.2)", border: "1px solid rgba(0,211,164,0.4)", color: "#00D3A4" }}
                        >
                          <Route className="w-3 h-3" /> Waze
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {ownStore?.lat && ownStore?.lng && (
              <Circle
                center={[ownStore.lat, ownStore.lng]}
                radius={800}
                pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.06, weight: 1.5, opacity: 0.5 }}
              />
            )}
          </MapContainer>

          {/* Floating counter + tile label */}
          <div
            className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-xl font-mono text-xs flex items-center gap-2"
            style={{ background: "rgba(10,14,26,0.9)", border: "1px solid rgba(0,255,204,0.2)", backdropFilter: "blur(8px)" }}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary font-bold">{filtered.length}</span>
            <span className="text-muted-foreground">nodos</span>
            <span className="text-[9px] text-muted-foreground/40 ml-1">{TILE_LAYERS[tileKey].label}</span>
            {hasProductFilter && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,204,0.15)", color: "#00FFCC" }}>
                filtrados
              </span>
            )}
          </div>
        </div>

        {/* Store list below map */}
        {showWidgets && filtered.length > 0 && (
          <div className="border-t border-white/5">
            <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
              <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
                {userPos ? "Tiendas ordenadas por distancia" : "Nodos de distribución"}
              </p>
              {filtered.map((s) => {
                const dist = distKm(s);
                const storeProds = products.filter((p: any) => p.storeId === s.id);
                const isSelected = selected?.id === s.id;
                const zoneColor = getZoneColor(s.lat, s.lng);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s)}
                    className="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-3"
                    style={{
                      background: isSelected ? "rgba(0,255,204,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? "rgba(0,255,204,0.3)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: zoneColor, boxShadow: `0 0 4px ${zoneColor}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-bold text-white truncate">{s.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{s.address}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-0.5">
                      {dist !== null && (
                        <p className="font-mono text-[10px] font-bold" style={{ color: "#00FFCC" }}>
                          {formatDist(dist)}
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
              <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.2)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="font-mono text-sm font-bold text-white truncate">{selected.name}</p>
                    </div>
                    {selected.description && (
                      <p className="font-mono text-[10px] text-muted-foreground mb-1 leading-relaxed">{selected.description}</p>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />{selected.address}
                    </p>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="font-mono text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#00FFCC" }}>
                        <Phone className="w-3 h-3 flex-shrink-0" />{selected.phone}
                      </a>
                    )}
                    {selected.lat && selected.lng && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openGoogleMaps(selected.lat!, selected.lng!, userPos?.lat, userPos?.lng)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all"
                          style={{ background: "rgba(66,133,244,0.15)", border: "1px solid rgba(66,133,244,0.3)", color: "#4285F4" }}
                        >
                          <ExternalLink className="w-3 h-3" /> Google Maps
                        </button>
                        <button
                          onClick={() => openWaze(selected.lat!, selected.lng!)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all"
                          style={{ background: "rgba(0,211,164,0.15)", border: "1px solid rgba(0,211,164,0.3)", color: "#00D3A4" }}
                        >
                          <Route className="w-3 h-3" /> Waze
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {distKm(selected) !== null && (
                      <p className="font-mono text-sm font-bold" style={{ color: "#00FFCC" }}>{formatDist(distKm(selected)!)}</p>
                    )}
                    <button onClick={() => setSelected(null)} className="mt-1 text-muted-foreground hover:text-white transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div>
        <p className="font-mono text-lg font-bold leading-none" style={{ color }}>{value}</p>
        <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}
