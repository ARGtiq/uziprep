/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--m3-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--m3-on-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--m3-primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--m3-on-primary-container) / <alpha-value>)',
        'secondary-container': 'rgb(var(--m3-secondary-container) / <alpha-value>)',
        'on-secondary-container': 'rgb(var(--m3-on-secondary-container) / <alpha-value>)',
        surface: 'rgb(var(--m3-surface) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--m3-surface-container-low) / <alpha-value>)',
        'surface-container': 'rgb(var(--m3-surface-container) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--m3-surface-container-high) / <alpha-value>)',
        'on-surface': 'rgb(var(--m3-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--m3-on-surface-variant) / <alpha-value>)',
        outline: 'rgb(var(--m3-outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--m3-outline-variant) / <alpha-value>)',
        error: 'rgb(var(--m3-error) / <alpha-value>)',
      },
      borderRadius: {
        'm3-sm': '10px',
        'm3-md': '14px',
        'm3-lg': '20px',
      },
    },
  },
  plugins: [],
};
