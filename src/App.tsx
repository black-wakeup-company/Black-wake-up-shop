import React, { useState } from 'react';
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
import { EmployeeInvitationView } from './components/auth/EmployeeInvitationView';

function BoutiqueApp() {
  const { workspaceMode, setWorkspaceMode, settings } = useBoutique();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation with Caisse / Admin Switcher */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdminAuth={() => setIsAdminPinOpen(true)}
      />

      {/* Main Workspace Display */}
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

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">{settings.boutiqueName}</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>
              {workspaceMode === 'caisse' ? 'Poste de Caisse Enregistreuse' : 'Panneau de Gestion Administrateur'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span>Code PIN Admin par défaut : 1234</span>
            <span>·</span>
            <span>Sauvegarde locale active</span>
          </div>
        </div>
      </footer>

      {/* Admin PIN Authentication Modal */}
      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onSuccess={() => setIsAdminPinOpen(false)}
      />

      {/* Store Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Google Drive Cloud Backup & Multi-device Sync Modal */}
      <GoogleDriveBackupModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer />

      {/* Screen Lock Overlay */}
      <LockScreen />
    </div>
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

  return (
    <BoutiqueProvider>
      <BoutiqueApp />
    </BoutiqueProvider>
  );
}
