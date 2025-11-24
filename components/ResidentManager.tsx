import React, { useState, useEffect } from 'react';
import { Resident } from '../types';
import { Search, Plus, Edit2, Trash2, User, Phone, Mail, Home, X, MessageCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const INITIAL_FORM_STATE = {
  name: '',
  unit: 'Casa 101',
  phone: '',
  email: '',
};

const PREDEFINED_UNITS = ['Casa 101', 'Casa 102', 'Casa 103'];

export const ResidentManager: React.FC = () => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.residents.getAll().then(setResidents).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) return;

    setLoading(true);
    try {
      if (editingId) {
        const updated = await api.residents.update(editingId, { ...form });
        setResidents(prev => prev.map(r => r.id === editingId ? updated : r));
      } else {
        const created = await api.residents.create({ ...form, status: 'active' });
        setResidents(prev => [...prev, created]);
      }
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar morador:", error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r: Resident) => {
    setForm({
      name: r.name,
      unit: r.unit,
      phone: r.phone,
      email: r.email,
    });
    setEditingId(r.id);
    setIsModalOpen(true);
  };

  const openAddForUnit = (unitName: string) => {
    setForm({ ...INITIAL_FORM_STATE, unit: unitName });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await api.residents.delete(deleteId);
        setResidents(prev => prev.filter(r => r.id !== deleteId));
        setDeleteId(null);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir.");
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM_STATE);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Gestão de Moradores</h2>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar morador..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          
          <button 
            onClick={() => {
              setForm(INITIAL_FORM_STATE);
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Morador</span>
          </button>
        </div>
      </div>

      {/* Visual Map of Houses */}
      <div className="overflow-auto flex-1 p-6 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PREDEFINED_UNITS.map((unit) => {
            const unitResidents = residents.filter(r => 
              r.unit === unit && 
              r.name.toLowerCase().includes(filterText.toLowerCase())
            );

            return (
              <div key={unit} className="flex flex-col h-full">
                {/* House Header */}
                <div className="bg-white border-t-4 border-indigo-500 rounded-t-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Home className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{unit}</h3>
                  </div>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                    {unitResidents.length} {unitResidents.length === 1 ? 'morador' : 'moradores'}
                  </span>
                </div>

                {/* House Body (Residents List) */}
                <div className="bg-slate-100/50 border-x border-b border-slate-200 rounded-b-xl p-4 flex-1 space-y-3 min-h-[200px]">
                  {unitResidents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8 border-2 border-dashed border-slate-200 rounded-lg">
                      <User className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-sm">Casa vazia</span>
                    </div>
                  ) : (
                    unitResidents.map(resident => (
                      <div key={resident.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                        {/* Actions */}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10">
                          <button 
                            onClick={() => openEdit(resident)} 
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-slate-200"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(resident.id)} 
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-start gap-3 pr-8">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {resident.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate mb-1">{resident.name}</p>
                            
                            {resident.phone && (
                              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{resident.phone}</span>
                                <a href={`https://wa.me/55${resident.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 rounded-full p-0.5" title="WhatsApp">
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              </div>
                            )}

                            {resident.email && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                <span className="truncate text-slate-600">{resident.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <button 
                    onClick={() => openAddForUnit(unit)}
                    className="w-full py-2.5 mt-2 text-xs font-medium text-indigo-600 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar em {unit}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Editar Morador' : 'Novo Morador'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Unidade / Casa</label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    required
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="" disabled>Selecione a casa...</option>
                    {PREDEFINED_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3 w-2 h-2 border-r border-b border-slate-400 rotate-45 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: João da Silva"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefone / Celular</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="Ex: 11999999999"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g,'')})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    placeholder="Ex: joao@email.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Morador')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Morador?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Tem certeza que deseja remover este registro? Esta ação não pode ser desfeita.
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