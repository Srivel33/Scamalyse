import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import './Header.css';

const NAV_LINKS = [
  { label: 'Analyse', href: '#' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
  { label: 'Privacy', href: '#privacy' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <a href="/" className="header-logo" aria-label="ScamLens home">
          <span className="logo-mark">
            <Logo width={20} height={20} />
          </span>
          <span className="logo-text">ScamLens</span>
        </a>

        {/* Desktop nav */}
        <nav className="header-nav" aria-label="Site navigation">
          {NAV_LINKS.map((link) => {
            const isActive = link.label === 'Analyse'; // Hardcoded for demo/MVP
            return (
              <a key={link.href} href={link.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="menu-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
