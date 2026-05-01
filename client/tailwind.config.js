/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "secondary-fixed-dim": "#cebdff",
        "surface-container": "#2a1d16",
        "primary-container": "#ff7300",
        "tertiary": "#96ccff",
        "error": "#ffb4ab",
        "outline": "#a88b7c",
        "on-tertiary": "#003353",
        "on-secondary-container": "#bea8ff",
        "surface-container-low": "#261912",
        "on-surface": "#f7ddd2",
        "on-tertiary-container": "#003759",
        "primary-fixed-dim": "#ffb68f",
        "on-tertiary-fixed": "#001d32",
        "background": "#1d110a",
        "surface-container-high": "#352720",
        "on-background": "#f7ddd2",
        "on-primary": "#542100",
        "tertiary-fixed": "#cee5ff",
        "primary-fixed": "#ffdbca",
        "surface": "#1d110a",
        "tertiary-fixed-dim": "#96ccff",
        "outline-variant": "#594236",
        "on-secondary": "#381385",
        "secondary-container": "#4f319c",
        "secondary": "#cebdff",
        "inverse-primary": "#9d4400",
        "surface-dim": "#1d110a",
        "surface-container-lowest": "#170b06",
        "surface-container-highest": "#41312a",
        "secondary-fixed": "#e8ddff",
        "on-primary-container": "#5a2400",
        "surface-tint": "#ffb68f",
        "on-secondary-fixed-variant": "#4f319c",
        "primary": "#ffb68f",
        "on-primary-fixed-variant": "#773200",
        "on-secondary-fixed": "#21005e",
        "tertiary-container": "#00a4fb",
        "on-error": "#690005",
        "on-surface-variant": "#e1c0b0",
        "inverse-surface": "#f7ddd2",
        "inverse-on-surface": "#3c2d26",
        "error-container": "#93000a",
        "on-primary-fixed": "#331100",
        "on-tertiary-fixed-variant": "#004a75",
        "surface-variant": "#41312a",
        "on-error-container": "#ffdad6",
        "surface-bright": "#45362e"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "lg": "24px",
        "2xl": "48px",
        "xl": "32px",
        "margin": "32px",
        "unit": "4px",
        "xs": "4px",
        "gutter": "24px",
        "3xl": "64px",
        "sm": "8px",
        "md": "16px"
      },
      fontFamily: {
        "mono-data": ["Space Grotesk", "monospace"],
        "h2": ["Manrope", "sans-serif"],
        "label-caps": ["Space Grotesk", "monospace"],
        "body-md": ["Manrope", "sans-serif"],
        "code-sm": ["Space Grotesk", "monospace"],
        "h3": ["Manrope", "sans-serif"],
        "h1": ["Manrope", "sans-serif"],
        "body-sm": ["Manrope", "sans-serif"],
        "body-lg": ["Manrope", "sans-serif"]
      },
      fontSize: {
        "mono-data": ["13px", {"lineHeight": "1.4", "fontWeight": "400"}],
        "h2": ["32px", {"lineHeight": "1.3", "fontWeight": "600"}],
        "label-caps": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "code-sm": ["12px", {"lineHeight": "1.4", "fontWeight": "500"}],
        "h3": ["24px", {"lineHeight": "1.4", "fontWeight": "600"}],
        "h1": ["40px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
}
