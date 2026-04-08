import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/pages/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import {
  FileText, Upload, Trash2, Eye, Search, X, Download,
  FilePlus, Filter, Tag, FolderOpen, Calendar, Building2,
  FileCheck, FileWarning, File, Plus,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface Document {
  id: number;
  storeId: number | null;
  userId: number | null;
  orderId: number | null;
  name: string;
  type: string;
  content: string | null;
  url: string | null;
  mimeType: string | null;
  size: number | null;
  tags: string | null;
  status: string;
  createdAt: string;
}

const API = "/api";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` });

const DOC_TYPES = [
  { key: "all", label: "Todos", color: "#00FFCC", icon: FolderOpen },
  { key: "invoice", label: "Facturas", color: "#f59e0b", icon: FileCheck },
  { key: "contract", label: "Contratos", color: "#a78bfa", icon: FileText },
  { key: "report", label: "Informes", color: "#22c55e", icon: FileText },
  { key: "receipt", label: "Recibos", color: "#38bdf8", icon: FileCheck },
  { key: "other", label: "Otros", color: "#94a3b8", icon: File },
];

const TYPE_LABELS: Record<string, string> = {
  invoice: "Factura", contract: "Contrato", report: "Informe", receipt: "Recibo", other: "Otro",
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function DocumentCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "invoice", tags: "" });
  const [preview, setPreview] = useState<Document | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      const storeId = (user as any)?.storeId;
      const url = user?.role === "superadmin" ? `${API}/documents` : `${API}/documents?storeId=${storeId}`;
      const res = await fetch(url, { headers: headers() });
      const data = await res.json();
      setDocs(Array.isArray(data) ? data.filter((d: Document) => d.status !== "deleted") : []);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar los documentos", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function upload() {
    if (!form.name) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    setUploading(true);
    try {
      let content: string | undefined;
      let mimeType: string | undefined;
      let size: number | undefined;
      if (selectedFile) {
        content = await fileToBase64(selectedFile);
        mimeType = selectedFile.type;
        size = selectedFile.size;
      }
      const storeId = (user as any)?.storeId;
      await fetch(`${API}/documents`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ ...form, content, mimeType, size, storeId }),
      });
      toast({ title: "✅ Documento guardado" });
      setForm({ name: "", type: "invoice", tags: "" });
      setSelectedFile(null);
      setShowForm(false);
      fetchDocs();
    } catch {
      toast({ title: "Error", description: "No se pudo guardar el documento", variant: "destructive" });
    } finally { setUploading(false); }
  }

  async function deleteDoc(id: number) {
    if (!confirm("¿Eliminar este documento?")) return;
    await fetch(`${API}/documents/${id}`, { method: "DELETE", headers: headers() });
    toast({ title: "Documento eliminado" });
    fetchDocs();
  }

  function downloadDoc(doc: Document) {
    if (!doc.content) return;
    const a = document.createElement("a");
    a.href = doc.content;
    a.download = doc.name;
    a.click();
  }

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || d.name.toLowerCase().includes(q) || (d.tags ?? "").toLowerCase().includes(q);
    const matchType = filterType === "all" || d.type === filterType;
    return matchQ && matchType;
  });

  const DocIcon = ({ type }: { type: string }) => {
    const t = DOC_TYPES.find(dt => dt.key === type);
    const Icon = t?.icon ?? File;
    return <Icon className="w-5 h-5" style={{ color: t?.color ?? "#94a3b8" }} />;
  };

  return (
    <DashboardLayout title="Centro de Documentos">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-mono font-black text-white tracking-wider flex items-center gap-2">
              <FolderOpen className="w-5 h-5" style={{ color: "#a78bfa" }} />
              Centro de Documentos
            </h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">{docs.length} documento(s) · Facturas, contratos, informes</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm"
            className="font-mono text-xs font-bold" style={{ background: "#a78bfa", color: "#000" }}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />Nuevo Documento
          </Button>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          {DOC_TYPES.map(dt => {
            const active = filterType === dt.key;
            return (
              <button key={dt.key} onClick={() => setFilterType(dt.key)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all"
                style={active ? { background: `${dt.color}20`, border: `1px solid ${dt.color}40`, color: dt.color }
                  : { border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                {dt.label} {filterType !== "all" || dt.key === "all" ? `(${dt.key === "all" ? docs.length : docs.filter(d => d.type === dt.key).length})` : ""}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o etiqueta..."
            className="pl-9 bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono font-bold text-white">Subir Documento</h3>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-white/40 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Nombre *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Factura #001 - Enero 2025" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 text-white font-mono text-xs rounded-lg px-3 h-9">
                  {DOC_TYPES.filter(dt => dt.key !== "all").map(dt => <option key={dt.key} value={dt.key}>{dt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Etiquetas</label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Ej: 2025, enero, cliente-xyz" className="bg-white/5 border-white/10 text-white font-mono text-sm h-9" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-white/50 uppercase mb-1 block">Archivo (opcional)</label>
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg border border-dashed border-white/20 text-white/40 hover:text-white hover:border-violet-400/40 transition-all text-xs font-mono">
                    <Upload className="w-3.5 h-3.5" />{selectedFile ? selectedFile.name.substring(0, 20) + "..." : "Seleccionar archivo"}
                  </button>
                  <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.txt" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); if (!form.name) setForm(ff => ({ ...ff, name: f.name })); }}} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setShowForm(false)} variant="ghost" size="sm" className="font-mono text-xs text-white/50 border border-white/10">Cancelar</Button>
              <Button onClick={upload} disabled={uploading} size="sm" className="font-mono text-xs font-bold" style={{ background: "#a78bfa", color: "#000" }}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />{uploading ? "Subiendo..." : "Guardar Documento"}
              </Button>
            </div>
          </div>
        )}

        {/* Preview modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
            <div className="bg-card rounded-2xl p-6 max-w-lg w-full space-y-4" style={{ border: "1px solid rgba(255,255,255,0.1)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocIcon type={preview.type} />
                  <div>
                    <h3 className="font-mono font-bold text-white text-sm">{preview.name}</h3>
                    <p className="text-[10px] font-mono text-white/40">{TYPE_LABELS[preview.type] ?? preview.type} · {formatBytes(preview.size)}</p>
                  </div>
                </div>
                <button onClick={() => setPreview(null)}><X className="w-5 h-5 text-white/40 hover:text-white" /></button>
              </div>
              {preview.tags && (
                <div className="flex gap-1.5 flex-wrap">
                  {preview.tags.split(",").map(t => <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40">{t.trim()}</span>)}
                </div>
              )}
              <div className="text-xs font-mono text-white/40 space-y-1">
                <p>Creado: {new Date(preview.createdAt).toLocaleString("es-CO")}</p>
                {preview.orderId && <p>Pedido: #{preview.orderId}</p>}
              </div>
              {preview.content?.startsWith("data:image") && (
                <img src={preview.content} alt={preview.name} className="rounded-lg max-h-64 object-contain w-full" />
              )}
              {preview.content && (
                <Button onClick={() => downloadDoc(preview)} className="w-full font-mono text-xs" style={{ background: "#a78bfa", color: "#000" }}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />Descargar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-white/10" />
            <p className="text-white/30 font-mono text-sm">{docs.length === 0 ? "No hay documentos" : "Sin resultados para esta búsqueda"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => {
              const dt = DOC_TYPES.find(t => t.key === doc.type);
              return (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5 cursor-pointer group"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }} onClick={() => setPreview(doc)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${dt?.color ?? "#888"}15`, border: `1px solid ${dt?.color ?? "#888"}25` }}>
                    <DocIcon type={doc.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-sm text-white truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: `${dt?.color ?? "#888"}15`, color: dt?.color ?? "#888" }}>
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </span>
                      {doc.tags && doc.tags.split(",").slice(0, 2).map(t => (
                        <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-white/30">{t.trim()}</span>
                      ))}
                      <span className="text-[10px] font-mono text-white/30">{formatBytes(doc.size)}</span>
                      <span className="text-[10px] font-mono text-white/20">{new Date(doc.createdAt).toLocaleDateString("es-CO")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    {doc.content && (
                      <button onClick={() => downloadDoc(doc)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-violet-400 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
