import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import './Header.css';

const NAV_LINKS = [
  { id: 'analyse', label: 'Analyse', href: '#analyse' },
  { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  { id: 'about', label: 'About', href: '#about' },
  { id: 'privacy', label: 'Privacy', href: '#privacy' },
];

export default function Header({ showNavLinks = true }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('analyse');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Scrollspy: determine which section is currently in view
      const sectionIds = ['analyse', 'how-it-works', 'about', 'privacy'];
      const scrollPosition = window.scrollY + 180;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
            return;
          }
        }
      }
      setActiveSection('analyse');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, id) => {
    e.preventDefault();
    setActiveSection(id);
    setMenuOpen(false);

    if (id === 'analyse') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const target = document.getElementById(id);
      if (target) {
        const headerOffset = 65;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-inner">
        <a
          href="/"
          className="header-logo"
          aria-label="Scamalyse home"
          onClick={(e) => handleNavClick(e, 'analyse')}
        >
          <span className="logo-mark">
            <Logo width={20} height={20} />
          </span>
          <span className="logo-text">Scamalyse</span>
        </a>

        {/* Desktop nav */}
        {showNavLinks && (
          <nav className="header-nav" aria-label="Site navigation">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleNavClick(e, link.id)}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Mobile hamburger */}
        {showNavLinks && (
          <button
            className="menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={`hamburger ${menuOpen ? 'open' : ''}`} />
          </button>
        )}
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                href={link.href}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, link.id)}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
