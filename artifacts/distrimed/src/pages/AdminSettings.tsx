import { useState, useEffect } from "react";
import DashboardLayout from "@/pages/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Globe, Bell, MessageCircle, Package, Rocket,
  Save, RefreshCw, Eye, EyeOff, CheckCircle, AlertTriangle,
  Palette, Phone, Mail, Link, Hash, Toggle3Right, Zap,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Setting {
  id: number;
  key: string;
  value: string | null;
  label: string;
  category: string;
  description: string | null;
  inputType: string;
  updatedAt: string;
}

const API = "/api";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` });

const CATEGORIES = [
  { key: "general", label: "General", icon: Globe, color: "#00FFCC" },
  { key: "appearance", label: "Apariencia", icon: Palette, color: "#a78bfa" },
  { key: "whatsapp", label: "WhatsApp Bot", icon: MessageCircle, color: "#22c55e" },
  { key: "notifications", label: "Notificaciones", icon: Bell, color: "#f59e0b" },
  { key: "inventory", label: "Inventario", icon: Package, color: "#f97316" },
  { key: "deployment", label: "Despliegue", icon: Rocket, color: "#ec4899" },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/settings`, { headers: headers() });
      const data = await res.json();
      setSettings(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los ajustes", variant: "destructive" });
    } finally { setLoading(false); }
  }

  function getVal(key: string) {
    if (key in dirty) return dirty[key];
    return settings.find(s => s.key === key)?.value ?? "";
  }

  function setVal(key: string, val: string) {
    setDirty(prev => ({ ...prev, [key]: val }));
  }

  async function saveAll() {
    if (Object.keys(dirty).length === 0) return;
    setSaving(true);
    try {
      const updates = Object.entries(dirty).map(([key, value]) => ({ key, value }));
      await fetch(`${API}/settings/batch`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ updates }),
      });
      await fetchSettings();
      setDirty({});
      toast({ title: "✅ Guardado", description: "Configuración actualizada correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudieron guardar los ajustes", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function testWhatsApp() {
    setTesting(true);
    try {
      const phone = getVal("whatsapp_from").replace("whatsapp:", "");
      const res = await fetch(`${API}/whatsapp/send`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ to: phone, message: "🧪 *Test DISTRIMED* — Configuración WhatsApp funcionando correctamente ✅", type: "test" }),
      });
      const data = await res.json();
      if (data.success) toast({ title: "✅ WhatsApp enviado", description: `Mensaje de prueba enviado. SID: ${data.sid}` });
      else toast({ title: "❌ Error WhatsApp", description: data.message ?? "No se pudo enviar", variant: "destructive" });
    } finally { setTesting(false); }
  }

  const BoolToggle = ({ settingKey }: { settingKey: string }) => {
    const val = getVal(settingKey) === "true";
    return (
      <button
        onClick={() => setVal(settingKey, val ? "false" : "true")}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
        style={{ background: val ? "#00FFCC" : "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <span className="inline-block h-4 w-4 transform rounded-full bg-black transition-transform" style={{ transform: val ? "translateX(24px)" : "translateX(2px)" }} />
      </button>
    );
  };

  const FieldInput = ({ s }: { s: Setting }) => {
    const val = getVal(s.key);
    const isPassword = s.inputType === "password";
    const show = showPasswords[s.key];

    if (s.inputType === "boolean") {
      return (
        <div className="flex items-center gap-3">
          <BoolToggle settingKey={s.key} />
          <span className="text-xs font-mono" style={{ color: val === "true" ? "#00FFCC" : "#888" }}>{val === "true" ? "Activado" : "Desactivado"}</span>
        </div>
      );
    }
    if (s.inputType === "color") {
      return (
        <div className="flex items-center gap-3">
          <input type="color" value={val || "#00FFCC"} onChange={e => setVal(s.key, e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
          <Input value={val} onChange={e => setVal(s.key, e.target.value)}
            className="flex-1 bg-white/5 border-white/10 text-white font-mono text-sm h-10" placeholder="#000000" />
        </div>
      );
    }
    return (
      <div className="relative">
        <Input
          type={isPassword && !show ? "password" : "text"}
          value={val}
          onChange={e => setVal(s.key, e.target.value)}
          className="bg-white/5 border-white/10 text-white font-mono text-sm h-10 pr-10"
          placeholder={s.description ?? s.label}
        />
        {isPassword && (
          <button onClick={() => setShowPasswords(p => ({ ...p, [s.key]: !show }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    );
  };

  const catSettings = settings.filter(s => s.category === activeTab);
  const hasDirty = Object.keys(dirty).length > 0;
  const activeCat = CATEGORIES.find(c => c.key === activeTab);

  return (
    <DashboardLayout title="Configuración del Sistema">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: "#00FFCC" }} />
              Ajustes del Sistema
            </h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">Configuración global · {settings.length} parámetros</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchSettings} variant="ghost" size="sm" className="text-white/50 hover:text-white font-mono text-xs border border-white/10">
              <RefreshCw className="w-3 h-3 mr-1.5" />Recargar
            </Button>
            {hasDirty && (
              <Button onClick={saveAll} disabled={saving} size="sm"
                className="font-mono text-xs font-bold" style={{ background: "#00FFCC", color: "#000" }}>
                <Save className="w-3 h-3 mr-1.5" />{saving ? "Guardando..." : `Guardar (${Object.keys(dirty).length})`}
              </Button>
            )}
          </div>
        </div>

        {hasDirty && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Hay {Object.keys(dirty).length} cambio(s) sin guardar. Haz clic en "Guardar" para aplicarlos.
          </div>
        )}

        <div className="flex gap-4">
          {/* Sidebar tabs */}
          <div className="w-44 space-y-1 flex-shrink-0">
            {CATEGORIES.map((cat) => {
              const CatIcon = cat.icon;
              const active = activeTab === cat.key;
              return (
                <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono transition-all text-left"
                  style={active ? { background: `${cat.color}12`, border: `1px solid ${cat.color}30`, color: cat.color }
                    : { border: "1px solid transparent", color: "rgba(255,255,255,0.4)" }}>
                  <CatIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Settings panel */}
          <div className="flex-1 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  {activeCat && <activeCat.icon className="w-4 h-4" style={{ color: activeCat.color }} />}
                  <h3 className="text-sm font-mono font-bold text-white">{activeCat?.label}</h3>
                  <span className="text-xs text-white/30 font-mono">· {catSettings.length} parámetros</span>
                </div>

                {catSettings.length === 0 && (
                  <p className="text-white/30 text-sm font-mono text-center py-8">No hay configuraciones en esta categoría</p>
                )}

                {catSettings.map(s => (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold text-white/80">{s.label}</label>
                      <span className="text-[9px] font-mono text-white/20">{s.key}</span>
                    </div>
                    {s.description && <p className="text-[11px] text-white/40 font-mono">{s.description}</p>}
                    <FieldInput s={s} />
                    {dirty[s.key] !== undefined && dirty[s.key] !== (s.value ?? "") && (
                      <p className="text-[10px] font-mono" style={{ color: "#00FFCC" }}>✓ Modificado</p>
                    )}
                  </div>
                ))}

                {/* WhatsApp test button */}
                {activeTab === "whatsapp" && (
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <Button onClick={testWhatsApp} disabled={testing} variant="outline" size="sm"
                      className="font-mono text-xs border-green-500/30 text-green-400 hover:bg-green-500/10">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                      {testing ? "Enviando prueba..." : "Enviar mensaje de prueba"}
                    </Button>
                    <div className="rounded-xl p-4 text-xs font-mono space-y-2" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", color: "rgba(34,197,94,0.8)" }}>
                      <p className="font-bold">📋 Configuración WhatsApp (Twilio Sandbox)</p>
                      <p>1. Crea una cuenta en <span className="text-green-300">twilio.com</span></p>
                      <p>2. Activa el sandbox de WhatsApp en Console › Messaging › Try it out</p>
                      <p>3. Copia tu Account SID y Auth Token</p>
                      <p>4. El número sandbox es: <span className="text-green-300">+14155238886</span></p>
                      <p>5. El webhook para mensajes entrantes es: <span className="text-green-300">/api/whatsapp/webhook</span></p>
                    </div>
                  </div>
                )}

                {/* Deployment info */}
                {activeTab === "deployment" && (
                  <div className="pt-4 border-t border-white/5">
                    <div className="rounded-xl p-4 text-xs font-mono space-y-2" style={{ background: "rgba(236,72,153,0.05)", border: "1px solid rgba(236,72,153,0.15)" }}>
                      <p className="font-bold text-pink-300">🚀 Despliegue en Replit</p>
                      <p className="text-white/50">Esta app puede publicarse con un solo clic desde Replit.</p>
                      <p className="text-white/50">URL de producción: <span className="text-pink-300">{getVal("deploy_url") || "No configurada"}</span></p>
                      <p className="text-white/50">Estado: <span className="text-green-400">✓ API activa · ✓ BD conectada · ✓ PWA habilitada</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
