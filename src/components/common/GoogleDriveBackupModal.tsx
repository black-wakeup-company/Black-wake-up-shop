import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { useGoogleDriveBackup } from '../../hooks/useGoogleDriveBackup';
import {
  Cloud,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Calendar,
  HardDrive,
  X,
  FileJson,
  DownloadCloud,
  LogOut,
  ShieldCheck,
  Smartphone,
  Share2
} from 'lucide-react';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    getDatabaseSnapshotJSON,
    importDatabaseJSON,
    showToast,
    isAdminUnlocked
  } = useBoutique();

  const {
    currentUser,
    isConnected,
    isLoading,
    backups,
    lastBackupTime,
    autoBackupEnabled,
    handleConnect,
    handleDisconnect,
    triggerManualBackup,
    triggerRestore,
    toggleAutoBackup,
    refreshBackupsList
  } = useGoogleDriveBackup(getDatabaseSnapshotJSON, importDatabaseJSON, showToast);

  const [activeTab, setActiveTab] = useState<'drive' | 'device_sync'>('drive');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/70 my-6">
        {/* Modal Top Ribbon */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-gradient-to-r from-[#10251f] to-[#075b43] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Sauvegarde & Synchronisation Cloud
              </h3>
              <p className="text-[11px] text-slate-300">
                Protégez vos données contre la perte de téléphone et synchronisez vos caisses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drive'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudUpload className="w-4 h-4 text-emerald-600" />
            <span>Google Drive (Sauvegarde & Restauration)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('device_sync')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'device_sync'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-sky-600" />
            <span>Multi-Appareils (Autre Téléphone)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {activeTab === 'drive' && (
            <>
              {/* Account connection status */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                    {isConnected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Cloud className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {isConnected ? 'Compte Google connecté' : 'Google Drive non connecté'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isConnected
                        ? `Connecté en tant que : ${currentUser?.email || 'Utilisateur Google'}`
                        : 'Connectez votre compte Google pour sauvegarder et restaurer en 1 clic'}
                    </span>
                  </div>
                </div>

                <div>
                  {isConnected ? (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Déconnecter</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <CloudUpload className="w-4 h-4 text-emerald-400" />
                      <span>{isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions Grid: Manual Backup + Auto Backup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Sauvegarder dans mon Google Drive */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <CloudUpload className="w-4 h-4 text-emerald-600" />
                      <span>Sauvegarder maintenant</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Crée un instantané complet de votre boutique dans le dossier <strong>BoutiquePro_Sauvegardes</strong> sur votre Google Drive.
                    </p>
                    {lastBackupTime && (
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Dernière sauvegarde : {new Date(lastBackupTime).toLocaleString('fr-FR')}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={triggerManualBackup}
                    disabled={!isConnected || isLoading}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Sauvegarder dans Google Drive</span>
                  </button>
                </div>

                {/* 2. Sauvegarde automatique */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <RefreshCw className={`w-4 h-4 ${autoBackupEnabled ? 'text-emerald-600 animate-spin-slow' : 'text-slate-400'}`} />
                        <span>Sauvegarde Automatique</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          autoBackupEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {autoBackupEnabled ? 'Active' : 'Désactivée'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Sauvegarde automatique en tâche de fond sur Google Drive toutes les heures sans action manuelle.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAutoBackup(!autoBackupEnabled)}
                    disabled={!isConnected}
                    className={`w-full py-2.5 px-3 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      autoBackupEnabled
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{autoBackupEnabled ? 'Désactiver l\'auto-sauvegarde' : 'Activer la sauvegarde automatique'}</span>
                  </button>
                </div>
              </div>

              {/* List of Backups to Restore */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Sauvegardes disponibles sur Google Drive ({backups.length})
                    </span>
                  </div>
                  {isConnected && (
                    <button
                      type="button"
                      onClick={refreshBackupsList}
                      disabled={isLoading}
                      className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  )}
                </div>

                {!isConnected ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    Connectez votre compte Google pour voir vos sauvegardes cloud et les restaurer.
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-1">
                    <FileJson className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700">Aucune sauvegarde trouvée dans Google Drive</p>
                    <p className="text-[11px] text-slate-400">
                      Cliquez sur "Sauvegarder dans Google Drive" ci-dessus pour créer votre première archive sécurisée.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {backups.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileJson className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <strong className="text-slate-900 block truncate">{file.name}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Modifié le {new Date(file.modifiedTime).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => triggerRestore(file)}
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        >
                          <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restaurer</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'device_sync' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-sky-700" />
                  <span>Comment utiliser sur le téléphone d'un caissier ?</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Lorsque vous partagez le lien de l'application à un caissier sur son téléphone :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
                  <li>Le caissier ouvre le lien et clique sur son nom de profil (ex: Junior, Sarah).</li>
                  <li>Il saisit son code PIN caissier pour vendre et imprimer les tickets de caisse.</li>
                  <li>L'accès aux sauvegardes, au bilan financier et à la restauration reste <strong>strictement réservé à l'administrateur</strong> avec le code PIN Admin.</li>
                  <li>Pour transférer l'état du stock et les articles vers un nouveau téléphone, effectuez une sauvegarde Google Drive depuis votre téléphone puis cliquez sur "Restaurer" sur le nouveau téléphone.</li>
                </ol>
              </div>

              {/* Security info card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Protection Administrateur & Rôles</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Seul l'icône Admin avec le code secret permet de modifier les prix d'achat, de consulter les bénéfices nets et de restaurer les bases de données. Les caissiers ne peuvent que saisir les ventes au comptoir et encaisser les clients.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
