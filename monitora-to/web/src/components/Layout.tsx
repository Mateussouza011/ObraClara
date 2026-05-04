import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">📍</span> Monitora TO
          </Link>
          <ul className="navbar-menu">
            <li>
              <Link to="/">Mapa</Link>
            </li>
            <li>
              <Link to="/denuncias">Denúncias</Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
