import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service Worker registration with update handling
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Check for updates every 60 seconds
      setInterval(() => reg.update(), 60_000);

      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            // New version available — could show a toast here
            console.info("[DISTRIMED] Nueva versión disponible. Recarga para actualizar.");
          }
        });
      });
    } catch (err) {
      console.warn("[DISTRIMED] SW registration failed:", err);
    }
  });
}

// Expose install prompt event for in-app install button
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  // Dispatch custom event so components can listen
  window.dispatchEvent(new CustomEvent("pwa-installable"));
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  window.dispatchEvent(new CustomEvent("pwa-installed"));
});

export function getPWAInstallPrompt() {
  return deferredPrompt;
}
