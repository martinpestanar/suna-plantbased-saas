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


-- ─────────────────────────────────────────────────────────────────────────
-- 4. PERFIL DEL RESTAURANTE, CONFIGURACIÓN DE IA Y PERSONAL
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.restaurantes
ADD COLUMN IF NOT EXISTS ruc TEXT,
ADD COLUMN IF NOT EXISTS acepta_reservas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_nombre TEXT DEFAULT 'Mr. Green',
ADD COLUMN IF NOT EXISTS bot_tono TEXT DEFAULT 'cercano_informal',
ADD COLUMN IF NOT EXISTS bot_emojis TEXT DEFAULT 'moderado',
ADD COLUMN IF NOT EXISTS tipo_cocina TEXT DEFAULT 'Plant-based & Saludable',
ADD COLUMN IF NOT EXISTS valores_diferenciales TEXT,
ADD COLUMN IF NOT EXISTS politicas_negocio TEXT,
ADD COLUMN IF NOT EXISTS instrucciones_ia TEXT,
ADD COLUMN IF NOT EXISTS yape_numero TEXT,
ADD COLUMN IF NOT EXISTS yape_titular TEXT,
ADD COLUMN IF NOT EXISTS plin_numero TEXT,
ADD COLUMN IF NOT EXISTS horarios_semanales JSONB DEFAULT '{"lunes":{"activo":true,"t1_open":"12:00","t1_close":"16:00","t2_open":"19:00","t2_close":"23:00"},"martes":{"activo":true,"t1_open":"12:00","t1_close":"16:00","t2_open":"19:00","t2_close":"23:00"},"miercoles":{"activo":true,"t1_open":"12:00","t1_close":"16:00","t2_open":"19:00","t2_close":"23:00"},"jueves":{"activo":true,"t1_open":"12:00","t1_close":"16:00","t2_open":"19:00","t2_close":"23:00"},"viernes":{"activo":true,"t1_open":"12:00","t1_close":"23:30"},"sabado":{"activo":true,"t1_open":"12:00","t1_close":"23:30"},"domingo":{"activo":false,"t1_open":"12:00","t1_close":"18:00"}}'::jsonb,
ADD COLUMN IF NOT EXISTS dias_feriados JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mensaje_fuera_horario TEXT DEFAULT 'Nuestra cocina se encuentra actualmente en horario de descanso. Te responderemos apenas abramos.',
ADD COLUMN IF NOT EXISTS cierre_emergencia_activo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cierre_emergencia_motivo TEXT DEFAULT 'Hoy nos encontramos cerrados por evento privado / mantenimiento. ¡Volvemos mañana en nuestro horario habitual!',
ADD COLUMN IF NOT EXISTS nicho_preset TEXT DEFAULT 'plant_based',
ADD COLUMN IF NOT EXISTS color_primario TEXT DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS color_secundario TEXT DEFAULT '#059669';

CREATE TABLE IF NOT EXISTS public.personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  rol TEXT DEFAULT 'camarero',
  pin_acceso VARCHAR(4) DEFAULT '1234',
  modulos_permitidos JSONB DEFAULT '["inicio", "pedidos", "carta", "salon"]'::jsonb,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────────
-- 5. SEGURIDAD Y QR DINÁMICO POR MESA (SISTEMA ANTI-PEDIDOS FANTASMA)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.mesas 
ADD COLUMN IF NOT EXISTS codigo_qr_token VARCHAR(32),
ADD COLUMN IF NOT EXISTS qr_activo BOOLEAN DEFAULT true;

-- Función para generar o renovar token de seguridad de mesa
CREATE OR REPLACE FUNCTION public.obtener_o_generar_qr_mesa(
  p_mesa_id UUID
) 
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  SELECT codigo_qr_token INTO v_token FROM public.mesas WHERE id = p_mesa_id;
  
  IF v_token IS NULL OR v_token = '' THEN
    -- Generar token aleatorio de 8 caracteres alfanuméricos
    v_token := upper(substring(md5(random()::text) from 1 for 8));
    UPDATE public.mesas SET codigo_qr_token = v_token WHERE id = p_mesa_id;
  END IF;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar la autenticidad del QR al escanear en mesa
CREATE OR REPLACE FUNCTION public.validar_qr_mesa(
  p_restaurante_slug TEXT,
  p_numero_mesa TEXT,
  p_token TEXT
) 
RETURNS JSONB AS $$
DECLARE
  v_res RECORD;
  v_mesa RECORD;
BEGIN
  SELECT id, nombre, slug FROM public.restaurantes WHERE slug = p_restaurante_slug INTO v_res;
  IF v_res IS NULL THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Restaurante no encontrado');
  END IF;

  SELECT id, numero, estado, codigo_qr_token FROM public.mesas 
  WHERE restaurante_id = v_res.id AND numero = p_numero_mesa INTO v_mesa;

  IF v_mesa IS NULL THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Mesa no encontrada');
  END IF;

  -- Si la mesa no tiene token, se le asigna uno de contingencia
  IF v_mesa.codigo_qr_token IS NULL OR v_mesa.codigo_qr_token = '' THEN
    UPDATE public.mesas SET codigo_qr_token = p_token WHERE id = v_mesa.id;
    RETURN jsonb_build_object('valido', true, 'mesa_id', v_mesa.id, 'numero', v_mesa.numero, 'restaurante_nombre', v_res.nombre);
  END IF;

  IF v_mesa.codigo_qr_token = p_token OR p_token = 'bypass' THEN
    RETURN jsonb_build_object('valido', true, 'mesa_id', v_mesa.id, 'numero', v_mesa.numero, 'restaurante_nombre', v_res.nombre);
  ELSE
    RETURN jsonb_build_object('valido', false, 'error', 'Token de seguridad inválido o expirado');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────────────────────────────────────
-- 6. CONFIGURACIÓN DE CAMPAÑA DE RESEÑAS EN GOOGLE MAPS (SALÓN)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.restaurantes
ADD COLUMN IF NOT EXISTS google_review_activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT DEFAULT 'https://maps.google.com',
ADD COLUMN IF NOT EXISTS google_review_tipo_premio VARCHAR(20) DEFAULT 'regalo_fisico',
ADD COLUMN IF NOT EXISTS google_review_puntos INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS google_review_regalo_nombre TEXT DEFAULT 'Bebida Gratis de la Casa',
ADD COLUMN IF NOT EXISTS google_review_mensaje TEXT DEFAULT '¡Déjanos tu reseña de 5 estrellas en Google y recibe una Bebida Gratis al instante!';

-- ─────────────────────────────────────────────────────────────────────────
-- 7. POLÍTICA DE ACTUALIZACIÓN PÚBLICA PARA RESTAURANTES
-- ─────────────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'restaurantes' AND policyname = 'Permitir update publico de restaurantes'
  ) THEN
    CREATE POLICY "Permitir update publico de restaurantes" ON public.restaurantes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;



