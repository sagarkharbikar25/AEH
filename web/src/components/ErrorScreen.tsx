import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Copy, Check, Compass, Radio, PowerOff, ShieldAlert, WifiOff } from 'lucide-react';
import { ErrorVariant } from '../types';
import { BorderBeamFrame } from './BorderBeamFrame';

interface ErrorScreenProps {
  variant: ErrorVariant;
  requestId?: string;
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
  },
  inline_validation: {
    icon: AlertCircle,
    title: 'Malformed Observation',
    subtitle: 'INVALID REQUEST PARAMETERS (400)',
    description: 'The query payload failed validation. Please verify that your prompt is non-empty and within allowable character limits.',
    actionText: 'Revise Query',
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
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <BorderBeamFrame activeBeam={true}>
          <div className="text-center relative">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full border border-rose-500/50 flex items-center justify-center bg-[#02040A] mb-4 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <Icon className="w-8 h-8" />
            </div>

            {/* Subtitle */}
            <div className="text-xs font-mono tracking-widest uppercase text-rose-400 font-bold mb-1">
              {cfg.subtitle}
            </div>

            {/* Title */}
            <h2 className="font-display text-3xl font-bold text-slate-100 mb-3">
              {cfg.title}
            </h2>

            {/* Description */}
            <p className="text-sm font-body text-slate-300 leading-relaxed mb-6 max-w-md mx-auto">
              {cfg.description}
            </p>

            {/* Request ID Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-white/10 bg-[#02040A] text-xs font-mono text-slate-400 mb-6">
              <span>DIAGNOSTIC ID:</span>
              <span className="text-slate-100 font-bold">{requestId}</span>
              <button 
                onClick={handleCopyId} 
                className="hover:text-amber-300 transition-colors ml-1"
                title="Copy ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handlePrimary}
                className="px-6 py-2.5 rounded-lg border border-amber-400/80 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_15px_rgba(245,208,97,0.15)]"
              >
                {cfg.actionText}
              </button>
              
              {cfg.secondaryAction && (
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-lg border border-white/10 hover:border-white/30 text-slate-300 font-mono text-xs uppercase tracking-wider transition-all"
                >
                  {cfg.secondaryAction}
                </button>
              )}
            </div>
          </div>
        </BorderBeamFrame>
      </div>
    </div>
  );
};
