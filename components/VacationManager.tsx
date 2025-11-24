import React, { useState } from 'react';
import { VacationNotice } from '../types';
import { Palmtree, Calendar, Plus, Trash2, X, AlertTriangle, CheckCircle2, Clock, Edit2, ArrowRight, CalendarDays } from 'lucide-react';

const PREDEFINED_UNITS = ['Casa 101', 'Casa 102', 'Casa 103'];

// Mock data
const INITIAL_NOTICES: VacationNotice[] = [
  { id: 1, unit: 'Casa 102', startDate: '2025-12-20', endDate: '2026-01-05', notes: 'Viagem de fim de ano. Chave na portaria.' },
];

const INITIAL_FORM = {
  unit: 'Casa 101',
  startDate: '',
  endDate: '',
  notes: ''
};

export const VacationManager: React.FC = () => {
  const [notices, setNotices] = useState<VacationNotice[]>(INITIAL_NOTICES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return;

    if (editingId) {
      // Editar existente
      setNotices(prev => prev.map(n => n.id === editingId ? { ...n, ...form } : n));
    } else {
      // Criar novo
      setNotices(prev => [...prev, {
        id: Date.now(),
        ...form
      }]);
    }
    
    closeModal();
  };

  const openEdit = (notice: VacationNotice) => {
    setForm({
      unit: notice.unit,
      startDate: notice.startDate,
      endDate: notice.endDate,
      notes: notice.notes || ''
    });
    setEditingId(notice.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setNotices(prev => prev.filter(n => n.id !== deleteId));
      setDeleteId(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getDurationDays = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  // Lógica para separar status
  const checkStatus = (start: string, end: string) => {
    if (today >= start && today <= end) return 'active'; // Ausente agora
    if (today < start) return 'scheduled'; // Vai viajar
    return 'completed'; // Já voltou
  };

  // Lógica da Barra de Progresso (Proximidade da Viagem)
  const getProximityData = (startDateStr: string) => {
    const now = new Date();
    now.setHours(0,0,0,0);
    
    // Adiciona T00:00:00 para garantir que o navegador interprete como data local, não UTC
    const start = new Date(startDateStr + 'T00:00:00'); 
    
    const diffTime = start.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let percentage = 0;
    let colorClass = 'bg-indigo-500';
    let label = '';

    if (daysLeft <= 0) {
      // Chegou o dia (ou já passou mas ainda não entrou no status 'active' por delay de render)
      percentage = 100;
      colorClass = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      label = 'É hoje!';
    } else if (daysLeft <= 15) {
      // Janela de 15 dias: calcula porcentagem (1 dia = ~93%, 15 dias = 0%)
      // Fórmula: 100 - (dias * (100 / 15))
      percentage = Math.max(5, 100 - (daysLeft * 6.6));
      
      if (daysLeft <= 3) colorClass = 'bg-indigo-600'; // Muito perto (escuro)
      else colorClass = 'bg-indigo-400'; // Aproximando (médio)
      
      label = `Faltam ${daysLeft} dias`;
    } else {
      // Longe (mais de 15 dias)
      percentage = 5; 
      colorClass = 'bg-slate-300';
      label = `Faltam ${daysLeft} dias`;
    }

    return { percentage, colorClass, label };
  };

  const activeNotices = notices.filter(n => checkStatus(n.startDate, n.endDate) === 'active');
  const scheduledNotices = notices.filter(n => checkStatus(n.startDate, n.endDate) === 'scheduled').sort((a,b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Box */}
      <div className="bg-teal-900 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palmtree className="w-6 h-6 text-teal-300" />
            Aviso de Férias
          </h2>
          <p className="text-teal-100 mt-2 max-w-xl">
            Informe quando sua casa ficará vazia. Isso ajuda na segurança e evita entregas ou visitas inesperadas durante sua ausência.
          </p>
          <button
            onClick={() => { setEditingId(null); setForm(INITIAL_FORM); setIsModalOpen(true); }}
            className="mt-6 bg-white text-teal-900 px-6 py-3 rounded-lg font-semibold shadow hover:bg-teal-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Nova Saída
          </button>
        </div>
        <div className="absolute right-0 bottom-0 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl translate-y-10 translate-x-10" />
      </div>

      {/* Status: AUSENTES AGORA (Crítico) */}
      {activeNotices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="text-lg font-bold text-amber-900">Ausentes Neste Momento</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeNotices.map(notice => (
              <div key={notice.id} className="bg-white p-5 rounded-xl shadow-sm border border-amber-200 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h4 className="font-bold text-xl text-slate-800">{notice.unit}</h4>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Casa Vazia</span>
                  </div>
                  <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(notice)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => requestDelete(notice.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pl-2 space-y-3">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="text-center">
                      <span className="block text-xs text-slate-500 uppercase">Saída</span>
                      <span className="font-semibold text-slate-800">{formatDate(notice.startDate)}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                    <div className="text-center">
                      <span className="block text-xs text-slate-500 uppercase">Volta</span>
                      <span className="font-bold text-amber-700">{formatDate(notice.endDate)}</span>
                    </div>
                  </div>

                  {notice.notes && (
                    <div className="text-sm text-slate-600 italic flex items-start gap-2">
                      <span className="text-slate-400">Obs:</span>
                      {notice.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status: AGENDADOS */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-1">
          <CalendarDays className="w-5 h-5 text-indigo-600" />
          Próximas Viagens
        </h3>
        
        {scheduledNotices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
            <Palmtree className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhuma viagem agendada para os próximos dias.</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-2 text-indigo-600 font-medium hover:underline">Agendar agora</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scheduledNotices.map(notice => {
              const progress = getProximityData(notice.startDate);
              
              return (
                <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col">
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                        {notice.unit.replace('Casa ', '')}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{notice.unit}</h4>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {getDurationDays(notice.startDate, notice.endDate)} dias fora
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEdit(notice)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => requestDelete(notice.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 mb-1">De</span>
                        <span className="font-semibold text-slate-700">{formatDate(notice.startDate)}</span>
                      </div>
                      <div className="h-px w-8 bg-slate-200"></div>
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-slate-400 mb-1">Até</span>
                        <span className="font-semibold text-slate-700">{formatDate(notice.endDate)}</span>
                      </div>
                    </div>
                    
                    {notice.notes ? (
                      <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-500 line-clamp-2">
                        {notice.notes}
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-50 text-xs text-slate-300 italic">
                        Sem observações
                      </div>
                    )}
                  </div>
                  
                  {/* Card Footer status line (Dynamic Progress Bar) */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-b-xl overflow-hidden relative" title={progress.label}>
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ease-out ${progress.colorClass}`}
                       style={{ width: `${progress.percentage}%` }}
                     />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Editar Aviso' : 'Registrar Ausência'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Unidade</label>
                <select 
                  value={form.unit}
                  onChange={(e) => setForm({...form, unit: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PREDEFINED_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data de Saída</label>
                  <input 
                    type="date" 
                    // Se editando, permite datas anteriores, se novo, apenas futuro
                    min={editingId ? undefined : today}
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data de Retorno</label>
                  <input 
                    type="date" 
                    min={form.startDate || today}
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Observações (Opcional)</label>
                <textarea 
                  placeholder="Ex: Chave deixada com portaria, vizinho irá regar plantas..." 
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingId ? 'Salvar Alterações' : 'Confirmar Aviso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Aviso?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Tem certeza que deseja remover este aviso de férias?
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