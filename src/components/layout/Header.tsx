import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Settings, ShoppingBag, ShieldCheck, Lock, TrendingUp, Download, Smartphone } from 'lucide-react';
import { WorkspaceMode } from '../../types/boutique';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ExchangeRateModal } from '../common/ExchangeRateModal';
import { PWAInstallModal } from '../common/PWAInstallModal';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAdminAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAdminAuth
}) => {
  const {
    settings,
    cart,
    workspaceMode,
    setWorkspaceMode,
    isAdminUnlocked,
    lockAdmin,
    lockScreen,
    exchangeRateUSD
  } = useBoutique();

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const { isInstallable, isInstalled, triggerInstall, showGuideModal, setShowGuideModal } = usePWAInstall();

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const handleModeSwitch = (mode: WorkspaceMode) => {
    if (mode === 'admin') {
      if (!isAdminUnlocked) {
        onOpenAdminAuth();
      } else {
        setWorkspaceMode('admin');
      }
    } else {
      setWorkspaceMode('caisse');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
            {/* Zone 1: Wordmark & Logo */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.boutiqueName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover bg-white border border-slate-200 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 shadow-2xs">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate max-w-[110px] sm:max-w-[180px]">
                {settings.boutiqueName || 'BoutiquePro'}
              </span>
            </div>

            {/* Zone 2: Mode Switcher + Taux du jour Badge */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Dual Mode Switcher (Partie Caisse vs Partie Admin stylée avec icône) */}
              <nav className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  onClick={() => handleModeSwitch('caisse')}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    workspaceMode === 'caisse'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Poste de Caisse Enregistreuse"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="hidden xs:inline">Caisse</span>
                  {totalCartCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500 text-white">
                      {totalCartCount}
                    </span>
                  )}
                </button>

                {/* Elegant icon-first Admin button ("admin doit être une icône bien placé pas des écrits pour le style") */}
                <button
                  onClick={() => handleModeSwitch('admin')}
                  className={`flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                    workspaceMode === 'admin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                  title={isAdminUnlocked ? "Espace Administration (Déverrouillé)" : "Accès Administrateur (Code PIN)"}
                  aria-label="Administration"
                >
                  {isAdminUnlocked ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="sr-only">Administration</span>
                </button>
              </nav>

              {/* Taux du jour Badge (Clickable to edit rate) */}
              <button
                type="button"
                onClick={() => setIsRateModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                title="Taux du jour Dollar/Franc Congolais (cliquez pour modifier)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline text-emerald-700 font-semibold text-[11px]">Taux :</span>
                <span className="font-mono">1 $ = {exchangeRateUSD.toLocaleString('fr-FR')} FC</span>
              </button>
            </div>

            {/* Zone 3: Lock Screen, Install App, Cloud Backup (Admin only), Settings */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Chrome / PWA Install Button */}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={triggerInstall}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  title="Installer l'application sur Chrome / Mobile"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden md:inline">Installer l'App</span>
                </button>
              )}

              {/* Lock Screen Trigger */}
              <button
                type="button"
                onClick={lockScreen}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="Verrouiller l'écran avec code PIN"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="hidden lg:inline">Verrouiller</span>
              </button>

              {workspaceMode === 'admin' && (
                <button
                  onClick={lockAdmin}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  title="Quitter le mode admin"
                >
                  <span className="hidden sm:inline">Quitter Admin</span>
                </button>
              )}

              {/* Settings button accessible only to Admin or when authenticated */}
              {workspaceMode === 'admin' && (
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Paramètres de la boutique"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xl:inline">Paramètres</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Exchange Rate Modal */}
      <ExchangeRateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
      />

      {/* PWA Install Guide Modal */}
      <PWAInstallModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onTriggerDirectInstall={triggerInstall}
        isInstallable={isInstallable}
      />
    </>
  );
};

