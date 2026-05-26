import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InteractiveTutorial, type TutorialStep } from './InteractiveTutorial';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  tutorialSteps?: TutorialStep[];
  tutorialStorageKey?: string;
}

export function Layout({
  children,
  tutorialSteps = [],
  tutorialStorageKey = 'monitora-tutorial-v1',
}: LayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('monitora-theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const [tutorialRestartSignal, setTutorialRestartSignal] = useState(0);

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
                <Link to="/" data-tutorial="nav-map">Mapa</Link>
              </li>
              <li>
                <Link to="/denuncias" data-tutorial="nav-denuncias">Denúncias</Link>
              </li>
            </ul>
            {tutorialSteps.length > 0 && (
              <button
                type="button"
                className="tutorial-open-button"
                onClick={() => setTutorialRestartSignal((signal) => signal + 1)}
              >
                Tutorial
              </button>
            )}
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme(current => (current === 'light' ? 'dark' : 'light'))}
              aria-label="Alternar tema"
              data-tutorial="theme-toggle"
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>
      {tutorialSteps.length > 0 && (
        <InteractiveTutorial
          steps={tutorialSteps}
          storageKey={tutorialStorageKey}
          restartSignal={tutorialRestartSignal}
        />
      )}
    </div>
  );
}
