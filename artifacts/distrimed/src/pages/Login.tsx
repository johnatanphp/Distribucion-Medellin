import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Terminal } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (res) => {
          setAuthToken(res.token);
          setUser(res.user);
          if (res.user.role === "customer") setLocation("/customer");
          else if (res.user.role === "store") setLocation("/store");
          else if (res.user.role === "superadmin") setLocation("/admin");
        },
        onError: (err) => {
          toast({
            title: "Error de acceso",
            description: err.error?.message || "Credenciales inválidas",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0e1a]">
      {/* Cyberpunk background accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md p-8 z-10 relative">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-mono font-bold tracking-tighter text-white glow-text mb-2 flex items-center justify-center gap-3">
            <Terminal className="w-10 h-10 text-primary" />
            DISTRIMED
          </h1>
          <p className="text-primary font-mono tracking-[0.3em] text-sm uppercase">
            Acceso al sistema
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-card/50 backdrop-blur-md p-8 rounded-lg border border-primary/20 glow-border">
          <div className="space-y-2">
            <Label className="text-muted-foreground font-mono text-xs uppercase">Identificador de Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
              <Input
                type="email"
                placeholder="ejemplo@distri.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground font-mono text-xs uppercase">Clave de Seguridad</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-black/50 border-primary/30 focus:border-primary text-white font-mono h-11"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary border border-primary glow-border font-mono tracking-widest uppercase transition-all duration-300"
          >
            {loginMutation.isPending ? "Procesando..." : "Inicializar Enlace"}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-black/40 border border-muted rounded text-xs font-mono text-muted-foreground">
          <p className="mb-2 text-primary">Credenciales de demo:</p>
          <ul className="space-y-1">
            <li>Admin: admin@distri.co / admin123</li>
            <li>Store: norte@distri.co / tienda123</li>
            <li>User: pedro@gmail.com / pass123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
