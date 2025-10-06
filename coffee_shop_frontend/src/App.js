import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import './App.css';
import './styles/theme.css';
import HtmlEmbedPage from './components/HtmlEmbedPage';

// PUBLIC_INTERFACE
export default function App() {
  /**
   * App entry renders a top navigation bar and an iframe-based page for each
   * static asset screen. The iframe guarantees pixel-fidelity and isolates
   * the assets' CSS/JS from React.
   *
   * README: Adding a new screen
   * 1) Put the new HTML/CSS/JS and images in public/assets/ (keep relative refs).
   * 2) Add a new <Route path="..." element={<HtmlEmbedPage src="/assets/yourpage.html" />} /> below.
   * 3) Add a matching <NavLink> in the Navbar for navigation.
   */
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="topbar" role="banner">
        <div className="topbar__inner">
          <div className="brand">
            <span className="brand__logo" aria-hidden="true">☕</span>
            <span className="brand__text">Coffee Shop</span>
          </div>
          <nav className="nav" aria-label="Primary">
            <NavLink className="nav__link" to="/about-me">About Me</NavLink>
            <NavLink className="nav__link" to="/license">License</NavLink>
            <NavLink className="nav__link" to="/product-feedback">Product Feedback</NavLink>
            <NavLink className="nav__link" to="/onboarding">Onboarding</NavLink>
            <NavLink className="nav__link" to="/note">Note</NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="content" role="main">
        <Routes>
          <Route path="/" element={<Navigate to="/about-me" replace />} />
          <Route path="/about-me" element={<HtmlEmbedPage src="/assets/about-me-442-3.html" headerOffset={72} />} />
          <Route path="/license" element={<HtmlEmbedPage src="/assets/license-442-36.html" headerOffset={72} />} />
          <Route path="/product-feedback" element={<HtmlEmbedPage src="/assets/product-feedback-442-132.html" headerOffset={72} />} />
          <Route path="/onboarding" element={<HtmlEmbedPage src="/assets/highfidelity-onboarding-421-1221.html" headerOffset={72} />} />
          <Route path="/note" element={<HtmlEmbedPage src="/assets/note-442-87.html" headerOffset={72} />} />
          <Route path="*" element={<Navigate to="/about-me" replace />} />
        </Routes>
      </main>
    </div>
  );
}
