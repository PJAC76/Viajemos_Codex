import type { PropsWithChildren } from "react";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background-light px-4 py-8 dark:bg-background-dark">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1.2fr_0.8fr]">
        <div className="hidden bg-slate-950 p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/60">Tribu Trip</p>
            <p className="mt-2 text-sm text-white/60">By Pedro Araujo</p>
            <h1 className="mt-6 max-w-md text-5xl font-extrabold leading-tight">Unifica tu viaje, incluso cuando el grupo no para.</h1>
            <p className="mt-4 max-w-md text-sm text-white/70">
              Base modular inspirada en Stitch para organizar lugares, reservas, gastos y ruta diaria.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm text-white/70">Preparado para PWA, InsForge, Google Maps y crecimiento por modulos.</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 md:p-12">{children}</div>
      </div>
    </div>
  );
}
