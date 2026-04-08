import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeo } from "@/contexts/GeoContext";
import { useAuth } from "@/components/AuthProvider";
import { useGetStores, useGetProducts } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  LocateFixed, LocateOff, Store, MapPin, Phone, Package,
  ShoppingBag, Search, ChevronRight, Navigation, Filter, X,
  Layers, RefreshCw, Star, ArrowRight,
} from "lucide-react";

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

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function makeStoreIcon(color: string, size = 32, pulse = true) {
  const ring = pulse
    ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5">
        <animate attributeName="r" values="14;22;14" dur="2.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.2s" repeatCount="indefinite"/>
       </circle>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" style="filter:drop-shadow(0 0 6px ${color})">
    ${ring}
    <circle cx="16" cy="16" r="11" fill="${color}" fill-opacity="0.18"/>
    <circle cx="16" cy="16" r="7" fill="${color}" fill-opacity="0.9"/>
    <path d="M16 9.5 L21 13.5 L21 22 L11 22 L11 13.5 Z" fill="white" fill-opacity="0.95"/>
    <rect x="13" y="16.5" width="2.5" height="5.5" fill="${color}" rx="0.4"/>
    <rect x="16.5" y="16.5" width="2.5" height="5.5" fill="${color}" rx="0.4" opacity="0.4"/>
    <polyline points="11,13.5 16,9.5 21,13.5" fill="none" stroke="white" stroke-width="1.2" opacity="0.9"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

function makeUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="16" fill="#00FFCC" fill-opacity="0.1">
      <animate attributeName="r" values="16;26;16" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="22" r="9" fill="#00FFCC" fill-opacity="0.25"/>
    <circle cx="22" cy="22" r="6" fill="#00FFCC"/>
    <circle cx="22" cy="22" r="3" fill="white"/>
    <line x1="22" y1="4" x2="22" y2="11" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="22" y1="33" x2="22" y2="40" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="4" y1="22" x2="11" y2="22" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
    <line x1="33" y1="22" x2="40" y2="22" stroke="#00FFCC" stroke-width="1.5" opacity="0.5"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
}

function PanToUser({ pos }: { pos: { lat: number; lng: number } | null }) {
  const map = useMap();
  const pannedRef = useRef(false);
  useEffect(() => {
    if (pos && !pannedRef.current) {
      map.setView([pos.lat, pos.lng], 14, { animate: true, duration: 1.2 });
      pannedRef.current = true;
    }
  }, [pos, map]);
  return null;
}

