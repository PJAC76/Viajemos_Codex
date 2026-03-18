import { Link } from "react-router-dom";
import { AuthLayout } from "../../../app/layouts/auth-layout";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

export function RegisterScreen() {
  return (
    <AuthLayout>
      <Card className="w-full max-w-md p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Registro</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">Crea tu cuenta de Viajemos</h1>
        <div className="mt-8 space-y-4">
          <Input placeholder="Nombre visible" />
          <Input placeholder="Email" type="email" />
          <Input placeholder="Contrasena" type="password" />
          <Button fullWidth>Crear cuenta</Button>
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
