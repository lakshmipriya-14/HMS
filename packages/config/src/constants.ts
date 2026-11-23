export const HOSPITAL_METADATA = {
  NAME: 'Kizuna Multispeciality Hospital',
  TAMIL_NAME: 'கிஜுனா பன்னோக்கு மருத்துவமனை',
  TAGLINE: 'Excellence in Care, Compassion in Healing',
  MAIN_CAMPUS: {
    NAME: 'Kizuna Apex Medical Center',
    CITY: 'Madurai / Chennai',
    STATE: 'Tamil Nadu',
    COUNTRY: 'India',
    PHONE: '+91 44 2490 8000',
    EMERGENCY: '+91 44 2490 8911',
    AMBULANCE: '108 / +91 44 2490 8108',
    EMAIL: 'info@kizunahospital.com',
  },
  PREFIXES: {
    UHID: 'KZN',
    APPOINTMENT: 'APT',
    INVOICE: 'INV',
    PRESCRIPTION: 'RX',
    LAB_ORDER: 'LAB',
    RADIOLOGY_ORDER: 'RAD',
    ADMISSION: 'ADM',
    AMBULANCE_TRIP: 'AMB',
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  TOKEN_EXPIRY: {
    ACCESS_TOKEN_MINUTES: 15,
    REFRESH_TOKEN_DAYS: 7,
  },
} as const;
