// ============================================================
// Design System — Theme Constants
// Premium dark mode with gradient accents
// ============================================================

export const COLORS = {
  // ── Base ────────────────────────────────────────────────
  background: '#0a0a1a',
  surface: '#12122a',
  surfaceElevated: '#1a1a3e',
  surfaceGlass: 'rgba(26, 26, 62, 0.7)',

  // ── Text ────────────────────────────────────────────────
  textPrimary: '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted: '#555577',

  // ── Accent ──────────────────────────────────────────────
  primary: '#6366f1',       // Indigo
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',

  secondary: '#a78bfa',     // Purple
  accent: '#60a5fa',        // Blue
  accentCyan: '#22d3ee',    // Cyan

  // ── Status ──────────────────────────────────────────────
  success: '#34d399',
  successDark: '#059669',
  warning: '#fbbf24',
  warningDark: '#d97706',
  error: '#f87171',
  errorDark: '#dc2626',
  info: '#60a5fa',

  // ── Severity / Urgency ────────────────────────────────
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',

  // ── Borders ─────────────────────────────────────────────
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderAccent: 'rgba(99, 102, 241, 0.3)',

  // ── Overlays ────────────────────────────────────────────
  overlay: 'rgba(0, 0, 0, 0.5)',
  glassBg: 'rgba(18, 18, 42, 0.85)',
} as const;

export const GRADIENTS = {
  primary: ['#6366f1', '#8b5cf6', '#a78bfa'],
  accent: ['#60a5fa', '#818cf8', '#a78bfa'],
  warm: ['#f97316', '#ef4444', '#ec4899'],
  success: ['#34d399', '#22d3ee'],
  dark: ['#0a0a1a', '#12122a', '#1a1a3e'],
  card: ['rgba(26, 26, 62, 0.9)', 'rgba(18, 18, 42, 0.7)'],
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

// ── Utility: Get urgency/severity color ─────────────────
export function getUrgencyColor(level: string): string {
  switch (level) {
    case 'critical': return COLORS.critical;
    case 'high': return COLORS.high;
    case 'medium': return COLORS.medium;
    case 'low': return COLORS.low;
    default: return COLORS.textSecondary;
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'waiting': return '⏳';
    case 'running': return '🔄';
    case 'done': return '✅';
    case 'error': return '❌';
    default: return '⏳';
  }
}
