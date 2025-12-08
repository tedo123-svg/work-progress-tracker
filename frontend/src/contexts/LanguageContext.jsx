import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to Amharic
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'am';
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'am' ? 'en' : 'am');
  };

  const t = (amharic, english) => {
    return language === 'am' ? amharic : english;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
