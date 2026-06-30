import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, X, Send, Sparkles, Compass, ShieldAlert, Heart, RefreshCw } from 'lucide-react';

export default function TravelChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    let id = localStorage.getItem('chat_session_id');
    if (!id) {
      id = `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
      localStorage.setItem('chat_session_id', id);
    }
    return id;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi there! 👋 I am **VoyageBot**, your interactive AI Travel Companion. I can help you outline itineraries, plan packing bags, or calculate budgets!\n\nWhere are you heading, or what would you like help with today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Clickable suggested prompts to help users test the chat easily
  const quickPrompts = [
    { label: '🌸 Japan Itinerary', text: 'Can you suggest a 5-day cherry blossom season itinerary in Japan?' },
    { label: '💶 Paris Budget Tips', text: 'How should I optimize my budget for an elegant 3-day Paris trip?' },
    { label: '🏔️ Hiking Gear', text: 'What are the absolute essential safety items to pack for mountain hiking?' },
    { label: '🔒 Safety Tips', text: 'What are some practical tips for staying safe while traveling solo?' }
  ];

  const handleClearChat = () => {
    const newId = `session-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    localStorage.setItem('chat_session_id', newId);
    setSessionId(newId);
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hi there! 👋 I am **VoyageBot**, your interactive AI Travel Companion. I can help you outline itineraries, plan packing bags, or calculate budgets!\n\nWhere are you heading, or what would you like help with today?",
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    // Append user's message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: textToSend.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      let replyText = '';
      if (typeof data === 'string') {
        replyText = data;
      } else if (data && typeof data === 'object') {
        replyText = data.reply || data.response || data.text || data.message || data.content || JSON.stringify(data);
      } else {
        replyText = "Sorry, I received an invalid response format from the server.";
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat API error:", error);
      const errorMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        sender: 'assistant',
        text: "⚠️ **Connection Error**: Unable to reach VoyageBot server. Please verify your internet connection or try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Convert custom basic markdown to HTML for mock responses (bullet points, bold text, headers)
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="font-display font-bold text-sm text-slate-900 mt-3 mb-1.5">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('#### ')) {
        return <h5 key={idx} className="font-display font-bold text-xs text-brand-700 mt-2.5 mb-1">{trimmed.replace('#### ', '')}</h5>;
      }
      
      // Bullet points
      if (trimmed.startsWith('* ')) {
        const itemText = trimmed.replace('* ', '');
        return (
          <li key={idx} className="ml-3 list-disc text-[11px] text-slate-600 mb-1 leading-relaxed">
            {formatInlineBold(itemText)}
          </li>
        );
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s/, '');
        const num = trimmed.match(/^\d+/)?.[0] || '';
        return (
          <div key={idx} className="flex gap-1.5 ml-2 text-[11px] text-slate-600 mb-1.5 leading-relaxed">
            <span className="font-bold text-brand-600">{num}.</span>
            <span>{formatInlineBold(itemText)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-[11px] text-slate-600 mb-2 leading-relaxed">
          {formatInlineBold(line)}
        </p>
      );
    });
  };

  const formatInlineBold = (text: string) => {
    // Regex for bold text **like this** and inline code `like this`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 bg-slate-100 rounded font-mono text-[9px] text-rose-600 font-semibold">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Collapsed Float Badge (Bottom-Right) */}
      <button
        id="floating-chat-trigger"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-brand-600 hover:bg-brand-700 text-white rounded-full p-4 shadow-xl shadow-brand-500/20 transition-all hover:scale-110 active:scale-95 cursor-pointer group flex items-center gap-2 ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out text-xs font-bold whitespace-nowrap pl-0 group-hover:pl-1">
          Travel Assistant
        </span>
      </button>

      {/* Expandable Chat Drawer */}
      <div
        id="travel-chat-drawer"
        className={`fixed bottom-6 right-6 z-50 w-[350px] sm:w-[380px] h-[520px] bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 rounded-full bg-brand-500 items-center justify-center font-bold text-sm text-white shadow-inner">
              🤖
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-xs">VoyageBot</span>
                <span className="bg-brand-500/20 text-brand-300 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wide">AI</span>
              </div>
              <p className="text-[10px] text-slate-400">Your Travel Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="clear-chat-btn"
              onClick={handleClearChat}
              title="Clear conversation history"
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              id="close-chat-drawer"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Connected Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 text-center flex items-center justify-center gap-1.5 text-[10px] text-emerald-800 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>VoyageBot Live API Connected</span>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium shadow-xs border ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white border-brand-600 rounded-tr-none'
                    : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>{formatMarkdown(msg.text)}</div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-mono mt-1 font-medium px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start max-w-[85%] mr-auto">
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 text-slate-600 flex items-center gap-2 rounded-tl-none shadow-xs">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planning itinerary...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Prompts Drawer Footer (Suggestion chips) */}
        {messages.length === 1 && !isTyping && (
          <div className="px-4 py-2 border-t border-slate-100 bg-white">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Try asking:</span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {quickPrompts.map((p, idx) => (
                <button
                  id={`prompt-chip-${idx}`}
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="bg-slate-50 hover:bg-brand-50 border border-slate-200 hover:border-brand-100 text-slate-600 hover:text-brand-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input form */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
          <input
            id="chat-message-text-input"
            type="text"
            placeholder="Type your travel question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-semibold bg-slate-50/50 disabled:opacity-55 placeholder:text-slate-400"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 text-white p-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
