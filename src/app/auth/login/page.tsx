'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '../actions';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result && !result.success) {
      setError(result.error || 'Ocurrió un error al iniciar sesión.');
      setLoading(false);
    } else if (result && result.redirect) {
      router.push(result.redirect);
      router.refresh();
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Círculos decorativos de fondo con difuminado (Glow effects) */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8">
        {/* Encabezado */}
        <div className="text-center">
          <Link href="/" className="inline-block text-2xl font-extrabold tracking-wider text-white">
            ALAMANO<span className="bg-gradient-to-r from-violet-400 to-teal-400 bg-clip-text text-transparent">V2</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Ingresa a tu cuenta para gestionar tus servicios u obtener clientes.
          </p>
        </div>

        {/* Tarjeta de Formulario Glassmorphism */}
        <div className="border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl rounded-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Input de Correo */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="ejemplo@correo.com"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-10 text-white placeholder-slate-600 outline-none transition duration-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Input de Contraseña */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Contraseña
                </label>
                <a href="#" className="text-xs text-violet-400 hover:text-violet-300">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-4 pl-10 text-white placeholder-slate-600 outline-none transition duration-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-violet-600 to-teal-500 py-3.5 px-4 text-sm font-semibold text-white shadow-lg transition duration-200 hover:from-violet-500 hover:to-teal-400 hover:shadow-violet-500/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar Sesión <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Pie de página de Auth */}
        <p className="text-center text-sm text-slate-400">
          ¿No tienes una cuenta?{' '}
          <Link href="/auth/register" className="font-semibold text-teal-400 hover:text-teal-300 transition duration-200">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
