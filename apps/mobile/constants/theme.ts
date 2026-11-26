export const UyirinaiTheme = {
  colors: {
    // Primary green palette
    primary: '#38845A',          // Primary green: main brand, active states, key CTAs
    primaryDark: '#287348',      // Dark green: header accents, high-contrast actions
    softGreen: '#EAF5ED',        // Soft green: summary cards, active card backgrounds
    lightGreen: '#CDE8D5',       // Light green: subtle highlights, badge backgrounds
    white: '#FFFFFF',            // White: clean cards, backgrounds, text-on-green

    // Background colors
    background: '#FFFFFF',       // Main background
    backgroundSecondary: '#F3F7F4', // Secondary background
    cardBackground: '#FFFFFF',   // Card background
    cardBackgroundSoft: '#EAF5ED', // Soft green card background

    // Text colors
    textPrimary: '#26352C',      // Primary text
    textSecondary: '#6B7A70',    // Secondary text
    textMuted: '#96A39A',        // Muted text
    textOnPrimary: '#FFFFFF',    // Text on primary green

    // Borders & dividers
    border: '#DDE8E0',           // Default border
    borderLight: '#EAF0EC',      // Light divider
    borderDefault: '#DDE8E0',

    // Semantic helpers
    warning: '#D69A32',
    warningBg: '#FEF9EE',
    secondaryBackground: '#F3F7F4',
    softGreenCard: '#EAF5ED',

    // Status colors (restrained semantic colors)
    success: '#38845A',          // Success status
    successBg: '#EAF5ED',
    pending: '#D69A32',          // Pending status
    pendingBg: '#FEF9EE',
    error: '#D9534F',            // Error / urgent status
    errorBg: '#FDF2F2',
    info: '#4385B5',             // Information status
    infoBg: '#EDF5FA',
    neutral: '#819087',          // Neutral status
    neutralBg: '#F2F5F3',

    // Backward-compatibility aliases so existing references resolve cleanly
    primaryLight: '#CDE8D5',
    black: '#26352C',
    lightGrey: '#F3F7F4',
    borderGrey: '#DDE8E0',
    mutedText: '#6B7A70',
    accentGreen: '#38845A',
    accentGreenBg: '#EAF5ED',
    accentRed: '#D9534F',
    accentRedBg: '#FDF2F2',
    accentBlue: '#4385B5',
    accentBlueBg: '#EDF5FA',
    accentAmber: '#D69A32',
    accentAmberBg: '#FEF9EE',
    cardShadow: 'rgba(38, 53, 44, 0.05)',
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
      shadowColor: '#26352C',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#26352C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
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
