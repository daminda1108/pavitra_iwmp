/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: '#800020',  /* UoP Maroon — primary */
          sage:   '#C5A649',  /* UoP Gold — secondary */
          amber:  '#A8882A',  /* UoP Gold dark — accents */
          cream:  '#F5EED6',  /* UoP light gold tint — backgrounds */
          bark:   '#4A0010',  /* UoP dark maroon — headings/text */
          moss:   '#5C0013',  /* UoP deep maroon — hover/sidebar */
        },
        surface: {
          card:   '#FFFFFF',
          border: '#E8E0CC',
          muted:  '#F0E8D0',
        },
        text: {
          primary: '#1C1C1C',
          muted:   '#6B7280',
          inverse: '#FFFFFF',
        },
        status: {
          open:      '#15803D',
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
