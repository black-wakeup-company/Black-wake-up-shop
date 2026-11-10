import React, { useState } from 'react';
import { signInEmployeeWithEmail } from '../../services/employeeAuth';
import {
  ArrowRight,
  Building2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
  UserRound
} from 'lucide-react';

interface EmployeeLoginScreenProps {
  onAuthenticated: (session: Awaited<ReturnType<typeof signInEmployeeWithEmail>>) => void;
}

/** Employee sign-in screen. The boutique code is shared by the store owner. */
export const EmployeeLoginScreen: React.FC<EmployeeLoginScreenProps> = ({ onAuthenticated }) => {
  const [storeId, setStoreId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = await signInEmployeeWithEmail({ storeId, email, password });
      onAuthenticated(session);
    } catch (error) {
      console.error('Employee sign-in failed:', error);
      const code = (error as { code?: string })?.code;
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setErrorMessage('Identifiants incorrects. Vérifiez votre adresse email et votre mot de passe.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Trop de tentatives. Patientez quelques instants avant de réessayer.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('Connexion Internet indisponible. Vérifiez votre réseau puis réessayez.');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible. Réessayez.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d18] px-4 py-8 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[110px]" />

      <section className="relative w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
            <Building2 className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.18em]">BOUTIQUE<span className="text-emerald-300">PRO</span></p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-slate-500">Espace collaborateur</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="rounded-[1.55rem] border border-white/[0.07] bg-[#101827]/95 px-6 py-8 sm:px-8">
            <div className="mb-7 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-slate-950">
                <UserRound className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Accès sécurisé</span>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Bon retour</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Connexion employé</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Utilisez les informations communiquées par le propriétaire de votre boutique.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-300">Code de la boutique</span>
                <span className="relative block">
                  <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={storeId}
                    onChange={(event) => setStoreId(event.target.value)}
                    required
                    autoComplete="off"
                    placeholder="Code fourni par le propriétaire"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-300">Adresse email</span>
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="username"
                    placeholder="nom@exemple.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-300">Mot de passe</span>
                <span className="relative block">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Votre mot de passe"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
                  />
                </span>
              </label>

              {errorMessage && (
                <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-xs leading-5 text-rose-200">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-400 px-4 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-900/30 border-t-emerald-950" />
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-start gap-3 border-t border-white/[0.07] pt-5 text-[11px] leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p>Votre accès est limité à la boutique à laquelle le propriétaire vous a rattaché. Si votre accès est suspendu, contactez-le.</p>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] tracking-wide text-slate-600">BOUTIQUEPRO · ESPACE ÉQUIPE</p>
      </section>
    </main>
  );
};
