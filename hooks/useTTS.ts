
import { useState, useEffect, useCallback } from 'react';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'speechSynthesis' in window && typeof window.speechSynthesis !== 'undefined';
    setIsSupported(supported);
  }, []);
  
  // Load voices, as they can be loaded asynchronously
  useEffect(() => {
      if (!isSupported) return;
      
      const loadVoices = () => {
          // This function call is just to trigger the loading if it hasn't happened.
          window.speechSynthesis.getVoices();
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      loadVoices();
      
      return () => {
          window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      }
  }, [isSupported]);

  const speak = useCallback((text: string, lang: string) => {
    if (!isSupported || isSpeaking) return;
    
    // Cancel any previous utterance to prevent overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang.startsWith(lang));
    
    // Fallback if no specific voice is found
    if (!voice) {
        voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    }

    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = lang;
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
    };
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, isSpeaking]);


  const cancel = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return { speak, cancel, isSpeaking, isSupported };
};
