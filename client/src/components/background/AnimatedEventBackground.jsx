import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * AuroraLayer - Continuously moving gradient blobs (Layer 1)
 */
export const AuroraLayer = ({ theme, parallaxOffset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blob A */}
      <div
        className={`absolute -top-20 -left-20 w-[650px] h-[650px] rounded-full blur-3xl opacity-70 animate-blob-slow ${
          theme === 'dark'
            ? 'bg-gradient-to-tr from-cyan-600/30 via-blue-600/20 to-purple-600/10'
            : 'bg-gradient-to-tr from-cyan-300/35 via-sky-200/40 to-lavender-300/25'
        }`}
        style={{
          transform: `translate(${parallaxOffset.x * 0.25}px, ${parallaxOffset.y * 0.25}px)`
        }}
      />
      {/* Blob B */}
      <div
        className={`absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-65 animate-blob-slow ${
          theme === 'dark'
            ? 'bg-gradient-to-bl from-purple-600/25 via-indigo-600/20 to-cyan-500/10'
            : 'bg-gradient-to-bl from-purple-300/30 via-indigo-200/35 to-sky-200/20'
        }`}
        style={{
          animationDelay: '3.5s',
          transform: `translate(${parallaxOffset.x * -0.35}px, ${parallaxOffset.y * 0.35}px)`
        }}
      />
      {/* Blob C */}
      <div
        className={`absolute bottom-10 left-1/3 w-[550px] h-[550px] rounded-full blur-3xl opacity-60 animate-blob-slow ${
          theme === 'dark'
            ? 'bg-gradient-to-tr from-emerald-600/20 via-cyan-500/20 to-transparent'
            : 'bg-gradient-to-tr from-cyan-200/40 via-sky-300/30 to-lavender-200/20'
        }`}
        style={{
          animationDelay: '7s',
          transform: `translate(${parallaxOffset.x * 0.3}px, ${parallaxOffset.y * -0.3}px)`
        }}
      />
    </div>
  );
};

/**
 * StageLightLayer - Rotating stage light beams from top corners (Layer 3 & 13)
 */
export const StageLightLayer = ({ theme, parallaxOffset }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Left Stage Beam */}
      <div
        className={`absolute -top-40 -left-20 w-[600px] h-[800px] origin-top-left pointer-events-none animate-beam-left ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-cyan-400/20 via-blue-500/10 to-transparent'
            : 'bg-gradient-to-b from-cyan-400/25 via-sky-300/15 to-transparent'
        } blur-2xl`}
        style={{
          transform: `translate(${parallaxOffset.x * 0.4}px, ${parallaxOffset.y * 0.2}px)`
        }}
      />
      {/* Top Right Stage Beam */}
      <div
        className={`absolute -top-40 -right-20 w-[600px] h-[800px] origin-top-right pointer-events-none animate-beam-right ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-purple-500/20 via-indigo-500/10 to-transparent'
            : 'bg-gradient-to-b from-purple-400/25 via-lavender-300/15 to-transparent'
        } blur-2xl`}
        style={{
          transform: `translate(${parallaxOffset.x * -0.4}px, ${parallaxOffset.y * 0.2}px)`
        }}
      />
    </div>
  );
};

/**
 * FlowingLinesLayer - Curved light trails & SVG data streams (Layer 4)
 */
export const FlowingLinesLayer = ({ theme }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-50">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M-100,180 Q400,60 900,320 T1900,120"
          fill="none"
          stroke={theme === 'dark' ? 'url(#darkFlowGrad1)' : 'url(#lightFlowGrad1)'}
          strokeWidth="2"
          strokeDasharray="10 8"
          className="animate-pulse"
        />
        <path
          d="M-100,520 Q600,640 1200,240 T2100,580"
          fill="none"
          stroke={theme === 'dark' ? 'url(#darkFlowGrad2)' : 'url(#lightFlowGrad2)'}
          strokeWidth="1.5"
          strokeDasharray="14 10"
        />
        <defs>
          <linearGradient id="lightFlowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="lightFlowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="darkFlowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="darkFlowGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

/**
 * ParticleLayer - Floating particles field rising & drifting (Layer 5)
 */
export const ParticleLayer = ({ theme }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        left: `${(i * 6.2) + 2}%`,
        top: `${(i * 5.8) + 15}%`,
        delay: `${i * 0.6}s`,
        duration: `${6 + (i % 4)}s`,
        size: `${Math.floor(Math.random() * 4) + 3}px`
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full animate-particle-rise shadow-sm ${
            theme === 'dark' ? 'bg-cyan-400/50 shadow-cyan-400/40' : 'bg-cyan-500/40 shadow-cyan-500/30'
          }`}
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration
          }}
        />
      ))}
    </div>
  );
};

/**
 * NetworkLayer - Organizer -> AI -> Stage -> Audience Network Nodes (Layer 6)
 */
export const NetworkLayer = ({ theme }) => {
  return (
    <div className="absolute top-1/4 inset-x-0 pointer-events-none z-0 opacity-40">
      <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
        {['ORGANIZER', 'AI ENGINE', 'STAGE HUD', 'AUDIENCE'].map((node, i) => (
          <div key={node} className="flex flex-col items-center gap-2">
            <div
              className={`w-3.5 h-3.5 rounded-full animate-node-pulse border ${
                theme === 'dark'
                  ? 'bg-cyan-400 border-cyan-300 text-cyan-400'
                  : 'bg-cyan-500 border-cyan-400 text-cyan-500'
              }`}
              style={{ animationDelay: `${i * 0.7}s` }}
            />
            <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--text-muted)] uppercase">
              {node}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * GridLayer - Dot/Grid Matrix Background (Layer 7)
 */
export const GridLayer = () => {
  return <div className="absolute inset-0 pointer-events-none stage-grid-bg z-0 opacity-80" />;
};

/**
 * WaveformLayer - Background Audio Waveform Equalizer (Layer 14)
 */
export const WaveformLayer = ({ theme }) => {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-0 opacity-30 flex items-end justify-center gap-1.5 h-12">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full animate-wave-bar ${
            theme === 'dark' ? 'bg-cyan-400' : 'bg-cyan-600'
          }`}
          style={{
            animationDelay: `${(i % 6) * 0.2}s`,
            animationDuration: `${0.8 + (i % 5) * 0.2}s`
          }}
        />
      ))}
    </div>
  );
};

/**
 * LightSweepLayer - Horizontal Light Illumination Sweep (Layer 8)
 */
export const LightSweepLayer = ({ theme }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className={`w-48 h-full opacity-30 animate-light-sweep ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent'
            : 'bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent'
        }`}
      />
    </div>
  );
};

/**
 * Main AnimatedEventBackground Container Component
 */
export const AnimatedEventBackground = ({ parallaxOffset = { x: 0, y: 0 } }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-500">
      <GridLayer />
      <AuroraLayer theme={theme} parallaxOffset={parallaxOffset} />
      <StageLightLayer theme={theme} parallaxOffset={parallaxOffset} />
      <FlowingLinesLayer theme={theme} />
      <ParticleLayer theme={theme} />
      <NetworkLayer theme={theme} />
      <WaveformLayer theme={theme} />
      <LightSweepLayer theme={theme} />
    </div>
  );
};

export default AnimatedEventBackground;
