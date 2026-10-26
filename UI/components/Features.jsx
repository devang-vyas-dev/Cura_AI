import React from 'react';

function Features() {
  const features = [
    {
      icon: '🔍',
      title: 'OCR + AI reading',
      desc: 'Handwritten scripts turned into structured medicine data.',
    },
    {
      icon: '⚠️',
      title: 'Risk detection',
      desc: 'Interactions, overdose and duplicate therapy flags.',
    },
    {
      icon: '📍',
      title: 'Care nearby',
      desc: 'Pharmacies and clinics around you, ranked by distance.',
    },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
        {features.map((f, idx) => (
          <div key={idx} style={{ background: '#ffffff', borderRadius: 24, padding: '24px 20px', boxShadow: '0 8px 32px rgba(16, 42, 48, 0.04)', textAlign: 'center', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#102a30', marginBottom: 6 }}>{f.title}</h4>
            <p style={{ fontSize: '0.9rem', color: '#6d8f8a', lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Features;