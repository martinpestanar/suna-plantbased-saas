import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../router';

const MODULE_DEFINITIONS = [
  {
    id: 'pedidos',
    nombre: 'Motor de Pedidos y QR',
    precio: 49.00,
    periodo: 'mes',
    descripcion: 'Menú digital interactivo en mesa, autogestión de pedidos y comandas en tiempo real.',
    icono: '📱',
    color: '#10B981',
  },
  {
    id: 'carta',
    nombre: 'Carta Digital y Gestión de Menú',
    precio: 29.00,
    periodo: 'mes',
    descripcion: 'Gestión completa de categorías, insumos por plato, variaciones y fotos del menú.',
    icono: '📋',
    color: '#F59E0B',
  },
  {
    id: 'inventario',
    nombre: 'Control de Inventario y Stock',
    precio: 39.00,
    periodo: 'mes',
    descripcion: 'Gestión de insumos, recetas por plato, alertas de stock mínimo y costos.',
    icono: '📦',
    color: '#3B82F6',
  },
  {
    id: 'fidelizacion',
    nombre: 'Club de Puntos y Fidelización (CRM)',
    precio: 29.00,
    periodo: 'mes',
    descripcion: 'Acumulación de puntos por cliente, cupones de descuento y catálogo de premios.',
    icono: '🎁',
    color: '#EC4899',
  },
  {
    id: 'delivery',
    nombre: 'Delivery y Despachos',
    precio: 35.00,
    periodo: 'mes',
    descripcion: 'Control de zonas de reparto, asignación de repartidores y seguimiento de pedidos.',
    icono: '🛵',
    color: '#F59E0B',
  },
  {
    id: 'marketing',
    nombre: 'Marketing e IA de Ventas',
    precio: 45.00,
    periodo: 'mes',
    descripcion: 'Agente de Inteligencia Artificial para recomendaciones y campañas de WhatsApp.',
    icono: '⚡',
    color: '#8B5CF6',
  },
  {
    id: 'reservas',
    nombre: 'Gestión de Mesas y Reservas (Salón)',
    precio: 29.00,
    periodo: 'mes',
    descripcion: 'Organización del salón, estado de ocupación de mesas y reservas online.',
    icono: '🪑',
    color: '#14B8A6',
  },
  {
    id: 'finanzas',
    nombre: 'Caja Chica y Control Financiero',
    precio: 35.00,
    periodo: 'mes',
    descripcion: 'Registro de ingresos, egresos diarios, arqueo de caja y reporte de utilidad.',
    icono: '💵',
    color: '#10B981',
  },
  {
    id: 'metricas',
    nombre: 'Métricas y Reportes de Rendimiento',
    precio: 25.00,
    periodo: 'mes',
    descripcion: 'Estadísticas de platos estrella, horas con más volumen y analítica avanzada.',
    icono: '📊',
    color: '#6366F1',
  },
  {
    id: 'modulos',
    nombre: 'Gestor de Suscripciones SaaS',
    precio: 19.00,
    periodo: 'mes',
    descripcion: 'Administrador central de planes, comprobantes y solicitud de módulos adicionales.',
    icono: '🧩',
    color: '#8B5CF6',
  }
];

