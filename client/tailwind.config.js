/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(94, 234, 212, 0.25), 0 0 40px rgba(34, 211, 238, 0.16)',
      },
      backgroundImage: {
        'hero-grid':
          'radial-gradient(circle at top left, rgba(34,211,238,0.18), transparent 30%), radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 25%), linear-gradient(180deg, rgba(3,7,18,0.92), rgba(3,7,18,1))',
      },
    },
  },
  plugins: [],
};
