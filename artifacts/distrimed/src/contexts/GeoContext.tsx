import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

type GeoStatus = "idle" | "requesting" | "granted" | "denied";

interface GeoContextValue {
  position: GeoPosition | null;
  status: GeoStatus;
  retry: () => void;
}

const GeoContext = createContext<GeoContextValue>({
  position: null,
  status: "idle",
  retry: () => {},
});

export function GeoProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const requested = useRef(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      requestLocation();
    }
  }, []);

  return (
    <GeoContext.Provider value={{ position, status, retry: requestLocation }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}
