import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGetStores } from "@workspace/api-client-react";
import { useAuth } from "@/components/AuthProvider";
import {
  Store, Search, MapPin, Navigation, ChevronRight, X,
  Activity, CheckCircle2, AlertCircle, Package, Users,
  Layers, Filter, Star, Phone, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  storeName?: string;
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

// ─── ICONO SVG POR ROL ────────────────────────────────────────────────────────
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
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

function makeUserIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="10" fill="#00FFCC" fill-opacity="0.15">
      <animate attributeName="r" values="10;16;10" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="fill-opacity" values="0.15;0;0.15" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <circle cx="18" cy="18" r="6" fill="#00FFCC" fill-opacity="0.3"/>
    <circle cx="18" cy="18" r="4" fill="#00FFCC"/>
    <circle cx="18" cy="18" r="2" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [36, 36], iconAnchor: [18, 18] });
}

// ─── FIT BOUNDS HELPER ────────────────────────────────────────────────────────
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

// ─── DISTANCIA ────────────────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── MAIN WIDGET ──────────────────────────────────────────────────────────────
interface Props {
  height?: string;
  showWidgets?: boolean;
  compact?: boolean;
}

export default function StoreMapWidget({ height = "480px", showWidgets = true, compact = false }: Props) {
  const { user } = useAuth();
  const role = user?.role ?? "customer";
  const { data: storesRaw = [] } = useGetStores();
  const stores: StoreItem[] = storesRaw as StoreItem[];

  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [showInactive, setShowInactive] = useState(role === "superadmin");

  // Obtener ubicación del usuario
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Filtrar tiendas
  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchZone = zone === "all" || getZone(s.lat, s.lng) === zone;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase());
      const matchActive = showInactive || s.active;
      return matchZone && matchSearch && matchActive;
    });
  }, [stores, zone, search, showInactive]);

  // Stats
  const totalActive = stores.filter((s) => s.active).length;
  const totalInactive = stores.filter((s) => !s.active).length;
  const zonesWithStores = new Set(stores.filter((s) => s.active).map((s) => getZone(s.lat, s.lng))).size;
  const ownStore = role === "store" ? stores.find((s) => s.id === user?.storeId) : null;

  const getStoreIcon = (s: StoreItem) => {
    const isOwn = role === "store" && s.id === user?.storeId;
    const color = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
    const size = isOwn ? 40 : s.active ? 32 : 24;
    const pulse = s.active && (isOwn || role !== "store");
    return makeStoreIcon(color, size, pulse, isOwn);
  };

  const distKm = (s: StoreItem) => {
    if (!userPos || !s.lat || !s.lng) return null;
    return haversine(userPos.lat, userPos.lng, s.lat, s.lng);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── WIDGETS DE ESTADÍSTICAS ───────────────────────────── */}
      {showWidgets && !compact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Store className="w-4 h-4" />} label="Tiendas activas" value={totalActive} color="#00FFCC" />
          <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Inactivas" value={totalInactive} color="#FF4444" />
          <StatCard icon={<Layers className="w-4 h-4" />} label="Zonas cubiertas" value={zonesWithStores} color="#A855F7" />
          <StatCard icon={<Package className="w-4 h-4" />} label="Puntos en mapa" value={filtered.length} color="#FF9900" />
        </div>
      )}

      {/* ── BARRA DE FILTROS ──────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex flex-col sm:flex-row gap-2 p-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tienda o dirección…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-muted-foreground outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          {/* Zone pills */}
          <div className="flex gap-1.5 flex-wrap">
            {ZONES.map((z) => (
              <button
                key={z.key}
                onClick={() => setZone(z.key)}
                className="px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
                style={{
                  background: zone === z.key ? z.color + "25" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${zone === z.key ? z.color + "60" : "rgba(255,255,255,0.08)"}`,
                  color: zone === z.key ? z.color : "#aaa",
                }}
              >
                {z.label}
              </button>
            ))}
          </div>
          {/* Toggle inactivas (solo admin) */}
          {role === "superadmin" && (
            <button
              onClick={() => setShowInactive((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
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
            <FitBoundsToStores stores={filtered.length ? filtered : stores} />

            {/* Marcador usuario */}
            {userPos && (
              <>
                <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
                  <Popup><span className="font-mono text-xs">Tu ubicación</span></Popup>
                </Marker>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={1500}
                  pathOptions={{ color: "#00FFCC", fillColor: "#00FFCC", fillOpacity: 0.04, weight: 1, opacity: 0.25 }}
                />
              </>
            )}

            {/* Marcadores de tiendas */}
            {filtered.map((s) => {
              if (!s.lat || !s.lng) return null;
              const isOwn = role === "store" && s.id === user?.storeId;
              const zoneColor = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
              const dist = distKm(s);
              return (
                <Marker
                  key={s.id}
                  position={[s.lat, s.lng]}
                  icon={getStoreIcon(s)}
                  eventHandlers={{ click: () => setSelected(s) }}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", minWidth: 200, color: "#fff", background: "transparent" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: zoneColor, boxShadow: `0 0 6px ${zoneColor}` }} />
                        <span className="font-bold text-sm" style={{ color: zoneColor }}>{s.name}</span>
                      </div>
                      <p className="text-xs opacity-70 mb-1">{s.address}</p>
                      {s.phone && <p className="text-xs opacity-60">📞 {s.phone}</p>}
                      {dist && <p className="text-xs mt-1" style={{ color: zoneColor }}>📍 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`} de ti</p>}
                      <div className="flex items-center gap-1 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold`} style={{ background: s.active ? "rgba(0,255,100,0.15)" : "rgba(255,68,68,0.15)", color: s.active ? "#00FF64" : "#FF6666" }}>
                          {s.active ? "● Activa" : "○ Inactiva"}
                        </span>
                        {isOwn && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>★ Tu tienda</span>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Resaltar tienda propia para store owner */}
            {ownStore?.lat && ownStore?.lng && (
              <Circle
                center={[ownStore.lat, ownStore.lng]}
                radius={800}
                pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.06, weight: 1.5, opacity: 0.5 }}
              />
            )}
          </MapContainer>

          {/* Badge conteo flotante */}
          <div className="absolute top-3 left-3 z-[1000] flex gap-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold" style={{ background: "rgba(10,14,26,0.9)", border: "1px solid rgba(0,255,204,0.3)", color: "#00FFCC", backdropFilter: "blur(12px)" }}>
              {filtered.length} punto{filtered.length !== 1 ? "s" : ""} • {zone === "all" ? "Medellín" : ZONES.find((z) => z.key === zone)?.label}
            </div>
          </div>

          {/* Leyenda de zonas */}
          {!compact && (
            <div className="absolute bottom-10 left-3 z-[1000] flex flex-col gap-1 pointer-events-none">
              {ZONES.slice(1).map((z) => (
                <div key={z.key} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-mono" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: z.color, boxShadow: `0 0 4px ${z.color}` }} />
                  <span style={{ color: z.color }}>{z.label}</span>
                </div>
              ))}
              {role === "store" && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-mono" style={{ background: "rgba(10,14,26,0.85)", border: "1px solid rgba(255,215,0,0.3)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: "#FFD700", boxShadow: "0 0 4px #FFD700" }} />
                  <span style={{ color: "#FFD700" }}>Tu tienda</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TARJETAS DE TIENDAS ───────────────────────────────── */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => {
            const isOwn = role === "store" && s.id === user?.storeId;
            const zoneColor = isOwn ? "#FFD700" : getZoneColor(s.lat, s.lng);
            const dist = distKm(s);
            const zoneName = ZONES.find((z) => z.key === getZone(s.lat, s.lng))?.label ?? "Centro";
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01]"
                style={{
                  background: isOwn ? "rgba(255,215,0,0.06)" : "rgba(10,14,26,0.85)",
                  border: `1px solid ${selected?.id === s.id ? zoneColor + "60" : isOwn ? "rgba(255,215,0,0.25)" : "rgba(255,255,255,0.07)"}`,
                  boxShadow: selected?.id === s.id ? `0 0 16px ${zoneColor}20` : "none",
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: zoneColor + "18", border: `1px solid ${zoneColor}30` }}>
                      <Store className="w-4 h-4" style={{ color: zoneColor }} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-white leading-tight">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{zoneName}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex-shrink-0 mt-0.5`} style={{ background: s.active ? "rgba(0,255,100,0.12)" : "rgba(255,68,68,0.12)", color: s.active ? "#00CC55" : "#FF5555" }}>
                    {s.active ? "ACTIVA" : "INACTIVA"}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mb-2 line-clamp-1">{s.address}</p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                  {dist !== null && (
                    <span className="flex items-center gap-1 ml-auto" style={{ color: zoneColor }}>
                      <Navigation className="w-3 h-3" />
                      {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                    </span>
                  )}
                </div>
                {isOwn && (
                  <div className="mt-2 text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg w-fit" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>
                    ★ Tu punto de distribución
                  </div>
                )}
              </button>
            );
          })}
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
            {(() => { const d = distKm(selected); return d !== null ? <DetailRow icon={<Navigation className="w-3 h-3" />} text={d < 1 ? `${Math.round(d * 1000)} metros de tu ubicación` : `${d.toFixed(2)} km de tu ubicación`} color={getZoneColor(selected.lat, selected.lng)} /> : null; })()}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-3 py-1 rounded-full font-mono font-bold`} style={{ background: selected.active ? "rgba(0,255,100,0.12)" : "rgba(255,68,68,0.12)", color: selected.active ? "#00CC55" : "#FF5555" }}>
              {selected.active ? "● Tienda Activa" : "○ Inactiva"}
            </span>
            {role === "store" && selected.id === user?.storeId && (
              <span className="text-[10px] px-3 py-1 rounded-full font-mono font-bold" style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700" }}>★ Tu tienda</span>
            )}
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
