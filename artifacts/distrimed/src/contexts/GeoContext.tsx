import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  timestamp?: number;
}

export type GeoStatus = "idle" | "requesting" | "granted" | "denied";

interface GeoContextValue {
  position: GeoPosition | null;
  status: GeoStatus;
  walkingMode: boolean;
  setWalkingMode: (on: boolean) => void;
  retry: () => void;
  centerMap: (() => void) | null;
  setCenterMap: (fn: (() => void) | null) => void;
  positionHistory: GeoPosition[];
}

const GeoContext = createContext<GeoContextValue>({
  position: null,
  status: "idle",
  walkingMode: false,
  setWalkingMode: () => {},
  retry: () => {},
  centerMap: null,
  setCenterMap: () => {},
  positionHistory: [],
});

export function GeoProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [walkingMode, setWalkingModeState] = useState(false);
  const [centerMap, setCenterMap] = useState<(() => void) | null>(null);
  const [positionHistory, setPositionHistory] = useState<GeoPosition[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const requested = useRef(false);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback((highAccuracy = true) => {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    stopWatch();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: GeoPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          altitude: pos.coords.altitude,
          timestamp: pos.timestamp,
        };
        setPosition(newPos);
        setStatus("granted");
        setPositionHistory((prev) => {
          const next = [...prev, newPos];
          return next.length > 100 ? next.slice(-100) : next;
        });
      },
      () => setStatus("denied"),
      {
        enableHighAccuracy: highAccuracy,
        timeout: 20000,
        maximumAge: walkingMode ? 1000 : 5000,
      }
    );
  }, [stopWatch, walkingMode]);

  useEffect(() => {
    if (!requested.current) {
      requested.current = true;
      requestLocation();
    }
    return stopWatch;
  }, [requestLocation, stopWatch]);

  const setWalkingMode = useCallback((on: boolean) => {
    setWalkingModeState(on);
    // Restart watch with tighter settings for walking mode
    setTimeout(() => requestLocation(true), 100);
  }, [requestLocation]);

  return (
    <GeoContext.Provider value={{
      position, status, walkingMode, setWalkingMode,
      retry: () => requestLocation(), centerMap, setCenterMap, positionHistory,
    }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}
