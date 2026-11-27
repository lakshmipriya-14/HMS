import { HMS_COLORS } from '@multispeciality-hms/config';

export const UyirinaiTheme = {
  colors: {
    // Centralized Healthcare Palette: Medical Blue + Teal + White
    primary: HMS_COLORS.primary,                 // #1565C0 Medical Blue
    primaryDark: HMS_COLORS.heading,             // #183153 Dark Navy
    primaryHover: HMS_COLORS.primaryHover,       // #0D47A1 Deep Medical Blue
    primaryBorder: HMS_COLORS.primaryBorder,     // #BFDBFE Soft Blue Border
    primaryMedium: HMS_COLORS.secondary,         // #00897B Teal
    secondary: HMS_COLORS.secondary,             // #00897B Teal
    secondaryDark: HMS_COLORS.secondaryHover,    // #00695C Deep Teal
    secondaryBg: HMS_COLORS.secondarySoft,       // #E0F2F1 Soft Teal
    secondaryBorder: HMS_COLORS.secondaryBorder, // #B2DFDB Soft Teal Border

    // Surface & Container Hierarchy
    background: HMS_COLORS.background,           // #F8FAFC Soft White
    backgroundSecondary: HMS_COLORS.background,  // #F8FAFC Soft White
    secondaryBackground: HMS_COLORS.surfaceMuted,// #F1F5F9 Subtle Slate Surface
    surface: HMS_COLORS.surface,                 // #FFFFFF White
    cardBackground: HMS_COLORS.surface,          // #FFFFFF White
    cardBackgroundSoft: HMS_COLORS.primarySoft,  // #E8F1FC Soft Medical Blue
    white: HMS_COLORS.white,                     // #FFFFFF White

    // Typography Tokens
    heading: HMS_COLORS.heading,                 // #183153 Dark Navy
    bodyText: HMS_COLORS.body,                   // #475569 Slate
    textPrimary: HMS_COLORS.heading,             // #183153 Dark Navy
    textSecondary: HMS_COLORS.body,              // #475569 Slate
    textMuted: HMS_COLORS.muted,                 // #64748B Muted Slate
    textOnPrimary: HMS_COLORS.onPrimary,         // #FFFFFF White
    textOnSecondary: HMS_COLORS.onSecondary,     // #FFFFFF White

    // Navigation & Interactive States
    activeNav: HMS_COLORS.activeNav,             // #1565C0 Medical Blue
    inactiveNav: HMS_COLORS.inactiveNav,         // #64748B Slate
    activeIndicator: HMS_COLORS.activeIndicator, // #00897B Teal
    focus: HMS_COLORS.focus,                     // #1565C0 Medical Blue
    disabled: HMS_COLORS.disabled,               // #E2E8F0
    disabledText: HMS_COLORS.disabledText,       // #94A3B8

    // Borders & Dividers
    border: HMS_COLORS.border,                   // #E2E8F0
    borderLight: HMS_COLORS.borderLight,         // #EEF2F6
    borderDefault: HMS_COLORS.border,            // #E2E8F0
    borderFocus: HMS_COLORS.focus,               // #1565C0

    // Semantic Status Colors
    success: HMS_COLORS.success,                 // #16A34A Green
    successBg: HMS_COLORS.successBg,             // #DCFCE7
    successBorder: HMS_COLORS.successBorder,     // #BBF7D0
    warning: HMS_COLORS.warning,                 // #F59E0B Amber
    warningBg: HMS_COLORS.warningBg,             // #FEF3C7
    warningBorder: HMS_COLORS.warningBorder,     // #FDE68A
    pending: HMS_COLORS.warning,                 // #F59E0B Amber
    pendingBg: HMS_COLORS.warningBg,             // #FEF3C7
    error: HMS_COLORS.error,                     // #DC2626 Red
    errorBg: HMS_COLORS.errorBg,                 // #FEE2E2
    errorBorder: HMS_COLORS.errorBorder,         // #FECACA
    info: HMS_COLORS.info,                       // #1565C0 Medical Blue
    infoBg: HMS_COLORS.infoBg,                   // #E8F1FC
    infoBorder: HMS_COLORS.infoBorder,           // #BFDBFE
    neutral: HMS_COLORS.muted,                   // #64748B
    neutralBg: HMS_COLORS.surfaceMuted,          // #F1F5F9

    // Backward-compatibility aliases mapped strictly to Medical Blue + Teal + Slate
    softLilac: HMS_COLORS.primarySoft,
    lightLilac: HMS_COLORS.primaryBorder,
    lavender: HMS_COLORS.secondaryBorder,
    softGreen: HMS_COLORS.secondarySoft,
    lightGreen: HMS_COLORS.secondaryBorder,
    softGreenCard: HMS_COLORS.primarySoft,
    primaryLight: HMS_COLORS.primarySoft,
    black: HMS_COLORS.heading,
    lightGrey: HMS_COLORS.surfaceMuted,
    borderGrey: HMS_COLORS.border,
    mutedText: HMS_COLORS.muted,
    accentGreen: HMS_COLORS.success,
    accentGreenBg: HMS_COLORS.successBg,
    accentRed: HMS_COLORS.error,
    accentRedBg: HMS_COLORS.errorBg,
    accentBlue: HMS_COLORS.primary,
    accentBlueBg: HMS_COLORS.primarySoft,
    accentTeal: HMS_COLORS.secondary,
    accentTealBg: HMS_COLORS.secondarySoft,
    accentAmber: HMS_COLORS.warning,
    accentAmberBg: HMS_COLORS.warningBg,
    cardShadow: 'rgba(24, 49, 83, 0.06)',
  },
  typography: {
    hospitalName: 'UYIRINAI MULTISPECIALITY HOSPITAL',
    headline: 'Compassionate Care. Advanced Treatment. Better Lives.',
    quote: 'Every life matters. Every patient deserves compassionate care.',
    fontSizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      display: 30,
    },
    fontWeights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  shadows: {
    subtle: {
      shadowColor: '#183153',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#183153',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  },
  iconSizes: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 26,
    xl: 32,
  },
};

export type Theme = typeof UyirinaiTheme;
