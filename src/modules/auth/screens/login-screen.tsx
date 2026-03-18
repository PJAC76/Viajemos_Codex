import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function LoginScreen() {
  const navigate = useNavigate();
  const { signInDemo } = useSession();

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Acceso</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Entra en tu proximo viaje</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Base lista para email/password, Google OAuth y session provider con Supabase.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email" type="email" />
          <Input placeholder="Contrasena" type="password" />
          <Button
            fullWidth
            onClick={() => {
              void signInDemo().then(() => navigate("/trips"));
            }}
          >
            Entrar con demo
          </Button>
          <Button variant="secondary" fullWidth>
            Continuar con Google
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/auth/recover" className="font-semibold text-primary">
            Recuperar acceso
          </Link>
          <Link to="/auth/register" className="font-semibold text-slate-600 dark:text-slate-300">
            Crear cuenta
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
}
