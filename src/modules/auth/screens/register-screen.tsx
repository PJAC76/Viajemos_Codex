import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function RegisterScreen() {
  const navigate = useNavigate();
  const { authMessage, signUp } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    try {
      setSubmitting(true);
      setError(null);
      const result = await signUp({ name, email, password });

      if (!result.requiresEmailVerification) {
        navigate("/trips");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Registro</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Crea tu cuenta de Viajemos</h1>
        <div className="mt-8 space-y-4">
          <Input placeholder="Nombre visible" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input
            placeholder="Contrasena"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          <Button fullWidth onClick={() => void handleRegister()} disabled={submitting || !email || !password}>
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Ya tienes cuenta?{" "}
          <Link to="/auth/login" className="font-semibold text-primary">
            Iniciar sesion
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
