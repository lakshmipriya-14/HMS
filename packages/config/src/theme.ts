/**
 * Centralized Healthcare Design System Tokens (Medical Blue + Teal + White).
 * Shared across mobile (`UyirinaiTheme`) and web (`tailwind.config.js` / CSS variables).
 */
export const HMS_COLORS = {
  // Core Brand Colors
  primary: '#1565C0',          // Medical Blue
  primaryHover: '#0D47A1',     // Pressed / hover Medical Blue
  primarySoft: '#E8F1FC',      // Soft Medical Blue tint for subtle badges/surfaces
  primaryBorder: '#BFDBFE',    // Soft Medical Blue border

  secondary: '#00897B',        // Teal
  secondaryHover: '#00695C',   // Pressed / deep Teal
  secondarySoft: '#E0F2F1',    // Soft Teal tint for secondary surfaces
  secondaryBorder: '#B2DFDB',  // Soft Teal border

  // Neutrals & Surfaces
  background: '#F8FAFC',       // Soft White (main page background)
  surface: '#FFFFFF',          // White (cards, forms, modals, containers)
  surfaceMuted: '#F1F5F9',     // Subtle muted container / table header background

  // Typography
  heading: '#183153',          // Dark Navy (page titles & important headings)
  body: '#475569',             // Slate (body text, descriptions, labels)
  muted: '#64748B',            // Muted Slate (metadata, placeholders, inactive nav)
  onPrimary: '#FFFFFF',        // Text/icons on primary/secondary fills
  onSecondary: '#FFFFFF',

  // Borders & States
  border: '#E2E8F0',
  borderLight: '#EEF2F6',
  focus: '#1565C0',
  disabled: '#E2E8F0',
  disabledText: '#94A3B8',

  // Navigation States
  activeNav: '#1565C0',
  inactiveNav: '#64748B',
  activeIndicator: '#00897B',

  // Semantic Status Colors
  success: '#16A34A',
  successBg: '#DCFCE7',
  successBorder: '#BBF7D0',

  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningBorder: '#FDE68A',

  error: '#DC2626',
  errorBg: '#FEE2E2',
  errorBorder: '#FECACA',

  info: '#1565C0',
  infoBg: '#E8F1FC',
  infoBorder: '#BFDBFE',

  white: '#FFFFFF',
} as const;

export const HEALTHCARE_THEME = {
  colors: {
    primary: {
      50: HMS_COLORS.primarySoft,
      100: HMS_COLORS.primaryBorder,
      500: HMS_COLORS.primary,
      600: HMS_COLORS.primaryHover,
      700: HMS_COLORS.heading,
      800: HMS_COLORS.heading,
    },
    secondary: {
      50: HMS_COLORS.secondarySoft,
      100: HMS_COLORS.secondaryBorder,
      500: HMS_COLORS.secondary,
      600: HMS_COLORS.secondaryHover,
      700: HMS_COLORS.heading,
    },
    accent: {
      teal: HMS_COLORS.secondary,
      emerald: HMS_COLORS.success,
      cyan: HMS_COLORS.secondary,
      blue: HMS_COLORS.primary,
    },
    status: {
      success: {
        bg: HMS_COLORS.successBg,
        text: HMS_COLORS.success,
        border: HMS_COLORS.successBorder,
      },
      warning: {
        bg: HMS_COLORS.warningBg,
        text: HMS_COLORS.warning,
        border: HMS_COLORS.warningBorder,
      },
      danger: {
        bg: HMS_COLORS.errorBg,
        text: HMS_COLORS.error,
        border: HMS_COLORS.errorBorder,
      },
      info: {
        bg: HMS_COLORS.infoBg,
        text: HMS_COLORS.info,
        border: HMS_COLORS.infoBorder,
      },
      neutral: {
        bg: HMS_COLORS.background,
        text: HMS_COLORS.body,
        border: HMS_COLORS.border,
      },
    },
  },
} as const;
