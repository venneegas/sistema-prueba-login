import { useEffect, useState } from 'react';

const getPreferredTheme = () => {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) return storedTheme === 'dark';

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (isDarkMode) => {
  document.documentElement.classList.toggle('dark', isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
};

const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const preferredDarkMode = getPreferredTheme();
    setIsDarkMode(preferredDarkMode);
    applyTheme(preferredDarkMode);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((currentMode) => {
      const nextMode = !currentMode;
      applyTheme(nextMode);
      return nextMode;
    });
  };

  return { isDarkMode, toggleTheme };
};

export default useTheme;
