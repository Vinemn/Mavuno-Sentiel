
import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Icon } from './Icon';
import { useLocalization } from '../context/LocalizationContext';
import type { User, AIAssistantMessage } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { generateSpeech } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface AIAssistantProps {
  user: User;
  initialPrompt: string | null;
  onPromptConsumed: () => void;
}

const SmallSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
);

export const AIAssistant: React.FC<AIAssistantProps> = ({ user, initialPrompt, onPromptConsumed }) => {
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  
  const storageKey = `ai_assistant_chat_${user.role}`;

  const [messages, setMessages] = useState<AIAssistantMessage[]>(() => {
    try {
      const savedMessages = localStorage.getItem(storageKey);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error("Failed to parse chat history from localStorage", error);
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // TTS State
  const { play, stop, isLoading: isAudioLoading, isPlaying } = useAudioPlayer({ sampleRate: 24000 });
  const [audioCache, setAudioCache] = useState<Record<number, string>>({});
  const [activeAudioIndex, setActiveAudioIndex] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Speech Recognition State
  const { isListening, transcript, startListening, stopListening, isSupported, error: sttError } = useSpeechRecognition();


  const welcomeMessageKey = `ai_assistant_welcome_${user.role.replace('-', '_')}`;
  const systemPromptKey = `ai_system_prompt_${user.role.replace('-', '_')}`;
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      if (!chat && !initError && isOnline) {
        try {
          if (!process.env.API_KEY) {
              throw new Error("API_KEY is not configured.");
          }
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          const newChat = ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                systemInstruction: t(systemPromptKey)
              }
          });
          setChat(newChat);
          if (messages.length === 0) {
              setMessages([{ role: 'model', text: t(welcomeMessageKey) }]);
          }
        } catch (error) {
            console.error("Failed to initialize AI Assistant:", error);
            const errorMessage = t('error_ai_init');
            // Prevent clearing chat history when showing an init error
            if (!messages.some(m => m.text === errorMessage)) {
                 setInitError(errorMessage);
            }
        }
      }
      return () => clearTimeout(timer);
    } else {
        // Stop audio when closing the assistant
        if(isPlaying) stop();
    }
  }, [isOpen, chat, t, systemPromptKey, welcomeMessageKey, messages.length, isPlaying, stop, initError, isOnline, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, initError]);
  
  useEffect(() => {
    try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
    }
  }, [messages, storageKey]);

  // Reset active audio index when playback finishes
  useEffect(() => {
    if (!isPlaying) {
      setActiveAudioIndex(null);
    }
  }, [isPlaying]);

  // Sync transcript to input
  useEffect(() => {
    if (transcript) {
        setInputValue(transcript);
    }
  }, [transcript]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !chat) return;

    const userMessage: AIAssistantMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
        const response = await chat.sendMessage({ message: text });
        const modelMessage: AIAssistantMessage = { role: 'model', text: response.text };
        setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
        console.error('AI Assistant Error:', error);
        const errorMessage: AIAssistantMessage = { role: 'model', text: "I apologize, but I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [chat]);


  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !chat) return;
    if (isListening) {
        stopListening();
    }
    sendMessage(inputValue);
    setInputValue('');
  };
  
  useEffect(() => {
    if (initialPrompt && chat && !isLoading) {
      setIsOpen(true);

      const sendInitialPrompt = async () => {
        // Clear existing messages and add the initial prompt context before the welcome message.
        setMessages([
          { role: 'model', text: initialPrompt },
          { role: 'model', text: t(welcomeMessageKey) },
        ]);
        
        setIsLoading(true);
        try {
          // Send the prompt to the model to get the response, without adding a duplicate user message.
          const response = await chat.sendMessage({ message: initialPrompt });
          const modelMessage: AIAssistantMessage = { role: 'model', text: response.text };
          setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
          console.error('AI Assistant Error during initial prompt:', error);
          const errorMessage: AIAssistantMessage = { role: 'model', text: "I apologize, but I encountered an error processing the request. Please try again." };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
          onPromptConsumed();
        }
      };

      // Use a short timeout to allow the modal to animate open before sending.
      const timer = setTimeout(sendInitialPrompt, 300);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, chat, isLoading, onPromptConsumed, t, welcomeMessageKey]);

  const handlePlayAudio = async (text: string, index: number) => {
    // If the currently playing message is clicked, stop it
    if (isPlaying && activeAudioIndex === index) {
      stop();
      return;
    }
    
    // If another message is playing, stop it first
    if (isPlaying) {
      stop();
    }

    setActiveAudioIndex(index);
    setAudioError(null);
    
    // Use cached audio if available
    if (audioCache[index]) {
      play(audioCache[index]);
      return;
    }
    
    // Otherwise, generate new audio
    try {
      const audioData = await generateSpeech(text);
      setAudioCache(prev => ({ ...prev, [index]: audioData }));
      play(audioData);
    } catch (error) {
        console.error("Failed to generate speech for AI assistant:", error);
        setAudioError(t('error_tts_failed'));
        setActiveAudioIndex(null); // Reset on error
        setTimeout(() => setAudioError(null), 4000);
    }
  };

  const renderAudioButton = (msg: AIAssistantMessage, index: number) => {
    const isActive = activeAudioIndex === index;
    let content: React.ReactNode = <Icon name="speaker-wave" className="w-5 h-5" />;

    if (isActive) {
        if (isAudioLoading) {
            content = <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-500"></div>;
        } else if (isPlaying) {
            content = <Icon name="stop-circle" className="w-5 h-5" />;
        }
    }

    return (
        <button
            onClick={() => handlePlayAudio(msg.text, index)}
            disabled={(isAudioLoading && !isActive) || !isOnline}
            className="ml-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('read_aloud')}
        >
            {content}
        </button>
    );
  }
  
  const handleMicClick = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 z-20"
        title={t('ai_assistant_tooltip')}
      >
        <Icon name="assistant" className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex justify-center items-center" onClick={() => setIsOpen(false)}>
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden m-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <Icon name="assistant" className="w-7 h-7 text-green-500" />
                <h2 className="text-xl font-bold">{t('ai_assistant_title')}</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                <Icon name="x" className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow p-6 overflow-y-auto">
              <div className="space-y-6">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold ${msg.role === 'user' ? 'bg-blue-200 dark:bg-blue-700 text-blue-700 dark:text-blue-200' : 'bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200'}`}>
                      {msg.role === 'user' ? user.name.charAt(0) : <Icon name="assistant" className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-sm md:max-w-md ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 rounded-bl-none'} ${index === messages.length - 1 && msg.role === 'model' ? 'animate-fade-in-up' : ''}`}>
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                    </div>
                    {msg.role === 'model' && renderAudioButton(msg, index)}
                  </div>
                ))}
                {initError && (
                  <div className="flex gap-3 items-center flex-row">
                     <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold bg-red-200 dark:bg-red-700 text-red-700 dark:text-red-200">
                        <Icon name="exclamation-triangle" className="w-5 h-5" />
                     </div>
                     <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 rounded-bl-none text-red-800 dark:text-red-200">
                        <p className="text-sm font-semibold">{initError}</p>
                     </div>
                   </div>
                )}
                {isLoading && (
                   <div className="flex gap-3 flex-row">
                     <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold bg-green-200 dark:bg-green-700 text-green-700 dark:text-green-200">
                        <Icon name="assistant" className="w-5 h-5" />
                     </div>
                     <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-none flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s] mx-1"></div>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                     </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Form */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
               {!isOnline && (
                <div className="text-center text-xs text-yellow-700 dark:text-yellow-400 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/50 rounded-md">
                  {t('ai_assistant_offline')}
                </div>
              )}
              <div className="text-center text-xs h-4 mb-2">
                  {audioError && <p className="text-red-500">{audioError}</p>}
                  {sttError && <p className="text-red-500">{t('error_stt_failed', { error: sttError })}</p>}
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-3">
                 {isSupported && (
                    <button
                        type="button"
                        onClick={handleMicClick}
                        disabled={isLoading || !isOnline || !!initError}
                        className={`p-3 rounded-lg flex-shrink-0 transition-colors ${isListening ? 'bg-red-100 dark:bg-red-900 text-red-500 animate-pulse' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={t(isListening ? 'stop_listening' : 'start_listening')}
                    >
                        <Icon name="microphone" className="w-5 h-5" />
                    </button>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={t('ai_assistant_placeholder')}
                  className="flex-grow bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed"
                  disabled={isLoading || !isOnline || !!initError}
                />
                <button type="submit" className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600" disabled={isLoading || !inputValue.trim() || !isOnline || !!initError}>
                  {isLoading ? <SmallSpinner /> : <Icon name="paper-airplane" className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
