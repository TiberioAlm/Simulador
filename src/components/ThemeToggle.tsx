import { useEffect } from 'react';
import { useAppStore } from '../state/store';

export const ThemeToggle = () => {
  const tema = useAppStore((state) => state.tema);
  const toggleTheme = useAppStore((state) => state.toggleTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'dark' ? '#0f172a' : '#ffffff');
  }, [tema]);

  return (
    <button type="button" className="button secondary" onClick={toggleTheme} aria-label="Alternar tema">
      {tema === 'dark' ? '☀️ Tema claro' : '🌙 Tema escuro'}
    </button>
  );
};

export default ThemeToggle;
