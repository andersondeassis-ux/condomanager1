import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Sparkles, LogOut, Building2, Menu, X, Users, FileDown, Palmtree, CheckSquare } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionManager } from './components/TransactionManager';
import { AIAssistant } from './components/AIAssistant';
import { ResidentManager } from './components/ResidentManager';
import { ExportReports } from './components/ExportReports';
import { VacationManager } from './components/VacationManager';
import { ApprovalsManager } from './components/ApprovalsManager';
import { Auth } from './components/Auth';
import { Transaction, User } from './types';
import { api } from './services/api';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';

type Tab = 'dashboard' | 'transactions' | 'ai' | 'residents' | 'exports' | 'vacation' | 'approvals';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Gerenciar Sessão do Supabase
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email || 'Usuário',
          role: 'admin', // Por padrão admin neste modelo
          unit: 'Admin'
        });
      }
      setAuthLoading(false);
    });

    // Escutar mudanças de auth (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email || 'Usuário',
          role: 'admin',
          unit: 'Admin'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar transações do backend ao autenticar
  useEffect(() => {
    if (session) {
      setLoadingData(true);
      api.transactions.getAll()
        .then(data => {
          // Com Supabase, os dados já vêm parseados (attachments já é array)
          const formatted = data.map((t: any) => ({
            ...t,
            amount: Number(t.amount),
            attachments: t.attachments || [] 
          }));
          setTransactions(formatted);
        })
        .catch(err => console.error("Erro ao carregar dados:", err))
        .finally(() => setLoadingData(false));
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTransactions([]);
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <Building2 className="w-10 h-10 text-indigo-300 mb-4" />
          <div className="text-indigo-900 font-medium">Carregando CondoManager...</div>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <Auth />;
  }

  const NavItem = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
    <button 
      onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        activeTab === id 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-indigo-100' : ''}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Building2 className="w-6 h-6 text-indigo-600" />
          <span>CondoManager</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:relative
        ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">CondoManager</h1>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">PRO</span>
            </div>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
            <NavItem id="dashboard" label="Visão Geral" icon={LayoutDashboard} />
            <NavItem id="transactions" label="Transações" icon={Receipt} />
            <NavItem id="approvals" label="Aprovações" icon={CheckSquare} />
            <NavItem id="residents" label="Moradores" icon={Users} />
            <NavItem id="vacation" label="Aviso de Férias" icon={Palmtree} />
            <NavItem id="exports" label="Relatórios" icon={FileDown} />
            <NavItem id="ai" label="Assistente IA" icon={Sparkles} />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate" title={user.name}>{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-hidden">
        <header className="mb-8 hidden lg:block">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'dashboard' && 'Visão Geral Financeira'}
            {activeTab === 'transactions' && 'Histórico de Transações'}
            {activeTab === 'approvals' && 'Aprovações e Ideias'}
            {activeTab === 'residents' && 'Gestão de Moradores e Unidades'}
            {activeTab === 'vacation' && 'Controle de Ausências e Férias'}
            {activeTab === 'exports' && 'Exportação de Relatórios'}
            {activeTab === 'ai' && 'Insights e Relatórios de IA'}
          </h2>
          <p className="text-slate-500">Bem-vindo de volta, veja o que está acontecendo hoje.</p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingData ? (
             <div className="flex flex-col items-center justify-center h-64 text-indigo-600">
               <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
               <p>Sincronizando dados...</p>
             </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard transactions={transactions} userEmail={session.user.email} />}
              {activeTab === 'transactions' && <TransactionManager transactions={transactions} setTransactions={setTransactions} userEmail={session.user.email} />}
              {activeTab === 'approvals' && <ApprovalsManager />}
              {activeTab === 'residents' && <ResidentManager />}
              {activeTab === 'vacation' && <VacationManager />}
              {activeTab === 'exports' && <ExportReports transactions={transactions} />}
              {activeTab === 'ai' && <AIAssistant transactions={transactions} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}