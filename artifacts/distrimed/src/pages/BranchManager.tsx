import { useState, useEffect } from "react";
import DashboardLayout from "@/pages/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import {
  GitBranch, Plus, MapPin, Phone, User, Clock,
  Pencil, Trash2, Check, X, ToggleLeft, ToggleRight,
  Navigation, Building2, Search,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Branch {
  id: number;
  storeId: number;
  name: string;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  active: boolean;
  managerName: string | null;
  openHours: string | null;
  notes: string | null;
  createdAt: string;
}

interface Store { id: number; name: string; }

const API = "/api";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` });

const BLANK: Partial<Branch> = { name: "", address: "", phone: "", managerName: "", openHours: "Lun-Vie 8:00-18:00", notes: "", active: true };

export default function BranchManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Branch> | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStore, setFilterStore] = useState<number | null>(null);

  const isAdmin = user?.role === "superadmin";
  const isStore = user?.role === "store";

  useEffect(() => {
    fetchBranches();
    if (isAdmin) fetchStores();
  }, []);

  async function fetchBranches() {
    setLoading(true);
    try {
      const url = isStore && (user as any)?.storeId
        ? `${API}/branches?storeId=${(user as any).storeId}`
        : `${API}/branches`;
      const res = await fetch(url, { headers: headers() });
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las sucursales", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function fetchStores() {
    const res = await fetch(`${API}/stores`, { headers: headers() });
    const data = await res.json();
    setStores(Array.isArray(data) ? data : []);
  }

  async function geolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setForm(f => f ? { ...f, lat: pos.coords.latitude, lng: pos.coords.longitude } : f);
      toast({ title: "📍 Ubicación obtenida", description: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}` });
    }, () => toast({ title: "Error GPS", description: "No se pudo obtener la ubicación", variant: "destructive" }));
  }

  async function save() {
    if (!form?.name || !form?.address) {
      toast({ title: "Campos requeridos", description: "Nombre y dirección son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const storeId = isStore ? (user as any)?.storeId : form.storeId;
      const body = { ...form, storeId };
      const res = editId
        ? await fetch(`${API}/branches/${editId}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) })
        : await fetch(`${API}/branches`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      toast({ title: editId ? "✅ Sucursal actualizada" : "✅ Sucursal creada" });
      setForm(null); setEditId(null);
      fetchBranches();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la sucursal", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function deleteBranch(id: number) {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    await fetch(`${API}/branches/${id}`, { method: "DELETE", headers: headers() });
    toast({ title: "Sucursal eliminada" });
    fetchBranches();
  }

  async function toggleActive(b: Branch) {
    await fetch(`${API}/branches/${b.id}`, { method: "PUT", headers: headers(), body: JSON.stringify({ active: !b.active }) });
    fetchBranches();
  }

  const filtered = branches.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q);
    const matchStore = !filterStore || b.storeId === filterStore;
    return matchQ && matchStore;
  });

  return (
    <DashboardLayout title="Sucursales">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-2">
              <GitBranch className="w-5 h-5" style={{ color: "#f97316" }} />
              Gestión de Sucursales
            </h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{branches.length} sucursal(es) registrada(s)</p>
          </div>
          <Button onClick={() => { setForm({ ...BLANK }); setEditId(null); }} size="sm"
            className="font-mono text-xs font-bold" style={{ background: "#f97316", color: "#000" }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Nueva Sucursal
          </Button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sucursal..."
              className="pl-9 bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
          </div>
          {isAdmin && stores.length > 0 && (
            <select value={filterStore ?? ""} onChange={e => setFilterStore(e.target.value ? Number(e.target.value) : null)}
              className="bg-black/40 border border-white/10 text-white font-mono text-xs rounded-lg px-3 h-9">
              <option value="">Todas las tiendas</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Create/Edit form */}
        {form && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-white">{editId ? "Editar Sucursal" : "Nueva Sucursal"}</h3>
              <button onClick={() => { setForm(null); setEditId(null); }}><X className="w-4 h-4 text-white/40 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isAdmin && (
                <div>
                  <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Tienda *</label>
                  <select value={form.storeId ?? ""} onChange={e => setForm(f => ({ ...f, storeId: Number(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 text-white font-mono text-xs rounded-lg px-3 h-9">
                    <option value="">Seleccionar tienda</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Nombre *</label>
                <Input value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Sucursal Centro" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div className={isAdmin ? "sm:col-span-2" : ""}>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Dirección *</label>
                <Input value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Ej: Calle 80 #45-10, Medellín" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Teléfono</label>
                <Input value={form.phone ?? ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="3001234567" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Responsable</label>
                <Input value={form.managerName ?? ""} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))}
                  placeholder="Nombre del encargado" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Horario</label>
                <Input value={form.openHours ?? ""} onChange={e => setForm(f => ({ ...f, openHours: e.target.value }))}
                  placeholder="Lun-Vie 8:00-18:00" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Coordenadas GPS</label>
                <div className="flex gap-2">
                  <Input value={form.lat ?? ""} onChange={e => setForm(f => ({ ...f, lat: parseFloat(e.target.value) || undefined }))}
                    placeholder="Latitud" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" type="number" step="0.0001" />
                  <Input value={form.lng ?? ""} onChange={e => setForm(f => ({ ...f, lng: parseFloat(e.target.value) || undefined }))}
                    placeholder="Longitud" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" type="number" step="0.0001" />
                  <Button onClick={geolocate} variant="outline" size="sm" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-9 px-3 flex-shrink-0">
                    <Navigation className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Notas internas</label>
                <Input value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Indicaciones especiales, referencias, etc." className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => { setForm(null); setEditId(null); }} variant="ghost" size="sm" className="font-mono text-xs text-white/50 border border-white/10">
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving} size="sm" className="font-mono text-xs font-bold" style={{ background: "#f97316", color: "#000" }}>
                <Check className="w-3.5 h-3.5 mr-1.5" />{saving ? "Guardando..." : editId ? "Actualizar" : "Crear Sucursal"}
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid gap-3">{[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-white/10" />
            <p className="text-white/30 font-mono text-sm">{branches.length === 0 ? "No hay sucursales registradas" : "Sin resultados"}</p>
            {branches.length === 0 && <Button onClick={() => setForm({ ...BLANK })} size="sm" variant="outline" className="font-mono text-xs border-orange-500/30 text-orange-400">Crear primera sucursal</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(b => {
              const store = stores.find(s => s.id === b.storeId);
              return (
                <div key={b.id} className="rounded-2xl p-4 space-y-3 relative transition-all hover:scale-[1.01]"
                  style={{ background: b.active ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${b.active ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-mono font-bold text-sm text-white truncate">{b.name}</h4>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${b.active ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                          {b.active ? "ACTIVA" : "INACTIVA"}
                        </span>
                      </div>
                      {isAdmin && store && <p className="text-[10px] font-mono text-orange-400/60 mt-0.5">{store.name}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => toggleActive(b)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        {b.active ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setForm({ ...b }); setEditId(b.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteBranch(b.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono text-white/50">
                    <p className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#f97316" }} /><span>{b.address}</span></p>
                    {b.phone && <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f97316" }} />{b.phone}</p>}
                    {b.managerName && <p className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f97316" }} />{b.managerName}</p>}
                    {b.openHours && <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f97316" }} />{b.openHours}</p>}
                    {b.lat && b.lng && (
                      <a href={`https://www.google.com/maps?q=${b.lat},${b.lng}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-orange-400 hover:text-orange-300">
                        <Navigation className="w-3.5 h-3.5" />Ver en mapa
                      </a>
                    )}
                  </div>
                  {b.notes && <p className="text-[11px] font-mono text-white/30 italic border-t border-white/5 pt-2">{b.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
