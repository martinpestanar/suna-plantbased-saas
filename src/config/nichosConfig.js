// Configuración del Sistema de Nichos, Presets y Temas para Suna SaaS 2026

export const NICHOS_CONFIG = {
  cafeteria: {
    id: 'cafeteria',
    nombre: '☕ Cafetería & Bakery',
    badge: 'Warm Artisan',
    descripcion: 'Diseño cálido y contemporáneo para cafés de especialidad, postres y panaderías.',
    terminos: {
      items: 'Bebidas & Antojos',
      item_singular: 'Bebida/Postre',
      staff_cocina: 'Barista',
      carta: 'Carta de Especialidad',
      horario_nota: 'Enfocado en Mañanas y Tardes',
    },
    paletaRecomendada: {
      primary: '#059669',        // Tech Emerald
      primaryDk: '#047857',      // Emerald Oscuro
      secondary: '#10B981',      // Emerald Mint
      bg: '#F8FAFC',             // Slate 50
      surface: '#FFFFFF',        // Blanco Puro
      surface2: '#F1F5F9',       // Slate 100
      surface3: '#E2E8F0',       // Borde Slate
      text: '#0F172A',           // Slate 900
      textMuted: '#64748B',      // Slate 500
      accent: '#ECFDF5',         // Emerald Glow
      sidebarBg: '#FFFFFF',      // Sidebar Clean
      sidebarText: '#0F172A',
      mode: 'light',
      cardRadius: '14px',
    }
  },
  restobar: {
    id: 'restobar',
    nombre: '🍸 Restobar & Coctelería',
    badge: 'Obsidian Glow',
    descripcion: 'Modo oscuro sofisticado para bares, gastro-pubs y coctelería de autor.',
    terminos: {
      items: 'Tragos & Tapas',
      item_singular: 'Trago/Cóctel',
      staff_cocina: 'Bartender',
      carta: 'Bar Menu & Coctelería',
      horario_nota: 'Enfocado en Noches',
    },
    paletaRecomendada: {
      primary: '#8B5CF6',        // Violeta Eléctrico
      primaryDk: '#7C3AED',
      secondary: '#EC4899',      // Magenta Nocturno
      bg: '#0B0F17',             // Obsidian Profundo
      surface: '#111827',        // Slate Oscuro
      surface2: '#161F30',       // Superficie 2
      surface3: '#1F2937',       // Borde Oscuro Sutil
      text: '#F8FAFC',           // Blanco Slate
      textMuted: '#94A3B8',      // Slate Muted
      accent: '#312E81',         // Glow Violeta
      sidebarBg: '#0B0F17',
      sidebarText: '#F8FAFC',
      mode: 'dark',
      cardRadius: '14px',
    }
  },
  restaurante: {
    id: 'restaurante',
    nombre: '🍽️ Restaurante General',
    badge: 'Executive Slate',
    descripcion: 'Diseño ejecutivo y ágil para restaurantes de alta rotación, bistrós y cadenas.',
    terminos: {
      items: 'Platos & Entradas',
      item_singular: 'Plato',
      staff_cocina: 'Chef / Cocinero',
      carta: 'Menú Principal',
      horario_nota: 'Doble Turno (Almuerzo y Cena)',
    },
    paletaRecomendada: {
      primary: '#2563EB',        // Royal Blue Tech
      primaryDk: '#1D4ED8',
      secondary: '#0D9488',      // Teal Modern
      bg: '#F8FAFC',             // Slate Ultra Light
      surface: '#FFFFFF',        // Blanco Puro
      surface2: '#F1F5F9',       // Slate 100
      surface3: '#E2E8F0',       // Slate 200
      text: '#0F172A',           // Slate 900
      textMuted: '#64748B',      // Slate 500
      accent: '#DBEAFE',         // Blue 100
      sidebarBg: '#FFFFFF',
      sidebarText: '#0F172A',
      mode: 'light',
      cardRadius: '14px',
    }
  },
  plant_based: {
    id: 'plant_based',
    nombre: '🌱 Plant-Based & Saludable',
    badge: 'Tech Emerald (Default)',
    descripcion: 'Estética limpia, fresca y contemporánea para gastronomía saludable y orgánica.',
    terminos: {
      items: 'Platos Saludables',
      item_singular: 'Plato Veggie',
      staff_cocina: 'Chef Saludable',
      carta: 'Carta Nutritiva',
      horario_nota: 'Horarios de Todo el Día',
    },
    paletaRecomendada: {
      primary: '#059669',        // Emerald 600
      primaryDk: '#047857',      // Emerald 700
      secondary: '#10B981',      // Emerald 500
      bg: '#F8FAFC',             // Slate 50
      surface: '#FFFFFF',        // Blanco Puro
      surface2: '#F0FDF4',       // Mint Ultra Soft
      surface3: '#E2E8F0',       // Slate 200
      text: '#0F172A',           // Slate 900
      textMuted: '#64748B',      // Slate 500
      accent: '#ECFDF5',         // Emerald 50
      sidebarBg: '#FFFFFF',
      sidebarText: '#0F172A',
      mode: 'light',
      cardRadius: '16px',
    }
  }
};

// Utilidad para obtener la configuración completa con fallbacks
export function getPresetConfig(nichoKey) {
  return NICHOS_CONFIG[nichoKey] || NICHOS_CONFIG.plant_based;
}
