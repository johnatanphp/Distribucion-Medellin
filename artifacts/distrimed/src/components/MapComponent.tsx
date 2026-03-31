import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createCyberIcon = (color: string) => L.divIcon({
  className: 'bg-transparent border-0',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 10px ${color}, 0 0 20px ${color}; border: 2px solid rgba(255,255,255,0.8);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const primaryIcon = createCyberIcon('#00FFCC');
const secondaryIcon = createCyberIcon('#8b5cf6');

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function LocationPicker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

interface StoreMarker {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  userLocation?: [number, number] | null;
  stores?: StoreMarker[];
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export default function MapComponent({ center, zoom = 13, userLocation, stores = [], onLocationSelect, interactive = false }: MapComponentProps) {
  return (
    <div className="w-full h-full rounded-md overflow-hidden border border-primary/20 glow-border z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#0a0e1a' }}
        attributionControl={false}
      >
        {/* Dark map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapUpdater center={center} />
        {interactive && <LocationPicker onLocationSelect={onLocationSelect} />}

        {userLocation && (
          <Marker position={userLocation} icon={secondaryIcon}>
            <Popup className="cyber-popup">
              <div className="font-mono text-xs">Tu Ubicación</div>
            </Popup>
          </Marker>
        )}

        {stores.map(store => (
          <Marker key={store.id} position={[store.lat, store.lng]} icon={primaryIcon}>
            <Popup className="cyber-popup">
              <div className="font-mono p-1">
                <strong className="text-primary block mb-1 uppercase">{store.name}</strong>
                {store.description && <span className="text-xs text-muted-foreground">{store.description}</span>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
