import React, { useState } from 'react';
import { ErrorScreen } from '../components/ErrorScreen';
import { type ErrorVariant } from '../types';

export const DevErrorsPage: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<ErrorVariant>('offline_backend');

  const variants: { id: ErrorVariant; label: string }[] = [
    { id: 'offline_backend', label: 'Observatory Offline (503)' },
    { id: 'budget_exhausted', label: 'Lamp Out of Oil (Budget Kill-Switch)' },
    { id: 'rate_limited', label: 'Too Many Readings (429)' },
    { id: 'signal_lost', label: 'Signal Lost (SSE Interrupted)' },
    { id: 'throttled', label: 'Heavy Traffic (Bedrock 503)' },
    { id: 'no_network', label: 'No Signal (Offline)' },
    { id: 'not_found', label: 'Off the Chart (404)' },
    { id: 'server_error', label: 'A Star Went Dark (500)' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      
      {/* Dev Switcher Header */}
      <div className="plate p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="plate-tag text-[var(--leaf)]">DIAGNOSTIC SANDBOX</span>
          <h2 className="font-display text-xl font-bold text-slate-100">
            Celestial Error Screen Tester
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedVariant(v.id)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedVariant === v.id
                  ? 'bg-[var(--leaf)] text-[#02120e] font-bold shadow-[0_0_10px_rgba(224,255,194,0.3)]'
                  : 'border border-[var(--forest)]/50 text-slate-300 hover:text-[var(--leaf)] hover:border-[var(--leaf)]/40'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Active Error Screen */}
      <ErrorScreen 
        variant={selectedVariant}
        requestId={`err_${selectedVariant}_${Math.random().toString(36).substring(2, 8)}`}
        onRetry={() => alert('Retry triggered in sandbox')}
      />

    </div>
  );
};
