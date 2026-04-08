import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

type GeoStatus = "idle" | "requesting" | "granted" | "denied";

interface GeoContextValue {
  position: GeoPosition | null;
  status: GeoStatus;
  retry: () => void;
  centerMap: (() => void) | null;
  setCenterMap: (fn: (() => void) | null) => void;
}

const GeoContext = createContext<GeoContextValue>({
  position: null,
  status: "idle",
  retry: () => {},
  centerMap: null,
  setCenterMap: () => {},
});

export function GeoProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [centerMap, setCenterMap] = useState<(() => void) | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const requested = useRef(false);

  const stopWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    stopWatch();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }, []);

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      requestLocation();
    }
    return stopWatch;
  }, [requestLocation]);

  return (
    <GeoContext.Provider value={{ position, status, retry: requestLocation, centerMap, setCenterMap }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}
