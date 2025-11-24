import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Activity, CheckCircle2, AlertCircle, Zap, Droplets, CalendarClock, AlertTriangle, PiggyBank, Wallet } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  userEmail?: string;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
const EXPECTED_UNITS = ['Casa 101', 'Casa 102', 'Casa 103'];
const QUOTA_DUE_DAY = 10;
const FUND_DUE_DAY = 10;
const FUND_AMOUNT_FIXED = 70.00;
const ADMIN_EMAIL = 'andersonde.assis@hotmail.com';

// Definição das contas fixas obrigatórias, palavras-chave e dia de vencimento
const REQUIRED_BILLS = [
  { id: 'light', label: 'Conta de Luz', dueDay: 10, keywords: ['luz', 'energia', 'elétrica', 'enel', 'cemig', 'cpfl'] },
  { id: 'water', label: 'Conta de Água', dueDay: 12, keywords: ['água', 'saneamento', 'sabesp', 'embasa'] }
];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, userEmail }) => {
  
  const isAdmin = userEmail === ADMIN_EMAIL;

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let fundTotal = 0;       // Exclusivo Fundo de Investimento
    let operationalIncome = 0; // Cotas + Outras receitas

    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
        
        // Verifica se é Fundo de Investimento
        const isFund = t.category === 'Fundo de Investimento' || t.desc.toLowerCase().includes('fundo');
        
        if (isFund) {
          fundTotal += t.amount;
        } else {
          operationalIncome += t.amount;
        }
      } else {
        expense += t.amount;
      }
    });

    return {
      totalIncome: income,
      operationalIncome,
      fundTotal,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthStr = today.toISOString().slice(0, 7); // Formato YYYY-MM

  // Helper: Obter todos os meses únicos presentes nas transações + o mês atual
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr); // Garante que o mês atual sempre seja verificado
    transactions.forEach(t => {
      months.add(t.date.slice(0, 7));
    });
    // Ordenar do mais recente para o mais antigo
    return Array.from(months).sort().reverse();
  }, [transactions, currentMonthStr]);

  // Helper para formatar mês curto (ex: 2025-11 -> Nov/25)
  const formatMonthShort = (ym: string) => {
    const [y, m] = ym.split('-');
    return `${m}/${y.slice(2)}`;
  }

  // --- Lógica de Verificação de Arrecadação (Cota Mensal) ---
  const quotaStatus = useMemo(() => {
    const unitStatus = EXPECTED_UNITS.map(unit => {
      const pendingMonths: string[] = [];
      let currentStatus = 'ok'; // ok, late_payment, overdue, pending
      
      availableMonths.forEach(month => {
        const isCurrentMonth = month === currentMonthStr;
        
        // Verifica se pagou neste mês específico
        const transaction = transactions.find(t => {
          const isThisMonth = t.date.startsWith(month);
          const isIncome = t.type === 'income';
          const isQuota = t.category === 'Taxa Condominial' || t.desc.toLowerCase().includes('cota');
          return isThisMonth && isIncome && isQuota && t.desc.includes(unit);
        });

        if (transaction) {
          // Pagou. Se for mês atual e pagou atrasado, anotamos, mas não é "pendência" de dívida.
          if (isCurrentMonth) {
             const paidDay = parseInt(transaction.date.split('-')[2]);
             if (paidDay > QUOTA_DUE_DAY) currentStatus = 'late_payment';
          }
        } else {
          // Não pagou
          if (isCurrentMonth) {
            // Se for mês atual, depende do dia de hoje
            if (currentDay > QUOTA_DUE_DAY) {
              currentStatus = 'overdue';
              pendingMonths.push(formatMonthShort(month));
            } else {
              // Ainda está no prazo
              if (currentStatus === 'ok') currentStatus = 'pending';
            }
          } else {
            // Mês passado não pago = Atrasado
            currentStatus = 'overdue';
            pendingMonths.push(formatMonthShort(month));
          }
        }
      });

      // Define mensagem final
      let msg = '';
      if (pendingMonths.length > 0) {
        msg = `Pendente: ${pendingMonths.slice(0, 2).join(', ')}${pendingMonths.length > 2 ? '...' : ''}`;
      } else if (currentStatus === 'pending') {
        msg = `Aguardando (Vence dia ${QUOTA_DUE_DAY})`;
      } else if (currentStatus === 'late_payment') {
        msg = 'Pago com atraso este mês';
      } else {
        msg = 'Em dia (Histórico Completo)';
      }

      return { name: unit, status: pendingMonths.length > 0 ? 'overdue' : currentStatus, msg };
    });

    const hasOverdue = unitStatus.some(u => u.status === 'overdue');
    const hasLatePayment = unitStatus.some(u => u.status === 'late_payment');
    const allPaid = unitStatus.every(u => u.status === 'ok' || u.status === 'late_payment');

    return { unitStatus, hasOverdue, hasLatePayment, allPaid };
  }, [transactions, availableMonths, currentMonthStr, currentDay]);

  // --- Lógica de Verificação do Fundo de Investimento ---
  const fundStatus = useMemo(() => {
    const unitStatus = EXPECTED_UNITS.map(unit => {
      const pendingMonths: string[] = [];
      let currentStatus = 'ok';

      availableMonths.forEach(month => {
        const isCurrentMonth = month === currentMonthStr;

        const transaction = transactions.find(t => {
          const isThisMonth = t.date.startsWith(month);
          const isIncome = t.type === 'income';
          const isFund = t.category === 'Fundo de Investimento' || t.desc.toLowerCase().includes('fundo');
          return isThisMonth && isIncome && isFund && t.desc.includes(unit);
        });

        if (transaction) {
          if (isCurrentMonth) {
            const paidDay = parseInt(transaction.date.split('-')[2]);
            if (paidDay > FUND_DUE_DAY) currentStatus = 'late_payment';
          }
        } else {
          if (isCurrentMonth) {
            if (currentDay > FUND_DUE_DAY) {
              currentStatus = 'overdue';
              pendingMonths.push(formatMonthShort(month));
            } else if (currentStatus === 'ok') {
              currentStatus = 'pending';
            }
          } else {
            currentStatus = 'overdue';
            pendingMonths.push(formatMonthShort(month));
          }
        }
      });

      let msg = '';
      if (pendingMonths.length > 0) {
        msg = `Pendente: ${pendingMonths.slice(0, 2).join(', ')}${pendingMonths.length > 2 ? '...' : ''}`;
      } else if (currentStatus === 'pending') {
        msg = `Aguardando (Vence dia ${FUND_DUE_DAY})`;
      } else if (currentStatus === 'late_payment') {
        msg = 'Pago com atraso este mês';
      } else {
        msg = 'Em dia (Histórico Completo)';
      }

      return { name: unit, status: pendingMonths.length > 0 ? 'overdue' : currentStatus, msg };
    });

    const hasOverdue = unitStatus.some(u => u.status === 'overdue');
    const hasLatePayment = unitStatus.some(u => u.status === 'late_payment');
    const allPaid = unitStatus.every(u => u.status === 'ok' || u.status === 'late_payment');

    return { unitStatus, hasOverdue, hasLatePayment, allPaid };
  }, [transactions, availableMonths, currentMonthStr, currentDay]);


  // --- Lógica de Verificação de Contas Fixas (Despesas Pagas pelo Condomínio) ---
  const billsStatus = useMemo(() => {
    const billStatus = REQUIRED_BILLS.map(bill => {
      const pendingMonths: string[] = [];
      let currentStatus = 'ok';

      availableMonths.forEach(month => {
        const isCurrentMonth = month === currentMonthStr;

        const transaction = transactions.find(t => {
          const isThisMonth = t.date.startsWith(month);
          const isExpense = t.type === 'expense';
          const lowerDesc = t.desc.toLowerCase();
          const lowerCat = t.category.toLowerCase();
          const matchKeyword = bill.keywords.some(k => lowerDesc.includes(k) || lowerCat.includes(k));
          return isThisMonth && isExpense && matchKeyword;
        });

        if (transaction) {
          if (isCurrentMonth) {
            const paidDay = parseInt(transaction.date.split('-')[2]);
            if (paidDay > bill.dueDay) currentStatus = 'late_payment';
          }
        } else {
          if (isCurrentMonth) {
             if (currentDay > bill.dueDay) {
               currentStatus = 'overdue';
               pendingMonths.push(formatMonthShort(month));
             } else if (currentStatus === 'ok') {
               currentStatus = 'pending';
             }
          } else {
             // Conta antiga não paga?
             currentStatus = 'overdue';
             pendingMonths.push(formatMonthShort(month));
          }
        }
      });

      let msg = '';
      if (pendingMonths.length > 0) {
        msg = `Não pago: ${pendingMonths.slice(0, 2).join(', ')}${pendingMonths.length > 2 ? '...' : ''}`;
      } else if (currentStatus === 'pending') {
        msg = `Aguardando (Vence dia ${bill.dueDay})`;
      } else if (currentStatus === 'late_payment') {
        msg = 'Pago com atraso este mês';
      } else {
        msg = 'Em dia (Histórico Completo)';
      }

      return { label: bill.label, status: pendingMonths.length > 0 ? 'overdue' : currentStatus, msg };
    });

    const hasOverdue = billStatus.some(b => b.status === 'overdue');
    const hasLatePayment = billStatus.some(b => b.status === 'late_payment');
    const allPaid = billStatus.every(b => b.status === 'ok' || b.status === 'late_payment');

    return { billStatus, hasOverdue, hasLatePayment, allPaid };
  }, [transactions, availableMonths, currentMonthStr, currentDay]);

  const chartData = useMemo(() => {
    const map: Record<string, { month: string, income: number, expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      // Format YYYY-MM
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      // Display MM/YYYY
      const displayKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      if (!map[key]) {
        map[key] = { month: displayKey, income: 0, expense: 0 };
      }
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expense += t.amount;
    });

    // Sort by YYYY-MM key but return the values with displayKey
    return Object.entries(map)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, val]) => val);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const formatBRL = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Helper para cor do card
  const getCardStyle = (hasOverdue: boolean, hasLate: boolean, allPaid: boolean) => {
    if (hasOverdue) return 'bg-red-50 border-red-200';
    if (!allPaid) return 'bg-amber-50 border-amber-200'; // Pendente mas no prazo
    if (hasLate) return 'bg-orange-50 border-orange-200'; // Tudo pago, mas houve atraso
    return 'bg-emerald-50 border-emerald-200'; // Tudo pago em dia
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'late_payment': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'overdue': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <CalendarClock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards Grid - VISÍVEL APENAS PARA ADMIN */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Card 1: Arrecadação (Cota Condominial) */}
          <div className={`p-6 rounded-xl shadow-sm border transition-colors ${getCardStyle(quotaStatus.hasOverdue, quotaStatus.hasLatePayment, quotaStatus.allPaid)}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/60 rounded-lg">
                {quotaStatus.hasOverdue ? <AlertCircle className="w-6 h-6 text-red-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Cotas Mensais</h3>
                <p className="text-xs text-slate-600 font-medium">Histórico Completo</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {quotaStatus.unitStatus.map((u) => (
                <div key={u.name} className="flex items-center justify-between text-sm bg-white/50 p-2 rounded border border-black/5">
                  <span className="font-medium text-slate-700">{u.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${u.status === 'overdue' ? 'text-red-700 font-bold' : u.status === 'ok' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {u.msg}
                    </span>
                    {getStatusIcon(u.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Fundo de Investimento */}
          <div className={`p-6 rounded-xl shadow-sm border transition-colors bg-purple-50 border-purple-200`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/60 rounded-lg">
                {fundStatus.hasOverdue ? <AlertCircle className="w-6 h-6 text-red-600" /> : <PiggyBank className="w-6 h-6 text-purple-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Fundo Invest.</h3>
                <p className="text-xs text-slate-600 font-medium">Histórico • R$ {FUND_AMOUNT_FIXED.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {fundStatus.unitStatus.map((u) => (
                <div key={u.name} className="flex items-center justify-between text-sm bg-white/50 p-2 rounded border border-black/5">
                  <span className="font-medium text-slate-700">{u.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${u.status === 'overdue' ? 'text-red-700 font-bold' : u.status === 'ok' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {u.msg}
                    </span>
                    {getStatusIcon(u.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Contas Fixas (Despesas) */}
          <div className={`p-6 rounded-xl shadow-sm border transition-colors ${getCardStyle(billsStatus.hasOverdue, billsStatus.hasLatePayment, billsStatus.allPaid)} md:col-span-2 lg:col-span-1`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/60 rounded-lg">
                {billsStatus.hasOverdue ? <AlertCircle className="w-6 h-6 text-red-600" /> : <Zap className="w-6 h-6 text-blue-600" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Contas Fixas</h3>
                <p className="text-xs text-slate-600 font-medium">Histórico (Luz & Água)</p>
              </div>
            </div>

            <div className="space-y-2">
              {billsStatus.billStatus.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-sm bg-white/50 p-2 rounded border border-black/5">
                  <span className="font-medium text-slate-700">{b.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${b.status === 'overdue' ? 'text-red-700 font-bold' : b.status === 'ok' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {b.msg}
                    </span>
                    {getStatusIcon(b.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Stats Cards - Análise Financeira Separada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Saldo Atual */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between relative overflow-hidden">
           <div className="relative z-10">
            <p className="text-sm font-medium text-slate-500">Saldo Geral</p>
            <h3 className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
              {formatBRL(stats.balance)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Conta Bancária</p>
          </div>
          <div className={`p-3 rounded-lg ${stats.balance >= 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'} relative z-10`}>
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Receita Operacional (Sem Fundo) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Receita Operacional</p>
            <h3 className="text-2xl font-bold mt-1 text-indigo-600">
              {formatBRL(stats.operationalIncome)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Cotas e Outros</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Despesas Totais */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Despesas Totais</p>
            <h3 className="text-2xl font-bold mt-1 text-pink-600">
              {formatBRL(stats.expense)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Contas pagas</p>
          </div>
          <div className="p-3 rounded-lg bg-pink-100 text-pink-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Fundo de Reserva Acumulado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Fundo Acumulado</p>
            <h3 className="text-2xl font-bold mt-1 text-purple-600">
              {formatBRL(stats.fundTotal)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Reserva separada</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Visão Geral do Fluxo de Caixa
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatBRL(value)}
                  labelStyle={{ color: '#475569' }}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" name="Receita Total" />
                <Area type="monotone" dataKey="expense" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Maiores Despesas por Categoria</h3>
          <div className="flex flex-col md:flex-row items-center">
            <div className="h-[300px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px' }} 
                    formatter={(value: number) => formatBRL(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-0">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-slate-600 font-medium">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{formatBRL(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};