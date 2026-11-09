import React from 'react';
import { Download, Monitor, Smartphone, Check, X, Chrome, Shield } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDirectInstall?: () => void;
  isInstallable?: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerDirectInstall,
  isInstallable
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Installer BoutiquePro</h3>
              <p className="text-[11px] text-slate-500">Application PWA Chrome & Mobile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <Chrome className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Installation directe comme une application native</p>
              <p className="text-emerald-800 text-[11px] leading-relaxed">
                BoutiquePro fonctionne en plein écran sans barre d'adresse, hors-ligne, et se lance directement depuis le bureau ou votre écran d'accueil.
              </p>
            </div>
          </div>

          {/* Quick direct button if browser prompt is available */}
          {isInstallable && (
            <button
              onClick={() => {
                if (onTriggerDirectInstall) onTriggerDirectInstall();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Installer maintenant en 1 clic</span>
            </button>
          )}

          {/* Instructions Tabs / Steps */}
          <div className="space-y-3 pt-1">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                <Monitor className="w-4 h-4 text-slate-600" />
                <span>Sur Google Chrome (Ordinateur PC / Mac)</span>
              </div>
              <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside pl-1">
                <li>Regardez tout à droite de la barre d'adresse de Chrome.</li>
                <li>
                  Cliquez sur l'icône <strong className="text-slate-800">Installer BoutiquePro</strong> (icône ⊕ ou ordinateur avec flèche).
                </li>
                <li>Ou ouvrez le menu <strong className="text-slate-800">⋮ (trois points)</strong> &gt; <strong className="text-slate-800">Installer BoutiquePro</strong>.</li>
              </ol>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                <Smartphone className="w-4 h-4 text-slate-600" />
                <span>Sur Téléphone ou Tablette (Android / Chrome)</span>
              </div>
              <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside pl-1">
                <li>Appuyez sur le menu <strong className="text-slate-800">⋮ (trois points)</strong> en haut à droite de Chrome.</li>
                <li>Appuyez sur <strong className="text-slate-800">Installer l'application</strong> ou <strong className="text-slate-800">Ajouter à l'écran d'accueil</strong>.</li>
              </ol>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 justify-center">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Aucun téléchargement lourd requis · Mises à jour automatiques</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
