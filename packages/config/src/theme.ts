export const HEALTHCARE_THEME = {
  colors: {
    primary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      500: '#0F766E', // Deep Clinical Teal
      600: '#0D9488',
      700: '#115E59',
      800: '#134E4A',
    },
    secondary: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      500: '#0284C7', // Clinical Cerulean Blue
      600: '#0369A1',
      700: '#075985',
    },
    accent: {
      teal: '#14B8A6',
      emerald: '#10B981',
      cyan: '#06B6D4',
      blue: '#2563EB',
    },
    status: {
      success: {
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
      },
      warning: {
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FDE68A',
      },
      danger: {
        bg: '#FEF2F2',
        text: '#991B1B',
        border: '#FECACA',
      },
      info: {
        bg: '#F0F9FF',
        text: '#075985',
        border: '#BAE6FD',
      },
      neutral: {
        bg: '#F8FAFC',
        text: '#475569',
        border: '#E2E8F0',
      },
    },
  },
} as const;
