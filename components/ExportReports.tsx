import React, { useState } from 'react';
import { Transaction } from '../types';
import { Download, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface ExportReportsProps {
  transactions: Transaction[];
}

export const ExportReports: React.FC<ExportReportsProps> = ({ transactions }) => {
  const currentYear = new Date().getFullYear();
  
  // States for selections
  const [monthSelected, setMonthSelected] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [semesterYear, setSemesterYear] = useState(currentYear);
  const [semesterHalf, setSemesterHalf] = useState('1');
  const [annualYear, setAnnualYear] = useState(currentYear);

  // Feedback states
  const [downloading, setDownloading] = useState<string | null>(null);

  // Helper: Convert to CSV and Download
  const downloadCSV = (data: Transaction[], filename: string) => {
    if (data.length === 0) {
      alert("Não há dados para o período selecionado.");
      return;
    }

    setDownloading(filename);
    
    const header = ["ID", "Data", "Tipo", "Categoria", "Descrição", "Valor", "Status"];
    const rows = data.map(t => [
      t.id,
      t.date,
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category,
      `"${t.desc.replace(/"/g, '""')}"`, // Escape quotes
      t.amount.toFixed(2).replace('.', ','),
      'Concluído'
    ]);

    const csvContent = "\uFEFF" + [header.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(null), 1000);
  };

  // 1. Export Monthly
  const handleMonthlyExport = () => {
    const filtered = transactions.filter(t => t.date.startsWith(monthSelected));
    downloadCSV(filtered, `relatorio_mensal_${monthSelected}`);
  };

  // 2. Export Semiannual
  const handleSemiannualExport = () => {
    const startMonth = semesterHalf === '1' ? 0 : 6; // 0 = Jan, 6 = Jul
    const endMonth = semesterHalf === '1' ? 5 : 11;  // 5 = Jun, 11 = Dec

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      const tYear = d.getFullYear();
      const tMonth = d.getMonth(); // 0-11
      return tYear === Number(semesterYear) && tMonth >= startMonth && tMonth <= endMonth;
    });

    downloadCSV(filtered, `relatorio_${semesterHalf}semestre_${semesterYear}`);
  };

  // 3. Export Annual
  const handleAnnualExport = () => {
    const filtered = transactions.filter(t => t.date.startsWith(String(annualYear)));
    downloadCSV(filtered, `relatorio_anual_${annualYear}`);
  };

  const yearsRange = Array.from({ length: 5 }, (_, i) => currentYear - i); // [2025, 2024, 2023...]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="bg-indigo-900 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-300" />
            Central de Exportação
          </h2>
          <p className="text-indigo-200 mt-2 max-w-xl">
            Gere relatórios detalhados em formato CSV (Excel) para auditoria, arquivamento ou análise externa.
          </p>
        </div>
        {/* Background Patterns */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 transform skew-x-12 translate-x-10" />
        <div className="absolute left-10 bottom-[-40px] w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Mensal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col hover:border-indigo-200 transition-all">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Relatório Mensal</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Ideal para o fechamento do caixa e prestação de contas mês a mês.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Selecione o Mês</label>
              <input 
                type="month" 
                value={monthSelected}
                onChange={(e) => setMonthSelected(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button 
              onClick={handleMonthlyExport}
              className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              {downloading?.includes('mensal') ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <Download className="w-4 h-4" />}
              Baixar CSV
            </button>
          </div>
        </div>

        {/* Card Semestral */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col hover:border-indigo-200 transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Relatório Semestral</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Consolidado de 6 meses. Útil para análises de médio prazo e reuniões de conselho.
          </p>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Ano</label>
                <select 
                  value={semesterYear}
                  onChange={(e) => setSemesterYear(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Período</label>
                <select 
                  value={semesterHalf}
                  onChange={(e) => setSemesterHalf(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="1">1º Semestre</option>
                  <option value="2">2º Semestre</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handleSemiannualExport}
              className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              {downloading?.includes('semestre') ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <Download className="w-4 h-4" />}
              Baixar CSV
            </button>
          </div>
        </div>

        {/* Card Anual */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col hover:border-indigo-200 transition-all">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Relatório Anual</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Visão completa do exercício fiscal. Essencial para a Assembleia Geral Ordinária (AGO).
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Selecione o Ano</label>
              <select 
                value={annualYear}
                onChange={(e) => setAnnualYear(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button 
              onClick={handleAnnualExport}
              className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              {downloading?.includes('anual') ? <CheckCircle2 className="w-4 h-4 text-emerald-600"/> : <Download className="w-4 h-4" />}
              Baixar CSV
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 flex items-start gap-3">
        <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <p>
          <strong>Nota técnica:</strong> Os arquivos são gerados em formato CSV com separação por ponto-e-vírgula (;) para garantir compatibilidade direta com Excel e Google Sheets em português, preservando a formatação de valores monetários.
        </p>
      </div>
    </div>
  );
};