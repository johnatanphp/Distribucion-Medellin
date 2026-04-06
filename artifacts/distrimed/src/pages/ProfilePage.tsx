import { useState } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Mail, Calendar, Key, Save, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpdateUser } from "@workspace/api-client-react";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [editing, setEditing] = useState(false);

  const updateUser = useUpdateUser({
    mutation: {
      onSuccess: (updated) => {
        setUser({ ...user!, name: updated.name, email: updated.email });
        setEditing(false);
        toast({ title: "Perfil actualizado", description: "Los cambios han sido guardados." });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
      },
    },
  });

  const handleSave = () => {
    if (!user) return;
    updateUser.mutate({ id: user.id, data: { name } });
  };

  const roleLabel: Record<string, string> = {
    superadmin: "Super Administrador",
    store: "Propietario de Tienda",
    customer: "Cliente",
  };

  const roleColor: Record<string, string> = {
    superadmin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    store: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    customer: "bg-green-500/10 text-green-400 border-green-500/30",
  };

  if (!user) return null;

  return (
    <DashboardLayout title="Mi Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card/50 backdrop-blur-md border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-primary flex items-center gap-2">
              <User className="w-4 h-4" /> Información de Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center">
                <span className="font-mono text-xl font-bold text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-white">{user.name}</p>
                <Badge className={`text-[10px] border mt-1 ${roleColor[user.role] || ""}`}>
                  {roleLabel[user.role] || user.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-black/20 rounded-md border border-primary/10 flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Correo</p>
                  <p className="text-sm font-mono text-white mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="p-3 bg-black/20 rounded-md border border-primary/10 flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Rol</p>
                  <p className="text-sm font-mono text-white mt-0.5">{roleLabel[user.role] || user.role}</p>
                </div>
              </div>

              <div className="p-3 bg-black/20 rounded-md border border-primary/10 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Miembro desde</p>
                  <p className="text-sm font-mono text-white mt-0.5">
                    {new Date(user.createdAt).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {user.storeId && (
                <div className="p-3 bg-black/20 rounded-md border border-primary/10 flex items-start gap-3">
                  <Store className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Tienda</p>
                    <p className="text-sm font-mono text-white mt-0.5">ID #{user.storeId}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-primary flex items-center gap-2">
              <Key className="w-4 h-4" /> Editar Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Nombre completo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
                className="bg-black/50 border-primary/30 focus:border-primary text-white font-mono"
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground font-mono text-xs uppercase">Correo electrónico</Label>
              <Input
                value={user.email}
                disabled
                className="bg-black/30 border-primary/10 text-muted-foreground font-mono cursor-not-allowed"
              />
              <p className="text-[10px] font-mono text-muted-foreground">El correo no puede modificarse</p>
            </div>

            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-black font-mono uppercase text-xs"
              >
                Editar Nombre
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={updateUser.isPending || !name.trim()}
                  className="bg-primary/10 text-primary border border-primary hover:bg-primary hover:text-black font-mono uppercase text-xs"
                >
                  <Save className="w-3 h-3 mr-2" />
                  {updateUser.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setEditing(false); setName(user.name); }}
                  className="text-muted-foreground hover:text-white font-mono uppercase text-xs"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-md border-primary/20">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase text-primary">Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/20 rounded-md border border-primary/10 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-400 uppercase">Activo</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground">Estado de cuenta</p>
              </div>
              <div className="p-3 bg-black/20 rounded-md border border-primary/10 text-center">
                <p className="text-primary font-mono font-bold text-sm">v2.0</p>
                <p className="text-xs font-mono text-muted-foreground">Versión plataforma</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
