import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User
} from 'firebase/auth';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LogOut, Mail, ShieldCheck } from 'lucide-react';
import { auth } from '../../services/firebase';

type AuthMode = 'login' | 'register';

export const OwnerAuthPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await action();
      setMessage(successMessage);
      setPassword('');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const known: Record<string, string> = {
        'auth/invalid-email': 'Adresse e-mail invalide.',
        'auth/user-not-found': 'Aucun compte trouvé avec cette adresse.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/invalid-credential': 'Identifiants incorrects.',
        'auth/email-already-in-use': 'Cette adresse possède déjà un compte.',
        'auth/weak-password': 'Choisissez un mot de passe d’au moins 6 caractères.',
        'auth/popup-closed-by-user': 'La fenêtre Google a été fermée avant la connexion.',
        'auth/unauthorized-domain': 'Ce domaine doit être autorisé dans les paramètres Firebase Authentication.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.'
      };
      setError((code && known[code]) || (err instanceof Error ? err.message : 'Une erreur est survenue.'));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    if (mode === 'register') {
      if (password.length < 6) {
        setError('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      void run(async () => {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await sendEmailVerification(credential.user);
      }, 'Compte créé. Consultez votre boîte e-mail pour vérifier votre adresse.');
    } else {
      void run(() => signInWithEmailAndPassword(auth, normalizedEmail, password), 'Connexion effectuée.');
    }
  };

  const handleGoogle = () => {
    void run(
      () => signInWithPopup(auth, new GoogleAuthProvider()),
      'Connexion Google effectuée.'
    );
  };

  const refreshVerification = () => {
    if (!auth.currentUser) return;
    void run(async () => {
      await reload(auth.currentUser!);
      setUser(auth.currentUser);
    }, 'Statut de vérification actualisé.');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Compte propriétaire — authentification</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Cette étape gère uniquement la connexion Firebase. Elle ne crée pas encore la boutique
            distante et ne lit ni n’écrit aucune donnée Firestore.
          </p>
        </div>
      </div>

      {user ? (
        <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">Session Firebase active</span>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.emailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {user.emailVerified ? 'E-mail vérifié' : 'Vérification requise'}
            </span>
          </div>
          <p className="break-all text-xs text-slate-600">{user.email || 'Compte Google'}</p>
          {!user.emailVerified && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => sendEmailVerification(user), 'E-mail de vérification envoyé.')}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Renvoyer l’e-mail
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={refreshVerification}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Actualiser le statut
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => signOut(auth), 'Déconnexion effectuée.')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Se déconnecter
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Connexion
            </button>
            <button type="button" onClick={() => { setMode('register'); setError(''); setMessage(''); }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Créer un compte
            </button>
          </div>
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Adresse e-mail</span>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                placeholder="vous@exemple.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700">Mot de passe</span>
              <span className="relative block">
                <input type={showPassword ? 'text' : 'password'} required minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-emerald-600"
                  placeholder="6 caractères minimum" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Afficher ou masquer le mot de passe">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>
            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
          {mode === 'login' && (
            <button type="button" disabled={busy || !email.trim()}
              onClick={() => void run(() => sendPasswordResetEmail(auth, email.trim().toLowerCase()), 'E-mail de réinitialisation envoyé.')}
              className="mt-3 text-xs font-semibold text-emerald-800 underline disabled:opacity-40">
              Mot de passe oublié ?
            </button>
          )}
          <button type="button" disabled={busy} onClick={handleGoogle}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Mail className="h-4 w-4" /> Continuer avec Google
          </button>
        </div>
      )}

      {busy && <p className="mt-3 text-xs text-slate-500">Opération en cours…</p>}
      {message && <p role="status" className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</p>}
      {error && <p role="alert" className="mt-3 text-xs font-medium text-rose-700">{error}</p>}
      <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
        Important : la connexion seule ne donne pas accès aux données de la boutique. La création du
        magasin cloud et les permissions resteront bloquées jusqu’à validation des règles Firestore.
      </p>
    </section>
  );
};
