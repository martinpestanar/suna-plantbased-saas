# Habilidad Suna GreenApp: Logo y Branding 🌿

**Esta es una habilidad/memoria permanente del agente de Inteligencia Artificial para el proyecto Suna GreenApp.**
**NUNCA cambies este logo a menos que el usuario lo solicite explícitamente.**

## 1. Logo Oficial
El logo oficial del proyecto es el ícono **`GrAd`** importado de `react-icons/gr`.

```javascript
import { GrAd } from "react-icons/gr";
```

## 2. Modos de Color del Logo y CSS Variables
El logo NUNCA debe usar colores en hexadecimal (`#...`) hardcodeados, sino que debe anclarse a las variables del sistema de diseño (Design Tokens) definidos en `index.css`. Esto garantiza la consistencia si se modifica la paleta central de Suna.

### Estructura Base del Logo
- **Fondo del contenedor (Background):** `var(--color-primary)` (Verde Primary Oscuro). Esto asegura que el bloque del logo sea siempre el ancla visual fuerte de la marca.
- **Color del Ícono (Modo Oscuro):** `var(--color-accent)` (Verde Acento)
- **Color del Ícono (Modo Claro):** `var(--color-surface)` (Beige Superficie)

## 3. Animación de Interacción (Vibración)
El logo SIEMPRE debe llevar la clase CSS `logo-vibrate` (y `cursor: pointer`), la cual acciona una pequeña vibración (shake) y un scale sutil al pasar el mouse por encima (`:hover`).

### Código Base CSS Requerido
```css
@keyframes vibrate {
  0% { transform: translate(0) }
  20% { transform: translate(-1px, 1px) rotate(-2deg) }
  40% { transform: translate(-1px, -1px) rotate(2deg) }
  60% { transform: translate(1px, 1px) rotate(-2deg) }
  80% { transform: translate(1px, -1px) rotate(2deg) }
  100% { transform: translate(0) }
}
.logo-vibrate {
  transition: transform 0.2s ease;
}
.logo-vibrate:hover {
  animation: vibrate 0.3s linear infinite both;
  transform: scale(1.1);
}
```

## 4. Ejemplo de Implementación Exacta

```javascript
// Ejemplo Light Mode
<div className="logo-vibrate" style={{
  width: 64, height: 64, borderRadius: 18, 
  background: '#D8F3DC', // Fondo Claro
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer'
}}>
  <GrAd size={34} color="#1B4332" /> {/* Ícono Oscuro */}
</div>
```
