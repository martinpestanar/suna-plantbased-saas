-- =========================================================================
-- SUNA GREENAPP - MIGRACIONES PARA MULTI-TENANCY SÓLIDO Y CLUB DE PUNTOS
-- Ejecutar estas instrucciones en el SQL Editor de tu panel de Supabase
-- =========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. ACTUALIZAR TABLA "clientes" (Agregar soporte Multi-tenant y Puntos)
-- ─────────────────────────────────────────────────────────────────────────

-- A. Agregar columna de relación al restaurante
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE;

-- B. Agregar columna de puntos acumulados (con valor por defecto 0)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS puntos INTEGER DEFAULT 0 NOT NULL;

-- C. (Opcional) Si existía una restricción única global sobre el teléfono, la removemos:
-- ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_telefono_key;

-- D. Crear clave única compuesta: Un teléfono es único POR restaurante.
-- Esto permite que un cliente compre en múltiples restaurantes manteniendo perfiles y puntos separados.
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_telefono_restaurante_id_key UNIQUE (telefono, restaurante_id);


-- ─────────────────────────────────────────────────────────────────────────
-- 2. OPTIMIZAR TABLA "items_menu" (Multi-tenant directo)
-- ─────────────────────────────────────────────────────────────────────────

-- A. Agregar columna de relación al restaurante
ALTER TABLE public.items_menu 
ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE;

-- B. Retroalimentar (Backfill): Copiar el restaurante_id correspondiente desde la categoría del menú
UPDATE public.items_menu i
SET restaurante_id = c.restaurante_id
FROM public.categorias_menu c
WHERE i.categoria_id = c.id;

-- C. Hacer que la columna sea obligatoria para futuros registros (opcional)
-- ALTER TABLE public.items_menu ALTER COLUMN restaurante_id SET NOT NULL;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. FUNCIONES DE POSTGRES (RPC) PARA LEALTAD Y TRANSACCIONES SEGURAS
-- ─────────────────────────────────────────────────────────────────────────

-- A. Función para acumular puntos por compras
CREATE OR REPLACE FUNCTION public.acumular_puntos(
  p_cliente_id UUID,
  p_monto DECIMAL,
  p_rate DECIMAL
) 
RETURNS VOID AS $$
BEGIN
  UPDATE public.clientes
  SET puntos = puntos + ROUND(p_monto * p_rate)
  WHERE id = p_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Función atómica para canjear puntos de forma segura (previene saldos negativos)
CREATE OR REPLACE FUNCTION public.canjear_puntos(
  p_cliente_id UUID,
  p_puntos_canje INT
) 
RETURNS BOOLEAN AS $$
DECLARE
  v_puntos_actuales INT;
BEGIN
  -- Obtener puntos actuales
  SELECT puntos INTO v_puntos_actuales 
  FROM public.clientes 
  WHERE id = p_cliente_id;

  -- Verificar si el cliente tiene suficientes puntos
  IF v_puntos_actuales >= p_puntos_canje THEN
    UPDATE public.clientes
    SET puntos = puntos - p_puntos_canje
    WHERE id = p_cliente_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
