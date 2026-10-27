import { useState, useEffect, useRef } from 'react'
import { authClient } from './auth'

/*
  Cura AI — 3D Auth Screen
  • Signup is the default mode (first thing visitors see)
  • The card tilts in 3D following the cursor, and floating
    prescription chips sit at different depths (translateZ)
  • Same teal / mint / peach palette as the main website
  • Login form flows left-to-right with liquid background
  • Google OAuth consent screen shows on social login
*/

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden="true">
    <path fill="#fff" d="M21.35 11.1H12v3.47h5.34a4.57 4.57 0 0 1-1.98 3v2.5h3.2c1.88-1.73 2.96-4.28 2.96-7.3 0-.58-.05-1.13-.17-1.67z" />
    <path fill="#4285F4" d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.2-2.5c-.9.6-2.05.96-3.41.96a5.95 5.95 0 0 1-5.6-4.1l-3.3 2.57A9.96 9.96 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.4 13.94a5.98 5.98 0 0 1 0-3.87L3.1 7.5a10 10 0 0 0 0 9l3.3-2.56z" />
    <path fill="#34A853" d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.84-2.84A9.95 9.95 0 0 0 12 2 9.96 9.96 0 0 0 3.1 7.5l3.3 2.57A5.95 5.95 0 0 1 12 5.97z" />
  </svg>
)

const STYLES = `
  @keyframes curaFloat { 0%,100%{transform:translateZ(var(--z,60px)) translateY(0) rotate(var(--r,0deg))} 50%{transform:translateZ(var(--z,60px)) translateY(-14px) rotate(var(--r,0deg))} }
  @keyframes curaScan { 0%{top:12%;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{top:88%;opacity:0} }
  @keyframes curaRise { from{opacity:0;transform:perspective(1100px) rotateY(0deg) translateY(26px)} to{opacity:1;transform:perspective(1100px) rotateY(0deg) translateY(0)} }
  @keyframes curaPulse { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.9);opacity:0} }
  @keyframes curaSpin { to{transform:rotate(360deg)} }
  @keyframes curaSideFloat { 0%,100%{transform:var(--base) translateZ(var(--z)) translateY(0)} 50%{transform:var(--base) translateZ(var(--z)) translateY(-14px)} }
  @keyframes curaCapsFloat { 0%,100%{transform:rotateZ(-32deg) rotateY(-16deg) translateY(0)} 50%{transform:rotateZ(-24deg) rotateY(10deg) translateY(-12px)} }
  @keyframes curaLiquidDrift {
    0%,100% { transform: translate3d(0,0,0) rotateX(0deg) rotateY(0deg) scale(1); border-radius: 46% 54% 60% 40% / 48% 42% 58% 52%; }
    50% { transform: translate3d(5vw,-4vh,70px) rotateX(18deg) rotateY(-14deg) scale(1.12); border-radius: 58% 42% 38% 62% / 44% 58% 42% 56%; }
  }
  @keyframes curaLiquidBackdrop {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .login-page {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 112px 24px 48px;
    isolation: isolate;
    perspective: 1200px;
    background: linear-gradient(135deg,#e8f6f3,#dff4ef 45%,#fff0e8 100%);
    background-size: 220% 220%;
    animation: curaLiquidBackdrop 18s ease-in-out infinite;
    font-family: Inter,system-ui,sans-serif;
  }
  .login-liquid {
    position: fixed;
    z-index: -1;
    width: min(58vw,680px);
    aspect-ratio: 1;
    pointer-events: none;
    transform-style: preserve-3d;
    filter: blur(2px);
    opacity: .7;
    animation: curaLiquidDrift 15s ease-in-out infinite;
  }
  .login-liquid--mint {
    top: -24%;
    left: -14%;
    background: radial-gradient(ellipse at 32% 30%,rgba(127,230,212,.8),rgba(15,181,161,.28) 48%,rgba(15,181,161,0) 72%);
  }
  .login-liquid--peach {
    right: -15%;
    bottom: -30%;
    background: radial-gradient(ellipse at 60% 42%,rgba(255,217,196,.8),rgba(242,160,123,.3) 50%,rgba(242,160,123,0) 72%);
    animation-delay: -7s;
    animation-duration: 19s;
  }
  .login-liquid--aqua {
    top: 40%;
    left: 42%;
    width: min(42vw,480px);
    opacity: .45;
    background: radial-gradient(ellipse at 40% 40%,rgba(189,245,233,.75),rgba(77,191,169,.25) 50%,rgba(77,191,169,0) 74%);
    animation-delay: -11s;
    animation-duration: 22s;
  }
  .login-stage {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    width: min(100%,520px);
    perspective: 1100px;
  }
  .login-card-scene {
    position: relative;
    width: 100%;
    animation: curaRise .7s cubic-bezier(.22,1,.36,1) both;
  }
  .login-card {
    position: relative;
    z-index: 1;
    transform-style: preserve-3d;
  }
  .cura-side {
    position: absolute;
    z-index: 2;
    top: -70px;
    transform-style: preserve-3d;
    pointer-events: none;
  }
  .cura-side--left { left: -112px; }
  .cura-side--right { right: -112px; }
  .cura-chip { z-index: 3; }
  @media (max-width: 820px) {
    .login-page { padding: 96px 18px 36px; }
    .cura-side { display: none; }
    .login-card { padding: 34px 24px 26px !important; }
  }
  @media (max-width: 420px) {
    .login-page { padding-right: 14px; padding-left: 14px; }
    .login-card { padding-right: 18px !important; padding-left: 18px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .login-page, .login-liquid { animation: none; }
    .login-card-scene, .cura-chip, .cura-side > div { animation: none !important; }
  }
`


