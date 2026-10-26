import React from 'react';

function Hero({ onUploadClick, onHowItWorksClick }) {
  return (
    <section style={{ padding: '32px 0 20px', background: '#eaf7f5' }}>
      <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px 16px', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, lineHeight: 1 }}>🧠</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#102a30', letterSpacing: '-0.02em' }}>CuraAI</span>
          </div>
          <div style={{ background: '#102a30', color: '#eaf7f5', fontSize: '13px', fontWeight: 600, padding: '6px 16px', borderRadius: 100, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            MVP • Prescription Safety
          </div>
        </div>

        {/* Hero content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }} className="fade-in">
          <div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 700, lineHeight: 1.1, color: '#102a30', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Know what your
              <br />
              prescription <span style={{ color: '#14a89e' }}>hides.</span>
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 1.2vw, 1.15rem)', color: '#3d5f5a', lineHeight: 1.6, maxWidth: 480, marginTop: 12, marginBottom: 28 }}>
              Upload a photo of your prescription. CuraAI reads it, checks every medicine for risks, and tells you exactly what to do next.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button onClick={onUploadClick} style={{ background: '#14a89e', color: '#fff', border: 'none', borderRadius: 60, padding: '14px 32px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s, transform 0.15s', boxShadow: '0 8px 24px rgba(20, 168, 158, 0.28)' }}
                onMouseEnter={(e) => e.target.style.background = '#0f8a81'}
                onMouseLeave={(e) => e.target.style.background = '#14a89e'}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.97)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              >
                Upload prescription
              </button>
              <button onClick={onHowItWorksClick} style={{ background: 'transparent', border: 'none', color: '#102a30', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, opacity: 0.7, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.7}
              >
                How it works →
              </button>
            </div>
          </div>

          {/* Right glass card – stacked chips, no blurs */}
          <div style={{ borderRadius: 32, padding: 32, background: 'linear-gradient(145deg, #fff7e8 0%, #f8c2b0 50%, #a8d8d0 100%)', boxShadow: '0 20px 60px rgba(16, 42, 48, 0.10), inset 0 0 0 1px rgba(255,255,255,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
              <span style={{ background: 'rgba(255,255,255,0.7)', padding: '8px 24px', borderRadius: 100, fontSize: '1.05rem', fontWeight: 500, color: '#102a30', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: 'fit-content' }}>
                Azithromycin 500mg
              </span>
              <span style={{ background: 'rgba(255,255,255,0.6)', padding: '8px 24px', borderRadius: 100, fontSize: '1.05rem', fontWeight: 500, color: '#102a30', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: 'fit-content' }}>
                Paracetamol 650mg
              </span>
              <span style={{ background: 'rgba(255,255,255,0.5)', padding: '8px 24px', borderRadius: 100, fontSize: '1.05rem', fontWeight: 500, color: '#102a30', backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', width: 'fit-content' }}>
                +3 more
              </span>
            </div>
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.95rem', color: 'rgba(16,42,48,0.7)', fontWeight: 500, letterSpacing: '0.2px' }}>
              ⚡ Scan & detect risks instantly
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;