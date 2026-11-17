import React, { useEffect, useMemo, useState } from 'react';
import { BoutiqueProvider, useBoutique } from './context/BoutiqueContext';
import { Header } from './components/layout/Header';
import { CaisseWorkspace } from './components/pos/CaisseWorkspace';
import { AdminView } from './components/admin/AdminView';
import { AdminPinModal } from './components/auth/AdminPinModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { GoogleDriveBackupModal } from './components/common/GoogleDriveBackupModal';
import { ToastContainer } from './components/common/ToastContainer';
import { LockScreen } from './components/auth/LockScreen';
import { EmployeeInvitationView } from './components/auth/EmployeeInvitationView';
import { OwnerLoginScreen } from './components/auth/OwnerLoginScreen';
import { subscribeToOwnerAuth, signOutOwner } from './services/ownerAuth';
import { getOwnerStore, saveOwnerStoreProfile, OwnerStore } from './services/storeService';
import { User } from 'firebase/auth';

type GateState =
  | { status: 'checking' }
  | { status: 'signedOut' }
  | { status: 'setup'; user: User; store: OwnerStore | null }
  | { status: 'ready'; user: User; storeId: string }
  | { status: 'error'; message: string };

const LEGACY_KEYS = {
  cashiers: 'boutiquepro_cashiers_v2',
  products: 'boutiquepro_products_v2',
  customers: 'boutiquepro_customers_v2',
  sales: 'boutiquepro_sales_v2',
  expenses: 'boutiquepro_expenses_v2',
  settings: 'boutiquepro_settings_v2',
  cashSession: 'boutiquepro_cash_session_v2'
};

function readLegacyData(): string | null {
  try {
    const snapshot: Record<string, unknown> = { version: '2.0', exportedAt: new Date().toISOString() };
    let found = false;
    for (const [field, key] of Object.entries(LEGACY_KEYS)) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        snapshot[field] = JSON.parse(raw);
        found = true;
      } catch {
        // Keep malformed legacy entries untouched; never overwrite or delete them.
      }
    }
    return found ? JSON.stringify(snapshot, null, 2) : null;
  } catch {
    return null;
  }
}

