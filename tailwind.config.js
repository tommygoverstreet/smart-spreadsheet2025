module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
    './src/**/*.{vue,svelte}'
  ],
  darkMode: 'class', // Enable dark mode via class
  theme: {
    extend: {
      colors: {
        // Custom color palette for the application
        primary: {
          50: '#f0f7ff',
          100: '#e0f0fe',
          200: '#b9e1fe',
          300: '#7cc8fd',
          400: '#36acfa',
          500: '#0c8ce9',
          600: '#0070c7',
          700: '#0159a1',
          800: '#064c85',
          900: '#0a406e',
          950: '#072848'
        },
        secondary: {
          50: '#f8f7ff',
          100: '#f2f1fe',
          200: '#e7e5fd',
          300: '#d1ccfb',
          400: '#b5a9f7',
          500: '#9b82f1',
          600: '#8b5ae8',
          700: '#7c48d4',
          800: '#6a3cb2',
          900: '#573492',
          950: '#351f63'
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        },
        surface: {
          0: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // Dark theme colors
        dark: {
          'bg-primary': '#0a0e27',
          'bg-secondary': '#1a1f3a',
          'bg-tertiary': '#252b4a',
          'surface': '#2d3347',
          'border': '#3d4465',
          'text-primary': '#e2e8f0',
          'text-secondary': '#94a3b8',
          'text-tertiary': '#64748b'
        }
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }]
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },

      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
        'strong': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'dark-soft': '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        'dark-medium': '0 4px 16px 0 rgba(0, 0, 0, 0.4)',
        'dark-strong': '0 8px 32px 0 rgba(0, 0, 0, 0.6)',
        // 3D effect shadows
        '3d': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
        '3d-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.08), 0 20px 25px -5px rgba(0, 0, 0, 0.12)',
        '3d-dark': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 8px 16px -4px rgba(0, 0, 0, 0.4)',
        '3d-dark-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      },

      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },

      backdropBlur: {
        'xs': '2px'
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite alternate'
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        skeleton: {
          '0%': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
          '100%': { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
        }
      },

      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },

      screens: {
        'xs': '475px',
        '3xl': '1600px'
      }
    }
  },

  plugins: [
    // Add custom utilities for the app
    function ({ addUtilities, addComponents, theme }) {
      // 3D card utilities
      addUtilities({
        '.card-3d': {
          boxShadow: theme('boxShadow.3d'),
          transform: 'translateY(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: theme('boxShadow.3d-hover'),
            transform: 'translateY(-2px)'
          }
        },
        '.card-3d-dark': {
          '.dark &': {
            boxShadow: theme('boxShadow.3d-dark'),
            '&:hover': {
              boxShadow: theme('boxShadow.3d-dark-hover')
            }
          }
        },

        // Performance utilities
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        },

        // Loading utilities
        '.loading-skeleton': {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '0',
            right: '0',
            bottom: '0',
            left: '0',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            animation: 'shimmer 1.5s infinite'
          }
        }
      });

      // Custom components
      addComponents({
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: theme('colors.white'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.medium'),
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: theme('colors.primary.700'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.medium')
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: theme('boxShadow.soft')
          }
        },

        '.input-primary': {
          borderColor: theme('colors.surface.300'),
          borderRadius: theme('borderRadius.lg'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm[0]'),
          transition: 'all 0.2s',
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.500')}20`
          }
        }
      });
    }
  ]
};