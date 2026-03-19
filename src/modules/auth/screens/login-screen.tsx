import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { useSession } from "../../../app/providers/session-provider";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { hasInsforgeEnv } from "../../../lib/env";
import { authClient } from "../data/auth-client";

function isEmailVerificationError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("verify") ||
    normalized.includes("verified") ||
    normalized.includes("verifica") ||
    normalized.includes("validado") ||
    normalized.includes("email not verified")
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authMessage, signInDemo, signInWithGoogle, signInWithPassword, user } = useSession();
  const inviteToken = searchParams.get("invite");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextPath = authClient.consumePostAuthRedirect();
    navigate(nextPath ?? (inviteToken ? `/invite/${inviteToken}` : "/trips"), { replace: true });
  }, [inviteToken, navigate, user]);

  async function handleLogin() {
    try {
      setSubmitting(true);
      setError(null);
      setNeedsVerification(false);
      await signInWithPassword({ email, password });
      navigate(inviteToken ? `/invite/${inviteToken}` : "/trips");
    } catch (authError) {
      const nextError = authError instanceof Error ? authError.message : "No se pudo iniciar sesion.";
      setError(nextError);
      setNeedsVerification(isEmailVerificationError(nextError));
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
          Accede con email o Google. Si tu cuenta aun no esta verificada, podras confirmarla por codigo.
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
          {needsVerification ? (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                const params = new URLSearchParams({ email });

                if (inviteToken) {
                  params.set("invite", inviteToken);
                }

                navigate(`/auth/verify?${params.toString()}`);
              }}
            >
              Introducir codigo de verificacion
            </Button>
          ) : null}
          <Button fullWidth onClick={() => void handleLogin()} disabled={submitting || !email || !password}>
            {submitting ? "Entrando..." : "Entrar con email"}
          </Button>
          {!hasInsforgeEnv ? (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                void signInDemo().then(() => navigate(inviteToken ? `/invite/${inviteToken}` : "/trips"));
              }}
            >
              Entrar con demo
            </Button>
          ) : null}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => void signInWithGoogle(inviteToken ? `/invite/${inviteToken}` : "/trips")}
          >
            Continuar con Google
          </Button>
        </div>
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/auth/recover" className="font-semibold text-primary">
            Recuperar acceso
          </Link>
          <Link
            to={email ? `/auth/verify?email=${encodeURIComponent(email)}` : "/auth/verify"}
            className="font-semibold text-primary"
          >
            Verificar email
          </Link>
          <Link
            to={inviteToken ? `/auth/register?invite=${encodeURIComponent(inviteToken)}` : "/auth/register"}
            className="font-semibold text-slate-600 dark:text-slate-300"
          >
            Crear cuenta
          </Link>
        </div>
      </Card>
    </AuthLayout>
  );
}
