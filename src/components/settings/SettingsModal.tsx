import React, { useState, useRef } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import {
  Save,
  Download,
  Upload,
  RefreshCw,
  X,
  Store,
  Receipt,
  Coins,
  ShieldAlert,
  Cloud
} from 'lucide-react';
import { ImageUploader } from '../common/ImageUploader';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetAllData
  } = useBoutique();

  const [activeTab, setActiveTab] = useState<'store' | 'tax' | 'backup'>('store');

  const [boutiqueName, setBoutiqueName] = useState(settings.boutiqueName);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [logo, setLogo] = useState(settings.logo || '');
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [nifOrSiret, setNifOrSiret] = useState(settings.nifOrSiret);
  const [receiptFooterMessage, setReceiptFooterMessage] = useState(settings.receiptFooterMessage);
  const [cashierName, setCashierName] = useState(settings.cashierName);

  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'FC');
  const [currencyPosition, setCurrencyPosition] = useState<'before' | 'after'>(settings.currencyPosition);
  const [exchangeRateUSD, setExchangeRateUSD] = useState((settings.exchangeRateUSD || 2850).toString());
  const [taxRate, setTaxRate] = useState(settings.taxRate.toString());
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      boutiqueName: boutiqueName.trim(),
      slogan: slogan.trim(),
      logo: logo.trim() || undefined,
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      nifOrSiret: nifOrSiret.trim(),
      receiptFooterMessage: receiptFooterMessage.trim(),
      cashierName: cashierName.trim(),
      currencySymbol: currencySymbol.trim() || 'FC',
      currencyPosition,
      exchangeRateUSD: Math.max(1, parseFloat(exchangeRateUSD) || 2850),
      taxRate: parseFloat(taxRate) || 0,
      taxEnabled
    });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDatabaseJSON(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-base text-slate-900">Paramètres de la Boutique</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('store')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'store'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Coordonnées & Tickets</span>
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tax'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Devise & Taxes</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Sauvegarde & Données</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {activeTab === 'store' && (
              <div className="space-y-4">
                {/* Logo uploader from local device */}
                <div>
                  <ImageUploader
                    currentImage={logo}
                    onImageSelected={(dataUrl) => setLogo(dataUrl)}
                    onImageRemoved={() => setLogo('')}
                    label="Logo de la boutique (choisir depuis votre appareil)"
                    shape="logo"
                    maxDimension={320}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom commercial de la boutique *
                  </label>
                  <input
                    type="text"
                    required
                    value={boutiqueName}
                    onChange={(e) => setBoutiqueName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slogan ou activité
                  </label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse physique du magasin
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Immatriculation (SIRET, NIF, R.C.)
                    </label>
                    <input
                      type="text"
                      value={nifOrSiret}
                      onChange={(e) => setNifOrSiret(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Caissier par défaut
                    </label>
                    <input
                      type="text"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message de bas de ticket de caisse
                  </label>
                  <textarea
                    rows={2}
                    value={receiptFooterMessage}
                    onChange={(e) => setReceiptFooterMessage(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Symbole de la devise
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="€, FCFA, $, MAD..."
                      className="w-full text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Position du symbole
                    </label>
                    <select
                      value={currencyPosition}
                      onChange={(e) => setCurrencyPosition(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="after">Après le montant (ex: 50 000 FC)</option>
                      <option value="before">Avant le montant (ex: FC 50 000)</option>
                    </select>
                  </div>
                </div>

                {/* Taux du jour USD / FC */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-900">
                    Taux du jour (1 $ USD en Franc Congolais FC)
                  </label>
                  <div className="relative w-48">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={exchangeRateUSD}
                      onChange={(e) => setExchangeRateUSD(e.target.value)}
                      className="w-full text-sm font-mono font-bold pl-3 pr-12 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      FC
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Permet d'ajouter des articles ou de vendre en choisissant la devise ($ ou FC) avec conversion automatique en direct.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-900 block">
                        Gestion de la TVA / Taxe
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Calculer et faire figurer la taxe sur les tickets de caisse
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxEnabled}
                        onChange={(e) => setTaxEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
                    </label>
                  </div>

                  {taxEnabled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Taux de TVA standard (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        className="w-32 text-xs font-bold font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="space-y-4">
                {/* Google Drive Direct Integration Card */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-emerald-600" />
                      <span>Google Drive (Cloud & Perte de Téléphone)</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Sauvegardez automatiquement vos données dans votre compte Google Drive. En cas de perte ou de changement de téléphone, vos articles, ventes et caisses sont restaurables en un clic.
                  </p>
                  <p className="text-[10px] text-emerald-700 italic">
                    Accédez au gestionnaire complet depuis l'espace Administration via le bouton vert "Sauvegarde Google Drive".
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Sauvegarde des données (Fichier JSON)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Téléchargez l'intégralité de vos articles, ventes, clients et dépenses dans un fichier sécurisé pour archivage local.
                  </p>
                  <button
                    type="button"
                    onClick={exportDatabaseJSON}
                    className="mt-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger le fichier de sauvegarde JSON</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>Restauration (Import JSON)</span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Chargez un fichier de sauvegarde pour restaurer l'état de votre boutique.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Sélectionner un fichier de sauvegarde</span>
                  </button>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <h4 className="font-semibold text-xs text-rose-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Réinitialisation des données</span>
                  </h4>
                  <p className="text-[11px] text-rose-700">
                    Efface les données courantes et réinitialise le catalogue avec les données de démonstration.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Voulez-vous vraiment réinitialiser toutes les données aux valeurs de démonstration ?')) {
                        resetAllData();
                        onClose();
                      }
                    }}
                    className="mt-2 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Réinitialiser les données de démo</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
