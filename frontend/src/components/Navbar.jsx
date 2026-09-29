import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Activity, Brain, Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/analyze', label: 'Analyze MRI' },
  { to: '/history', label: 'History' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="page-container nav-inner">
        <Link className="brand" to="/" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Brain size={21} strokeWidth={1.8} /></span>
          <span className="brand-copy">
            <strong>Brain Tumor Detection</strong>
            <small>AI-assisted MRI analysis</small>
          </span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/analyze"
            className="nav-cta"
            onClick={() => setMenuOpen(false)}
          >
            <Activity size={16} />
            Start analysis
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
