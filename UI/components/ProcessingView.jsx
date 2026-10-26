// src/components/ProcessingView.jsx
import React, { useEffect, useState } from 'react';

function ProcessingView({ step }) {
  const steps = [
    { label: 'Reading prescription', icon: '🔍', emoji: '📄' },
    { label: 'Checking interactions', icon: '⚡', emoji: '🧬' },
    { label: 'Generating advice', icon: '✨', emoji: '📋' },
  ];

  const [visibleSteps, setVisibleSteps] = useState(0);

  // Animate steps appearing one by one
  useEffect(() => {
    setVisibleSteps(step);
  }, [step]);

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 32,
        padding: '40px 32px 44px',
        boxShadow: '0 12px 48px rgba(16, 42, 48, 0.06)',
        animation: 'fadeIn 0.4s ease forwards',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 28,
            marginBottom: 6,
          }}
        >
          ⏳
        </div>
        <h3
          style={{
            fontSize: '1.3rem',
            fontWeight: 600,
            color: '#102a30',
            letterSpacing: '-0.01em',
          }}
        >
          Analyzing your prescription
        </h3>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#6d8f8a',
            marginTop: 4,
          }}
        >
          Please wait while we process your medication list
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        {steps.map((s, idx) => {
          const isDone = idx < visibleSteps;
          const isActive = idx === visibleSteps && visibleSteps < steps.length;
          const isPending = idx > visibleSteps;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '10px 0',
                opacity: isPending ? 0.4 : 1,
                transition: 'opacity 0.4s',
              }}
            >
              {/* Step circle */}
              <div
                className="step-dot"
                style={{
                  background: isDone ? '#14a89e' : isActive ? '#eaf7f5' : '#f0f5f3',
                  border: `2px solid ${isDone ? '#14a89e' : isActive ? '#14a89e' : '#d4e8e3'}`,
                  color: isDone ? '#fff' : isActive ? '#14a89e' : '#b8d5d0',
                  fontSize: isDone ? 18 : isActive ? 18 : 16,
                }}
              >
                {isDone ? '✓' : isActive ? '⋯' : idx + 1}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isDone ? '#102a30' : isActive ? '#102a30' : '#8aa8a3',
                  flex: 1,
                }}
              >
                {s.label}
              </span>

              {/* Emoji */}
              {isDone && (
                <span style={{ fontSize: 20, opacity: 0.7 }}>✅</span>
              )}
              {isActive && (
                <span
                  style={{
                    fontSize: 18,
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                >
                  ⏳
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 28,
          height: 4,
          background: '#eaf7f5',
          borderRadius: 4,
          overflow: 'hidden',
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min((visibleSteps / steps.length) * 100, 100)}%`,
            background: '#14a89e',
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

export default ProcessingView;