import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function LoginScreen() {
  const navigate = useNavigate();
  const { authMessage, signInDemo, signInWithGoogle, signInWithPassword } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    try {
      setSubmitting(true);
      setError(null);
      await signInWithPassword({ email, password });
      navigate("/trips");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo iniciar sesion.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Acceso</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Entra en tu proximo viaje</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Base lista para email/password, Google OAuth y session provider con InsForge.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            placeholder="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          <Button fullWidth onClick={() => void handleLogin()} disabled={submitting || !email || !password}>
            {submitting ? "Entrando..." : "Entrar con email"}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              void signInDemo().then(() => navigate("/trips"));
            }}
          >
            Entrar con demo
          </Button>
          <Button variant="secondary" fullWidth onClick={() => void signInWithGoogle()}>
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
