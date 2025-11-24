import React, { useState, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Attachment } from '../types';
import { Search, Plus, Filter, Trash2, Edit2, Download, X, Paperclip, AlertTriangle, FileText, Lock } from 'lucide-react';
import { api } from '../services/api';

interface TransactionManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  userEmail?: string;
}

const INITIAL_FORM_STATE = {
  date: new Date().toISOString().split('T')[0],
  type: 'expense' as TransactionType,
  desc: '',
  amount: '',
  category: '',
  attachments: [] as Attachment[]
};

const ADMIN_EMAIL = 'andersonde.assis@hotmail.com';

export const TransactionManager: React.FC<TransactionManagerProps> = ({ transactions, setTransactions, userEmail }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verifica permissão
  const canEdit = userEmail === ADMIN_EMAIL;

  const availableCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const filtered = transactions
    .filter(t => {
      const matchText = t.desc.toLowerCase().includes(filterText.toLowerCase()) || 
                        t.category.toLowerCase().includes(filterText.toLowerCase());
      const matchMonth = filterMonth ? t.date.startsWith(filterMonth) : true;
      const matchCategory = filterCategory ? t.category === filterCategory : true;
      return matchText && matchMonth && matchCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return; // Segurança extra frontend

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || !form.desc) return;

    setLoading(true);
    try {
      if (editingId) {
        // Atualizar via API
        const updated = await api.transactions.update(editingId, { ...form, amount });
        // Com Supabase o JSON já vem parseado
        setTransactions(prev => prev.map(t => t.id === editingId ? updated : t));
      } else {
        // Criar via API
        const created = await api.transactions.create({ ...form, amount });
        setTransactions(prev => [created, ...prev]);
      }
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      alert("Erro ao salvar no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (t: Transaction) => {
    if (!canEdit) return;
    setForm({
      date: t.date,
      type: t.type,
      desc: t.desc,
      amount: String(t.amount),
      category: t.category,
      attachments: t.attachments || []
    });
    setEditingId(t.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: number) => {
    if (!canEdit) return;
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await api.transactions.delete(deleteId);
        setTransactions(prev => prev.filter(t => t.id !== deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir do servidor.");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM_STATE);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAttachment: Attachment = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      };
      setForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment]
      }));
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const exportCSV = () => {
    const header = ["ID", "Data", "Tipo", "Descrição", "Categoria", "Valor"];
    const rows = filtered.map(t => [t.id, t.date, t.type, `"${t.desc}"`, t.category, t.amount]);
    const csv = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transacoes_condominio.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBRL = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const clearFilters = () => {
    setFilterText('');
    setFilterMonth('');
    setFilterCategory('');
  };

  const hasActiveFilters = filterText || filterMonth || filterCategory;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-800">Transações</h2>
          {!canEdit && (
            <span className="flex items-center gap-1 text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3" /> Modo Visualização
            </span>
          )}
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
          
          {/* Filtros... (Mantidos iguais) */}
          <div className="w-full sm:w-auto">
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600"
            />
          </div>

          <div className="w-full sm:w-auto relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-40 pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-slate-600"
            >
              <option value="">Todas Categorias</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar descrição..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={exportCSV}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {/* Botão de Adicionar - Apenas Admin */}
            {canEdit && (
              <button 
                onClick={() => { setIsModalOpen(true); setEditingId(null); setForm(INITIAL_FORM_STATE); }}
                className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nova Transação</span>
                <span className="sm:hidden">Nova</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left">Data</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Descrição</th>
              <th className="px-6 py-3 text-left">Categoria</th>
              <th className="px-6 py-3 text-right">Valor</th>
              {/* Coluna de Ações - Apenas Admin */}
              {canEdit && <th className="px-6 py-3 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="px-6 py-12 text-center text-slate-400">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap font-medium">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      t.type === 'income' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                    <div className="flex flex-col">
                      <span>{t.desc}</span>
                      {t.attachments && t.attachments.length > 0 && (
                        <div className="flex gap-1 mt-1">
                           {t.attachments.map((att, idx) => (
                             <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                               <Paperclip className="w-3 h-3" /> {att.name}
                             </a>
                           ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {t.category}
                  </td>
                  <td className={`px-6 py-4 text-sm text-right font-semibold ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.type === 'expense' ? '-' : '+'}{formatBRL(t.amount)}
                  </td>
                  {/* Botões de Ação - Apenas Admin */}
                  {canEdit && (
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-transparent hover:border-indigo-100"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => requestDelete(t.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                  <select 
                    value={form.type} 
                    onChange={(e) => setForm({...form, type: e.target.value as TransactionType})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={form.date} 
                    onChange={(e) => setForm({...form, date: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
                <input 
                  placeholder="Ex: Cota Mensal - 101" 
                  value={form.desc} 
                  onChange={(e) => setForm({...form, desc: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
                  <input 
                    list="category-suggestions"
                    placeholder="Ex: Taxa Condominial" 
                    value={form.category} 
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <datalist id="category-suggestions">
                    <option value="Taxa Condominial" />
                    <option value="Fundo de Investimento" />
                    <option value="Manutenção" />
                    <option value="Contas Fixas" />
                    <option value="Utilidades" />
                    <option value="Serviços" />
                    <option value="Outros" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={form.amount} 
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Anexos (Opcional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                <div 
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-indigo-200 rounded-lg p-4 flex flex-col items-center justify-center text-indigo-400 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <Paperclip className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Clique para anexar comprovante</span>
                  <span className="text-xs text-indigo-300">Imagens ou PDF</span>
                </div>
                {form.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {form.attachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 overflow-hidden">
                          <FileText className="w-4 h-4 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{att.name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Adicionar Transação')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && canEdit && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Transação?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Tem certeza que deseja remover este registro financeiro? Esta ação afetará o saldo e não pode ser desfeita.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};