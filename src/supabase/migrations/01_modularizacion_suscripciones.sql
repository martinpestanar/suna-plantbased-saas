-- =========================================================================
-- MIGRACIÓN 01: MODULARIZACIÓN DE RESTAURANTES Y SOLICITUDES DE PAGO YAPE/PLIN
-- =========================================================================

-- 1. Tabla para registrar los módulos habilitados por cada restaurante
CREATE TABLE IF NOT EXISTS public.restaurante_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL, -- 'pedidos', 'inventario', 'fidelizacion', 'reservas', 'marketing', 'delivery'
  activo BOOLEAN DEFAULT true,
  fecha_expiracion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurante_id, modulo)
);

-- 2. Tabla para almacenar solicitudes de pago/activación manuales (Yape, Plin, Transferencia)
CREATE TABLE IF NOT EXISTS public.solicitudes_activacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE,
  modulo VARCHAR(50) NOT NULL,
  metodo_pago VARCHAR(30) NOT NULL, -- 'yape', 'plin', 'transferencia_bcp', 'transferencia_interbank'
  monto DECIMAL(10,2) NOT NULL,
  numero_operacion VARCHAR(50),
  titular_origen VARCHAR(100),
  voucher_url TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  notas_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.restaurante_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_activacion ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura pública temporal para desarrollo/demo
CREATE POLICY "Permitir todo en restaurante_modulos" ON public.restaurante_modulos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en solicitudes_activacion" ON public.solicitudes_activacion FOR ALL USING (true) WITH CHECK (true);
