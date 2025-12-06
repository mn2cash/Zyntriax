/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#020617',
        neon: '#4de3ff',
        zyn: '#8b5cf6'
      },
      boxShadow: {
        glass: '0 20px 60px rgba(0,0,0,0.45)'
      },
      backgroundImage: {
        noise: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)'
      }
    }
  },
  plugins: []
}
