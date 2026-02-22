import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Settings, Youtube, Sparkles, Copy, Check, ExternalLink, Loader2, Play } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

function App() {
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [promptSupplement, setPromptSupplement] = useState('');

  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/config`);
      setGeminiKey(res.data.gemini_api_key || '');
      setOpenaiKey(res.data.openai_api_key || '');
    } catch (err) {
      console.error("Failed to load config", err);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await axios.post(`${API_BASE}/config`, {
        gemini_api_key: geminiKey,
        openai_api_key: openaiKey
      });
      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Failed to save config", err);
      // Could add a toast here, but keeping it simple for now
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Por favor, insira o link do vídeo.");
      return;
    }

    setLoading(true);
    setError('');
    setSummary('');
    setCopied(false);

    try {
      const res = await axios.post(`${API_BASE}/summarize`, {
        url,
        provider,
        prompt_supplement: promptSupplement
      });
      setSummary(res.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Ocorreu um erro ao gerar o resumo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-4xl z-10 flex flex-col gap-8 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-purple-600 p-3 rounded-2xl shadow-lg shadow-primary/20">
              <Youtube className="w-8 h-8 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                ResumoTube AI
              </h1>
              <p className="text-textMuted text-sm">Insights automáticos de vídeos do YouTube</p>
            </div>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-secondary rounded-full p-3 hover:rotate-90 transition-transform duration-300"
            title="Configurações (Chaves de API)"
          >
            <Settings className="w-5 h-5 text-textMuted hover:text-white transition-colors" />
          </button>
        </div>

        {/* Main Input Card */}
        <div className="glass-panel p-6 sm:p-8 w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSummarize} className="space-y-6">

            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-textMuted mb-2">
                Link do Vídeo do YouTube
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Play className="h-5 w-5 text-textMuted" />
                </div>
                <input
                  type="url"
                  id="url"
                  className="input-field pl-12"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Provider Select */}
              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">
                  Modelo de Inteligência Artificial
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${provider === 'gemini' ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/10 text-textMuted hover:bg-black/30'}`}>
                    <input type="radio" value="gemini" checked={provider === 'gemini'} onChange={() => setProvider('gemini')} className="sr-only" />
                    Gemini (Google)
                  </label>
                  <label className={`flex-1 flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${provider === 'openai' ? 'bg-primary/20 border-primary text-white' : 'bg-black/20 border-white/10 text-textMuted hover:bg-black/30'}`}>
                    <input type="radio" value="openai" checked={provider === 'openai'} onChange={() => setProvider('openai')} className="sr-only" />
                    OpenAI (GPT)
                  </label>
                </div>
              </div>

              {/* Optional Prompt Supplement */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-textMuted mb-2">
                  Complemento do Prompt (Opcional)
                </label>
                <input
                  type="text"
                  id="prompt"
                  className="input-field"
                  placeholder="Ex: Foque mais na parte de economia..."
                  value={promptSupplement}
                  onChange={(e) => setPromptSupplement(e.target.value)}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary w-full group relative overflow-hidden"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando e resumindo...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar Resumo Inteligente
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Area */}
        {summary && (
          <div className="glass-panel p-6 sm:p-8 w-full animate-slide-up relative" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-primary" />
                Resumo Gerado
              </h2>
              <button
                onClick={handleCopy}
                className="btn-secondary px-3 py-1.5 text-sm"
                title="Copiar markdown"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-textMuted" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="prose w-full max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold text-white mb-6">Configurações de API</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                />
                <p className="text-xs text-textMuted/70 mt-1 flex items-center gap-1">
                  Obtenha no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center">Google AI Studio <ExternalLink className="w-3 h-3 ml-0.5" /></a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-textMuted mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                />
                <p className="text-xs text-textMuted/70 mt-1 flex items-center gap-1">
                  Obtenha na <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center">OpenAI Platform <ExternalLink className="w-3 h-3 ml-0.5" /></a>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 border-t border-white/10 pt-4">
              <button
                className="btn-secondary"
                onClick={() => setIsSettingsOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary py-2"
                onClick={saveConfig}
                disabled={savingConfig}
              >
                {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Localmente'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
