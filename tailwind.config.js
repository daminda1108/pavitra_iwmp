/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#3D6B4F',
          sage:   '#7A9E7E',
          amber:  '#C4882A',
          cream:  '#F7F4EE',
          bark:   '#5C4A32',
          moss:   '#2C4A35',
        },
        surface: {
          card:   '#FFFFFF',
          border: '#E5E0D8',
          muted:  '#F0EDE6',
        },
        text: {
          primary: '#1C1C1C',
          muted:   '#6B7280',
          inverse: '#FFFFFF',
        },
        status: {
          open:      '#3D6B4F',
          claimed:   '#C4882A',
          confirmed: '#2563EB',
          completed: '#6B7280',
          cancelled: '#C0392B',
          pending:   '#D97706',
          bidding:   '#7C3AED',
          expired:   '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
