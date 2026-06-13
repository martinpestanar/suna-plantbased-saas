import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Nuevos'); // 'Nuevos', 'En Cocina', 'Despachos', 'Historial'
  const [toastMsg, setToastMsg] = useState(null);
  const [processingOrders, setProcessingOrders] = useState({});

  // Iconos SVG
  const Icon = {
    clock: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    check: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    x: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    bell: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    ),
    moto: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><line x1="14" y1="17" x2="10" y2="17"/><polyline points="14 17 14 10 18 10 21 14 21 17"/><line x1="2" y1="17" x2="4" y2="17"/><polyline points="6 10 10 10 10 17"/>
      </svg>
    ),
    bag: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const notifyNewOrder = () => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    showToast('🔔 ¡Nueva orden recibida!');
  };

  // 1. Fetch inicial de datos
  useEffect(() => {
    fetchOrders();

    // 2. Suscripción a cambios en tiempo real
    const channel = supabase.channel('admin_ordenes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ordenes' }, payload => {
        fetchOrders();
        notifyNewOrder();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ordenes' }, payload => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        clientes ( nombre, telefono ),
        detalles_orden (
          cantidad,
          precio_unitario,
          items_menu ( nombre )
        )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  // Filtros por pestaña
  const filteredOrders = useMemo(() => {
    if (tab === 'Nuevos') return orders.filter(o => o.estado === 'pendiente');
    if (tab === 'En Cocina') return orders.filter(o => o.estado === 'preparando');
    if (tab === 'Despachos') return orders.filter(o => ['listo_para_recojo', 'en_camino'].includes(o.estado));
    return orders.filter(o => ['entregado', 'cancelado'].includes(o.estado));
  }, [orders, tab]);

  // Actualizador de estado con Feedback UI (loading/success)
  const updateStatus = async (id, newStatus) => {
    if (processingOrders[id]) return; // Evitar doble clic
    if (navigator.vibrate) navigator.vibrate(10);
    
    setProcessingOrders(prev => ({ ...prev, [id]: 'loading' }));
    
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Feedback visual positivo breve
      setProcessingOrders(prev => ({ ...prev, [id]: 'success' }));
      
      setTimeout(() => {
        setProcessingOrders(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        
        // Optimistic UI fallback
        setOrders(prev => prev.map(o => o.id === id ? { ...o, estado: newStatus } : o));
        
        if (newStatus === 'preparando') showToast('👨‍🍳 Orden enviada a cocina');
        if (newStatus === 'listo_para_recojo') showToast('🥡 Orden lista en mostrador');
        if (newStatus === 'en_camino') showToast('🛵 Orden enviada con repartidor');
        if (newStatus === 'entregado') showToast('✅ Orden finalizada');
        if (newStatus === 'cancelado') showToast('🚫 Orden cancelada');
      }, 700);
      
    } catch (err) {
      console.error(err);
      showToast('❌ No se pudo actualizar el estado, intenta de nuevo');
      setProcessingOrders(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const forzarPagoDev = async (id) => {
    if (processingOrders[id]) return;
    setProcessingOrders(prev => ({ ...prev, [id]: 'loading' }));
    
    try {
      const { error } = await supabase.from('ordenes').update({
        estado_pago: 'verificado',
        comprobante_url: 'https://fake-voucher.com/dev.jpg',
        pago_operacion_ref: 'DEV-' + Date.now()
      }).eq('id', id);

      if (error) throw error;
      showToast('👾 Pago forzado en Modo Dev');
      fetchOrders(); // Refrescar para ver el pago verificado
    } catch (err) {
      console.error(err);
      showToast('❌ Error forzando pago');
    } finally {
      setProcessingOrders(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  // Helper para renderizar una card de orden individual (reutilizada en Mobile y Kanban)
  const renderOrderCard = (order) => {
    const isProcessing = processingOrders[order.id];
    return (
      <div key={order.id} style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 20,
        border: '1px solid var(--color-surface-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}>
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--color-surface-2)', color: 'var(--color-muted)', padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, fontFamily: 'monospace' }}>
                #{order.id.split('-')[0].toUpperCase()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: order.tipo_entrega === 'delivery' ? 'var(--color-primary)' : '#F59E0B' }}>
                {order.tipo_entrega === 'delivery' ? '🛵 Delivery' : '🥡 Recojo'}
              </span>
              {order.estado_pago === 'verificado' ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', background: '#D1FAE5', padding: '2px 8px', borderRadius: 6 }}>
                  ✅ Pagado
                </span>
              ) : order.estado_pago === 'pendiente_efectivo' ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', background: '#FEF3C7', padding: '2px 8px', borderRadius: 6 }}>
                  💵 Efectivo
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', background: '#FEE2E2', padding: '2px 8px', borderRadius: 6 }}>
                  🛑 Pago Pendiente
                </span>
              )}
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--color-on-surface)', marginTop: 8 }}>
              {order.clientes?.nombre || 'Cliente Anónimo'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
              📞 {order.clientes?.telefono || 'Sin teléfono'}
            </p>
            {order.direccion && (
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                📍 {order.direccion}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-primary)' }}>
              S/. {parseFloat(order.total || 0).toFixed(2)}
            </span>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Detalles de la orden */}
        <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.detalles_orden?.map((det, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>
                {det.cantidad}x <span style={{ fontWeight: 400 }}>{det.items_menu?.nombre}</span>
              </span>
              <span style={{ color: 'var(--color-muted)' }}>
                S/. {parseFloat(det.precio_unitario * det.cantidad).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Comprobante / Pago Modo Dev */}
        {order.estado_pago !== 'verificado' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--color-surface-3)', padding: 8, borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>¿Pago verificado en cuenta?</span>
            <button 
              onClick={() => forzarPagoDev(order.id)} 
              className="chip chip-default"
              style={{ fontSize: 11, padding: '4px 8px', background: 'var(--color-surface-2)', cursor: 'pointer' }}
            >
              👾 Validar (Dev)
            </button>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {order.estado === 'pendiente' && (
            <>
              <button 
                onClick={() => updateStatus(order.id, 'preparando')}
                disabled={isProcessing === 'loading'}
                className="btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: 13, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
              >
                {isProcessing === 'loading' ? 'Procesando...' : (
                  <>👨‍🍳 Aceptar y Cocinar</>
                )}
              </button>
              <button 
                onClick={() => updateStatus(order.id, 'cancelado')}
                disabled={isProcessing === 'loading'}
                className="chip chip-default"
                style={{ padding: '10px 16px', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 10, cursor: 'pointer' }}
              >
                Rechazar
              </button>
            </>
          )}

          {order.estado === 'preparando' && (
            <>
              <button 
                onClick={() => updateStatus(order.id, order.tipo_entrega === 'delivery' ? 'en_camino' : 'listo_para_recojo')}
                disabled={isProcessing === 'loading'}
                className="btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: 13, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
              >
                {isProcessing === 'loading' ? 'Procesando...' : (
                  order.tipo_entrega === 'delivery' ? (
                    <>🛵 Despachar Delivery</>
                  ) : (
                    <>🥡 Listo para Recojo</>
                  )
                )}
              </button>
            </>
          )}

          {(order.estado === 'listo_para_recojo' || order.estado === 'en_camino') && (
            <button 
              onClick={() => updateStatus(order.id, 'entregado')}
              disabled={isProcessing === 'loading'}
              className="btn-primary"
              style={{ flex: 1, padding: '10px 16px', fontSize: 13, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
            >
              {isProcessing === 'loading' ? 'Procesando...' : (
                <>✅ Entregar Pedido</>
              )}
            </button>
          )}

          {(order.estado === 'entregado' || order.estado === 'cancelado') && (
            <div style={{ flex: 1, textAlign: 'center', fontSize: 12, padding: '8px', borderRadius: 8, background: order.estado === 'entregado' ? '#D1FAE5' : '#FEE2E2', color: order.estado === 'entregado' ? '#10B981' : '#EF4444', fontWeight: 700 }}>
              {order.estado === 'entregado' ? '✅ Pedido Entregado' : '🚫 Pedido Cancelado'}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', background: 'transparent' }}>
      
      {/* HEADER MOVIL - Ocultado en Escritorio */}
      <div className="mobile-header-only" style={{ padding: '20px 20px 10px', background: 'var(--color-surface)', color: 'var(--color-on-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Panel de Cocina</h1>
          </div>
        </div>

        {/* TABS DE ESTADO */}
        <div className="category-strip-wrapper" style={{ margin: '0 -20px' }}>
          <div className="category-strip" style={{ padding: '0 20px 10px' }}>
            {['Nuevos', 'En Cocina', 'Despachos', 'Historial'].map(t => {
              const isActive = tab === t;
              let count = 0;
              if (t === 'Nuevos') count = orders.filter(o => o.estado === 'pendiente').length;
              if (t === 'En Cocina') count = orders.filter(o => o.estado === 'preparando').length;
              if (t === 'Despachos') count = orders.filter(o => ['listo_para_recojo', 'en_camino'].includes(o.estado)).length;
              
              return (
                <button key={t} onClick={() => { setTab(t); if(navigator.vibrate) navigator.vibrate(5); }}
                  className={`chip ${isActive ? 'chip-active' : 'chip-default'}`}
                  style={{ gap: 8 }}
                >
                  {t}
                  {count > 0 && (
                    <span style={{ 
                      background: isActive ? '#fff' : 'var(--color-primary)', 
                      color: isActive ? 'var(--color-primary)' : '#fff', 
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 900 
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL COMPUESTO */}
      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>Cargando órdenes...</div>
      ) : (
        <>
          {/* VISTA ESCRITORIO - KANBAN BOARD */}
          <div className="desktop-kanban-only" style={{ padding: '0 0 20px 0' }}>
            <div className="kanban-board">
              {/* Columna 1: Nuevos */}
              <div className="kanban-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-surface-3)', paddingBottom: 10 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14 }}>🟡 NUEVOS</h3>
                  <span style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {orders.filter(o => o.estado === 'pendiente').length}
                  </span>
                </div>
                {orders.filter(o => o.estado === 'pendiente').length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, padding: '20px 0' }}>Sin pedidos nuevos</p>
                ) : (
                  orders.filter(o => o.estado === 'pendiente').map(renderOrderCard)
                )}
              </div>

              {/* Columna 2: En Cocina y Despachos */}
              <div className="kanban-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-surface-3)', paddingBottom: 10 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14 }}>🍳 EN COCINA / LISTOS</h3>
                  <span style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {orders.filter(o => ['preparando', 'listo_para_recojo', 'en_camino'].includes(o.estado)).length}
                  </span>
                </div>
                {orders.filter(o => ['preparando', 'listo_para_recojo', 'en_camino'].includes(o.estado)).length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, padding: '20px 0' }}>Sin pedidos activos</p>
                ) : (
                  orders.filter(o => ['preparando', 'listo_para_recojo', 'en_camino'].includes(o.estado)).map(renderOrderCard)
                )}
              </div>

              {/* Columna 3: Historial reciente */}
              <div className="kanban-col">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--color-surface-3)', paddingBottom: 10 }}>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 14 }}>✅ HISTORIAL RECIENTE</h3>
                  <span style={{ background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {orders.filter(o => ['entregado', 'cancelado'].includes(o.estado)).slice(0, 10).length}
                  </span>
                </div>
                {orders.filter(o => ['entregado', 'cancelado'].includes(o.estado)).length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: 12, padding: '20px 0' }}>Sin historial</p>
                ) : (
                  orders.filter(o => ['entregado', 'cancelado'].includes(o.estado)).slice(0, 10).map(renderOrderCard)
                )}
              </div>
            </div>
          </div>

          {/* VISTA MOVIL - SINGLE COLUMN SCROLL */}
          <div className="mobile-orders-only" style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--color-muted)' }}>
                <p style={{ fontSize: 40, marginBottom: 10 }}>🌱</p>
                <p style={{ fontWeight: 600 }}>No hay órdenes en esta sección</p>
              </div>
            ) : (
              filteredOrders.map(renderOrderCard)
            )}
          </div>
        </>
      )}

      {/* TOAST ALERTS */}
      {toastMsg && (
        <div className="toast toast-success" style={{ top: 20, position: 'fixed', zIndex: 9999 }}>
          {toastMsg}
        </div>
      )}

      {/* Toggles responsivos inyectados por CSS */}
      <style>{`
        @media (min-width: 900px) {
          .mobile-header-only { display: none !important; }
          .mobile-orders-only { display: none !important; }
          .desktop-kanban-only { display: block !important; }
        }
        @media (max-width: 899px) {
          .mobile-header-only { display: block !important; }
          .mobile-orders-only { display: flex !important; }
          .desktop-kanban-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}
