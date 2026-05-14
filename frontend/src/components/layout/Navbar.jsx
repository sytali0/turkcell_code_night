import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Kurslar', icon: BookOpen },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="glass sticky top-0 z-50"
      style={{ borderBottom: '1px solid var(--tc-border)', height: '64px' }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--tc-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GraduationCap size={20} color="var(--tc-navy)" strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'var(--tc-text)',
                letterSpacing: '-0.02em',
              }}
            >
              Edu<span style={{ color: 'var(--tc-yellow)' }}>Cell</span>
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--tc-muted)', fontWeight: 500 }}>
              by Turkcell
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive(to) ? 'var(--tc-yellow)' : 'var(--tc-muted)',
                  background: isActive(to) ? 'rgba(255,209,0,0.08)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right side ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              {/* User dropdown button */}
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--tc-border)',
                  background: 'var(--tc-surface2)',
                  cursor: 'pointer',
                  color: 'var(--tc-text)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--tc-yellow) 0%, #E6BC00 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={14} color="var(--tc-navy)" strokeWidth={2.5} />
                </div>
                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name || user?.phone_number || 'Kullanıcı'}
                </span>
                <ChevronDown
                  size={14}
                  color="var(--tc-muted)"
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: '180px',
                    background: 'var(--tc-surface)',
                    border: '1px solid var(--tc-border)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    zIndex: 100,
                  }}
                >
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#F87171',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={15} />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
              Giriş Yap
            </Link>
          )}
        </div>
      </div>

      {/* Backdrop to close dropdown */}
      {dropdownOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
}
