import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function RecoverScreen() {
  const { authMessage, resetPasswordWithCode, sendResetPasswordEmail } = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    try {
      setSubmitting(true);
      setError(null);
      await sendResetPasswordEmail(email);
      setSent(true);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo enviar el correo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    try {
      setSubmitting(true);
      setError(null);
      await resetPasswordWithCode({
        email,
        code,
        newPassword
      });
      setCode("");
      setNewPassword("");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "No se pudo actualizar la contrasena.");
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
          Tu backend usa recuperacion por codigo. Primero enviamos el codigo y despues te dejamos fijar una nueva contrasena.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email de acceso" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {sent ? (
            <>
              <Input placeholder="Codigo de 6 digitos" value={code} onChange={(event) => setCode(event.target.value)} />
              <Input
                placeholder="Nueva contrasena"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </>
          ) : null}
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          {sent ? (
            <Button
              fullWidth
              onClick={() => void handleResetPassword()}
              disabled={submitting || !email || !code || !newPassword}
            >
              {submitting ? "Actualizando..." : "Guardar nueva contrasena"}
            </Button>
          ) : (
            <Button fullWidth onClick={() => void handleSendCode()} disabled={submitting || !email}>
              {submitting ? "Enviando..." : "Enviar codigo"}
            </Button>
          )}
          {sent ? (
            <Button variant="secondary" fullWidth onClick={() => void handleSendCode()} disabled={submitting || !email}>
              Reenviar codigo
            </Button>
          ) : null}
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
