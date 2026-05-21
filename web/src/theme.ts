import { createTheme } from "@mantine/core";

export const appTheme = createTheme({
  primaryColor: "accent",
  defaultRadius: "md",
  fontFamily:
    '"Geist", "SF Pro Display", "Helvetica Neue", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontFamilyMonospace:
    '"Geist Mono", "SF Mono", "JetBrains Mono", ui-monospace, monospace',
  headings: {
    fontFamily:
      '"Newsreader", "Lyon Text", "Instrument Serif", Georgia, serif',
    fontWeight: "600",
    textWrap: "pretty",
    sizes: {
      h1: { fontSize: "3rem", lineHeight: "1.05", fontWeight: "600" },
      h2: { fontSize: "2.25rem", lineHeight: "1.15", fontWeight: "600" },
      h3: { fontSize: "1.5rem", lineHeight: "1.25", fontWeight: "600" },
      h4: { fontSize: "1.25rem", lineHeight: "1.35", fontWeight: "600" },
      h5: { fontSize: "1.125rem", lineHeight: "1.4", fontWeight: "600" },
      h6: { fontSize: "1rem", lineHeight: "1.5", fontWeight: "600" },
    },
  },
  colors: {
    accent: [
      "#fff9e6",
      "#fff3cc",
      "#ffe999",
      "#f5d970",
      "#e5bd4b",
      "#d9ad38",
      "#c99527",
      "#b07e1a",
      "#8c6315",
      "#6b4a0e",
    ],
  },
  shadows: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.03)",
    sm: "0 2px 8px rgba(0, 0, 0, 0.04)",
    md: "0 4px 16px rgba(0, 0, 0, 0.05)",
    lg: "0 8px 24px rgba(0, 0, 0, 0.06)",
    xl: "0 12px 40px rgba(0, 0, 0, 0.08)",
  },
  respectReducedMotion: true,
  components: {
    Button: {
      defaultProps: {
        radius: "md",
      },
      styles: {
        root: {
          fontWeight: 700,
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Textarea: {
      defaultProps: {
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "xl",
        p: "xl",
      },
    },
    Card: {
      defaultProps: {
        radius: "xl",
        p: "xl",
      },
    },
    Badge: {
      defaultProps: {
        radius: "xl",
        size: "sm",
        tt: "uppercase",
      },
      styles: {
        root: {
          fontWeight: 600,
          letterSpacing: "0.18em",
          fontSize: "11px",
          padding: "4px 12px",
        },
      },
    },
  },
});