function FitBoundsToStores({ stores }: { stores: any[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    const pts = stores.filter((s) => s.lat && s.lng).map((s) => [s.lat, s.lng] as [number, number]);
    if (pts.length < 2) {
      map.setView([6.2442, -75.5812], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(pts).pad(0.18));
    fitted.current = true;
  }, [stores, map]);
  return null;
}

function FocusStore({ store }: { store: any | null }) {
  const map = useMap();
  useEffect(() => {
    if (store?.lat && store?.lng) {
      map.setView([store.lat, store.lng], 16, { animate: true, duration: 0.8 });
    }
  }, [store, map]);
  return null;
}

export default function CustomerHome() {
  const { position: userPos, status: locStatus, retry: requestLocation } = useGeo();
  const { data: storesRaw = [] } = useGetStores();
  const { data: productsRaw = [] } = useGetProducts({});
  const { user } = useAuth();

  const stores = (storesRaw as any[]).filter((s) => s.active && s.lat && s.lng);
  const products = productsRaw as any[];

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [showList, setShowList] = useState(true);

  const distKm = (s: any) => {
    if (!userPos || !s.lat || !s.lng) return null;
    return haversine(userPos.lat, userPos.lng, s.lat, s.lng);
  };

  const filtered = useMemo(() => {
    return stores
      .filter((s) => {
        const matchZone = zone === "all" || getZone(s.lat, s.lng) === zone;
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.address || "").toLowerCase().includes(search.toLowerCase());
        return matchZone && matchSearch;
      })
      .sort((a, b) => {
        if (!userPos) return 0;
        const da = distKm(a) ?? 999;
        const db = distKm(b) ?? 999;
        return da - db;
      });
  }, [stores, zone, search, userPos]);

  const storeProducts = (storeId: number) =>
    products.filter((p: any) => p.storeId === storeId);

  const formatDist = (km: number | null) => {
    if (km === null) return null;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#050810]" style={{ fontFamily: "monospace" }}>
      {/* ── HEADER ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "rgba(5,8,16,0.95)", borderColor: "rgba(0,255,204,0.12)", backdropFilter: "blur(12px)", zIndex: 20 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)" }}
            >
              <Navigation className="w-3.5 h-3.5" style={{ color: "#00FFCC" }} />
            </div>
            <span className="font-black text-white tracking-widest text-sm">DISTRIMED</span>
          </div>
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide"
            style={{ background: "rgba(0,255,204,0.08)", border: "1px solid rgba(0,255,204,0.2)", color: "#00FFCC" }}
          >
            <MapPin className="w-3 h-3" />
            Medellín
          </div>
        </div>

        <div className="flex items-center gap-2">
          {locStatus === "granted" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
              style={{ background: "rgba(0,255,204,0.08)", border: "1px solid rgba(0,255,204,0.25)", color: "#00FFCC" }}>
              <LocateFixed className="w-3 h-3" />
              <span className="hidden sm:inline">GPS Activo</span>
            </div>
          ) : locStatus === "denied" ? (
            <button
              onClick={requestLocation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
              style={{ background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", color: "#FF6666" }}
            >
              <LocateOff className="w-3 h-3" />
              <span className="hidden sm:inline">Sin GPS</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
              style={{ background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.15)", color: "#00FFCC80" }}>
              <LocateFixed className="w-3 h-3 animate-pulse" />
              <span className="hidden sm:inline">Localizando...</span>
            </div>
          )}
          <Link href="/customer/catalog">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all hover:scale-105"
              style={{ background: "rgba(0,255,204,0.12)", border: "1px solid rgba(0,255,204,0.35)", color: "#00FFCC" }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
            </div>
          </Link>
        </div>
      </header>

      {/* ── GPS STATUS BANNER ── */}
      {locStatus === "denied" && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
          style={{ background: "rgba(255,68,68,0.08)", borderBottom: "1px solid rgba(255,68,68,0.2)" }}
        >
          <LocateOff className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400 flex-1">
            Sin acceso al GPS — activa la ubicación para ver tiendas ordenadas por cercanía
          </span>
          <button
            onClick={requestLocation}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
            style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)", color: "#00FFCC" }}
          >
            <RefreshCw className="w-3 h-3" /> Reintentar
          </button>
        </div>
      )}

      {locStatus === "requesting" && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
          style={{ background: "rgba(0,255,204,0.05)", borderBottom: "1px solid rgba(0,255,204,0.12)" }}
        >
          <LocateFixed className="w-4 h-4 animate-pulse flex-shrink-0" style={{ color: "#00FFCC" }} />
          <span className="text-xs" style={{ color: "#00FFCC80" }}>
            Obteniendo tu ubicación GPS para mostrar tiendas cercanas...
          </span>
        </div>
      )}

      {/* ── SEARCH + ZONE FILTER ── */}
      <div
        className="flex-shrink-0 px-3 pt-3 pb-2 space-y-2"
        style={{ background: "rgba(5,8,16,0.9)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#00FFCC60" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda o dirección en Medellín…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-white/25 outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-white/40" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => setZone(z.key)}
              className="flex-shrink-0 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: zone === z.key ? z.color + "22" : "rgba(255,255,255,0.04)",
                border: `1px solid ${zone === z.key ? z.color + "55" : "rgba(255,255,255,0.07)"}`,
                color: zone === z.key ? z.color : "#666",
              }}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="relative flex-shrink-0" style={{ height: "52vh", minHeight: 260 }}>
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
          <PanToUser pos={userPos} />
          {!userPos && <FitBoundsToStores stores={filtered.length ? filtered : stores} />}
          <FocusStore store={selected} />

          {userPos && (
            <>
              <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
                <Popup>
                  <div style={{ fontFamily: "monospace", color: "#00FFCC", fontWeight: "bold", fontSize: 12 }}>
                    📍 Tu ubicación
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[userPos.lat, userPos.lng]}
                radius={1500}
                pathOptions={{ color: "#00FFCC", fillColor: "#00FFCC", fillOpacity: 0.035, weight: 1, opacity: 0.18 }}
              />
            </>
          )}

          {filtered.map((s) => {
            const color = getZoneColor(s.lat, s.lng);
            const dist = distKm(s);
            const prods = storeProducts(s.id);
            return (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={makeStoreIcon(color, selected?.id === s.id ? 40 : 32, true)}
                eventHandlers={{ click: () => setSelected(s) }}
              >
                <Popup>
                  <div style={{ fontFamily: "monospace", minWidth: 200, color: "#fff" }}>
                    <p style={{ color, fontWeight: "bold", fontSize: 13, marginBottom: 4 }}>{s.name}</p>
                    {s.address && <p style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>📍 {s.address}</p>}
                    {s.phone && <p style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>📞 {s.phone}</p>}
                    {dist !== null && (
                      <p style={{ color: "#00FFCC", fontWeight: "bold", fontSize: 11, marginTop: 4 }}>
                        {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} de ti
                      </p>
                    )}
                    {prods.length > 0 && (
                      <p style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                        🛍 {prods.length} producto{prods.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating counter */}
        <div
          className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: "rgba(5,8,16,0.92)", border: "1px solid rgba(0,255,204,0.22)", backdropFilter: "blur(8px)" }}
        >
          <Layers className="w-3.5 h-3.5" style={{ color: "#00FFCC" }} />
          <span style={{ color: "#00FFCC" }} className="font-bold">{filtered.length}</span>
          <span className="text-white/40">tiendas</span>
          {userPos && (
            <span className="text-white/30 text-[10px]">· por cercanía</span>
          )}
        </div>

        {/* Toggle list button */}
        <button
          onClick={() => setShowList((v) => !v)}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all"
          style={{ background: "rgba(5,8,16,0.92)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff" }}
        >
          <Store className="w-3 h-3" />
          {showList ? "Ocultar lista" : "Ver lista"}
        </button>
      </div>

      {/* ── STORES LIST ── */}
      {showList && (
        <div className="flex-1 overflow-y-auto" style={{ background: "#050810" }}>
          {/* Section header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 sticky top-0 z-10"
            style={{ background: "rgba(5,8,16,0.97)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5" style={{ color: "#00FFCC" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00FFCC" }}>
                {userPos ? "Tiendas más cercanas" : "Nodos de distribución"}
              </span>
            </div>
            <span className="text-[10px] text-white/30 font-mono">{filtered.length} resultados</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Store className="w-12 h-12 mx-auto mb-3 text-white/10" />
              <p className="text-sm text-white/30 font-mono">No se encontraron tiendas</p>
              <button
                onClick={() => { setSearch(""); setZone("all"); }}
                className="mt-3 text-xs px-4 py-1.5 rounded-xl transition-all"
                style={{ border: "1px solid rgba(0,255,204,0.2)", color: "#00FFCC" }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {filtered.map((s, i) => {
                const dist = distKm(s);
                const prods = storeProducts(s.id);
                const color = getZoneColor(s.lat, s.lng);
                const isSelected = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(isSelected ? null : s)}
                    className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all"
                    style={{
                      background: isSelected ? `${color}0d` : "transparent",
                      borderLeft: isSelected ? `2px solid ${color}` : "2px solid transparent",
                    }}
                  >
                    {/* Rank badge */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                    >
                      {userPos ? (i + 1) : <Store className="w-3.5 h-3.5" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-white truncate">{s.name}</p>
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                      </div>
                      <p className="text-[11px] text-white/40 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {s.address}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {prods.length > 0 && (
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <Package className="w-2.5 h-2.5" />
                            {prods.length} prod.
                          </span>
                        )}
                        {s.phone && (
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {s.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {dist !== null && (
                        <span className="text-sm font-black" style={{ color }}>
                          {formatDist(dist)}
                        </span>
                      )}
                      <ChevronRight
                        className="w-4 h-4"
                        style={{ color: isSelected ? color : "rgba(255,255,255,0.2)" }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* CTA to catalog */}
          <div className="p-4 pb-safe">
            <Link href="/customer/catalog">
              <div
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{ background: "rgba(0,255,204,0.07)", border: "1px solid rgba(0,255,204,0.22)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,255,204,0.12)" }}>
                    <ShoppingBag className="w-4 h-4" style={{ color: "#00FFCC" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Ver Catálogo Completo</p>
                    <p className="text-[11px] text-white/40">{products.length} productos disponibles</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: "#00FFCC" }} />
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
