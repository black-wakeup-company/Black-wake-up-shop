import React, { useState } from 'react';
import { OwnerAuthPanel } from './OwnerAuthPanel';
import {
  Cloud,
  ShieldCheck,
  Users,
  Mail,
  LockKeyhole,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Clock3,
  Link2,
  Ban
} from 'lucide-react';

// Keep remote invitation actions disabled until Firestore rules are deliberately deployed.
const REMOTE_INVITATIONS_ENABLED = false;

const plannedSteps = [
  'Connexion sécurisée du propriétaire avec son compte Google ou e-mail',
  'Invitation d’un employé avec son adresse e-mail vérifiée',
  'Activation de l’accès par l’employé lui-même',
  'Attribution du rôle : Gérant ou Caissier',
  'Isolation des données entre boutiques et synchronisation contrôlée'
];

export const MultiBoutiqueEmployeesView: React.FC = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState<'manager' | 'cashier'>('cashier');

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              <Cloud className="h-3.5 w-3.5" />
              Gestion cloud multiboutique
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Employés de la boutique</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Un espace distinct des profils caissiers locaux. Chaque employé disposera de son propre
              compte et de permissions limitées à sa boutique.
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <Users className="h-8 w-8 text-emerald-300" />
          </div>
        </div>
      </section>

      <OwnerAuthPanel />

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="text-sm font-bold text-amber-950">Accès Firestore encore verrouillé</h3>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">
              L’interface est préparée, mais aucune invitation ne peut encore être créée, consultée
              ou révoquée depuis cet écran. Les règles distantes ne sont pas déployées. Les données
              locales et la caisse continuent de fonctionner indépendamment.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Préparer une invitation</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">Bientôt disponible</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Renseignez les informations de l’employé. Le formulaire est en aperçu et ne transmet aucune donnée.
        </p>

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Nom complet</span>
            <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)}
              disabled={REMOTE_INVITATIONS_ENABLED} placeholder="Nom de l’employé"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Adresse e-mail</span>
            <input type="email" value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)}
              disabled={REMOTE_INVITATIONS_ENABLED} placeholder="employe@exemple.com"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Rôle dans la boutique</span>
            <select value={employeeRole} onChange={(event) => setEmployeeRole(event.target.value as 'manager' | 'cashier')}
              disabled={REMOTE_INVITATIONS_ENABLED}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed">
              <option value="cashier">Caissier — ventes et opérations autorisées</option>
              <option value="manager">Gérant — gestion opérationnelle autorisée</option>
            </select>
          </label>
          <button type="button" disabled={!REMOTE_INVITATIONS_ENABLED}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white opacity-50 md:col-span-2">
            <Mail className="h-4 w-4" /> Créer l’invitation
          </button>
        </form>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Après activation, un lien individuel pourra être partagé par WhatsApp. Aucun e-mail automatique n’est envoyé par cette application à ce stade.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">Invitations en attente</h3>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">0 invitation chargée</span>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center">
          <Ban className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-2 text-xs font-semibold text-slate-700">Liste non connectée</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">Elle affichera les invitations en attente, acceptées ou révoquées après activation sécurisée de Firestore.</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Authentification</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Compte individuel</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Chaque employé utilisera son propre e-mail et son propre mot de passe.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Permissions</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Rôles contrôlés</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Le propriétaire pourra gérer les rôles et suspendre un accès.</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <RefreshCw className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Synchronisation</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Multi-appareils</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">La synchronisation cloud sera séparée de la sauvegarde Google Drive.</p>
        </article>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Parcours prévu pour les employés</h3>
        </div>
        <ol className="mt-4 space-y-3">
          {plannedSteps.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                {index + 1}
              </span>
              <span className="pt-0.5 text-xs leading-5 text-slate-600">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
