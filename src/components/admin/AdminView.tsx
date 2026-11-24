import React, { useState } from 'react';
import { useBoutique } from '../../context/BoutiqueContext';
import { ReportsView } from '../reports/ReportsView';
import { InventoryView } from '../inventory/InventoryView';
import { SalesView } from '../sales/SalesView';
import { CustomersView } from '../customers/CustomersView';
import { ExpensesView } from '../expenses/ExpensesView';
import { StaffView } from './StaffView';
import { MultiBoutiqueEmployeesView } from './MultiBoutiqueEmployeesView';
import {
  BarChart3,
  Package,
  Receipt,
  Users,
  Wallet,
  UserCheck,
  ShoppingBag,
  Lock,
  Cloud,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';

export type AdminTab = 'reports' | 'inventory' | 'sales' | 'customers' | 'expenses' | 'staff' | 'cloudEmployees';

interface AdminViewProps {
  onOpenSettings: () => void;
  onSwitchToCaisse: () => void;
  onOpenCloudSync: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onOpenSettings: _onOpenSettings, onSwitchToCaisse, onOpenCloudSync }) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('reports');
  const { lockAdmin, settings } = useBoutique();

  const navItems: { id: AdminTab; label: string; description: string; icon: React.ReactNode }[] = [
    { id: 'reports', label: 'Vue d’ensemble', description: 'Bilan & analyse', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'inventory', label: 'Stock & articles', description: 'Catalogue et niveaux', icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: 'Ventes', description: 'Journal des opérations', icon: <Receipt className="w-4 h-4" /> },
    { id: 'customers', label: 'Clients', description: 'Comptes et crédits', icon: <Users className="w-4 h-4" /> },
    { id: 'expenses', label: 'Dépenses', description: 'Charges de la boutique', icon: <Wallet className="w-4 h-4" /> },
    { id: 'staff', label: 'Équipe', description: 'Caissiers et sécurité', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'cloudEmployees', label: 'Équipe réseau', description: 'Employés multiboutique', icon: <Cloud className="w-4 h-4" /> }
  ];

  const activeItem = navItems.find((item) => item.id === adminTab) ?? navItems[0];

  return (
    <div className="min-h-full space-y-5 sm:space-y-7">
      <section className="relative isolate overflow-hidden rounded-[1.65rem] bg-[#0b211b] text-white shadow-[0_22px_60px_rgba(8,35,27,0.16)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_0%,rgba(16,185,129,0.30),transparent_34%),radial-gradient(circle_at_0%_100%,rgba(6,95,70,0.55),transparent_42%)]" />
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -right-8 -top-16 -z-10 h-48 w-48 rounded-full border border-white/[0.07]" />

        <div className="px-4 py-5 sm:px-7 sm:py-7 lg:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                  Centre de pilotage
                </span>
                <span className="text-[11px] font-semibold text-white/45">ESPACE ADMINISTRATION</span>
              </div>
              <h1 className="max-w-3xl text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[2.15rem]">
                Gérez votre boutique avec précision.
              </h1>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-emerald-50/65 sm:text-sm">
                {settings.boutiqueName || 'Votre boutique'} <span className="px-1.5 text-emerald-300/50">/</span> Suivez vos activités, vos stocks et vos performances depuis un seul espace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenCloudSync}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-xs font-bold text-white shadow-sm transition-all hover:border-emerald-300/40 hover:bg-white/[0.13] focus:outline-none focus:ring-2 focus:ring-emerald-300/60"
                title="Sauvegarde et restauration Google Drive (Admin uniquement)"
              >
                <Cloud className="h-4 w-4 text-emerald-300" />
                <span>Sauvegarde cloud</span>
              </button>
              <button
                onClick={onSwitchToCaisse}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-extrabold text-emerald-950 shadow-lg shadow-emerald-950/20 transition-all hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/70"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Ouvrir la caisse</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-70" />
              </button>
              <button
                onClick={lockAdmin}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3.5 text-xs font-semibold text-white/75 transition-all hover:border-white/25 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                title="Verrouiller la session administrateur"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Verrouiller</span>
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/40">Navigation principale</p>
              <p className="hidden text-[10px] font-semibold text-emerald-200/60 sm:block">7 espaces de gestion</p>
            </div>
            <nav aria-label="Navigation de l’administration" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navItems.map((item) => {
                const isActive = adminTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAdminTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group flex min-w-max items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:px-4 ${
                      isActive
                        ? 'border-white/80 bg-white text-[#10251f] shadow-lg shadow-black/10'
                        : 'border-white/[0.08] bg-white/[0.035] text-white/65 hover:border-white/20 hover:bg-white/[0.09] hover:text-white'
                    }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-white/[0.08] text-emerald-200 group-hover:bg-white/10'
                    }`}>
                      {item.icon}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[11px] font-extrabold leading-4">{item.label}</span>
                      <span className={`text-[9px] leading-3 ${
                        isActive ? 'text-slate-500' : 'text-white/35 group-hover:text-white/55'
                      }`}>{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-0 pb-10 sm:px-1 lg:px-2">
        <div className="mb-4 flex items-center gap-2 px-1 text-[11px] font-semibold text-slate-400">
          <span>Administration</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-700">{activeItem.label}</span>
        </div>
        {adminTab === 'reports' && <ReportsView />}
        {adminTab === 'inventory' && <InventoryView />}
        {adminTab === 'sales' && <SalesView />}
        {adminTab === 'customers' && <CustomersView />}
        {adminTab === 'expenses' && <ExpensesView />}
        {adminTab === 'staff' && <StaffView />}
        {adminTab === 'cloudEmployees' && <MultiBoutiqueEmployeesView />}
      </div>
    </div>
  );
};
