import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createStoreIcon = (active = true) => L.divIcon({
  className: "bg-transparent border-0",
  html: `
    <div style="position:relative;width:32px;height:38px;">
      <div style="
        position:absolute;
        top:0;left:50%;transform:translateX(-50%);
        width:28px;height:28px;
        background:${active ? "rgba(0,255,204,0.15)" : "rgba(139,92,246,0.15)"};
        border:2px solid ${active ? "#00FFCC" : "#8b5cf6"};
        border-radius:50%;
        box-shadow:0 0 16px ${active ? "#00FFCC" : "#8b5cf6"},0 0 32px ${active ? "rgba(0,255,204,0.3)" : "rgba(139,92,246,0.3)"};
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="${active ? "#00FFCC" : "#8b5cf6"}">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="${active ? "#00FFCC" : "#8b5cf6"}" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="
        position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        width:2px;height:10px;
        background:linear-gradient(to bottom,${active ? "#00FFCC" : "#8b5cf6"},transparent);
      "></div>
    </div>
  `,
  iconSize: [32, 38],
  iconAnchor: [16, 38],
  popupAnchor: [0, -40],
});

const createUserIcon = () => L.divIcon({
  className: "bg-transparent border-0",
  html: `
    <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;
        width:40px;height:40px;
        border-radius:50%;
        border:2px solid #8b5cf6;
        opacity:0.4;
        animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
      "></div>
      <div style="
        width:18px;height:18px;
        background:#8b5cf6;
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 0 12px #8b5cf6,0 0 24px rgba(139,92,246,0.5);
        position:relative;z-index:1;
      "></div>
    </div>
    <style>@keyframes ping{0%{transform:scale(1);opacity:0.4}75%,100%{transform:scale(2);opacity:0}}</style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function LocationPicker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export interface StoreMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description?: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  stores?: StoreMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
  selectedStoreId?: number | null;
  onStoreClick?: (store: StoreMarker) => void;
}

export default function MapComponent({
  center,
  zoom = 13,
  userLocation,
  stores = [],
  onLocationSelect,
  interactive = false,
  selectedStoreId,
  onStoreClick,
}: MapComponentProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden z-0" style={{ border: "1px solid rgba(0,255,204,0.2)" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", background: "#050810" }}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <MapUpdater center={center} zoom={selectedStoreId ? 16 : undefined} />
        {interactive && <LocationPicker onLocationSelect={onLocationSelect} />}

        {userLocation && (
          <Marker position={userLocation} icon={createUserIcon()}>
            <Popup>
              <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#8b5cf6", textTransform: "uppercase", fontWeight: "bold" }}>
                📍 Tu ubicación
              </div>
            </Popup>
          </Marker>
        )}

        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            icon={createStoreIcon(store.active !== false)}
            eventHandlers={{ click: () => onStoreClick?.(store) }}
          >
            <Popup>
              <div style={{ fontFamily: "monospace", minWidth: "160px" }}>
                <p style={{ color: "#00FFCC", fontWeight: "bold", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase" }}>
                  {store.name}
                </p>
                {store.description && (
                  <p style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "2px" }}>{store.description}</p>
                )}
                {store.address && (
                  <p style={{ color: "#64748b", fontSize: "10px" }}>📍 {store.address}</p>
                )}
                {store.phone && (
                  <p style={{ color: "#64748b", fontSize: "10px" }}>📞 {store.phone}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
