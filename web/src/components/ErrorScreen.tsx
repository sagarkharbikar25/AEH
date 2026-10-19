import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Copy, Check, Compass, Radio, PowerOff, ShieldAlert, WifiOff } from 'lucide-react';
import { ErrorVariant } from '../types';

interface ErrorScreenProps {
  variant: ErrorVariant;
  requestId?: string;
  retryAfterSeconds?: number;
  onWatchReplay?: () => void;
  onRetry?: () => void;
}

interface VariantConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  actionText: string;
  secondaryAction?: string;
}

const ERROR_CONFIGS: Record<ErrorVariant, VariantConfig> = {
  offline_backend: {
    icon: PowerOff,
    title: 'The Observatory is Offline',
    subtitle: 'EC2 DECIDER 2B ENGINE UNREACHABLE',
    description: 'The EC2 Decider instance is currently suspended to preserve compute quota. The celestial atlas remains fully operational using recorded flight replays.',
    actionText: 'Watch Recorded Flight',
    secondaryAction: 'Probe Connection'
  },
  budget_exhausted: {
    icon: ShieldAlert,
    title: 'The Lamp is Out of Oil',
    subtitle: 'DAILY BEDROCK SPEND KILL-SWITCH TRIPPED',
    description: 'The automatic safeguard tripped to prevent Bedrock API runaway expenses. All live prompts are paused for today; deterministic replay flights remain active.',
    actionText: 'Watch Recorded Flight',
    secondaryAction: 'Review Budget Cap'
  },
  rate_limited: {
    icon: Radio,
    title: 'Too Many Readings',
    subtitle: 'RATE LIMIT REACHED (429)',
    description: 'The observatory rate limiter has throttled incoming queries. Please wait a moment before sending another instrument reading.',
    actionText: 'Retry Query',
    secondaryAction: 'Return to Atlas'
  },
  signal_lost: {
    icon: AlertCircle,
    title: 'Signal Lost Mid-Flight',
    subtitle: 'SSE EVENT STREAM DISCONNECTED',
    description: 'The real-time Server-Sent Events stream from the router was interrupted. Partial metrics have been saved.',
    actionText: 'Resume Connection',
    secondaryAction: 'Play Cached Replay'
  },
  throttled: {
    icon: Radio,
    title: 'Heavy Traffic Over the Sky',
    subtitle: 'BEDROCK CONVERSE THROTTLED (503)',
    description: 'Amazon Bedrock has requested backoff due to sudden demand. Backing off automatically with exponential jitter.',
    actionText: 'Retry with Backoff'
  },
  no_network: {
    icon: WifiOff,
    title: 'No Signal to Ground',
    subtitle: 'BROWSER OFFLINE',
    description: 'Your browser is currently disconnected from the network. Reconnecting when internet access is restored.',
    actionText: 'Check Connection'
  },
  not_found: {
    icon: Compass,
    title: 'Off the Chart',
    subtitle: 'UNKNOWN CELESTIAL SECTOR (404)',
    description: 'The coordinates you requested do not map to any known instrument or catalog plate in this atlas.',
    actionText: 'Return to Atlas'
  },
  server_error: {
    icon: AlertCircle,
    title: 'A Star Went Dark',
    subtitle: 'INTERNAL OBSERVATORY ERROR (500)',
    description: 'An unexpected exception occurred inside the router pipeline. Please copy the diagnostic request ID below.',
    actionText: 'Reload Instrument',
    secondaryAction: 'Return to Atlas'
  }
};

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  variant,
  requestId = 'req_' + Math.random().toString(36).substring(2, 10),
  onWatchReplay,
  onRetry
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const cfg = ERROR_CONFIGS[variant] || ERROR_CONFIGS.server_error;
  const Icon = cfg.icon;

  const handleCopyId = () => {
    navigator.clipboard.writeText(requestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrimary = () => {
    if (variant === 'offline_backend' || variant === 'budget_exhausted') {
      if (onWatchReplay) onWatchReplay();
      else navigate('/');
    } else if (variant === 'not_found') {
      navigate('/');
    } else if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full plate border-[var(--ember)]/60 bg-[var(--ink-800)]/90 p-8 text-center relative overflow-hidden shadow-2xl">
        
        {/* Celestial background rings */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400">
            <circle cx="200" cy="200" r="140" fill="none" stroke="var(--ember)" strokeWidth="1" strokeDasharray="4,8" />
            <circle cx="200" cy="200" r="80" fill="none" stroke="var(--ember)" strokeWidth="1" />
          </svg>
        </div>

        {/* Icon */}
        <div className="relative z-10 mx-auto w-14 h-14 rounded-full border border-[var(--ember)]/80 flex items-center justify-center bg-[var(--ink-900)] mb-4 text-[var(--ember)]">
          <Icon className="w-7 h-7" />
        </div>

        {/* Subtitle / Tag */}
        <div className="relative z-10 text-[11px] font-mono tracking-widest uppercase text-[var(--ember)] mb-1">
          {cfg.subtitle}
        </div>

        {/* Title */}
        <h2 className="relative z-10 font-display text-3xl font-bold text-[var(--parchment)] mb-3">
          {cfg.title}
        </h2>

        {/* Description */}
        <p className="relative z-10 text-sm font-body text-[var(--parchment-dim)] leading-relaxed mb-6 max-w-md mx-auto">
          {cfg.description}
        </p>

        {/* Request ID badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[var(--line)] bg-[var(--ink-900)] text-xs font-mono text-[var(--parchment-muted)] mb-6">
          <span>REQUEST ID:</span>
          <span className="text-[var(--parchment)] font-bold">{requestId}</span>
          <button 
            onClick={handleCopyId} 
            className="hover:text-[var(--brass-bright)] transition-colors ml-1"
            title="Copy Request ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[var(--lichen)]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Actions */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handlePrimary}
            className="px-6 py-2.5 rounded border border-[var(--brass)] bg-[var(--brass)]/10 hover:bg-[var(--brass)]/20 text-[var(--brass-bright)] font-mono text-xs uppercase tracking-wider transition-all"
          >
            {cfg.actionText}
          </button>
          
          {cfg.secondaryAction && (
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded border border-[var(--line)] hover:border-[var(--parchment-dim)] text-[var(--parchment-dim)] font-mono text-xs uppercase tracking-wider transition-all"
            >
              {cfg.secondaryAction}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
