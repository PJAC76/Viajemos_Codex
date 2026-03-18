import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function RecoverScreen() {
  const { authMessage, sendResetPasswordEmail } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRecover() {
    try {
      setSubmitting(true);
      setError(null);
      await sendResetPasswordEmail(email);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo enviar el correo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Recovery</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Recupera tu acceso</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Preparado para el flujo de recuperacion de InsForge Auth.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email de acceso" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          <Button fullWidth onClick={() => void handleRecover()} disabled={submitting || !email}>
            {submitting ? "Enviando..." : "Enviar enlace"}
          </Button>
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/auth/login" className="font-semibold text-primary">
            Volver al login
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
