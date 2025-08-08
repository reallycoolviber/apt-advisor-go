import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				/* ==================== GLOBAL APP COLORS ==================== */
				
				/* Primärfärg med varianter */
				'app-primary': 'hsl(var(--app-primary))',
				'app-primary-light': 'hsl(var(--app-primary-light))',
				'app-primary-dark': 'hsl(var(--app-primary-dark))',
				
				/* Accentfärg med varianter */
				'app-accent': 'hsl(var(--app-accent))',
				'app-accent-light': 'hsl(var(--app-accent-light))',
				'app-accent-dark': 'hsl(var(--app-accent-dark))',
				
				/* Bakgrundsfärger */
				'app-background-primary': 'hsl(var(--app-background-primary))',
				'app-background-secondary': 'hsl(var(--app-background-secondary))',
				
				/* Textfärg */
				'app-text-primary': 'hsl(var(--app-text-primary))',
				
				/* Semantiska trafikljusfärger */
				'semantic-good': 'hsl(var(--semantic-good))',
				'semantic-average': 'hsl(var(--semantic-average))',
				'semantic-bad': 'hsl(var(--semantic-bad))',
				
				/* ==================== SHADCN SYSTEM COLORS ==================== */
				
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				'address-field': {
					DEFAULT: 'hsl(var(--address-field))',
					foreground: 'hsl(var(--address-field-foreground))'
				},
				hover: {
					DEFAULT: 'hsl(var(--hover))',
					foreground: 'hsl(var(--hover-foreground))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
