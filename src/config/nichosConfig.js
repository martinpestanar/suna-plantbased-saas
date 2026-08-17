// Configuración del Sistema de Nichos, Presets y Temas para Suna SaaS 2026

export const NICHOS_CONFIG = {
  cafeteria: {
    id: 'cafeteria',
    nombre: '☕ Cafetería & Bakery',
    badge: 'Cute & Warm',
    descripcion: 'Diseño acogedor, ideal para cafés de especialidad, postres, desayunos y panaderías.',
    terminos: {
      items: 'Bebidas & Antojos',
      item_singular: 'Bebida/Postre',
      staff_cocina: 'Barista',
      carta: 'Carta de Especialidad',
      horario_nota: 'Enfocado en Mañanas y Tardes',
    },
    paletaRecomendada: {
      primary: '#D97706',        // Ámbar / Caramelo
      primaryDk: '#B45309',      // Ámbar Oscuro
      secondary: '#8C5A4C',      // Cappuccino / Moka
      bg: '#FDF8F5',             // Crema Pastel
      surface: '#FFFFFF',        // Blanco Limpio
      surface2: '#F9F1EC',       // Crema Suave
      surface3: '#EFE3DA',       // Borde Warm
      text: '#4A2E2B',           // Café Oscuro
      textMuted: '#8C6A64',      // Texto Muted Moka
      accent: '#F3E8FF',         // Detalle Cute
      sidebarBg: '#2D1B18',      // Sidebar Moka Oscuro Elegante
      sidebarText: '#FDF8F5',    // Texto Sidebar Crema
      mode: 'light',
      cardRadius: '18px',
    }
  },
  restobar: {
    id: 'restobar',
    nombre: '🍸 Restobar & Coctelería',
    badge: 'Dark Neon',
    descripcion: 'Modo oscuro sofisticado para bares, pubs, discotecas y coctelería nocturna.',
    terminos: {
      items: 'Tragos & Tapas',
      item_singular: 'Trago/Cóctel',
      staff_cocina: 'Bartender',
      carta: 'Bar Menu & Coctelería',
      horario_nota: 'Enfocado en Noches (5 PM - 2 AM)',
    },
    paletaRecomendada: {
      primary: '#8B5CF6',        // Púrpura Neón
      primaryDk: '#7C3AED',      // Púrpura Intenso
      secondary: '#EC4899',      // Magenta Nocturno
      bg: '#090D16',             // Negro Neón Profundo
      surface: '#0F172A',        // Azul Slate Oscuro
      surface2: '#1E293B',       // Superficie Tarjeta
      surface3: '#334155',       // Borde Neón
      text: '#F8FAFC',           // Blanco Neón
      textMuted: '#94A3B8',      // Texto Muted Nocturno
      accent: '#10B981',         // Verde Bar
      sidebarBg: '#050B14',      // Sidebar Midnight Ultra Dark
      sidebarText: '#F8FAFC',    // Texto Sidebar Neón
      mode: 'dark',
      cardRadius: '14px',
    }
  },
  restaurante: {
    id: 'restaurante',
    nombre: '🍽️ Restaurante General',
    badge: 'Classic Bistro',
    descripcion: 'Diseño ejecutivo y profesional para restaurantes de mañanas, almuerzos y cenas.',
    terminos: {
      items: 'Platos & Entradas',
      item_singular: 'Plato',
      staff_cocina: 'Chef / Cocinero',
      carta: 'Menú Principal',
      horario_nota: 'Doble Turno (Almuerzo y Cena)',
    },
    paletaRecomendada: {
      primary: '#1E3A8A',        // Azul Ejecutivo
      primaryDk: '#1E40AF',      // Azul Rey
      secondary: '#D97706',      // Ámbar Cálido
      bg: '#F8FAFC',             // Gris Ejecutivo Muy Claro
      surface: '#FFFFFF',        // Blanco Pura
      surface2: '#F1F5F9',       // Gris Plata
      surface3: '#E2E8F0',       // Borde Limpio
      text: '#0F172A',           // Azul Marino Oscuro
      textMuted: '#64748B',      // Texto Muted Ejecutivo
      accent: '#2563EB',         // Azul Eléctrico
      sidebarBg: '#0F172A',      // Sidebar Navy Ejecutivo
      sidebarText: '#F8FAFC',    // Texto Sidebar Blanco
      mode: 'light',
      cardRadius: '12px',
    }
  },
  plant_based: {
    id: 'plant_based',
    nombre: '🌱 Plant-Based & Saludable',
    badge: 'Green Vitality',
    descripcion: 'Estética fresca y ecológica para comida vegana, vegetariana, bowls y orgánicos.',
    terminos: {
      items: 'Platos Saludables',
      item_singular: 'Plato Veggie',
      staff_cocina: 'Chef Saludable',
      carta: 'Carta Nutritiva',
      horario_nota: 'Horarios de Todo el Día',
    },
    paletaRecomendada: {
      primary: '#10B981',        // Verde Esmeralda
      primaryDk: '#059669',      // Verde Bosque
      secondary: '#047857',      // Verde Oscuro
      bg: '#F0FDF4',             // Menta Ecológico
      surface: '#FFFFFF',        // Blanco Limpio
      surface2: '#E6F4EA',       // Menta Suave
      surface3: '#C6E7CE',       // Borde Ecológico
      text: '#064E3B',           // Verde Bosque Profundo
      textMuted: '#52796F',      // Texto Muted Natura
      accent: '#F59E0B',         // Sol Dorado
      sidebarBg: '#0B2016',      // Sidebar Foresta Oscuro Original
      sidebarText: '#E6F4EA',    // Texto Sidebar Menta
      mode: 'light',
      cardRadius: '16px',
    }
  }
};

// Utilidad para obtener la configuración completa con fallbacks
export function getPresetConfig(nichoKey) {
  return NICHOS_CONFIG[nichoKey] || NICHOS_CONFIG.plant_based;
}
