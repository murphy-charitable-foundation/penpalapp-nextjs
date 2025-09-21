/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // responsive breakpoints
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    // make Tailwind `container` full-bleed & centered with sensible padding
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '1.25rem',
        lg: '1.5rem',
      },
    },

    extend: {
      colors: {
        primary: '#034792',
        brightBlue: '#2563EB',
        lightBlue: '#E6F0FA',
        murphyGreen: { DEFAULT: '#4E802A', dark: '#166534', light: '#6FBF3D' },
        murphyGray: { DEFAULT: '#4B5563', dark: '#1F2937', light: '#F3F4F6' },
        'dark-green': '#4E802A',
        blue: { 100: '#E6F0FA', 300: '#60A5FA', 500: '#034792', 600: '#2563EB' },
        gray: { 100: '#F9FAFB', 300: '#D1D5DB', 600: '#4B5563', 900: '#1F2937' },
      },
      borderRadius: {
        card: '1rem',
        button: '9999px',
      },
      fontSize: {
        heading: ['1.5rem', { fontWeight: '700' }],
        subheading: ['1.25rem', { fontWeight: '600' }],
        body: ['1rem', { fontWeight: '400' }],
        caption: ['0.875rem', { fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}
