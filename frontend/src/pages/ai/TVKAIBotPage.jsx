import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Trash2,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const TVKAIBotPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { error: notifyError } = useNotification();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    t('tvkBot.questions.q1', 'Which ward has the highest number of issues?'),
    t('tvkBot.questions.q2', 'What is the total number of members?'),
    t('tvkBot.questions.q3', 'How many grievances are pending?'),
    t('tvkBot.questions.q4', 'What is the category-wise issue analysis?'),
    t('tvkBot.questions.q5', 'Show the executive summary.'),
    t('tvkBot.questions.q6', 'Which department has the most pending issues?'),
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      if (res.data.success && res.data.data.length > 0) {
        setMessages(res.data.data);
      } else {
        // Welcome message
        setMessages([
          {
            sender: 'bot',
            text: t('tvkBot.welcomeText', {
              name: user?.name || 'Officer',
              defaultValue: `Vanakkam ${user?.name || 'Officer'}! I am **TVK AI BOT**, your live district intelligence assistant for Coimbatore.\n\nI have direct authorized access to real-time CRM database records across all 10 constituencies and 100 wards. Ask me any question below or type your custom query.`
            }),
            suggestedActions: suggestedQuestions.slice(0, 4),
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: query.trim(),
      });

      if (res.data.success) {
        const botMsg = {
          sender: 'bot',
          text: res.data.data.reply,
          suggestedActions: res.data.data.suggestedActions || [],
          timestamp: new Date(res.data.data.timestamp),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      notifyError('Failed to communicate with TVK AI BOT');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear your conversation history with TVK AI BOT?')) return;
    try {
      await api.delete('/chatbot/history');
      fetchHistory();
    } catch (err) {}
  };

  return (
    <div className="h-[calc(100vh-125px)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Bot Chat Header Matching Theme */}
      <div className="p-4 sm:px-6 bg-gradient-to-r from-[#850000] via-[#A00000] to-[#850000] text-white flex items-center justify-between border-b-2 border-[#FFD32A]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFD32A] text-[#850000] flex items-center justify-center font-extrabold shadow-sm border border-amber-300">
            <Bot className="w-6 h-6 text-[#850000]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold tracking-tight">TVK AI BOT</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-[#FFD32A] font-semibold">
              {t('tvkBot.subtitle', 'Live Coimbatore CRM Database Grounded Assistant')}
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          title={t('tvkBot.clearHistory', 'Clear Chat History')}
          className="p-2 rounded-xl text-red-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-gradient-to-tr from-red-800 to-red-600 text-amber-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs whitespace-pre-wrap ${
                  isUser
                    ? 'bg-red-700 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}

                {/* Suggested Action Pills if available */}
                {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.suggestedActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
                        className="text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-800 px-2.5 py-1 rounded-lg border border-red-200 transition text-left"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`block text-[10px] mt-1.5 ${
                    isUser ? 'text-red-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 max-w-3xl mr-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-800 to-red-600 text-amber-300 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 rounded-tl-none shadow-xs text-xs flex items-center space-x-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-red-700" />
              <span>{t('tvkBot.thinking', 'Analyzing live Coimbatore database metrics...')}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel Bar */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          {t('tvkBot.suggestedQueriesTitle', 'Quick Prompts')}:
        </span>
        {suggestedQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 text-[11px] font-medium transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('tvkBot.inputPlaceholder', 'Ask anything about Coimbatore wards, grievances, members, or department officers...')}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-700/20 focus:border-red-700"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-3 bg-red-700 hover:bg-red-800 text-white rounded-2xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default TVKAIBotPage;
