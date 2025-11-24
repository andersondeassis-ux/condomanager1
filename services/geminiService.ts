import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure this is available in your env

// Initialize client safely
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateFinancialReport = async (transactions: Transaction[]): Promise<string> => {
  if (!ai) return "A Chave da API está ausente. Por favor, configure o ambiente.";

  const recentTransactions = transactions.slice(-20); // Analyze last 20 for context
  const summary = JSON.stringify(recentTransactions);

  const prompt = `
    Você é um consultor financeiro especialista para administração de condomínios.
    Analise os seguintes dados JSON representando transações recentes do condomínio (receitas e despesas).
    
    Dados: ${summary}

    Por favor, forneça um relatório conciso em formato Markdown (em Português do Brasil) incluindo:
    1. **Diagnóstico Financeiro**: O condomínio está economizando ou gastando demais?
    2. **Anomalias de Gastos**: Aponte quaisquer despesas incomumente altas ou padrões irregulares.
    3. **Oportunidades de Economia**: Sugira 2-3 maneiras práticas de reduzir custos com base nas categorias mostradas (ex: Manutenção, Água, Energia).
    4. **Minuta de Comunicado**: Escreva um parágrafo curto e educado para os moradores resumindo o status financeiro do mês atual.

    Mantenha o tom profissional, mas acessível. Responda em Português.
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