export default function DashboardModulos() {
  const { activeRestaurant } = useAuth();
  const [modulosActivos, setModulosActivos] = useState({});
  const [solicitudesPendientes, setSolicitudesPendientes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  
  // Checkout Form State
  const [metodoPago, setMetodoPago] = useState('yape'); // 'yape', 'plin', 'bcp', 'interbank'
  const [numOperacion, setNumOperacion] = useState('');
  const [titular, setTitular] = useState('');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  useEffect(() => {
    if (activeRestaurant?.id) {
      cargarEstadoModulos();
    } else {
      setLoading(false);
    }
  }, [activeRestaurant]);

  const cargarEstadoModulos = async () => {
    setLoading(true);
    try {
      // 1. Obtener módulos activos
      const { data: modulosData } = await supabase
        .from('restaurante_modulos')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id);

      const mapModulos = {};
      if (modulosData) {
        modulosData.forEach(m => {
          mapModulos[m.modulo] = m.activo;
        });
      }
      setModulosActivos(mapModulos);

      // 2. Obtener solicitudes de activación pendientes
      const { data: solData } = await supabase
        .from('solicitudes_activacion')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .eq('estado', 'pendiente');

      const mapSolicitudes = {};
      if (solData) {
        solData.forEach(s => {
          mapSolicitudes[s.modulo] = s;
        });
      }
      setSolicitudesPendientes(mapSolicitudes);
    } catch (e) {
      console.error('Error al cargar módulos:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVoucherFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVoucherPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPago = async (e) => {
    e.preventDefault();
    if (!numOperacion.trim()) {
      alert('Por favor ingresa el número de operación del pago');
      return;
    }

    setSubmitting(true);
    try {
      let voucherUrl = voucherPreview || '';

      // Si tenemos Supabase Storage bucket activo, intentar subida
      if (voucherFile && activeRestaurant?.id) {
        const fileExt = voucherFile.name.split('.').pop();
        const fileName = `${activeRestaurant.id}_${selectedModule.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('vouchers')
          .upload(fileName, voucherFile);

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage.from('vouchers').getPublicUrl(fileName);
          if (urlData?.publicUrl) voucherUrl = urlData.publicUrl;
        }
      }

      // Guardar registro de solicitud de activación
      const { error } = await supabase.from('solicitudes_activacion').insert({
        restaurante_id: activeRestaurant.id,
        modulo: selectedModule.id,
        metodo_pago: metodoPago,
        monto: selectedModule.precio,
        numero_operacion: numOperacion.trim(),
        titular_origen: titular.trim() || activeRestaurant.nombre,
        voucher_url: voucherUrl,
        estado: 'pendiente'
      });

      if (error) throw error;

      setToastMsg('🎉 Solicitud enviada con éxito. En breve un administrador activará tu módulo.');
      setSelectedModule(null);
      setNumOperacion('');
      setTitular('');
      setVoucherFile(null);
      setVoucherPreview(null);
      cargarEstadoModulos();
    } catch (err) {
      console.error('Error al registrar pago:', err);
      alert('Error al enviar la solicitud: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--color-surface-3)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 100px', maxWidth: 640, margin: '0 auto' }}>
      {/* Toast message */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 20, left: 16, right: 16, zIndex: 100,
          background: '#064E3B', color: '#D1FAE5', padding: '14px 18px',
          borderRadius: 16, fontWeight: 700, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Title Header Mobile */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>🧩</span>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--color-on-surface)', margin: 0 }}>
            Módulos y Funcionalidades
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0, lineHeight: 1.4 }}>
          Personaliza tu SaaS. Paga únicamente por las herramientas que tu restaurante necesita hoy.
        </p>
      </div>

      {/* Peru Payment Info Alert */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.1))',
        border: '1.5px solid rgba(16,185,129,0.3)',
        borderRadius: 20, padding: '14px 16px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
          🇵🇪
        </div>
        <div>
          <h4 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)' }}>
            Pagos Locales en Perú
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.3 }}>
            Aceptamos <b>Yape, Plin y Transferencia BCP/Interbank</b>. Activación inmediata al verificar tu comprobante.
          </p>
        </div>
      </div>

      {/* Grid de Módulos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {MODULE_DEFINITIONS.map(mod => {
          const hasRecord = modulosActivos[mod.id] !== undefined;
          const estaActivo = hasRecord ? modulosActivos[mod.id] : true;
          const estaPendiente = !!solicitudesPendientes[mod.id];

          return (
            <div key={mod.id} style={{
              background: 'var(--color-surface)',
              border: `1.5px solid ${estaActivo ? 'rgba(16,185,129,0.4)' : estaPendiente ? 'rgba(245,158,11,0.4)' : 'var(--color-surface-3)'}`,
              borderRadius: 22, padding: 18,
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              position: 'relative', overflow: 'hidden',
              transition: 'all 200ms ease'
            }}>
              {/* Top Row: Icon, Title, Badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `${mod.color}15`, border: `1px solid ${mod.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0
                  }}>
                    {mod.icono}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: 'Outfit, sans-serif' }}>
                      {mod.nombre}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 800, color: mod.color }}>
                      S/ {mod.precio.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)' }}>/ {mod.periodo}</span>
                    </p>
                  </div>
                </div>

                {/* Badge de Estado */}
                {estaActivo ? (
                  <span style={{
                    background: '#10B98120', color: '#10B981', border: '1px solid #10B98140',
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    ✓ Activo
                  </span>
                ) : estaPendiente ? (
                  <span style={{
                    background: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40',
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    ⏳ En Revisión
                  </span>
                ) : (
                  <span style={{
                    background: 'var(--color-surface-2)', color: 'var(--color-muted)', border: '1px solid var(--color-surface-3)',
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700
                  }}>
                    Disponible
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: 12.5, color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.4 }}>
                {mod.descripcion}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {estaActivo ? (
                  <button style={{
                    width: '100%', padding: '12px', borderRadius: 14,
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)',
                    color: 'var(--color-on-surface)', fontSize: 13, fontWeight: 700, cursor: 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}>
                    ✓ Módulo Habilitado
                  </button>
                ) : estaPendiente ? (
                  <button style={{
                    width: '100%', padding: '12px', borderRadius: 14,
                    background: '#F59E0B15', border: '1.5px dashed #F59E0B80',
                    color: '#F59E0B', fontSize: 13, fontWeight: 700, cursor: 'default'
                  }}>
                    Comprobante enviado (Op: {solicitudesPendientes[mod.id]?.numero_operacion || 'Revisando'})
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedModule(mod)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 14,
                      background: 'var(--color-primary)', border: 'none',
                      color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'transform 150ms active'
                    }}
                  >
                    ⚡ Adquirir Módulo (S/ {mod.precio.toFixed(2)})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CHECKOUT MOBILE-FIRST */}
      {selectedModule && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,26,21,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            width: '100%', maxWidth: 540,
            background: 'var(--color-surface)',
            borderRadius: '28px 28px 0 0',
            padding: '24px 20px 32px',
            maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            {/* Drag indicator bar */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-surface-3)', margin: '0 auto 16px' }} />

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: 'var(--color-on-surface)' }}>
                  Activar {selectedModule.nombre}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
                  Monto a pagar: S/ {selectedModule.precio.toFixed(2)} / mes
                </p>
              </div>
              <button
                onClick={() => setSelectedModule(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface-2)', border: 'none', color: 'var(--color-on-surface)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPago}>
              {/* Payment Method Selector */}
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                1. Selecciona Método de Pago en Perú:
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'yape', label: 'YAPE', color: '#712A84', icon: '🟣' },
                  { id: 'plin', label: 'PLIN', color: '#00A8FF', icon: '🔵' },
                  { id: 'bcp', label: 'BCP', color: '#002A8F', icon: '🏦' },
                  { id: 'interbank', label: 'Interbank', color: '#059669', icon: '💚' },
                ].map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setMetodoPago(item.id)}
                    style={{
                      padding: '12px 6px', borderRadius: 14,
                      background: metodoPago === item.id ? `${item.color}20` : 'var(--color-surface-2)',
                      border: `2px solid ${metodoPago === item.id ? item.color : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'center', transition: 'all 150ms'
                    }}
                  >
                    <div style={{ fontSize: 18 }}>{item.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: metodoPago === item.id ? item.color : 'var(--color-on-surface)' }}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Payment Details Box */}
              <div style={{
                background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)',
                borderRadius: 18, padding: 16, marginBottom: 20
              }}>
                {metodoPago === 'yape' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#A855F7' }}>🟣 Número Yape:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('987654321', 'yape')}
                        style={{ background: '#712A8420', border: '1px solid #712A8440', color: '#A855F7', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {copiedText === 'yape' ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)', letterSpacing: 1, marginBottom: 4 }}>
                      987 654 321
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                      Titular: <b>SUNA SAAS AGENCIA DIGITAL S.A.C.</b>
                    </p>
                  </div>
                )}

                {metodoPago === 'plin' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#38BDF8' }}>🔵 Número Plin:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('987654321', 'plin')}
                        style={{ background: '#00A8FF20', border: '1px solid #00A8FF40', color: '#38BDF8', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {copiedText === 'plin' ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)', letterSpacing: 1, marginBottom: 4 }}>
                      987 654 321
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>
                      Titular: <b>SUNA SAAS PERU S.A.C.</b>
                    </p>
                  </div>
                )}

                {metodoPago === 'bcp' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)' }}>Cuenta Soles BCP:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('193-98765432-0-12', 'bcp')}
                        style={{ background: 'var(--color-surface-3)', border: 'none', color: 'var(--color-on-surface)', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {copiedText === 'bcp' ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-primary)', marginBottom: 8 }}>
                      193-98765432-0-12
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>CCI Interbancario:</span>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-muted)' }}>
                      002-193-0098765432012-18
                    </div>
                  </div>
                )}

                {metodoPago === 'interbank' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)' }}>Cuenta Interbank Soles:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('200-3001234567', 'ibk')}
                        style={{ background: 'var(--color-surface-3)', border: 'none', color: 'var(--color-on-surface)', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        {copiedText === 'ibk' ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: '#10B981', marginBottom: 8 }}>
                      200-3001234567
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>CCI Interbancario:</span>
                    <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-muted)' }}>
                      003-200-003001234567-42
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Inputs */}
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--color-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                2. Datos de la Transacción:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>
                    Nº de Operación / Referencia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 12894560"
                    value={numOperacion}
                    onChange={e => setNumOperacion(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 14,
                      background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)',
                      color: 'var(--color-on-surface)', fontSize: 14, fontWeight: 700, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>
                    Nombre del Titular que realizó el pago
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={titular}
                    onChange={e => setTitular(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 14,
                      background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)',
                      color: 'var(--color-on-surface)', fontSize: 14, fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                {/* Subir voucher foto */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: 4 }}>
                    Foto de Voucher / Captura (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="voucher-upload-input"
                  />
                  <label
                    htmlFor="voucher-upload-input"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      padding: '14px', borderRadius: 14,
                      background: 'var(--color-surface-2)', border: '1.5px dashed var(--color-surface-3)',
                      color: 'var(--color-on-surface)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    📷 {voucherFile ? voucherFile.name : 'Tomar foto o cargar captura'}
                  </label>
                  {voucherPreview && (
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <img src={voucherPreview} alt="Voucher Preview" style={{ maxHeight: 120, borderRadius: 12, border: '1px solid var(--color-surface-3)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: 'var(--color-primary)', border: 'none',
                  color: '#ffffff', fontSize: 15, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(16,185,129,0.3)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Enviando comprobante...' : '🚀 Confirmar y Enviar Pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
