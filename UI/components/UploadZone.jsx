import React, { useRef, useState } from 'react';

function UploadZone({ onFileSelect, error }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleBrowseClick = () => fileInputRef.current?.click();

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragover' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        background: '#ffffff',
        borderRadius: 32,
        padding: '44px 32px 40px',
        textAlign: 'center',
        boxShadow: '0 12px 48px rgba(16, 42, 48, 0.06)',
        border: `2px dashed ${isDragging ? '#14a89e' : '#d4e8e3'}`,
        transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={handleBrowseClick}
    >
      <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.8 }}>📄</div>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#102a30', marginBottom: 6, letterSpacing: '-0.01em' }}>
        Drop your prescription here
      </h3>
      <p style={{ fontSize: '0.95rem', color: '#6d8f8a', marginBottom: 0 }}>
        JPG or PNG · analysed privately, never stored
      </p>
      {error && (
        <div style={{ marginTop: 12, color: '#721c24', background: '#f8d7da', padding: '8px 16px', borderRadius: 8, fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="file-input-hidden" onChange={handleFileChange} />
    </div>
  );
}

export default UploadZone;