import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, reload, type User } from 'firebase/auth';
import { AlertTriangle, CheckCircle2, Clock3, Link2, Loader2, ShieldCheck } from 'lucide-react';
import { OwnerAuthPanel } from '../admin/OwnerAuthPanel';
import { acceptEmployeeInvitation } from '../../services/employeeService';
import { auth } from '../../services/firebase';

interface EmployeeInvitationLandingProps { storeId: string; invitationId: string; }

export const EmployeeInvitationLanding: React.FC<EmployeeInvitationLandingProps> = ({ storeId, invitationId }) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [checking, setChecking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const refreshAccount = async () => {
    if (!auth.currentUser) return;
    setChecking(true); setError('');
    try { await reload(auth.currentUser); setUser(auth.currentUser); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’actualiser le compte.'); }
    finally { setChecking(false); }
  };

  const acceptInvitation = async () => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) {
      setError('Connectez-vous avec l’adresse invitée et vérifiez votre e-mail avant de continuer.'); return;
    }
    setAccepting(true); setError('');
    try { await acceptEmployeeInvitation(storeId, invitationId); setAccepted(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Impossible d’accepter cette invitation.'); }
    finally { setAccepting(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200"><Link2 className="h-3.5 w-3.5" /> Invitation employé</div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Rejoindre une boutique</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Connectez-vous avec l’adresse e-mail qui a reçu l’invitation. Seul le compte correspondant pourra l’accepter.</p>
        </header>
        {accepted ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-3 text-lg font-bold text-emerald-950">Invitation acceptée</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">Votre accès employé a été créé. La synchronisation et l’ouverture de l’espace de travail seront activées dans une prochaine étape sécurisée.</p>
          </section>
        ) : (
          <>
            <OwnerAuthPanel />
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><h2 className="text-sm font-bold text-slate-900">Vérification avant acceptation</h2><p className="mt-1 text-xs leading-5 text-slate-500">L’invitation est liée à une adresse e-mail et à un rôle définis par le propriétaire. Le rôle ne peut pas être modifié depuis ce lien.</p></div></div>
              {user && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="break-all text-xs font-semibold text-slate-800">{user.email || 'Compte sans adresse e-mail'}</p><p className={user.emailVerified ? 'mt-1 text-xs font-medium text-emerald-700' : 'mt-1 text-xs font-medium text-amber-700'}>{user.emailVerified ? 'Adresse vérifiée' : 'Adresse non vérifiée'}</p>{!user.emailVerified && <button type="button" disabled={checking} onClick={refreshAccount} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}Actualiser après vérification</button>}</div>}
              <button type="button" onClick={acceptInvitation} disabled={!user || !user.emailVerified || accepting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Accepter l’invitation</button>
              {error && <p role="alert" className="mt-3 flex items-start gap-2 text-xs leading-5 text-rose-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
            </section>
          </>
        )}
        <p className="text-center text-[11px] leading-5 text-slate-500">La caisse locale reste indépendante. Cette page ne modifie aucune donnée locale et n’active pas la synchronisation cloud.</p>
      </div>
    </main>
  );
};