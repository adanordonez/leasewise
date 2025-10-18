'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Comment01Icon, SentIcon } from '@hugeicons-pro/core-stroke-rounded';
import { useTranslations } from 'next-intl';
import type { ChatMessage, SuggestedQuestion } from '@/types/chat';
import SourceCitation from './SourceCitation';

interface LeaseChatProps {
  leaseDataId: string;
  userEmail: string;
  pdfUrl?: string;
  analysisResult?: any;
}

export default function LeaseChat({ leaseDataId, userEmail, pdfUrl, analysisResult }: LeaseChatProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };
  
  useEffect(() => {
    // Only scroll if we have messages
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only trigger when message count changes
  
  // Load suggested questions on mount
  useEffect(() => {
    async function loadSuggestedQuestions() {
      try {
        const response = await fetch('/api/generate-suggested-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leaseDataId }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuggestedQuestions(data.questions || []);
        }
      } catch (error) {
        console.error('Error loading suggested questions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    
    loadSuggestedQuestions();
  }, [leaseDataId]);
  
  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat-with-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseDataId,
          userEmail,
          question,
          chatHistory: messages,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        timestamp: data.timestamp,
        sources: data.sources,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: t('LeaseChat.messages.error'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };
  
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };
  
  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
            <HugeiconsIcon icon={Comment01Icon} size={20} strokeWidth={1.5} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('LeaseChat.header.title')}</h3>
            <p className="text-sm text-slate-600">{t('LeaseChat.header.subtitle')}</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !loadingSuggestions && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">{t('LeaseChat.emptyState.title')}</h4>
            <p className="text-sm text-slate-600 mb-6 max-w-md">
              {t('LeaseChat.emptyState.description')}
            </p>
            
            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="w-full max-w-2xl">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{t('LeaseChat.emptyState.suggestedQuestions')}</p>
                <div className="grid gap-2">
                  {suggestedQuestions.slice(0, 6).map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(sq.question)}
                      className="text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-sm text-slate-700"
                    >
                      {sq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="space-y-2">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                
                {/* Sources - Inline */}
                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center pt-1">
                    <span className="text-xs font-medium text-slate-500">{t('LeaseChat.messages.sources')}</span>
                    {message.sources.map((source, sourceIdx) => (
                      <SourceCitation
                        key={sourceIdx}
                        sourceText={source.text}
                        pageNumber={source.pageNumber}
                        pdfUrl={pdfUrl}
                        label={`${t('LeaseChat.messages.page')} ${source.pageNumber}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-xs mt-2 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-100">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                <p className="text-sm text-slate-600">{t('LeaseChat.messages.thinking')}</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-slate-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('LeaseChat.input.placeholder')}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <HugeiconsIcon icon={SentIcon} size={20} strokeWidth={1.5} />
            )}
          </button>
        </form>
        
        <p className="text-xs text-slate-500 mt-2">
          {t('LeaseChat.input.tip')}
        </p>
      </div>
    </div>
  );
}

