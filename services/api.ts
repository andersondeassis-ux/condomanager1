import { supabase } from './supabase';
import { Transaction, Resident, VacationNotice, BudgetProposal, ImprovementIdea } from '../types';

// Helper genérico para tratamento de erros
const handleResponse = async (query: any) => {
  const { data, error } = await query;
  if (error) {
    console.error("Supabase Error:", error);
    throw error;
  }
  return data;
};

export const api = {
  transactions: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    create: async (data: Omit<Transaction, 'id'>) => {
      const { data: res, error } = await supabase
        .from('transactions')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return res;
    },
    update: async (id: number, data: Partial<Transaction>) => {
      const { data: res, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res;
    },
    delete: async (id: number) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  residents: {
    getAll: async () => {
      return handleResponse(supabase.from('residents').select('*'));
    },
    create: async (data: Omit<Resident, 'id'>) => {
      return handleResponse(supabase.from('residents').insert([data]).select().single());
    },
    update: async (id: number, data: Partial<Resident>) => {
      return handleResponse(supabase.from('residents').update(data).eq('id', id).select().single());
    },
    delete: async (id: number) => {
      const { error } = await supabase.from('residents').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  vacations: {
    getAll: async () => {
      return handleResponse(supabase.from('vacation_notices').select('*'));
    },
    create: async (data: Omit<VacationNotice, 'id'>) => {
      return handleResponse(supabase.from('vacation_notices').insert([data]).select().single());
    },
    update: async (id: number, data: Partial<VacationNotice>) => {
      return handleResponse(supabase.from('vacation_notices').update(data).eq('id', id).select().single());
    },
    delete: async (id: number) => {
      const { error } = await supabase.from('vacation_notices').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  },

  proposals: {
    getAll: async () => {
      return handleResponse(supabase.from('budget_proposals').select('*'));
    },
    create: async (data: Omit<BudgetProposal, 'id'>) => {
      return handleResponse(supabase.from('budget_proposals').insert([data]).select().single());
    },
    vote: async (id: number, type: 'for' | 'against') => {
      // Para incrementar atomicamente, o ideal seria uma RPC (função no banco), 
      // mas faremos via fetch+update para simplificar a configuração do usuário.
      const { data: current } = await supabase.from('budget_proposals').select('*').eq('id', id).single();
      if (!current) throw new Error("Proposta não encontrada");

      const updates = type === 'for' 
        ? { votesFor: current.votesFor + 1 }
        : { votesAgainst: current.votesAgainst + 1 };

      return handleResponse(supabase.from('budget_proposals').update(updates).eq('id', id).select().single());
    },
    updateStatus: async (id: number, status: 'approved' | 'rejected') => {
      return handleResponse(supabase.from('budget_proposals').update({ status }).eq('id', id).select().single());
    },
  },

  ideas: {
    getAll: async () => {
      return handleResponse(supabase.from('improvement_ideas').select('*'));
    },
    create: async (data: Omit<ImprovementIdea, 'id'>) => {
      // Garante que o JSONB seja enviado corretamente
      const payload = {
        ...data,
        votes: { low: 0, medium: 0, high: 0 }
      };
      return handleResponse(supabase.from('improvement_ideas').insert([payload]).select().single());
    },
    delete: async (id: number) => {
      const { error } = await supabase.from('improvement_ideas').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
    vote: async (id: number, priority: 'low' | 'medium' | 'high') => {
      // Fetch current state first
      const { data: idea } = await supabase.from('improvement_ideas').select('*').eq('id', id).single();
      if (!idea) throw new Error("Ideia não encontrada");

      const currentVotes = idea.votes || { low: 0, medium: 0, high: 0 };
      const newVotes = {
        ...currentVotes,
        [priority]: (currentVotes[priority] || 0) + 1
      };

      return handleResponse(supabase.from('improvement_ideas').update({ votes: newVotes }).eq('id', id).select().single());
    },
  }
};