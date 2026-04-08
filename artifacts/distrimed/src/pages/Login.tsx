import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User, Lock, ShieldCheck, Store, ShoppingCart,
  ChevronRight, Loader2, UserPlus, LogIn, Eye, EyeOff,
  Activity, MapPin, Package,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Superadmin",
    email: "admin@distri.co",
    password: "admin123",
    role: "superadmin" as const,
    icon: ShieldCheck,
    color: "#7C3AED",
    roleLabel: "Admin",
    description: "Gestión global del sistema",
  },
  {
    label: "Tienda Norte",
    email: "norte@distri.co",
    password: "tienda123",
    role: "store" as const,
    icon: Store,
    color: "#0099B8",
    roleLabel: "Tienda",
    description: "norte@distri.co",
  },
  {
    label: "Tienda Poblado",
    email: "poblado@distri.co",
    password: "tienda123",
    role: "store" as const,
    icon: Store,
    color: "#0099B8",
    roleLabel: "Tienda",
    description: "poblado@distri.co",
  },
  {
    label: "Pedro (Cliente)",
    email: "pedro@gmail.com",
    password: "pass123",
    role: "customer" as const,
    icon: ShoppingCart,
    color: "#16A34A",
    roleLabel: "Cliente",
    description: "pedro@gmail.com",
  },
  {
    label: "María (Cliente)",
    email: "maria@gmail.com",
    password: "pass123",
    role: "customer" as const,
    icon: ShoppingCart,
    color: "#16A34A",
    roleLabel: "Cliente",
    description: "maria@gmail.com",
  },
];

type Tab = "demo" | "login" | "register";

export default function Login() {
  const [tab, setTab] = useState<Tab>("demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const loginMutation = useLogin();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const doLogin = (email: string, password: string) => {
    setLoadingEmail(email);
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (res) => {
          setAuthToken(res.token);
          setUser(res.user);
          setLoadingEmail(null);
          if (res.user.role === "customer") setLocation("/customer");
          else if (res.user.role === "store") setLocation("/store");
          else if (res.user.role === "superadmin") setLocation("/admin");
        },
        onError: (err) => {
          setLoadingEmail(null);
          toast({
            title: "Error de acceso",
            description: (err as any)?.error?.message || "Credenciales inválidas",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    doLogin(email, password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setIsRegistering(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role: "customer" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error al registrar", description: data.message || "No se pudo crear la cuenta", variant: "destructive" });
        return;
      }
      toast({ title: "Cuenta creada", description: "Iniciando sesión automáticamente..." });
      doLogin(email.trim().toLowerCase(), password);
    } catch {
      toast({ title: "Error de red", description: "Intenta de nuevo", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex mesh-bg"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Left panel — branding (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg, hsl(194 80% 38%) 0%, hsl(220 30% 22%) 100%)",
        }}
      >
        <div className="absolute inset-0 pharma-grid opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-mono font-black text-xl tracking-widest">DISTRIMED</span>
          </div>
          <h2 className="text-white font-sans font-bold text-3xl leading-tight mb-4">
            Red de Distribución<br />
            <span style={{ color: "rgba(255,255,255,0.70)" }}>Farmacéutica</span>
          </h2>
          <p className="text-white/60 font-sans text-sm leading-relaxed">
            Plataforma B2B/B2C para el área metropolitana de Medellín. Conectamos distribuidoras, tiendas y clientes en tiempo real con GPS integrado.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: MapPin, text: "12 tiendas reales en Medellín con GPS" },
            { icon: Package, text: "100+ productos farmacéuticos catalogados" },
            { icon: Activity, text: "Modo Caminata — compra al caminar" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white/80" />
              </div>
              <p className="text-white/70 font-mono text-xs">{text}</p>
            </div>
          ))}
          <p className="text-white/30 font-mono text-[10px] mt-6">© 2026 DISTRIMED · Medellín, Colombia</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-mono font-black text-2xl text-foreground tracking-widest">DISTRIMED</h1>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Red de Distribución Farmacéutica</p>
          </div>

          <div className="lg:mb-6 mb-2">
            <h2 className="font-sans text-2xl font-bold text-foreground">Bienvenido</h2>
            <p className="text-muted-foreground text-sm mt-1">Selecciona una cuenta de demo o inicia sesión</p>
          </div>

          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6 gap-1"
            style={{ background: "hsl(var(--muted))" }}
          >
            {([
              { key: "demo", label: "Acceso Rápido", icon: ShieldCheck },
              { key: "login", label: "Iniciar Sesión", icon: LogIn },
              { key: "register", label: "Registrarse", icon: UserPlus },
            ] as { key: Tab; label: string; icon: typeof LogIn }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wide transition-all duration-200"
                style={tab === key ? {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--primary))",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                  fontWeight: "bold",
                } : {
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* DEMO TAB */}
          {tab === "demo" && (
            <div className="space-y-2.5">
              <p className="text-xs font-mono text-muted-foreground text-center mb-4 uppercase tracking-widest">
                Haz clic para acceder al instante
              </p>
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                const isLoading = loadingEmail === account.email;
                return (
                  <button
                    key={account.email}
                    onClick={() => doLogin(account.email, account.password)}
                    disabled={loadingEmail !== null}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group disabled:opacity-60 hover:shadow-sm hover:-translate-y-0.5"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${account.color}60`;
                      (e.currentTarget as HTMLElement).style.background = `${account.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                      (e.currentTarget as HTMLElement).style.background = "hsl(var(--card))";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ background: `${account.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: account.color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-sans font-semibold text-foreground text-sm">{account.label}</span>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase tracking-wide font-bold"
                          style={{ background: `${account.color}15`, color: account.color }}
                        >
                          {account.roleLabel}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{account.description}</span>
                    </div>
                    <div className="text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-1">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                );
              })}
              <p className="text-center text-xs text-muted-foreground font-mono mt-5">
                ¿Tienes cuenta propia?{" "}
                <button onClick={() => setTab("login")} className="text-primary font-bold hover:underline">
                  Iniciar sesión
                </button>{" "}
                ·{" "}
                <button onClick={() => setTab("register")} className="text-primary font-bold hover:underline">
                  Registrarse
                </button>
              </p>
            </div>
          )}

          {/* LOGIN TAB */}
          {tab === "login" && (
            <form
              onSubmit={handleLoginSubmit}
              className="space-y-5 p-6 rounded-2xl shadow-sm"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Correo electrónico</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 font-mono"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 font-mono"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-11 font-mono text-sm uppercase tracking-wider"
              >
                {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                {loginMutation.isPending ? "Verificando..." : "Iniciar Sesión"}
              </Button>
              <p className="text-center text-xs text-muted-foreground font-mono">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => setTab("register")} className="text-primary font-bold hover:underline">
                  Regístrate gratis
                </button>
              </p>
            </form>
          )}

          {/* REGISTER TAB */}
          {tab === "register" && (
            <form
              onSubmit={handleRegister}
              className="space-y-4 p-6 rounded-2xl shadow-sm"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Nombre completo</Label>
                <Input
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Correo electrónico</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 font-mono"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full h-11 font-mono text-sm uppercase tracking-wider"
              >
                {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isRegistering ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
              <p className="text-center text-xs text-muted-foreground font-mono">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => setTab("login")} className="text-primary font-bold hover:underline">
                  Iniciar sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
