import React, { useState } from 'react';
import { Transaction } from '../types';
import { generateFinancialReport } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  transactions: Transaction[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ transactions }) => {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateFinancialReport(transactions);
    setReport(result);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Insights CondoAI
          </h2>
          <p className="text-indigo-200 mt-2 max-w-xl">
            Use inteligência artificial para analisar o fluxo de caixa do seu condomínio, detectar anomalias de gastos e gerar relatórios mensais para os moradores.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-6 bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analisando Finanças..." : "Gerar Relatório Inteligente"}
          </button>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-pink-600 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {report && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-4 border-b border-slate-100">
            Resultados da Análise
          </h3>
          <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-strong:text-indigo-700">
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