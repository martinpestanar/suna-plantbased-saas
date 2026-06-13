import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';
import { useDragScroll } from '../../hooks/useDragScroll.js';

/* ── Toggle iOS ── */
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onChange(!value); }}
      disabled={disabled}
      style={{
        width: 48, height: 28, borderRadius: 14,
        background: value ? 'var(--color-primary)' : 'var(--color-surface-3)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 250ms ease',
        flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 22 : 3,
        width: 22, height: 22, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 260ms cubic-bezier(0.34,1.56,0.64,1)',
      }}/>
    </button>
  );
}

/* ── Skeleton ── */
const SkeletonItem = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--color-surface-3)' }}>
    <div className="skeleton" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }}/>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div className="skeleton" style={{ height: 13, borderRadius: 6, width: '65%' }}/>
      <div className="skeleton" style={{ height: 10, borderRadius: 6, width: '40%' }}/>
    </div>
    <div className="skeleton" style={{ width: 48, height: 28, borderRadius: 14, flexShrink: 0 }}/>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   GESTIÓN DE CARTA — Toggle disponibilidad
   ═══════════════════════════════════════════════════════════ */
export default function DashboardCarta() {
  const { activeRestaurant } = useAuth();
  const [cats, setCats]           = useState([]);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [toggling, setToggling]   = useState({});
  const [toast, setToast]         = useState(null);
  const [searchQ, setSearchQ]     = useState('');

  const dragCategories = useDragScroll({ horizontal: true, vertical: false, stopPropagation: true });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchData();
  }, [activeRestaurant]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData, error: catErr } = await supabase
        .from('categorias_menu')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('nombre');

      if (catErr) throw catErr;

      let itemData = [];
      if (catData && catData.length > 0) {
        const catIds = catData.map(c => c.id);
        const { data: iData, error: iErr } = await supabase
          .from('items_menu')
          .select('id, nombre, precio, imagen_url, disponible, categoria_id, en_oferta, precio_oferta, etiqueta_promo')
          .in('categoria_id', catIds)
          .order('nombre');
        
        if (iErr) throw iErr;
        itemData = iData || [];
      }

      setCats(catData || []);
      setItems(itemData.map(i => ({
        ...i,
        precio: parseFloat(i.precio),
        precio_oferta: i.precio_oferta ? parseFloat(i.precio_oferta) : null
      })));
    } catch (e) {
      console.error(e);
      showToast('Error cargando carta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (itemId, currentValue) => {
    if (toggling[itemId]) return;
    if (navigator.vibrate) navigator.vibrate(8);
    setToggling(prev => ({ ...prev, [itemId]: true }));

    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, disponible: !currentValue } : i));

    try {
      const { error } = await supabase
        .from('items_menu')
        .update({ disponible: !currentValue })
        .eq('id', itemId);
      if (error) throw error;
      showToast(!currentValue ? '✅ Plato habilitado' : '🔴 Plato ocultado del menú');
    } catch {
      // Revert optimistic
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, disponible: currentValue } : i));
      showToast('Error al actualizar', 'error');
    } finally {
      setToggling(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    }
  };

  const handleTogglePromo = async (itemId, val) => {
    if (toggling[itemId]) return;
    if (navigator.vibrate) navigator.vibrate(8);

    if (!val) {
      setToggling(prev => ({ ...prev, [itemId]: true }));
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, en_oferta: false, precio_oferta: null, etiqueta_promo: null } : i));
      try {
        const { error } = await supabase
          .from('items_menu')
          .update({ en_oferta: false, precio_oferta: null, etiqueta_promo: null })
          .eq('id', itemId);
        if (error) throw error;
        showToast('🔥 Oferta desactivada');
      } catch (err) {
        showToast('Error al desactivar oferta', 'error');
      } finally {
        setToggling(prev => { const n = { ...prev }; delete n[itemId]; return n; });
      }
    } else {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, en_oferta: true } : i));
    }
  };

  const updateItemPromoLocal = (itemId, field, val) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: val } : i));
  };

  const savePromoSettings = async (itemId, precio_oferta, etiqueta_promo) => {
    console.log('savePromoSettings called with:', { itemId, precio_oferta, etiqueta_promo });
    if (!precio_oferta || parseFloat(precio_oferta) <= 0) {
      console.log('Validation failed: invalid precio_oferta');
      showToast('Ingresa un precio de oferta válido', 'error');
      return;
    }
    setToggling(prev => ({ ...prev, [itemId]: true }));
    try {
      console.log('Sending update to Supabase...');
      const { data, error } = await supabase
        .from('items_menu')
        .update({
          en_oferta: true,
          precio_oferta: parseFloat(precio_oferta),
          etiqueta_promo: etiqueta_promo ? etiqueta_promo.trim() : null
        })
        .eq('id', itemId)
        .select();
      console.log('Supabase response:', { data, error });
      if (error) throw error;
      showToast('🔥 Oferta guardada exitosamente');
    } catch (err) {
      console.error('Error saving promo settings:', err);
      showToast('Error al guardar oferta', 'error');
    } finally {
      setToggling(prev => { const n = { ...prev }; delete n[itemId]; return n; });
    }
  };

  const filtered = items.filter(it => {
    const inCat = activeCat === 'all' || it.categoria_id === activeCat;
    const inQ = !searchQ || it.nombre.toLowerCase().includes(searchQ.toLowerCase());
    return inCat && inQ;
  });

  const disponibles = filtered.filter(i => i.disponible).length;

  return (
    <div>

      {/* Sub-header STICKY — siempre visible al scrollear */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '16px 20px 12px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-surface-3)'
      }}>
        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder="Buscar plato..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36, borderRadius: 12, fontSize: 13 }}
          />
        </div>
        {/* Category chips */}
        <div 
          ref={dragCategories}
          className="category-strip" 
          style={{ padding: '0 20px 2px', gap: 6, margin: '4px -20px 0' }}
        >
          <button onClick={() => setActiveCat('all')} className={`chip ${activeCat === 'all' ? 'chip-active' : 'chip-default'}`} style={{ fontSize: 12 }}>
            ✨ Todo
          </button>
          {cats.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className={`chip ${activeCat === c.id ? 'chip-active' : 'chip-default'}`} style={{ fontSize: 12 }}>
              {c.icon || '🍽️'} {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!loading && (
        <div style={{ padding: '10px 20px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-surface-3)', display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>
            <span style={{ color: '#40916C', fontWeight: 900 }}>{disponibles}</span> disponibles
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>
            <span style={{ color: '#D90429', fontWeight: 900 }}>{filtered.length - disponibles}</span> ocultos
          </span>
        </div>
      )}

      {/* Lista de platos — fluye en un grid responsivo en desktop */}
      <div style={{ padding: '0 20px 20px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🌿</p>
            <p style={{ fontWeight: 700 }}>No hay platos aquí</p>
          </div>
        ) : (
          <div className="carta-grid">
            {filtered.map(item => (
              <div key={item.id} style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                padding: '14px', border: '1px solid var(--color-surface-3)',
                borderRadius: 'var(--radius-lg)',
                background: item.en_oferta ? 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.03) 100%)' : 'var(--color-surface)',
                borderLeft: item.en_oferta ? '4px solid var(--color-secondary)' : '1px solid var(--color-surface-3)',
                opacity: item.disponible ? 1 : 0.55,
                transition: 'all 300ms ease',
              }}>
                {/* Primera Fila: Imagen, Info, Disponible Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Imagen */}
                  <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                    {item.imagen_url && (
                      <img src={item.imagen_url} alt={item.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 700,
                      color: 'var(--color-on-surface)', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      textDecoration: item.disponible ? 'none' : 'line-through',
                    }}>
                      {item.nombre}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)', marginTop: 2 }}>
                      S/. {item.precio.toFixed(2)}
                      {item.en_oferta && item.precio_oferta && (
                        <span style={{ color: 'var(--color-danger)', marginLeft: 8 }}>
                          🏷️ S/. {parseFloat(item.precio_oferta).toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* Toggle Disponible */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Disp.</span>
                    <Toggle
                      value={item.disponible}
                      onChange={() => toggleItem(item.id, item.disponible)}
                      disabled={!!toggling[item.id]}
                    />
                  </div>
                </div>

                {/* Segunda Fila: Toggle Oferta y campos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px dashed var(--color-surface-3)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔥 Oferta del Día
                    </span>
                    <Toggle
                      value={item.en_oferta || false}
                      onChange={(val) => handleTogglePromo(item.id, val)}
                      disabled={!!toggling[item.id]}
                    />
                  </div>

                  {/* Inputs que se expanden si está en oferta */}
                  {item.en_oferta && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, background: 'var(--color-surface-2)', borderRadius: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Precio Oferta</label>
                          <input
                            type="number" step="any"
                            placeholder="S/. 0.00"
                            value={item.precio_oferta || ''}
                            onChange={(e) => updateItemPromoLocal(item.id, 'precio_oferta', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', background: 'var(--color-surface)', border: '1.5px solid var(--color-surface-3)', borderRadius: 8, fontSize: 11, color: 'var(--color-on-surface)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Etiqueta Promo</label>
                          <input
                            type="text"
                            placeholder="Ej. 2x1, -15%"
                            value={item.etiqueta_promo || ''}
                            onChange={(e) => updateItemPromoLocal(item.id, 'etiqueta_promo', e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', background: 'var(--color-surface)', border: '1.5px solid var(--color-surface-3)', borderRadius: 8, fontSize: 11, color: 'var(--color-on-surface)' }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => savePromoSettings(item.id, item.precio_oferta, item.etiqueta_promo)}
                        style={{
                          background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center', marginTop: 4,
                          boxShadow: '0 2px 6px rgba(27,67,50,0.15)'
                        }}
                      >
                        💾 Guardar Oferta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-on-surface)', color: '#fff',
          padding: '10px 20px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          whiteSpace: 'nowrap', zIndex: 99, animation: 'toast-in 250ms ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
