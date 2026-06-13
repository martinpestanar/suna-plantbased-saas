import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

export default function DashboardInventario() {
  const { activeRestaurant } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCritical, setFilterCritical] = useState(false);
  const [activeCategory, setActiveCategory] = useState('todos');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMermaModal, setShowMermaModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Estados de Promociones IA
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTargetDish, setPromoTargetDish] = useState('');
  const [promoTargetIngredient, setPromoTargetIngredient] = useState('');
  const [promoInstruction, setPromoInstruction] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Estados Formulario Ingrediente
  const [nombre, setNombre] = useState('');
  const [stockActual, setStockActual] = useState('');
  const [stockMinimo, setStockMinimo] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('g');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados Formulario Merma
  const [mermaCantidad, setMermaCantidad] = useState('');
  const [mermaMotivo, setMermaMotivo] = useState('vencido');
  const [savingMerma, setSavingMerma] = useState(false);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ingredientes')
        .select('*')
        .order('nombre');
      if (!error && data) {
        setIngredients(data);
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !stockActual || !stockMinimo || !costoUnitario) return;
    setSaving(true);

    const payload = {
      nombre: nombre.trim(),
      stock_actual: parseFloat(stockActual),
      stock_minimo: parseFloat(stockMinimo),
      unidad_medida: unidadMedida,
      costo_unitario: parseFloat(costoUnitario),
    };

    try {
      let error;
      if (selectedIngredient) {
        const { error: err } = await supabase
          .from('ingredientes')
          .update(payload)
          .eq('id', selectedIngredient.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('ingredientes')
          .insert([payload]);
        error = err;
      }

      if (!error) {
        setShowAddModal(false);
        resetForm();
        fetchIngredients();
        if (navigator.vibrate) navigator.vibrate(10);
      } else {
        alert('Error guardando ingrediente: ' + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMerma = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !mermaCantidad || parseFloat(mermaCantidad) <= 0) return;
    setSavingMerma(true);

    const cantidad = parseFloat(mermaCantidad);

    try {
      const { error: mermaError } = await supabase
        .from('registro_mermas')
        .insert([{
          ingrediente_id: selectedIngredient.id,
          cantidad: cantidad,
          motivo: mermaMotivo
        }]);

      if (mermaError) throw mermaError;

      const nuevoStock = Math.max(0, selectedIngredient.stock_actual - cantidad);
      const { error: updateError } = await supabase
        .from('ingredientes')
        .update({ stock_actual: nuevoStock })
        .eq('id', selectedIngredient.id);

      if (updateError) throw updateError;

      setShowMermaModal(false);
      setMermaCantidad('');
      setSelectedIngredient(null);
      fetchIngredients();
      if (navigator.vibrate) navigator.vibrate([15, 30]);
    } catch (err) {
      console.error(err);
      alert('Error registrando merma: ' + err.message);
    } finally {
      setSavingMerma(false);
    }
  };

  const openEditModal = (ing) => {
    setSelectedIngredient(ing);
    setNombre(ing.nombre);
    setStockActual(ing.stock_actual);
    setStockMinimo(ing.stock_minimo);
    setUnidadMedida(ing.unidad_medida);
    setCostoUnitario(ing.costo_unitario);
    setShowAddModal(true);
  };

  const openNewModal = () => {
    setSelectedIngredient(null);
    resetForm();
    setShowAddModal(true);
  };

  const openMermaModal = (ing) => {
    setSelectedIngredient(ing);
    setMermaCantidad('');
    setMermaMotivo('vencido');
    setShowMermaModal(true);
  };

  const handleOpenPromoModal = (ingName, dishName) => {
    setPromoTargetIngredient(ingName);
    setPromoTargetDish(dishName);
    setPromoInstruction(`Hoy empuja la venta de la ${dishName} mediante el chat de WhatsApp porque nos queda mucho stock de ${ingName.toLowerCase()} fresco.`);
    setShowPromoModal(true);
  };

  const handleDisableDishInBot = async (dishName) => {
    if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
    if (window.confirm(`¿Seguro que deseas desactivar temporalmente ${dishName} de las recomendaciones del Bot? (Insumo agotado)`)) {
      setLoading(true);
      try {
        await supabase.from('propuestas_sistema').insert([{
          tipo_propuesta: 'desactivar_plato_ia',
          descripcion: `Desactivar temporalmente recomendación de ${dishName} por falta de stock.`,
          estado: 'activo',
          meta_data: { plato: dishName }
        }]);

        const { data: ext } = await supabase
          .from('restaurante_info_contexto')
          .select('*')
          .eq('clave', 'platos_agotados')
          .single();

        let nuevoContenido = `${dishName} (Agotado temporalmente)`;
        if (ext) {
          nuevoContenido = ext.contenido + `, ${dishName} (Agotado temporalmente)`;
          await supabase.from('restaurante_info_contexto').update({ contenido: nuevoContenido }).eq('id', ext.id);
        } else {
          await supabase.from('restaurante_info_contexto').insert([{
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            clave: 'platos_agotados',
            contenido: nuevoContenido
          }]);
        }
        
        alert(`🤖 Chatbot IA actualizado: ${dishName} ha sido marcado como agotado en WhatsApp.`);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!promoInstruction.trim()) return;
    setPromoLoading(true);

    try {
      const { error: propErr } = await supabase
        .from('propuestas_sistema')
        .insert([{
          tipo_propuesta: 'promocion_ia',
          descripcion: promoInstruction.trim(),
          estado: 'activo',
          meta_data: { ingrediente: promoTargetIngredient, plato: promoTargetDish }
        }]);

      if (propErr) throw propErr;

      const { data: existingContext } = await supabase
        .from('restaurante_info_contexto')
        .select('*')
        .eq('clave', 'promocion_activa')
        .single();

      if (existingContext) {
        await supabase
          .from('restaurante_info_contexto')
          .update({ contenido: promoInstruction.trim(), updated_at: new Date().toISOString() })
          .eq('id', existingContext.id);
      } else {
        await supabase
          .from('restaurante_info_contexto')
          .insert([{
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            clave: 'promocion_activa',
            contenido: promoInstruction.trim()
          }]);
      }

      setShowPromoModal(false);
      if (navigator.vibrate) navigator.vibrate([10, 30]);
      alert('🤖 ¡Éxito! La instrucción de venta ha sido enviada al chatbot de IA.');
    } catch (err) {
      console.error(err);
      alert('Error al actualizar chatbot: ' + err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  const resetForm = () => {
    setNombre('');
    setStockActual('');
    setStockMinimo('');
    setUnidadMedida('g');
    setCostoUnitario('');
    setSelectedIngredient(null);
  };

  const getCategory = (name) => {
    const n = name.toLowerCase();
    if (n.includes('queso')) return 'quesos';
    if (n.includes('leche') || n.includes('kombucha') || n.includes('jugo')) return 'bebidas';
    if (n.includes('palta') || n.includes('kale') || n.includes('espinaca') || n.includes('champiñon') || n.includes('portobello')) return 'frescos';
    return 'secos';
  };

  const filtered = ingredients.filter(ing => {
    const matchesSearch = ing.nombre.toLowerCase().includes(searchQuery.toLowerCase());
    const isCritical = ing.stock_actual <= ing.stock_minimo;
    const matchesCategory = activeCategory === 'todos' || getCategory(ing.nombre) === activeCategory;
    return filterCritical ? (matchesSearch && isCritical && matchesCategory) : (matchesSearch && matchesCategory);
  });

  const totalValuation = ingredients.reduce((sum, ing) => sum + (ing.stock_actual * ing.costo_unitario), 0);

  /* ── Estilos compartidos para inputs/selects de modales ── */
  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--color-surface-2)',
    border: '1.5px solid var(--color-surface-3)',
    borderRadius: 12, color: 'var(--color-on-surface)',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13,
  };

  /* ── Overlay de fondo para portales ── */
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 99999,
    background: 'rgba(10, 20, 15, 0.80)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', boxSizing: 'border-box',
  };

  /* ── Caja interior de modal ── */
  const modalBoxStyle = {
    background: 'var(--color-surface)', width: '100%',
    borderRadius: 24, padding: '24px 20px',
    border: '1px solid var(--color-surface-3)',
    animation: 'scale-up 200ms ease',
    boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
    maxHeight: '90vh', overflowY: 'auto',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '20px 20px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      
      {/* Encabezado y Acceso */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
            Inventario de Insumos
          </h1>
          <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>
            Control de insumos plant-based y mermas
          </p>
        </div>
        <button
          onClick={openNewModal}
          style={{
            background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 14, padding: '10px 16px',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(27,67,50,0.2)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ➕ Nuevo Insumo
        </button>
      </div>

      {/* SECCIÓN DE ALERTAS DE INSUMOS CRÍTICOS E IA */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.03) 100%)',
        border: '1.5px solid rgba(64,145,108,0.25)',
        borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column', gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 900, color: 'var(--color-on-surface)' }}>
                Optimización de Mermas por IA
              </h3>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
                Inyecta instrucciones al chatbot de WhatsApp para empujar excedentes
              </p>
            </div>
          </div>
          <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
            Mr. Green Bot
          </span>
        </div>

        {/* Lista de sugerencias */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Alerta 1 */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
            borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#D90429', background: '#FEE2E2', padding: '2px 6px', borderRadius: 4 }}>EXCESO / EXPIRA</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>Queso de Cashew Artesanal</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                Riesgo de merma en 2 días. Plato asociado: <strong>Burger Ancestral</strong>
              </p>
            </div>
            <button 
              onClick={() => handleOpenPromoModal('Queso de Cashew Artesanal', 'Burger Ancestral')}
              className="chip chip-active"
              style={{ fontSize: 11, padding: '6px 12px', cursor: 'pointer' }}
            >
              🤖 Empujar Venta
            </button>
          </div>

          {/* Alerta 2 */}
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)',
            borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>STOCK BAJO</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>Hongos Ostra Silvestres</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                Quedan 200g. Plato asociado: <strong>Bowl Matcha & Tofu Crispy</strong>
              </p>
            </div>
            <button 
              onClick={() => handleDisableDishInBot('Bowl Matcha & Tofu Crispy')}
              className="chip chip-default"
              style={{ fontSize: 11, padding: '6px 12px', borderColor: '#EF4444', color: '#EF4444', cursor: 'pointer' }}
            >
              🛑 Desactivar en Bot
            </button>
          </div>
        </div>
      </div>

      {/* Buscador y Filtro Críticos */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px 12px 40px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-surface-3)',
              borderRadius: 14, color: 'var(--color-on-surface)', fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
        </div>
        <button
          onClick={() => setFilterCritical(p => !p)}
          style={{
            background: filterCritical ? '#FEE2E2' : 'var(--color-surface)',
            border: `1.5px solid ${filterCritical ? '#EF4444' : 'var(--color-surface-3)'}`,
            color: filterCritical ? '#EF4444' : 'var(--color-muted)',
            borderRadius: 14, padding: '0 14px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 150ms',
          }}
        >
          ⚠️ {filterCritical ? 'Ver Todos' : 'Críticos'}
        </button>
      </div>

      {/* Chips de Categorías */}
      <div className="category-strip-wrapper" style={{ margin: '-2px -20px 4px' }}>
        <div className="category-strip" style={{ padding: '0 20px' }}>
          {[
            { id: 'todos', label: '✨ Todos' },
            { id: 'quesos', label: '🧀 Quesos' },
            { id: 'frescos', label: '🥦 Frescos' },
            { id: 'bebidas', label: '🥛 Bebidas/Lácteos' },
            { id: 'secos', label: '📦 Secos/Otros' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); if(navigator.vibrate) navigator.vibrate(5); }}
              className={`chip ${activeCategory === cat.id ? 'chip-active' : 'chip-default'}`}
              style={{ padding: '8px 14px', fontSize: 11, borderRadius: 12 }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Valor Almacén</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-primary)', marginTop: 4 }}>
            S/. {totalValuation.toLocaleString([], { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Críticos</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>
            {ingredients.filter(i => i.stock_actual <= i.stock_minimo).length}
          </p>
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total ítems</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 4 }}>{ingredients.length}</p>
        </div>
      </div>

      {/* Lista / Tabla de Insumos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>Cargando almacén...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)', background: 'var(--color-surface)', borderRadius: 20, border: '1px solid var(--color-surface-3)' }}>
          <p style={{ fontSize: 32 }}>📦</p>
          <p style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>No se encontraron ingredientes</p>
        </div>
      ) : (
        <>
          {/* Vista Desktop (Tabla) */}
          <div className="inventario-table-wrapper">
            <table className="inventario-table">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Unidad</th>
                  <th>Costo Unitario</th>
                  <th>Valorizado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ing => {
                  const isCritical = ing.stock_actual <= ing.stock_minimo;
                  const cat = getCategory(ing.nombre);
                  return (
                    <tr key={ing.id} style={{ background: isCritical ? 'rgba(239, 68, 68, 0.02)' : 'none' }}>
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ color: isCritical ? '#EF4444' : 'inherit' }}>
                          {isCritical ? '⚠️ ' : ''}{ing.nombre}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--color-muted)' }}>{cat}</td>
                      <td style={{ fontWeight: 800, color: isCritical ? '#EF4444' : 'var(--color-primary)' }}>
                        {ing.stock_actual}
                      </td>
                      <td>{ing.unidad_medida}</td>
                      <td>S/. {ing.costo_unitario.toFixed(3)}</td>
                      <td style={{ fontWeight: 800 }}>S/. {(ing.stock_actual * ing.costo_unitario).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => openMermaModal(ing)}
                            style={{
                              background: 'rgba(217, 4, 41, 0.08)', border: 'none', borderRadius: 8,
                              padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#D90429',
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ Merma
                          </button>
                          <button
                            onClick={() => openEditModal(ing)}
                            style={{
                              background: 'var(--color-surface-2)', border: 'none', borderRadius: 8,
                              padding: '6px 12px', fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile (Cards actualizadas - ocultadas en CSS de desktop) */}
          <div className="mobile-cards-only" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
            {filtered.map(ing => {
              const isCritical = ing.stock_actual <= ing.stock_minimo;
              const pct = Math.min(100, (ing.stock_actual / (ing.stock_minimo * 2.5)) * 100);
              return (
                <div
                  key={ing.id}
                  style={{
                    background: 'var(--color-surface)',
                    border: `1.5px solid ${isCritical ? 'rgba(239, 68, 68, 0.25)' : 'var(--color-surface-3)'}`,
                    borderRadius: 18, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ing.nombre}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 2 }}>
                        Costo: S/. {ing.costo_unitario.toFixed(3)} / {ing.unidad_medida}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openMermaModal(ing)} style={{ background: 'rgba(217, 4, 41, 0.08)', border: 'none', borderRadius: 10, padding: '6px 10px', fontSize: 11, color: '#D90429', fontWeight: 700, cursor: 'pointer' }}>🗑️ Merma</button>
                      <button onClick={() => openEditModal(ing)} style={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 10, padding: '6px 10px', fontSize: 11, color: 'var(--color-muted)', fontWeight: 700, cursor: 'pointer' }}>✏️ Editar</button>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isCritical ? '#EF4444' : 'var(--color-muted)' }}>{isCritical ? '⚠️ STOCK CRÍTICO' : 'Stock disponible'}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--color-on-surface)' }}>{ing.stock_actual} {ing.unidad_medida}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isCritical ? '#EF4444' : 'var(--color-primary)', borderRadius: 99 }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════ MODAL INGREDIENTE — Portal (escapa del overflow:hidden) ═══════════ */}
      {showAddModal && createPortal(
        <div
          style={overlayStyle}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div style={{ ...modalBoxStyle, maxWidth: 420 }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: 'var(--color-on-surface)', marginBottom: 16 }}>
              {selectedIngredient ? '✏️ Editar Insumo' : '➕ Registrar Nuevo Insumo'}
            </h3>

            <form onSubmit={handleSaveIngredient} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  Nombre del ingrediente
                </label>
                <input
                  required type="text"
                  placeholder="Ej. Queso de Almendras Orgánico"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Stock Inicial
                  </label>
                  <input
                    required type="number" step="any"
                    placeholder="Ej. 1500"
                    value={stockActual}
                    onChange={e => setStockActual(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Stock Mínimo
                  </label>
                  <input
                    required type="number" step="any"
                    placeholder="Ej. 300"
                    value={stockMinimo}
                    onChange={e => setStockMinimo(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Unidad
                  </label>
                  <select value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)} style={inputStyle}>
                    <option value="g">Gramos (g)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="unidades">Unidades</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Costo Unitario (S/.)
                  </label>
                  <input
                    required type="number" step="any"
                    placeholder="Ej. 0.038"
                    value={costoUnitario}
                    onChange={e => setCostoUnitario(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: 13, background: 'none', border: '1px solid var(--color-surface-3)', borderRadius: 14, color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1, padding: 13, background: 'var(--color-primary)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Guardando...' : 'Guardar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════ MODAL MERMA — Portal (escapa del overflow:hidden) ═══════════ */}
      {showMermaModal && selectedIngredient && createPortal(
        <div
          style={overlayStyle}
          onClick={e => { if (e.target === e.currentTarget) setShowMermaModal(false); }}
        >
          <div style={{ ...modalBoxStyle, maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>🗑️</span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 10 }}>
                Registrar Merma Operativa
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginTop: 4 }}>
                Insumo: <span style={{ color: 'var(--color-on-surface)', fontWeight: 800 }}>{selectedIngredient.nombre}</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                Stock actual: <strong>{selectedIngredient.stock_actual} {selectedIngredient.unidad_medida}</strong>
              </p>
            </div>

            <form onSubmit={handleSaveMerma} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  Cantidad Desperdiciada ({selectedIngredient.unidad_medida})
                </label>
                <input
                  required type="number" step="any" min="0.01"
                  max={selectedIngredient.stock_actual}
                  placeholder={`Máx: ${selectedIngredient.stock_actual}`}
                  value={mermaCantidad}
                  onChange={e => setMermaCantidad(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 900, color: '#D90429' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  Motivo de la merma
                </label>
                <select value={mermaMotivo} onChange={e => setMermaMotivo(e.target.value)} style={inputStyle}>
                  <option value="vencido">⚠️ Vencimiento de Lote</option>
                  <option value="mal_estado">🍎 Mal Estado / Podrido</option>
                  <option value="preparacion">🍳 Error de Preparación</option>
                  <option value="otro">⚙️ Otro Motivo</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowMermaModal(false)}
                  style={{ flex: 1, padding: 13, background: 'none', border: '1px solid var(--color-surface-3)', borderRadius: 14, color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMerma}
                  style={{ flex: 1, padding: 13, background: '#D90429', border: 'none', borderRadius: 14, color: '#fff', fontSize: 12, fontWeight: 800, cursor: savingMerma ? 'not-allowed' : 'pointer', opacity: savingMerma ? 0.7 : 1 }}
                >
                  {savingMerma ? 'Registrando...' : 'Descontar y Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ═══════════ MODAL PROMOCIÓN IA — Portal ═══════════ */}
      {showPromoModal && createPortal(
        <div
          style={overlayStyle}
          onClick={e => { if (e.target === e.currentTarget) setShowPromoModal(false); }}
        >
          <div style={{ ...modalBoxStyle, maxWidth: 420 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>🤖</span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 10 }}>
                Ordenar a Chatbot IA
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', fontWeight: 600, marginTop: 4 }}>
                Insumo: <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{promoTargetIngredient}</span>
              </p>
            </div>

            <form onSubmit={handleSavePromo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Instrucción de venta para la IA (WhatsApp)
                </label>
                <textarea
                  required
                  rows="4"
                  value={promoInstruction}
                  onChange={e => setPromoInstruction(e.target.value)}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  style={{ flex: 1, padding: 13, background: 'none', border: '1px solid var(--color-surface-3)', borderRadius: 14, color: 'var(--color-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={promoLoading}
                  style={{ flex: 1, padding: 13, background: 'var(--color-primary)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 12, fontWeight: 800, cursor: promoLoading ? 'not-allowed' : 'pointer', opacity: promoLoading ? 0.7 : 1 }}
                >
                  {promoLoading ? 'Actualizando IA...' : 'Inyectar en Chatbot'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Style overrides inside DashboardInventario for table/mobile card responsive toggles */}
      <style>{`
        @media (min-width: 900px) {
          .mobile-cards-only { display: none !important; }
          .inventario-table-wrapper { display: block !important; }
        }
        @media (max-width: 899px) {
          .mobile-cards-only { display: flex !important; }
          .inventario-table-wrapper { display: none !important; }
        }
      `}</style>

    </div>
  );
}
