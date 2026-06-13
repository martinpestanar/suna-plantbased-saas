import { useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { GrAd } from "react-icons/gr";
import { useRouter, useAuth } from '../router.jsx';

/* ── Icono ojo para mostrar/ocultar contraseña ── */
const IcoEye = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

/* ── Spinner ── */
const Spinner = () => (
  <div style={{
    width: 18, height: 18,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  }}/>
);

/* ═══════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Login() {
  const { navigate } = useRouter();
  const { loginAsDev } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { triggerError('Ingresa tu email y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message?.includes('Invalid login') || err.message?.includes('invalid')
        ? 'Correo o contraseña incorrectos'
        : 'Error de conexión. Intenta de nuevo.';
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0F1A15',
      overflowY: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        animation: shake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97)' : 'none',
      }}>

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: 'var(--color-surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(252, 251, 249, 0.1)',
            cursor: 'pointer'
          }}>
            <GrAd className="logo-vibrate" size={34} color="var(--color-primary)" />
          </div>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900,
            color: '#fff', marginBottom: 6, letterSpacing: '-0.01em',
          }}>
            Panel Administrativo
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            Suna GreenApp · Acceso exclusivo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 800,
              color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 6,
            }}>
              Correo electrónico
            </label>
            <input
              type="email" required autoComplete="email"
              placeholder="tu@restaurante.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${error ? 'rgba(217,4,41,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, color: '#fff', fontSize: 14,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
              }}
              onFocus={e => { e.target.style.borderColor = '#40916C'; e.target.style.boxShadow = '0 0 0 3px rgba(64,145,108,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = error ? 'rgba(217,4,41,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 800,
              color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 6,
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{
                  width: '100%', padding: '14px 48px 14px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${error ? 'rgba(217,4,41,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 14, color: '#fff', fontSize: 14,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  outline: 'none', transition: 'border-color 200ms, box-shadow 200ms',
                }}
                onFocus={e => { e.target.style.borderColor = '#40916C'; e.target.style.boxShadow = '0 0 0 3px rgba(64,145,108,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = error ? 'rgba(217,4,41,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                type="button" onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: 4,
                  display: 'flex', alignItems: 'center',
                }}
              >
                <IcoEye open={showPwd} />
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', background: 'rgba(217,4,41,0.1)',
              border: '1px solid rgba(217,4,41,0.25)', borderRadius: 12,
              animation: 'fade-in-down 200ms ease',
            }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <p style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '16px',
              background: loading ? 'rgba(27,67,50,0.7)' : 'linear-gradient(135deg,#1B4332,#2C6246)',
              color: '#D8F3DC', border: '1px solid rgba(216,243,220,0.15)',
              borderRadius: 16, fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(27,67,50,0.4)',
              transition: 'transform 150ms, opacity 150ms',
              minHeight: 52,
            }}
            onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading ? <><Spinner /> Verificando acceso...</> : 'Ingresar al Panel →'}
          </button>

          {/* Dev Bypass Button */}
          {window.location.hostname === 'localhost' && (
            <button
              type="button"
              onClick={loginAsDev}
              style={{
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(255,255,255,0.5)',
                border: '1.5px dashed rgba(255,255,255,0.15)',
                borderRadius: 16, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(64,145,108,0.15)';
                e.currentTarget.style.color = '#D8F3DC';
                e.currentTarget.style.borderColor = '#40916C';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              🔑 Bypass Login (Modo Desarrollo)
            </button>
          )}
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            ¿Olvidaste tu contraseña?{' '}
            <button
              onClick={() => {/* TODO: reset flow */}}
              style={{ background: 'none', border: 'none', color: 'rgba(64,145,108,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Recuperar acceso
            </button>
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
