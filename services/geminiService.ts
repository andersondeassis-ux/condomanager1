import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your env

// Initialize client safely
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateFinancialReport = async (transactions: Transaction[], periodContext: string = 'Período Recente'): Promise<string> => {
  if (!ai) return "A Chave da API está ausente. Por favor, configure o ambiente.";

  // Aumentamos o contexto para 40 transações para ter mais precisão em períodos maiores
  // Em um app real, idealmente enviaríamos um resumo agregado (soma por categorias) para economizar tokens
  const analyzedTransactions = transactions.slice(-40); 
  const summary = JSON.stringify(analyzedTransactions);

  const prompt = `
    Você é um consultor financeiro especialista para administração de condomínios.
    
    CONTEXTO DA ANÁLISE: ${periodContext}
    
    Analise os seguintes dados JSON representando as transações financeiras (receitas e despesas) deste período.
    Nota: Se houver muitas transações, esta é uma amostra das mais recentes/relevantes.
    
    Dados: ${summary}

    Por favor, forneça um relatório conciso em formato Markdown (em Português do Brasil) incluindo:
    1. **Resumo do Período**: O saldo do período foi positivo ou negativo? (${periodContext})
    2. **Anomalias e Destaques**: Aponte gastos elevados ou receitas atípicas neste período específico.
    3. **Sugestões de Ação**: 2 conselhos práticos baseados nestes números.
    4. **Minuta para Moradores**: Um parágrafo curto comunicando a situação deste período específico.

    Mantenha o tom profissional, direto e em Português.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o relatório no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao gerar o relatório de IA. Por favor, tente novamente mais tarde.";
  }
};