export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('signup') // Signup is the first screen
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const sceneRef = useRef(null)

  useEffect(() => {
    // subtle parallax — mouse moves the card in real 3D space
    const el = sceneRef.current
    if (!el) return
    if (matchMedia('(pointer: coarse)').matches) return // skip on touch devices
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      setTilt({ x: -ny * 9, y: nx * 12 })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave) }
  }, [])

  const finish = (user) => {
    setSuccess(mode === 'signup' ? 'Account created! Taking you in…' : 'Signed in! Taking you in…')
    setTimeout(() => onLogin && onLogin(user), 550)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signup') {
        const { data, error: apiError } = await authClient.signUp.email({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          password,
        })
        if (apiError) throw new Error(apiError.message || 'Could not create the account')
        finish(data?.user || null)
      } else {
        const { data, error: apiError } = await authClient.signIn.email({
          email: email.trim(),
          password,
        })
        if (apiError) throw new Error(apiError.message || 'Invalid email or password')
        finish(data?.user || null)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true); setError(''); setSuccess('')
    try {
      // Neon's vanilla client does not always auto-navigate to the provider,
      // so we follow the redirect ourselves when the server hands us a URL.
      const { data, error: apiError } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin,
        prompt: 'select_account',
      })
      if (apiError) {
        setError(apiError.message || 'Google sign-in failed. Please try again.')
        setLoading(false)
        return
      }
      if (data?.url) {
        window.location.href = data.url   // → Google consent screen
        return
      }
      if (data?.redirect) {
        // Consent flow started - wait for redirect back to callbackURL
        // The user will be redirected to Google, then back to this app
        // via the callbackURL specified in the social sign-in call
        setLoading(false)
        return
      }
      setError('Google sign-in did not start. Please try again or use email.')
      setLoading(false)
    } catch (err) {
      setError(err?.message || 'Google sign-in failed. Please try again.')
      setLoading(false)
    }
  }

  const tiltScene = {
    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: 'transform .12s ease-out',
    transformStyle: 'preserve-3d',
  }
  const chip = (text, z, x, y, r, delay, tone) => (
    <div key={text} className="cura-chip" style={{
      position: 'absolute', left: x, top: y, '--z': z, '--r': r,
      animation: `curaFloat 4.2s ease-in-out ${delay}s infinite`,
      transformStyle: 'preserve-3d',
      background: tone, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      color: '#0a2a2a', padding: '9px 18px', borderRadius: 100,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
      boxShadow: '0 10px 24px rgba(10,42,42,.16), inset 0 1px 0 rgba(255,255,255,.55)',
      border: '1px solid rgba(255,255,255,.6)',
    }}>{text}</div>
  )

  return (
    <div className="login-page">
      <style>{STYLES}</style>
      <div className="login-liquid login-liquid--mint" />
      <div className="login-liquid login-liquid--peach" />
      <div className="login-liquid login-liquid--aqua" />

      <div ref={sceneRef} className="login-stage">
        <div className="login-card-scene" style={tiltScene}>

          {/* floating prescription chips flank the upper edge of the card */}
          {chip('Amoxicillin 500mg', 130, '2%', '-48px', '-6deg', 0, 'rgba(255,255,255,.78)')}
          {chip('Paracetamol 650mg', 90, '58%', '-48px', '5deg', .6, 'rgba(255,255,255,.65)')}
          {chip('✓ Interaction checked', 110, '1%', '-4px', '4deg', 1.1, 'rgba(214,245,236,.9)')}
          {chip('Risk: Low', 70, '72%', '-4px', '-4deg', 1.6, 'rgba(255,248,230,.92)')}

          {/* LEFT SIDE — stacked prescription sheet in real 3D depth */}
          <div className="cura-side cura-side--left">
            <div style={{ position: 'relative', width: 118, height: 158, '--base': 'rotateY(30deg) rotateZ(-7deg)', '--z': '120px', animation: 'curaSideFloat 5s ease-in-out infinite', transformStyle: 'preserve-3d' }}>
              {/* back sheets — the stack reads as a pile of scanned papers */}
              <div style={{ position: 'absolute', top: 18, left: 18, width: 104, height: 146, borderRadius: 10, background: 'rgba(255,255,255,.42)', boxShadow: '0 18px 30px -10px rgba(10,42,42,.28)' }} />
              <div style={{ position: 'absolute', top: 9, left: 9, width: 104, height: 146, borderRadius: 10, background: 'rgba(255,255,255,.66)' }} />
              {/* front ruled paper, scanner line running down it */}
              <div style={{ position: 'relative', width: 104, height: 146, borderRadius: 10, background: 'linear-gradient(160deg,#fff,#f5fbf9)', border: '1px solid rgba(15,181,161,.25)', boxShadow: '0 26px 40px -14px rgba(10,42,42,.4), inset 0 1px 0 #fff', padding: '16px 10px 0 28px', overflow: 'hidden' }}>
                {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ height: 2, background: '#e4e4e4', marginBottom: 16, width: `${88 - i * 7}%` }} />)}
                <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: '#f4a79a' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#0fb5a1,transparent)', boxShadow: '0 0 10px #0fb5a1', animation: 'curaScan 3.2s ease-in-out infinite' }} />
              </div>
              {/* teal cross badge peeling off the pile */}
              <div style={{ position: 'absolute', right: -22, bottom: -16, width: 40, height: 40, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #6fe3d1, #0e8a7e)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 18, boxShadow: '0 12px 22px -6px rgba(14,138,126,.55), inset 0 -5px 8px rgba(0,0,0,.16), inset 0 4px 8px rgba(255,255,255,.35)', transform: 'translateZ(60px)' }}>+</div>
            </div>
          </div>

          {/* RIGHT SIDE — medicine bottle + capsule in real 3D depth */}
          <div className="cura-side cura-side--right">
            <div style={{ position: 'relative', width: 120, height: 180, '--base': 'rotateY(-30deg) rotateZ(6deg)', '--z': '140px', animation: 'curaSideFloat 5.6s ease-in-out .9s infinite', transformStyle: 'preserve-3d' }}>
              {/* cap + neck */}
              <div style={{ position: 'absolute', top: 0, left: 24, width: 74, height: 30, borderRadius: '9px 9px 4px 4px', background: 'linear-gradient(180deg,#7fe6d4,#0aa593)', boxShadow: 'inset 0 3px 5px rgba(255,255,255,.55), inset 0 -5px 7px rgba(0,0,0,.15), 0 8px 14px -6px rgba(10,42,42,.3)' }} />
              <div style={{ position: 'absolute', top: 28, left: 36, width: 50, height: 11, background: '#0d8f84', borderRadius: '0 0 3px 3px' }} />
              {/* glassy body with a lab label */}
              <div style={{ position: 'absolute', top: 38, left: 8, width: 106, height: 130, borderRadius: 14, background: 'radial-gradient(120% 90% at 30% 16%, #d8f5ee 0%, #9adfcd 42%, #4dbfa9 100%)', boxShadow: '0 30px 44px -14px rgba(10,42,42,.42), inset 0 4px 8px rgba(255,255,255,.6), inset 0 -10px 16px rgba(0,0,0,.14)', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 11, right: 11, top: 50, height: 62, borderRadius: 9, background: '#fff', boxShadow: '0 4px 10px rgba(10,42,42,.16)', padding: '10px 9px 0' }}>
                  <div style={{ height: 3, width: '68%', background: '#9adbd0', marginBottom: 8 }} />
                  <div style={{ height: 3, width: '52%', background: '#e2efec', marginBottom: 8 }} />
                  <div style={{ height: 3, width: '60%', background: '#e2efec' }} />
                </div>
              </div>
              {/* two-tone capsule tumbling beside the bottle */}
              <div style={{ position: 'absolute', right: -34, bottom: -6, width: 66, height: 27, borderRadius: 999, background: 'linear-gradient(90deg,#0fb5a1 0%,#14c9b2 50%,#ffd9c4 50%,#f2a07b 100%)', boxShadow: 'inset 0 4px 6px rgba(255,255,255,.55), inset 0 -5px 7px rgba(0,0,0,.18), 0 14px 22px -8px rgba(10,42,42,.4)', animation: 'curaCapsFloat 4.4s ease-in-out .5s infinite' }} />
            </div>
          </div>

          {/* main card (depth layer 1) */}
          <div className="login-card" style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.99))',
            borderRadius: 30, padding: '38px 30px 30px',
            boxShadow: '0 34px 70px -18px rgba(10,42,42,.28), 0 6px 18px rgba(10,42,42,.08), inset 0 1px 0 rgba(255,255,255,.7)',
            border: '1px solid rgba(255,255,255,.7)',
            backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          }}>
            {/* scan line — echoes the prescription scanner */}
            <div style={{ position: 'absolute', left: 22, right: 22, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,transparent,#0fb5a1,transparent)', boxShadow: '0 0 12px #0fb5a1', animation: 'curaScan 3.4s ease-in-out infinite', pointerEvents: 'none' }} />

            {/* logo sphere with pulse ring */}
            <div style={{ display: 'grid', placeItems: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative', width: 66, height: 66 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(15,181,161,.55)', animation: 'curaPulse 2.4s ease-out infinite' }} />
                <div style={{
                  width: 66, height: 66, borderRadius: '50%',
                  background: 'radial-gradient(circle at 32% 28%, #6fe3d1 0%, #0fb5a1 55%, #0a7c72 100%)',
                  display: 'grid', placeItems: 'center',
                  boxShadow: '0 14px 26px -8px rgba(14,138,126,.55), inset 0 -6px 12px rgba(0,0,0,.18), inset 0 4px 8px rgba(255,255,255,.4)',
                  transform: 'translateZ(50px)',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="9.2" />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0a2a2a', margin: 0, letterSpacing: '-.6px' }}>Cura AI</h1>
              <p style={{ color: '#5a7a79', fontSize: 12.5, marginTop: 5, marginBottom: 0 }}>
                {mode === 'signup' ? 'Create an account to scan prescriptions safely' : 'Welcome back — your prescriptions await'}
              </p>
            </div>

            {/* signup / signin tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              background: '#eaf5f3', padding: 4, borderRadius: 18, marginBottom: 18,
            }}>
              {['signup', 'signin'].map((m) => (
                <button key={m} type="button" onClick={() => { setMode(m); setError('') }} style={{
                  border: 0, borderRadius: 14, padding: '9px 0', fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .18s ease',
                  background: mode === m ? '#0e8a7e' : 'transparent',
                  color: mode === m ? '#fff' : '#5a7a79',
                  boxShadow: mode === m ? '0 4px 10px rgba(14,138,126,.35)' : 'none',
                }}>{m === 'signup' ? 'Sign up' : 'Sign in'}</button>
              ))}
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogle} disabled={loading} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#fff', color: '#223', border: '1.5px solid #d8e6e3',
              padding: '12px 16px', borderRadius: 16, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all .18s ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 18px rgba(14,138,126,.14)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.98)' }}
            >
              <GoogleIcon /> {loading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#dfece9' }} />
              <span style={{ fontSize: 10.5, color: '#8aa8a3', letterSpacing: '.4px' }}>OR USE EMAIL</span>
              <div style={{ flex: 1, height: 1, background: '#dfece9' }} />
            </div>

            {error && (
              <div style={{ background: '#fff1f1', border: '1px solid #ffd6d6', color: '#c43c3c', borderRadius: 12, padding: '10px 12px', fontSize: 11.5, marginBottom: 10, textAlign: 'center' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background: '#effaf6', border: '1px solid #bfe8da', color: '#0e8a7e', borderRadius: 12, padding: '10px 12px', fontSize: 11.5, marginBottom: 10, textAlign: 'center', fontWeight: 600 }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
              {mode === 'signup' && (
                <div style={{
                  background: '#f2f8f7', border: '1.5px solid #dcebe8', borderRadius: 15,
                  padding: '3px 15px', display: 'flex', alignItems: 'center', gap: 9,
                  transition: 'border-color .15s',
                }} onFocus={(e) => { e.currentTarget.style.borderColor = '#0fb5a1' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#dcebe8' }}>
                  <span style={{ fontSize: 14, color: '#7fa8a2' }}>👤</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name"
                    style={{ flex: 1, border: 0, outline: 0, background: 'none', fontSize: 13.5, color: '#0a2a2a', padding: '10px 0' }} />
                </div>
              )}
              <div style={{
                background: '#f2f8f7', border: '1.5px solid #dcebe8', borderRadius: 15,
                padding: '3px 15px', display: 'flex', alignItems: 'center', gap: 9,
              }} onFocus={(e) => { e.currentTarget.style.borderColor = '#0fb5a1' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#dcebe8' }}>
                <span style={{ fontSize: 14, color: '#7fa8a2' }}>✉️</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                  style={{ flex: 1, border: 0, outline: 0, background: 'none', fontSize: 13.5, color: '#0a2a2a', padding: '10px 0' }} />
              </div>
              <div style={{
                background: '#f2f8f7', border: '1.5px solid #dcebe8', borderRadius: 15,
                padding: '3px 15px', display: 'flex', alignItems: 'center', gap: 9,
              }} onFocus={(e) => { e.currentTarget.style.borderColor = '#0fb5a1' }} onBlur={(e) => { e.currentTarget.style.borderColor = '#dcebe8' }}>
                <span style={{ fontSize: 14, color: '#7fa8a2' }}>🔒</span>
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8 characters)" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  style={{ flex: 1, border: 0, outline: 0, background: 'none', fontSize: 13.5, color: '#0a2a2a', padding: '10px 0' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} title={showPassword ? 'Hide password' : 'Show password'}
                  style={{ border: 0, background: 'none', cursor: 'pointer', fontSize: 13, color: '#7fa8a2', padding: 4 }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>

              <button type="submit" disabled={loading} style={{
                marginTop: 4, width: '100%',
                background: 'linear-gradient(135deg, #14a89e, #0e8a7e)',
                color: '#fff', border: 0, padding: '13px 0', borderRadius: 16,
                fontSize: 13.5, fontWeight: 700, letterSpacing: '.2px', cursor: 'pointer',
                boxShadow: '0 12px 22px -8px rgba(14,138,126,.5)',
                opacity: loading ? .65 : 1,
                transform: loading ? 'none' : undefined,
                transition: 'all .18s ease',
              }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none' }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(.98)' }}
              >
                {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', display: 'inline-block', animation: 'curaSpin .8s linear infinite' }} />Please wait…</span>
                  : mode === 'signup' ? 'Create account →' : 'Sign in →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 10.5, color: '#8aa8a3', margin: '14px 0 0', lineHeight: 1.5 }}>
              By continuing you agree that Cura AI analyses your prescription images privately — they are never stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}