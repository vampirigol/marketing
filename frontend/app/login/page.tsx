"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setError(data?.error || "Credenciales invalidas.");
        return;
      }

      const data = await resp.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.usuario));
      }

      router.replace("/dashboard");
    } catch (err) {
      setError("No se pudo iniciar sesion. Verifica el backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-10 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200/70 bg-white p-3 shadow-md">
            <Image
              src="/logo-clinicas.png"
              alt="Clinicas Adventistas"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Sistema CRM
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Acceso al portal
            </h1>
            <p className="text-sm text-slate-600">
              Inicia sesion para continuar con la gestion.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Usuario o email
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="admin123"
              required
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? "Ingresando..." : "Iniciar sesion"}
          </button>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Usuario demo: <span className="font-semibold">admin</span> /
            Contrasena: <span className="font-semibold">admin123</span>
          </div>
        </form>
      </div>
    </div>
  );
}
