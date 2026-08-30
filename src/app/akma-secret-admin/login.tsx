"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Lock, ShieldCheck, User } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "ورود ناموفق بود");
      } else {
        router.refresh();
      }
    } catch {
      setError("خطا در برقراری ارتباط");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="card w-full max-w-md p-8 sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-accent2 to-accent text-on-accent shadow-lg shadow-accent/25">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mt-6 text-center text-2xl font-black tracking-tight">
          ورود به پنل مدیریت
        </h1>
        <p className="mt-2 text-center text-xs text-muted">
          این بخش فقط برای مدیر فروشگاه است.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="relative">
            <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field !pr-10"
              placeholder="نام کاربری"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              dir="ltr"
              required
            />
          </div>
          <div className="relative">
            <KeyRound size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="field !pr-10"
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              dir="ltr"
              required
            />
          </div>
          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs font-bold text-rose-400">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary h-12 w-full text-sm">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
            ورود به پنل
          </button>
        </form>
      </div>
    </div>
  );
}
