import React from 'react';
import {
  Cloud,
  ShieldCheck,
  Users,
  Mail,
  LockKeyhole,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const plannedSteps = [
  'Connexion sécurisée du propriétaire avec son compte Google ou e-mail',
  'Invitation d’un employé avec son adresse e-mail vérifiée',
  'Activation de l’accès par l’employé lui-même',
  'Attribution du rôle : Gérant ou Caissier',
  'Isolation des données entre boutiques et synchronisation contrôlée'
];

export const MultiBoutiqueEmployeesView: React.FC = () => {
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
              Un espace distinct des profils caissiers locaux. Les employés cloud auront leur propre
              compte sécurisé et des permissions limitées à cette boutique.
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
            <h3 className="text-sm font-bold text-amber-950">Activation distante volontairement verrouillée</h3>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">
              Aucun employé n’est chargé ou modifié depuis Firestore dans cette version de l’écran.
              La connexion cloud et les invitations seront activées après validation des tests de sécurité
              et déploiement coordonné des règles. Vos données locales restent inchangées.
            </p>
          </div>
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

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Mail className="h-4 w-4" />
          <p className="text-xs font-bold">Aucune invitation n’a été envoyée</p>
        </div>
        <p className="mt-1 pl-6 text-xs leading-5 text-slate-500">
          Les actions d’invitation, de changement de rôle et de suspension ne seront proposées ici
          qu’une fois le parcours d’authentification propriétaire/employé prêt et les règles testées.
        </p>
      </section>
    </div>
  );
};