function OwnerSetupScreen({ user, existingStore, onSaved }: {
  user: User;
  existingStore: OwnerStore | null;
  onSaved: (storeId: string) => void;
}) {
  const [name, setName] = useState(existingStore?.name || '');
  const [industry, setIndustry] = useState(existingStore?.industry || '');
  const [currency, setCurrency] = useState(existingStore?.primaryCurrency || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !currency) return;
    setSaving(true);
    setError('');
    try {
      const store = await saveOwnerStoreProfile(user, {
        name: name.trim(),
        industry: industry.trim() || undefined,
        primaryCurrency: currency
      });
      onSaved(store.storeId);
    } catch (err) {
      console.error('Owner store setup failed:', err);
      setError(err instanceof Error ? err.message : 'La configuration n’a pas pu être enregistrée. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Configuration initiale</p>
        <h1 className="mt-3 text-3xl font-black">Créons votre boutique</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Compte propriétaire : {user.email || user.displayName || 'Google'}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">Nom commercial de la boutique *</label>
            <input required maxLength={100} value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex. Boutique Élégance"
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Secteur d’activité <span className="font-normal text-slate-500">(facultatif)</span></label>
            <select value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">Choisir plus tard</option>
              <option value="Commerce général">Commerce général</option>
              <option value="Vêtements et mode">Vêtements et mode</option>
              <option value="Alimentation">Alimentation</option>
              <option value="Électronique">Électronique</option>
              <option value="Pharmacie et santé">Pharmacie et santé</option>
              <option value="Cosmétiques">Cosmétiques</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Devise principale *</label>
            <select required value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-400">
              <option value="">Sélectionner la devise principale</option>
              <option value="USD">USD — Dollar américain</option>
              <option value="CDF">CDF — Franc congolais</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Livre sterling</option>
              <option value="KES">KES — Shilling kényan</option>
              <option value="UGX">UGX — Shilling ougandais</option>
              <option value="RWF">RWF — Franc rwandais</option>
              <option value="TZS">TZS — Shilling tanzanien</option>
              <option value="ZAR">ZAR — Rand sud-africain</option>
              <option value="XAF">XAF — Franc CFA (Afrique centrale)</option>
              <option value="XOF">XOF — Franc CFA (Afrique de l’Ouest)</option>
              <option value="CAD">CAD — Dollar canadien</option>
              <option value="CHF">CHF — Franc suisse</option>
              <option value="CNY">CNY — Yuan chinois</option>
              <option value="INR">INR — Roupie indienne</option>
              <option value="JPY">JPY — Yen japonais</option>
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">Vous pourrez utiliser d’autres devises dans vos opérations. Cette devise servira de référence aux rapports consolidés.</p>
          </div>
          {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
          <button type="submit" disabled={saving || !name.trim() || !currency}
            className="w-full rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
            {saving ? 'Enregistrement…' : 'Enregistrer et accéder à ma boutique'}
          </button>
        </form>
      </div>
    </main>
  );
}

function LegacyMigrationNotice({ onDismiss }: { onDismiss: () => void }) {
  const { importDatabaseJSON } = useBoutique();
  const legacyData = useMemo(() => readLegacyData(), []);
  const [message, setMessage] = useState('');

  if (!legacyData) return null;

  const downloadBackup = () => {
    const blob = new Blob([legacyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `black-wakeup-ancienne-boutique-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Sauvegarde téléchargée. Vos anciennes données restent également sur cet appareil.');
  };

  const importLegacy = () => {
    if (importDatabaseJSON(legacyData)) {
      setMessage('Import effectué dans cette boutique. Les anciennes données locales n’ont pas été supprimées.');
      onDismiss();
    } else {
      setMessage('Import impossible. Les anciennes données restent intactes.');
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-4">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold text-amber-950">Anciennes données locales détectées</p>
        <p className="mt-1 text-xs leading-5 text-amber-900">Une ancienne base de boutique existe sur cet appareil. Téléchargez d’abord une sauvegarde, puis choisissez si vous souhaitez l’importer dans cette boutique. Rien ne sera supprimé automatiquement.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={downloadBackup} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-950">Télécharger la sauvegarde</button>
          <button onClick={importLegacy} className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white">Importer les anciennes données</button>
          <button onClick={onDismiss} className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-900 underline">Continuer sans importer</button>
        </div>
        {message && <p className="mt-2 text-xs text-amber-900">{message}</p>}
      </div>
    </div>
  );
}

function BoutiqueApp({ ownerEmail, onSignOut }: { ownerEmail: string | null; onSignOut: () => void }) {
  const { workspaceMode, setWorkspaceMode, settings } = useBoutique();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [showLegacyMigration, setShowLegacyMigration] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {showLegacyMigration && <LegacyMigrationNotice onDismiss={() => setShowLegacyMigration(false)} />}
      <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-2 text-xs text-white">
        <span className="truncate text-slate-300">Espace propriétaire · {ownerEmail || 'Compte Google connecté'}</span>
        <button onClick={onSignOut} className="shrink-0 rounded-lg border border-white/20 px-3 py-1.5 font-semibold hover:bg-white/10">Déconnexion</button>
      </div>
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdminAuth={() => setIsAdminPinOpen(true)}
      />
      <main className="flex-1 pb-10">
        {workspaceMode === 'caisse' ? (
          <CaisseWorkspace onOpenAdmin={() => setIsAdminPinOpen(true)} />
        ) : (
          <AdminView
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSwitchToCaisse={() => setWorkspaceMode('caisse')}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
          />
        )}
      </main>
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">{settings.boutiqueName}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>{workspaceMode === 'caisse' ? 'Poste de Caisse Enregistreuse' : 'Panneau de Gestion Administrateur'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Authentification propriétaire Google</span>
            <span>·</span>
            <span>Sauvegarde locale active</span>
          </div>
        </div>
      </footer>
      <AdminPinModal isOpen={isAdminPinOpen} onClose={() => setIsAdminPinOpen(false)} onSuccess={() => setIsAdminPinOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <GoogleDriveBackupModal isOpen={isCloudSyncOpen} onClose={() => setIsCloudSyncOpen(false)} />
      <ToastContainer />
      <LockScreen />
    </div>
  );
}

function OwnerGate() {
  const [gate, setGate] = useState<GateState>({ status: 'checking' });

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToOwnerAuth((user) => {
      if (!active) return;
      if (!user) {
        setGate({ status: 'signedOut' });
        return;
      }
      if (!user.emailVerified) {
        setGate({ status: 'error', message: 'Le compte Google utilisé ne présente pas une adresse e-mail vérifiée. Essayez avec un compte Google vérifié.' });
        return;
      }
      setGate({ status: 'checking' });
      getOwnerStore(user).then((store) => {
        if (!active) return;
        if (!store || !store.name || !store.primaryCurrency) {
          setGate({ status: 'setup', user, store });
        } else {
          setGate({ status: 'ready', user, storeId: store.storeId });
        }
      }).catch((error) => {
        console.error('Owner store lookup failed:', error);
        if (active) setGate({
          status: 'error',
          message: error instanceof Error ? error.message : 'Impossible de charger votre boutique. Vérifiez votre connexion.'
        });
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm('Voulez-vous vraiment vous déconnecter de votre espace propriétaire ?')) return;
    try {
      await signOutOwner();
    } catch (error) {
      console.error('Owner sign-out failed:', error);
      setGate({ status: 'error', message: 'La déconnexion a échoué. Réessayez.' });
    }
  };

  if (gate.status === 'checking') {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-emerald-300" /><p className="mt-4 text-sm text-slate-300">Chargement de votre espace propriétaire…</p></div></main>;
  }
  if (gate.status === 'signedOut') return <OwnerLoginScreen onAuthenticated={() => setGate({ status: 'checking' })} />;
  if (gate.status === 'error') {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white"><div className="max-w-md rounded-2xl border border-rose-300/20 bg-slate-900 p-7"><h1 className="text-xl font-bold">Accès à la boutique impossible</h1><p className="mt-3 text-sm leading-6 text-slate-300">{gate.message}</p><div className="mt-5 flex gap-3"><button onClick={() => window.location.reload()} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-bold text-slate-950">Réessayer</button><button onClick={() => signOutOwner()} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Déconnexion</button></div></div></main>;
  }
  if (gate.status === 'setup') {
    return <OwnerSetupScreen user={gate.user} existingStore={gate.store} onSaved={(storeId) => setGate({ status: 'ready', user: gate.user, storeId })} />;
  }
  return (
    <BoutiqueProvider key={gate.storeId} storeId={gate.storeId}>
      <BoutiqueApp ownerEmail={gate.user.email} onSignOut={handleSignOut} />
    </BoutiqueProvider>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const inviteStore = params.get('inviteStore');
  const inviteId = params.get('inviteId');

  if (inviteStore || inviteId) {
    if (!inviteStore || !inviteId) {
      return <div className="min-h-screen bg-slate-50 p-8 text-center text-sm text-rose-700">Lien d’invitation incomplet ou invalide.</div>;
    }
    return <EmployeeInvitationView storeId={inviteStore} invitationId={inviteId} />;
  }

  return <OwnerGate />;
}
