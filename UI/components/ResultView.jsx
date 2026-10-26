import React, { useState } from 'react';

function ResultView({ results, onBack, imageUrl }) {
  const [showOcr, setShowOcr] = useState(false);

  console.log("DEBUG Results in ResultView:", results); // hata dena baad me

  const riskStyle = (risk) => {
    const map = {
      low: { bg: '#d4edda', text: '#155724', label: 'Low' },
      moderate: { bg: '#fff3cd', text: '#856404', label: 'Moderate' },
      high: { bg: '#f8d7da', text: '#721c24', label: 'High' },
    };
    return map[risk?.toLowerCase()] || map.low;
  };

  // 🔥 YEHI MAIN FIX HAI - har jagah se dhundega
  const data = results?.data || results?.result || results?.results || results || {};
  const patient = data.patient || results.patient || {};
  const rawMeds = data.medicines || results.medicines || [];
  const medicines = rawMeds.map(m => typeof m === 'string' ? { name: m } : m);
  const interactions = data.interactions || results.interactions || [];
  const recommendations = data.recommendations || results.recommendations || '';
  const ocrText = data.ocr_text || data.ocrText || results.ocr_text || results.ocrText || '';

  return (
    <div style={{ background: '#ffffff', borderRadius: 32, padding: '28px 24px 32px', boxShadow: '0 12px 48px rgba(16, 42, 48, 0.06)' }}>
      
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#102a30', marginBottom: 12 }}>Scanned Prescription</h2>
        <div style={{ background: '#f8fcfb', borderRadius: 16, overflow: 'hidden', border: '1px solid #eaf7f5', position: 'relative' }}>
          {imageUrl ? <img src={imageUrl} alt="Prescription" style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'contain' }} /> : null}
        </div>
      </div>

      {patient?.name && (
        <div style={{ marginBottom: 24, background: '#f8fcfb', borderRadius: 16, padding: '16px 20px', border: '1px solid #eaf7f5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            <div><strong>Name:</strong> {patient.name}</div>
            <div><strong>Age:</strong> {patient.age || 'N/A'} {patient.sex && `Sex: ${patient.sex}`}</div>
            <div><strong>Date:</strong> {patient.date || 'N/A'}</div>
          </div>
        </div>
      )}

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#102a30', marginBottom: 12 }}>
          Medicines detected ({medicines.length})
        </h3>
        {medicines.length === 0 ? (
          <div style={{ background: '#fff3cd', borderRadius: 16, padding: '14px 18px', border: '1px solid #ffeeba', color: '#856404' }}>
            No medicines found. Backend ne {rawMeds.length} bheja tha par format galat tha. Console check kar.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {medicines.map((med, idx) => {
              const risk = riskStyle(med.risk);
              return (
                <div key={idx} style={{ background: '#f8fcfb', borderRadius: 16, padding: '14px 18px', border: '1px solid #eaf7f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#102a30' }}>{med.name || med.medicine || JSON.stringify(med)}</span>
                    {med.risk && <span style={{ background: risk.bg, color: risk.text, fontSize: '0.75rem', fontWeight: 700, padding: '3px 14px', borderRadius: 100 }}>{risk.label}</span>}
                  </div>
                  {(med.sig || med.dosage) && <div style={{ fontSize: '0.9rem', color: '#3d5f5a', marginTop: 4 }}>Sig: {med.sig || med.dosage}</div>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {recommendations && (
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#102a30', marginBottom: 12 }}>Recommendations</h3>
          <div style={{ background: '#eaf7f5', borderRadius: 16, padding: '16px 18px', color: '#102a30', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations, null, 2)}
          </div>
        </section>
      )}

      {ocrText && (
        <section style={{ marginBottom: 28 }}>
          <button onClick={() => setShowOcr(!showOcr)} style={{ background: 'none', border: 'none', color: '#14a89e', fontWeight: 600, cursor: 'pointer' }}>
            {showOcr ? 'Hide' : 'Show'} raw OCR text {showOcr ? '▲' : '▼'}
          </button>
          {showOcr && <div style={{ marginTop: 8, background: '#f8fcfb', borderRadius: 16, padding: '14px 18px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{ocrText}</div>}
        </section>
      )}

      <button onClick={onBack} style={{ background: 'transparent', border: '2px solid #d4e8e3', borderRadius: 60, padding: '12px 32px', width: '100%', fontWeight: 600, cursor: 'pointer' }}>← Rescan Another</button>
    </div>
  );
}
export default ResultView;