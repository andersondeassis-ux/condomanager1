
export type TransactionType = 'income' | 'expense';

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Transaction {
  id: number;
  date: string;
  type: TransactionType;
  desc: string;
  amount: number;
  category: string;
  attachments: Attachment[];
}

export interface User {
  name: string;
  role: 'admin' | 'resident';
  unit?: string;
}

export interface Resident {
  id: number;
  name: string;
  unit: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface VacationNotice {
  id: number;
  unit: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export interface DashboardStats {
  balance: number;
  totalIncome: number;
  totalExpense: number;
}

export interface CategorySummary {
  name: string;
  value: number;
  color: string;
}

export interface BudgetProposal {
  id: number;
  title: string;
  description: string;
  value: number;
  provider: string;
  status: 'open' | 'approved' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  deadline: string;
}

export interface ImprovementIdea {
  id: number;
  title: string;
  description: string;
  authorUnit: string;
  // Novo sistema de votação por prioridade
  votes: {
    low: number;    // Melhoria Futura
    medium: number; // Ideia para o Momento
    high: number;   // Urgente
  };
  createdAt: string;
}