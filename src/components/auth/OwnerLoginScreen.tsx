import React, { useState } from 'react';
import { signInOwnerWithGoogle } from '../../services/ownerAuth';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Cloud,
  LockKeyhole,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface OwnerLoginScreenProps {
  onAuthenticated: (user: { uid: string; email: string | null; displayName: string | null }) => void;
}

/**
 * Premium owner entry screen. Kept as a standalone component until the
 * multi-store data migration and Firestore rules are ready for activation.
 */
export const OwnerLoginScreen: React.FC<OwnerLoginScreenProps> = ({ onAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const user = await signInOwnerWithGoogle();
      onAuthenticated({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
    } catch (error) {
      console.error('Owner sign-in failed:', error);
      setErrorMessage('La connexion n’a pas abouti. Vérifiez votre connexion Internet puis réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d18] text-white selection:bg-emerald-300 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-emerald-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] shadow-lg shadow-emerald-950/30">
              <Building2 className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-white">BOUTIQUE<span className="text-emerald-300">PRO</span></p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Business workspace</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            Espace propriétaire
          </div>
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-16">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              PILOTEZ VOTRE COMMERCE AUTREMENT
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Votre boutique.
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                Votre univers.
              </span>
              <span className="mt-2 block text-slate-300">Votre réussite.</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
              Retrouvez vos ventes, votre stock et votre équipe dans un espace de gestion pensé pour avancer avec clarté, sécurité et liberté.
            </p>

            <div className="mt-9 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <Cloud className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-xs font-bold text-white">Multi-appareils</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Retrouvez votre espace connecté</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-xs font-bold text-white">Accès privé</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Un espace par propriétaire</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <BadgeCheck className="mb-3 h-5 w-5 text-violet-300" />
                <p className="text-xs font-bold text-white">Votre équipe</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Des rôles adaptés à chacun</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
              <div className="rounded-[1.55rem] border border-white/[0.07] bg-[#101827]/95 px-6 py-8 sm:px-8 sm:py-10">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-teal-500 text-slate-950 shadow-lg shadow-emerald-900/30">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Connexion sécurisée</span>
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Bienvenue</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white">Accédez à votre boutique</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Connectez-vous avec le compte Google qui sera propriétaire de cet espace.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#101827] disabled:cursor-wait disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                  ) : (
                    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.05 13.22l7.98 6.19C11.95 13.72 17.45 9.5 24 9.5Z" transform="translate(0 4)" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.86 46.98 24.55Z" />
                      <path fill="#FBBC05" d="M10.03 28.59A14.4 14.4 0 0 1 9.27 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.58 10.78l7.45-6.19Z" transform="translate(0 0)" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.55 0-12.05-4.22-14.03-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                    </svg>
                  )}
                  <span>{isLoading ? 'Connexion en cours…' : 'Continuer avec Google'}</span>
                  {!isLoading && <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />}
                </button>

                {errorMessage && (
                  <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-xs leading-5 text-rose-200">
                    {errorMessage}
                  </p>
                )}

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Protection de votre espace</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex items-start gap-3 text-[11px] leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p>Vos données de boutique seront séparées de celles des autres propriétaires. Ne partagez jamais votre compte Google.</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-[10px] tracking-wide text-slate-600">BOUTIQUEPRO · GESTION COMMERCIALE INTELLIGENTE</p>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-white/[0.07] py-5 text-[10px] text-slate-600 sm:flex-row">
          <span>© {new Date().getFullYear()} BoutiquePro. Tous droits réservés.</span>
          <span className="tracking-wider">SIMPLE · PRIVÉ · EFFICACE</span>
        </footer>
      </div>
    </main>
  );
};
