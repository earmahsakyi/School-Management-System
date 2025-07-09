module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        accent: "#2ecc71",
        moon: "#D0D8C3",
        kaitoke: "#014421",
        // Add colors for alerts
        'danger': {
          100: '#fee2e2', // Light red background for alert-danger
          700: '#b91c1c', // Dark red text for alert-danger
        },
        'light': {
          100: '#f3f4f6', // Light gray background for alert-light
          700: '#1f2937', // Dark gray text for alert-light
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
    'neuro-light': '8px 8px 24px #e3e8f0, -8px -8px 24px #ffffff',
    'neuro-dark': '8px 8px 24px #0f172a, -8px -8px 24px #334155',
  },
    },
  },
  plugins: [
    // Add custom utilities for alert classes
    function ({ addUtilities }) {
      const newUtilities = {
        '.alert': {
          padding: '1rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
        },
        '.alert-danger': {
          backgroundColor: '#fee2e2', // danger.100
          color: '#b91c1c', // danger.700
        },
        '.alert-light': {
          backgroundColor: '#f3f4f6', // light.100
          color: '#1f2937', // light.700
        },
      };
      addUtilities(newUtilities, ['responsive']);
    },
  ],
  corePlugins: {
    preflight: false, // Keep your existing setting
  },
};