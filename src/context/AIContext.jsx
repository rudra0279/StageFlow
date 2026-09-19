import React, { createContext, useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { MOCK_AI_SUGGESTIONS } from '../constants/mockData';

export const AIContext = createContext(null);

export const AIProvider = ({ children }) => {
  const [suggestions, setSuggestions] = useState(MOCK_AI_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [sentimentScore, setSentimentScore] = useState(88); // 88% positive engagement
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2); // Speed scale 1-5
  const [fontSize, setFontSize] = useState(32); // Font size for teleprompter view

  const generateScript = async (params) => {
    setLoading(true);
    try {
      return await aiService.generateScript(params);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = (id) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const addCustomAlert = (title, content, level = 'info') => {
    const newAlert = {
      id: `sug_${Date.now()}`,
      type: 'CUSTOM_ALERT',
      level,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      content,
      actionText: 'Acknowledge',
    };
    setSuggestions((prev) => [newAlert, ...prev]);
  };

  const value = {
    suggestions,
    loading,
    sentimentScore,
    teleprompterSpeed,
    fontSize,
    setTeleprompterSpeed,
    setFontSize,
    generateScript,
    dismissSuggestion,
    addCustomAlert,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};
