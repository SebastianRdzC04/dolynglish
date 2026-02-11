/**
 * Paleta de colores de Dolynglish
 * Tema oscuro inspirado en las mascotas
 */

export const Colors = {
  // Fondos
  background: {
    primary: "#1F1F1F",
    secondary: "#2A2A2A",
  },

  // Textos
  text: {
    primary: "#F5F5F5",
    secondary: "#6B6B6B",
    muted: "#9A9A9A",
  },

  // Acentos (Naranja)
  accent: {
    primary: "#F4A261",
    strong: "#E76F51",
  },

  // Grises
  gray: {
    pepper: "#6B6B6B",
    light: "#9A9A9A",
    dark: "#3A3A3A",
  },

  // Estados
  status: {
    error: "#E74C3C",
    success: "#2ECC71",
    warning: "#F4A261",
  },

  // Bordes
  border: {
    light: "#3A3A3A",
    focus: "#F4A261",
  },
} as const;
