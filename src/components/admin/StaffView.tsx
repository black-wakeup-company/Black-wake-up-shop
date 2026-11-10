import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { Cashier } from '../../types/boutique';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  X,
  CheckCircle2
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const {
    cashiers,
    addCashier,
    updateCashier,
    deleteCashier,
    settings,
    updateSettings,
    showToast
  } = useBoutique();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
  const [formName, setFormName] = useState('');
  const [formPin, setFormPin] = useState('0000');
  const [formRole, setFormRole] = useState<'admin' | 'caissier'>('caissier');

  // Change master PIN state
  const [masterPin, setMasterPin] = useState(settings.adminPin || '1234');
  const [isChangingMasterPin, setIsChangingMasterPin] = useState(false);

  const openAdd = () => {
    setEditingCashier(null);
    setFormName('');
    setFormPin('0000');
    setFormRole('caissier');
    setIsAddEditOpen(true);
  };

  const openEdit = (c: Cashier) => {
    setEditingCashier(c);
    setFormName(c.name);
    setFormPin(c.pin);
    setFormRole(c.role);
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Le nom du caissier est requis', 'warning');
      return;
    }

    const colors = ['bg-emerald-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-600', 'bg-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    if (editingCashier) {
      updateCashier(editingCashier.id, {
        name: formName.trim(),
        pin: formPin.trim(),
        role: formRole
      });
    } else {
      addCashier({
        name: formName.trim(),
        pin: formPin.trim(),
        role: formRole,
        active: true,
        avatarColor: randomColor
      });
    }

    setIsAddEditOpen(false);
  };

  const handleSaveMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPin.length < 4) {
      showToast('Le code PIN doit comporter au moins 4 chiffres', 'warning');
      return;
    }
    updateSettings({ adminPin: masterPin.trim() });
    setIsChangingMasterPin(false);
    showToast('Code PIN Administrateur principal mis à jour', 'success');
  };

  return (
    <div className="bp-view space-y-6">
      {/* Top Banner & Quick Master PIN */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Code PIN Administrateur Principal</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Code sécurisé protégeant l'accès à la partie Admin et aux rapports financiers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isChangingMasterPin ? (
            <form onSubmit={handleSaveMasterPin} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={masterPin}
                onChange={(e) => setMasterPin(e.target.value.replace(/\D/g, ''))}
                className="w-24 text-center font-mono font-bold text-sm px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Valider
              </button>
              <button
                type="button"
                onClick={() => setIsChangingMasterPin(false)}
                className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                PIN Actuel : {settings.adminPin || '1234'}
              </span>
              <button
                type="button"
                onClick={() => setIsChangingMasterPin(true)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Staff List Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-sm text-slate-900">Équipe & Profils Caissiers ({cashiers.length})</h3>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Ajouter un Caissier</span>
        </button>
      </div>

      {/* Cashiers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Utilisateur / Caissier</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Code PIN Caisse</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {cashiers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                        c.avatarColor || 'bg-slate-700'
                      }`}
                    >
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">{c.name}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      c.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.role === 'admin' ? (
                      <>
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Administrateur</span>
                      </>
                    ) : (
                      <span>Vendeur / Caissier</span>
                    )}
                  </span>
                </td>

                <td className="py-3 px-4 font-mono text-slate-600">
                  •••• ({c.pin})
                </td>

                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Actif</span>
                  </span>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {cashiers.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer l'accès de "${c.name}" ?`)) {
                            deleteCashier(c.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingCashier ? 'Modifier le Caissier' : 'Nouveau Caissier'}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nom & Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sarah Martin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Code PIN personnel (4 chiffres)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Ex: 1234"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rôle & Permissions
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="caissier">Vendeur / Caissier (Accès Caisse uniquement)</option>
                  <option value="admin">Administrateur (Accès complet Caisse + Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
