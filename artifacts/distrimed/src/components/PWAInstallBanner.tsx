import { useState, useEffect } from "react";
import { Download, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onInstallable = () => {
      const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
      if (!dismissed) setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstalled(true);
    };

    window.addEventListener("pwa-installable", onInstallable);
    window.addEventListener("pwa-installed", onInstalled);
    return () => {
      window.removeEventListener("pwa-installable", onInstallable);
      window.removeEventListener("pwa-installed", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    // Dynamic import to avoid SSR issues
    const { getPWAInstallPrompt } = await import("../main");
    const prompt = getPWAInstallPrompt();
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-50 rounded-2xl p-4 shadow-2xl"
      style={{
        background: "rgba(10,14,26,0.95)",
        border: "1px solid rgba(0,255,204,0.3)",
        boxShadow: "0 0 32px rgba(0,255,204,0.1)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,255,204,0.1)", border: "1px solid rgba(0,255,204,0.3)" }}
        >
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold text-white mb-0.5">Instalar DISTRIMED</p>
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            Accede más rápido desde tu pantalla de inicio, sin necesidad de abrir el navegador.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-white transition-colors flex-shrink-0 -mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 font-mono text-xs uppercase rounded-xl h-8"
          style={{ background: "rgba(0,255,204,0.15)", color: "#00FFCC", border: "1px solid rgba(0,255,204,0.4)" }}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Instalar App
        </Button>
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="font-mono text-xs text-muted-foreground hover:text-white rounded-xl h-8 border border-white/10"
        >
          Ahora no
        </Button>
      </div>
    </div>
  );
}
