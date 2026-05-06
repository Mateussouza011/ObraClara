import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('monitora-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('monitora-theme', theme);
  }, [theme]);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/" className="navbar-brand">
              <img src="/logo.png" className="brand-logo" alt="Monitora Tocantins" />
              <span>Monitora Tocantins</span>
            </Link>
          </div>

          <div className="navbar-actions">
            <ul className="navbar-menu">
              <li>
                <Link to="/">Mapa</Link>
              </li>
              <li>
                <Link to="/denuncias">Denúncias</Link>
              </li>
            </ul>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme(current => (current === 'light' ? 'dark' : 'light'))}
              aria-label="Alternar tema"
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
