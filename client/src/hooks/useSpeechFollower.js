import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export const useSpeechFollower = ({ scriptText = '', containerRef }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [status, setStatus] = useState('MIC_OFF'); // 'UNSUPPORTED' | 'MIC_OFF' | 'LISTENING' | 'PAUSED' | 'DENIED' | 'ERROR'
  const [isListening, setIsListening] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const wordRefs = useRef([]);
  const activeIndexRef = useRef(-1);

  // Parse script into tokenized words object array
  const parsedWords = useMemo(() => {
    if (!scriptText) return [];
    const tokens = scriptText.split(/(\s+)/);
    let wordCount = 0;
    
    return tokens.map((token) => {
      const isWhitespace = /^\s+$/.test(token);
      if (isWhitespace) {
        return { isWhitespace: true, text: token };
      }
      const clean = token.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const item = {
        isWhitespace: false,
        text: token,
        clean,
        index: wordCount,
      };
      wordCount++;
      return item;
    });
  }, [scriptText]);

  const cleanWordsList = useMemo(() => {
    return parsedWords.filter((w) => !w.isWhitespace);
  }, [parsedWords]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Scroll active word to 35% viewport height
  const scrollToActiveWord = useCallback((index) => {
    if (!containerRef?.current || !wordRefs.current[index]) return;
    const container = containerRef.current;
    const wordEl = wordRefs.current[index];

    const containerRect = container.getBoundingClientRect();
    const wordRect = wordEl.getBoundingClientRect();

    const relativeTop = wordRect.top - containerRect.top + container.scrollTop;
    const targetScrollTop = relativeTop - containerRect.height * 0.35;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  }, [containerRef]);

  // Process live speech transcript and find current position in script
  const processTranscript = useCallback((speechText) => {
    if (!cleanWordsList.length || !speechText.trim()) return;

    const speechTokens = speechText
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
      .filter(Boolean);

    if (speechTokens.length === 0) return;

    const lastSpeechToken = speechTokens[speechTokens.length - 1];
    const prevSpeechToken = speechTokens.length > 1 ? speechTokens[speechTokens.length - 2] : null;

    const currentPos = activeIndexRef.current < 0 ? 0 : activeIndexRef.current;
    const searchStart = Math.max(0, currentPos - 3);
    const searchEnd = Math.min(cleanWordsList.length - 1, currentPos + 25);

    let matchIndex = -1;

    // Try 2-word phrase match
    if (prevSpeechToken) {
      for (let i = searchStart; i < searchEnd; i++) {
        if (
          cleanWordsList[i]?.clean === prevSpeechToken &&
          cleanWordsList[i + 1]?.clean === lastSpeechToken
        ) {
          matchIndex = i + 1;
          break;
        }
      }
    }

    // Fallback: single word match
    if (matchIndex === -1) {
      for (let i = searchStart; i <= searchEnd; i++) {
        if (cleanWordsList[i]?.clean === lastSpeechToken) {
          matchIndex = i;
          break;
        }
      }
    }

    if (matchIndex !== -1 && matchIndex !== activeIndexRef.current) {
      activeIndexRef.current = matchIndex;
      setActiveWordIndex(matchIndex);
      scrollToActiveWord(matchIndex);
    }
  }, [cleanWordsList, scrollToActiveWord]);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatus('UNSUPPORTED');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setStatus('LISTENING');
      setIsListening(true);
      setErrorMessage('');
    };

    recognition.onresult = (event) => {
      let liveText = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        liveText += event.results[i][0].transcript + ' ';
      }
      processTranscript(liveText);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setStatus('DENIED');
        setErrorMessage('Microphone permission denied.');
        setIsListening(false);
        isListeningRef.current = false;
      } else if (event.error === 'no-speech') {
        setStatus('PAUSED');
      } else if (event.error === 'audio-capture') {
        setStatus('ERROR');
        setErrorMessage('No microphone detected.');
        setIsListening(false);
        isListeningRef.current = false;
      } else {
        setStatus('PAUSED');
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          setStatus('MIC_OFF');
        }
      } else {
        setIsListening(false);
        setStatus('MIC_OFF');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [processTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    try {
      setIsListening(true);
      isListeningRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      setIsListening(false);
      isListeningRef.current = false;
      recognitionRef.current.stop();
      setStatus('MIC_OFF');
    } catch (err) {
      console.warn('Speech recognition stop error:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetFollower = useCallback(() => {
    setActiveWordIndex(-1);
    activeIndexRef.current = -1;
    if (containerRef?.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [containerRef]);

  return {
    isSupported,
    status,
    isListening,
    activeWordIndex,
    errorMessage,
    parsedWords,
    wordRefs,
    startListening,
    stopListening,
    toggleListening,
    resetFollower,
  };
};
