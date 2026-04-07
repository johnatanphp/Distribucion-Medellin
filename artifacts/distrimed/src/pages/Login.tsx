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
  User,
  Lock,
  Terminal,
  ShieldCheck,
  Store,
  ShoppingCart,
  ChevronRight,
  Loader2,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Superadmin",
    email: "admin@distri.co",
    password: "admin123",
    role: "superadmin" as const,
    icon: ShieldCheck,
    color: "from-violet-500/20 to-purple-500/10 border-violet-500/40 hover:border-violet-400/70",
    iconColor: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-300",
    description: "Gestión global del sistema",
  },
  {
    label: "Tienda Norte",
    email: "norte@distri.co",
    password: "tienda123",
    role: "store" as const,
    icon: Store,
    color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/40 hover:border-cyan-400/70",
    iconColor: "text-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-300",
    description: "norte@distri.co",
  },
  {
    label: "Tienda Poblado",
    email: "poblado@distri.co",
    password: "tienda123",
    role: "store" as const,
    icon: Store,
    color: "from-sky-500/20 to-teal-500/10 border-sky-500/40 hover:border-sky-400/70",
    iconColor: "text-sky-400",
    badge: "bg-sky-500/20 text-sky-300",
    description: "poblado@distri.co",
  },
  {
    label: "Pedro (Cliente)",
    email: "pedro@gmail.com",
    password: "pass123",
    role: "customer" as const,
    icon: ShoppingCart,
    color: "from-emerald-500/20 to-green-500/10 border-emerald-500/40 hover:border-emerald-400/70",
    iconColor: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
    description: "pedro@gmail.com",
  },
  {
    label: "María (Cliente)",
    email: "maria@gmail.com",
    password: "pass123",
    role: "customer" as const,
    icon: ShoppingCart,
    color: "from-pink-500/20 to-rose-500/10 border-pink-500/40 hover:border-pink-400/70",
    iconColor: "text-pink-400",
    badge: "bg-pink-500/20 text-pink-300",
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
            description: err.error?.message || "Credenciales inválidas",
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
        toast({
          title: "Error al registrar",
          description: data.message || "No se pudo crear la cuenta",
          variant: "destructive",
        });
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
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0e1a]">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-xl px-4 py-8 z-10 relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-mono font-bold tracking-tighter text-white mb-1 flex items-center justify-center gap-3">
            <Terminal className="w-9 h-9 text-primary" />
            DISTRIMED
          </h1>
          <p className="text-primary font-mono tracking-[0.3em] text-xs uppercase">
            Sistema de Distribución
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg border border-white/10 bg-black/40 p-1 mb-6 gap-1">
          {([
            { key: "demo", label: "Acceso Rápido", icon: ShieldCheck },
            { key: "login", label: "Iniciar Sesión", icon: LogIn },
            { key: "register", label: "Registrarse", icon: UserPlus },
          ] as { key: Tab; label: string; icon: typeof LogIn }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-mono uppercase tracking-wide transition-all duration-200 ${
                tab === key
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Demo Accounts Tab */}
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
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r ${account.color} transition-all duration-200 group disabled:opacity-60`}
                >
                  <div className={`p-2 rounded-md bg-black/30 ${account.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-semibold text-white text-sm">{account.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide ${account.badge}`}>
                        {account.role === "superadmin" ? "admin" : account.role === "store" ? "tienda" : "cliente"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{account.description}</span>
                  </div>
                  <div className={`${account.iconColor} transition-transform duration-200 group-hover:translate-x-1`}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
            <p className="text-center text-xs text-muted-foreground font-mono mt-4">
              ¿Tienes cuenta propia?{" "}
              <button onClick={() => setTab("login")} className="text-primary hover:underline">
                Iniciar sesión
              </button>{" "}
              ·{" "}
              <button onClick={() => setTab("register")} className="text-primary hover:underline">
                Registrarse
              </button>
            </p>
          </div>
        )}

        {/* Login Tab */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 bg-card/50 backdrop-blur-md p-6 rounded-lg border border-primary/20">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Correo electrónico</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending || loadingEmail !== null}
              className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary font-mono tracking-widest uppercase"
            >
              {loginMutation.isPending || loadingEmail !== null ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>
              ) : (
                "Acceder"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground font-mono">
              ¿Sin cuenta?{" "}
              <button type="button" onClick={() => setTab("register")} className="text-primary hover:underline">
                Registrarse gratis
              </button>
            </p>
          </form>
        )}

        {/* Register Tab */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-5 bg-card/50 backdrop-blur-md p-6 rounded-lg border border-primary/20">
            <div className="text-center mb-2">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Nueva cuenta de cliente
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Correo electrónico</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isRegistering || loadingEmail !== null}
              className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary font-mono tracking-widest uppercase"
            >
              {isRegistering || loadingEmail !== null ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando cuenta...</>
              ) : (
                "Crear cuenta"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground font-mono">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => setTab("login")} className="text-primary hover:underline">
                Iniciar sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
