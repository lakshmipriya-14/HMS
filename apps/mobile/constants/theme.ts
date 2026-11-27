export const UyirinaiTheme = {
  colors: {
    // Purple & Lilac Palette (from User Specification)
    // #EAB8E4 (Light Lilac) | #D6A2D5 (Soft Lavender) | #B57BC4 (Medium Violet) | #8E5DAF (Vibrant Purple) | #5B3F8D (Deep Royal Purple)
    primary: '#8E5DAF',          // Vibrant Purple: main brand, primary actions, active indicators
    primaryDark: '#5B3F8D',      // Deep Royal Purple: headers, high-contrast actions, titles
    primaryMedium: '#B57BC4',    // Medium Violet: chips, secondary active states
    softLilac: '#F6ECF7',        // Very soft lilac for card backgrounds
    lightLilac: '#EAB8E4',       // Light lilac accent
    lavender: '#D6A2D5',         // Soft lavender badge/highlight
    white: '#FFFFFF',            // Pure white: clean cards, backgrounds, text-on-purple

    // Backward-compatibility aliases for green tokens
    softGreen: '#F6ECF7',        // Aliased to soft lilac for theme consistency
    lightGreen: '#EAB8E4',       // Aliased to light lilac for theme consistency
    softGreenCard: '#F6ECF7',

    // Background colors
    background: '#FFFFFF',          // Main background
    backgroundSecondary: '#F8F2F9', // Secondary page background (subtle lilac tint)
    cardBackground: '#FFFFFF',      // Card background
    cardBackgroundSoft: '#F6ECF7',  // Soft lilac card background

    // Text colors (Engineered for optimal WCAG contrast)
    textPrimary: '#251838',         // Deep purple-black: crisp, high contrast primary text
    textSecondary: '#5F4D73',       // Refined deep purple: clear secondary descriptions
    textMuted: '#8B799E',           // Gentle purple-grey: subtle metadata
    textOnPrimary: '#FFFFFF',       // Crisp white text on primary purple

    // Borders & dividers
    border: '#EADCEE',              // Default soft purple-tinted border
    borderLight: '#F3E9F6',         // Light divider
    borderDefault: '#EADCEE',

    // Semantic helpers
    warning: '#D69A32',
    warningBg: '#FEF9EE',
    secondaryBackground: '#F8F2F9',

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
