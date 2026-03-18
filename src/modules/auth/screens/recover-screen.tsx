import { Link } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function RecoverScreen() {
  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Recovery</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Recupera tu acceso</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Preparado para el flujo de recuperacion de Supabase Auth.
        </p>
        <div className="mt-8 space-y-4">
          <Input placeholder="Email de acceso" type="email" />
          <Button fullWidth>Enviar enlace</Button>
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
