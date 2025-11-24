
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { Building2, Mail, Lock, Loader2, User, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, Phone, Home } from 'lucide-react';

const PREDEFINED_UNITS = ['Casa 101', 'Casa 102', 'Casa 103'];

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Validações extras para cadastro
        if (!unit) throw new Error("Por favor, selecione sua unidade.");
        if (!phone) throw new Error("Por favor, informe seu telefone.");

        // 1. Criar usuário no Supabase Auth
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              unit: unit,
              phone: phone
            },
          },
        });
        if (authError) throw authError;

        // 2. Criar perfil automaticamente na tabela de Moradores
        // Nota: Isso funciona porque a política RLS está pública. 
        // Em produção real, isso seria feito via Trigger no banco ou Edge Function para segurança total.
        try {
            await api.residents.create({
                name: name,
                unit: unit,
                phone: phone,
                email: email,
                status: 'active'
            });
        } catch (residentError) {
            console.error("Erro ao criar perfil de morador:", residentError);
            // Não bloqueamos o fluxo de auth se falhar o perfil, mas logamos o erro.
        }

        // Se o cadastro foi sucesso e não há sessão ativa imediata
        if (data.user && !data.session) {
          setShowVerification(true);
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || "Erro ao reenviar e-mail.");
    } finally {
      setResendLoading(false);
    }
  };

  // Tela de Verificação de Email
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-200/30 blur-3xl" />
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10 animate-in fade-in zoom-in duration-300 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-100 p-4 rounded-full shadow-sm">
              <Mail className="w-10 h-10 text-emerald-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifique seu e-mail</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            Enviamos um link de confirmação para:<br/>
            <strong className="text-slate-800">{email}</strong>
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left text-sm text-slate-500">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
              Clique no link enviado para ativar sua conta.
            </p>
            <p className="flex items-start gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
              Verifique também sua caixa de Spam ou Lixo Eletrônico.
            </p>
            <p className="flex items-start gap-2 mt-2 border-t border-slate-200 pt-2 text-indigo-600">
              <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Seu perfil de morador para a <strong>{unit}</strong> já foi pré-criado.
            </p>
          </div>

          {resendSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              E-mail reenviado com sucesso!
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-left">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={() => {
                setShowVerification(false);
                setIsSignUp(false); // Volta para tela de login
              }}
              className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              Fazer Login
            </button>

            <button 
              onClick={handleResendEmail}
              disabled={resendLoading}
              className="w-full py-3 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Não recebi o e-mail
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Login / Cadastro
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-pink-200/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">CondoManager Pro</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">
          {isSignUp ? 'Preencha seus dados para acesso.' : 'Acesse sua conta segura.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Sua Unidade / Casa</label>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <select
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none text-slate-700"
                  >
                    <option value="" disabled>Selecione sua casa...</option>
                    {PREDEFINED_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-4 w-2 h-2 border-r border-b border-slate-400 rotate-45 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
                    placeholder="Ex: João da Silva" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
                    placeholder="(11) 99999-9999" 
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
                placeholder="seu@email.com" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" 
                placeholder="••••••••" 
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSignUp ? 'Finalizar Cadastro' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {isSignUp ? 'Já tem uma conta?' : 'Não tem conta?'}
            <button 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="ml-1 font-semibold text-indigo-600 hover:underline focus:outline-none"
            >
              {isSignUp ? 'Fazer Login' : 'Cadastrar Morador'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
