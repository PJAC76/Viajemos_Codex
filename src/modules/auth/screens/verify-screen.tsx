import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function VerifyScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authMessage, resendVerificationEmail, verifyEmailCode } = useSession();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify() {
    try {
      setSubmitting(true);
      setError(null);
      await verifyEmailCode({ email, otp });
      navigate(inviteToken ? `/invite/${inviteToken}` : "/trips");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "No se pudo verificar el codigo.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      setError(null);
      await resendVerificationEmail(email);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "No se pudo reenviar el codigo.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Verificacion</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Confirma tu email</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          InsForge esta configurado con verificacion por codigo. Introduce el codigo de 6 digitos que has recibido.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input placeholder="Codigo de verificacion" value={otp} onChange={(event) => setOtp(event.target.value)} />
          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {authMessage ? <p className="text-sm font-medium text-emerald-600">{authMessage}</p> : null}
          <Button fullWidth onClick={() => void handleVerify()} disabled={submitting || !email || !otp}>
            {submitting ? "Verificando..." : "Verificar email"}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => void handleResend()} disabled={resending || !email}>
            {resending ? "Reenviando..." : "Reenviar codigo"}
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
