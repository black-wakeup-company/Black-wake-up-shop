import React, { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { CheckCircle2, Loader2, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { auth } from '../../services/firebase';
import { acceptEmployeeInvitation } from '../../services/employeeService';

interface Props {
  storeId: string;
  invitationId: string;
}

type Mode = 'login' | 'register';

export const EmployeeInvitationView: React.FC<Props> = ({ storeId, invitationId }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (cause) {
      const code = (cause as { code?: string })?.code;
      const known: Record<string, string> = {
        'auth/invalid-credential': 'Identifiants incorrects.',
        'auth/user-not-found': 'Aucun compte trouvé avec cette adresse.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/email-already-in-use': 'Cette adresse possède déjà un compte. Connectez-vous plutôt.',
        'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
        'auth/unauthorized-domain': 'Ce domaine doit être autorisé dans Firebase Authentication.',
        'auth/operation-not-allowed': 'Cette méthode de connexion n’est pas activée dans Firebase.',
        'auth/popup-closed-by-user': 'La fenêtre Google a été fermée.',
        'auth/network-request-failed': 'Connexion réseau impossible. Vérifiez Internet.'
      };
      setError((code && known[code]) || (cause instanceof Error ? cause.message : 'Une erreur est survenue.'));
    } finally {
      setBusy(false);
    }
  };

  const submitCredentials = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    void run(async () => {
      if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await sendEmailVerification(result.user);
        setMessage('Compte créé. Vérifiez votre boîte e-mail, puis revenez ici pour actualiser votre statut.');
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setMessage('Connexion effectuée. Vérifiez que vous utilisez l’adresse invitée.');
      }
      setPassword('');
    });
  };

  const signInGoogle = () => void run(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    setMessage('Connexion Google effectuée. Vérifiez que cette adresse correspond à l’invitation.');
  });

  const refreshVerification = () => {
    if (!auth.currentUser) return;
    void run(async () => {
      await reload(auth.currentUser!);
      setUser(auth.currentUser);
      setMessage('Statut de vérification actualisé.');
    });
  };

  const accept = () => void run(async () => {
    const current = auth.currentUser;
    if (!current) throw new Error('Connectez-vous avant de continuer.');
    await reload(current);
    if (!auth.currentUser?.emailVerified) throw new Error('Vérifiez votre adresse e-mail avant d’accepter.');
    await acceptEmployeeInvitation(storeId, invitationId);
    setAccepted(true);
    setMessage('Invitation acceptée. Votre accès employé est maintenant activé.');
  });

  if (accepted) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <section className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-white p-7 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-xl font-black text-slate-900">Invitation acceptée</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          <a href={import.meta.env.BASE_URL} className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white">Ouvrir l’application</a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 to-emerald-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><UserCheck className="h-6 w-6 text-emerald-300" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-200">Black Wakeup Shop</p>
              <h1 className="text-xl font-black">Invitation employé</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">Connectez-vous avec l’adresse e-mail qui a reçu cette invitation. Seul le propriétaire peut définir votre rôle.</p>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" /> Vérification obligatoire</div>
            <p className="mt-1">L’accès ne sera activé qu’après vérification de l’e-mail et validation de l’invitation. Une invitation expirée, révoquée ou destinée à une autre adresse sera refusée.</p>
          </div>

          {user ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-800">Compte connecté</p>
              <p className="mt-1 break-all text-sm text-slate-700">{user.email || 'Compte Google'}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${user.emailVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {user.emailVerified ? 'Adresse vérifiée' : 'Vérification requise'}
              </span>
              {!user.emailVerified && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void run(async () => { await sendEmailVerification(user); setMessage('E-mail de vérification envoyé.'); })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Renvoyer l’e-mail</button>
                  <button type="button" disabled={busy} onClick={refreshVerification} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">J’ai vérifié mon e-mail</button>
                </div>
              )}
              <button type="button" disabled={busy || !user.emailVerified} onClick={accept} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accepter l’invitation
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Connexion</button>
                <button type="button" onClick={() => { setMode('register'); setError(''); setMessage(''); }} className={`rounded-lg px-3 py-2 text-xs font-bold ${mode === 'register' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Créer un compte</button>
              </div>
              <form onSubmit={submitCredentials} className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Adresse e-mail invitée</span>
                  <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="employe@exemple.com" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Mot de passe</span>
                  <input type="password" required minLength={6} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="6 caractères minimum" />
                </label>
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</button>
              </form>
              <button type="button" disabled={busy} onClick={signInGoogle} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-50">Continuer avec Google</button>
            </>
          )}

          {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">{message}</p>}
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs leading-5 text-rose-800">{error}</p>}
          <p className="text-[11px] leading-5 text-slate-500">Le lien contient uniquement l’identifiant de la boutique et de l’invitation. Il ne donne aucun accès tant que l’identité et l’adresse e-mail ne sont pas vérifiées.</p>
        </div>
      </section>
    </main>
  );
};
