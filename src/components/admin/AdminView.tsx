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
    <div className="space-y-5 sm:space-y-7">
      {/* Admin Subheader Toolbar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#10251f] via-[#123d30] to-[#075b43] text-white shadow-xl shadow-emerald-950/10">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title & Badge */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[.14em] bg-white/10 text-emerald-100 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur">
                Espace Administration
              </span>
              <span className="text-sm font-semibold text-white/85">
                {settings.boutiqueName} · Pilotage & Comptabilité
              </span>
            </div>

            {/* Quick Actions: Return to POS, Cloud Backup & Lock */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCloudSync}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-black/10 cursor-pointer"
                title="Sauvegarde et restauration Google Drive (Admin uniquement)"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Sauvegarde Google Drive</span>
              </button>

              <button
                onClick={onSwitchToCaisse}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-extrabold text-emerald-950 bg-white hover:bg-emerald-50 rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-black/10 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ouvrir la Caisse (POS)</span>
              </button>

              <button
                onClick={lockAdmin}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white/75 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                title="Verrouiller la session administrateur"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verrouiller</span>
              </button>
            </div>
          </div>

          {/* Admin Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-4 mt-4 border-t border-white/15">
            {navItems.map((item) => {
              const isActive = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAdminTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? 'bg-white text-emerald-950 border border-white shadow-lg shadow-black/10'
                      : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-1">
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
