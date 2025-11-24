import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { generateFinancialReport } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle, Calendar, Layers, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  transactions: Transaction[];
}

type FilterType = 'month' | 'all';

export const AIAssistant: React.FC<AIAssistantProps> = ({ transactions }) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Lógica de Filtragem dos Dados antes de enviar para IA
  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, filterType, selectedMonth]);

  const handleGenerate = async () => {
    setLoading(true);
    
    // Define o texto de contexto para ajudar a IA
    let contextLabel = '';
    if (filterType === 'all') {
      contextLabel = 'Todo o Histórico Cadastrado';
    } else {
      const [y, m] = selectedMonth.split('-');
      contextLabel = `Mês de Referência: ${m}/${y}`;
    }

    const result = await generateFinancialReport(filteredTransactions, contextLabel);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header com Filtros */}
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Insights CondoAI
          </h2>
          <p className="text-indigo-200 mt-2 max-w-xl text-sm">
            Selecione o período que deseja analisar. A IA lerá as transações filtradas e gerará um relatório financeiro personalizado.
          </p>

          {/* Área de Filtros */}
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              
              {/* Toggle Tipo de Filtro */}
              <div className="flex bg-indigo-950 p-1 rounded-lg w-full md:w-auto">
                <button
                  onClick={() => setFilterType('month')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filterType === 'month' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-300 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Mês Específico
                </button>
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    filterType === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-indigo-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Todo Período
                </button>
              </div>

              {/* Input de Data (só aparece se for mês específico) */}
              {filterType === 'month' && (
                <div className="w-full md:w-auto">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-indigo-800 border border-indigo-700 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  />
                </div>
              )}

              {/* Contador de dados */}
              <div className="text-xs text-indigo-200 ml-auto hidden md:block">
                {filteredTransactions.length} registros encontrados
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-xs text-indigo-300 md:hidden">
                {filteredTransactions.length} registros para análise
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading || filteredTransactions.length === 0}
                className="w-full md:w-auto bg-white text-indigo-900 px-6 py-2.5 rounded-lg font-bold shadow hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Processando..." : "Gerar Relatório"}
              </button>
            </div>
          </div>

        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-600 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {report && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-fade-in relative">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-xl" />
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Relatório da Inteligência Artificial</h3>
              <p className="text-xs text-slate-500">
                Análise baseada em {filteredTransactions.length} transações de {filterType === 'all' ? 'todo o histórico' : selectedMonth}.
              </p>
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-strong:text-indigo-700 prose-li:marker:text-indigo-500">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {!process.env.API_KEY && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-800 font-semibold text-sm">Chave da API Ausente</h4>
            <p className="text-amber-700 text-sm mt-1">
              Para usar os recursos de IA, configure a <code>API_KEY</code> no seu ambiente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
