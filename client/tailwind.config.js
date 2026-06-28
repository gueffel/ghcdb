/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        bg2: '#161b27',
        bg3: '#1e2535',
        bg4: '#252d40',
        border: '#2a3350',
        text: {
          DEFAULT: '#e2e8f0',
          muted: '#7a88a8',
          dim: '#4a5568',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          end: '#6366f1',
        },
        brand: {
          green: '#22c55e',
          red: '#ef4444',
          orange: '#f97316',
          purple: '#a855f7',
          gold: '#eab308',
        },
      },
      borderRadius: {
        app: '8px',
        'app-lg': '12px',
      },
      height: {
        nav: '56px',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
