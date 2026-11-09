import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { ReportsView } from '../reports/ReportsView';
import { InventoryView } from '../inventory/InventoryView';
import { SalesView } from '../sales/SalesView';
import { CustomersView } from '../customers/CustomersView';
import { ExpensesView } from '../expenses/ExpensesView';
import { StaffView } from './StaffView';
import {
  BarChart3,
  Package,
  Receipt,
  Users,
  Wallet,
  UserCheck,
  Sliders,
  ShoppingBag,
  Lock,
  ArrowLeft,
  Cloud
} from 'lucide-react';

export type AdminTab = 'reports' | 'inventory' | 'sales' | 'customers' | 'expenses' | 'staff';

interface AdminViewProps {
  onOpenSettings: () => void;
  onSwitchToCaisse: () => void;
  onOpenCloudSync: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onOpenSettings, onSwitchToCaisse, onOpenCloudSync }) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('reports');
  const { lockAdmin, settings } = useBoutique();

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'reports', label: 'Bilan & Analyse', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'inventory', label: 'Stock & Articles', icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: 'Journal des Ventes', icon: <Receipt className="w-4 h-4" /> },
    { id: 'customers', label: 'Clients & Crédits', icon: <Users className="w-4 h-4" /> },
    { id: 'expenses', label: 'Charges & Dépenses', icon: <Wallet className="w-4 h-4" /> },
    { id: 'staff', label: 'Caissiers & Sécurité', icon: <UserCheck className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Admin Subheader Toolbar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                Espace Administration
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {settings.boutiqueName} · Pilotage & Comptabilité
              </span>
            </div>

            {/* Quick Actions: Return to POS, Cloud Backup & Lock */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCloudSync}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                title="Sauvegarde et restauration Google Drive (Admin uniquement)"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Sauvegarde Google Drive</span>
              </button>

              <button
                onClick={onSwitchToCaisse}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ouvrir la Caisse (POS)</span>
              </button>

              <button
                onClick={lockAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                title="Verrouiller la session administrateur"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verrouiller</span>
              </button>
            </div>
          </div>

          {/* Admin Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 mt-1 border-t border-slate-800">
            {navItems.map((item) => {
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {adminTab === 'reports' && <ReportsView />}
        {adminTab === 'inventory' && <InventoryView />}
        {adminTab === 'sales' && <SalesView />}
        {adminTab === 'customers' && <CustomersView />}
        {adminTab === 'expenses' && <ExpensesView />}
        {adminTab === 'staff' && <StaffView />}
      </div>
    </div>
  );
};
