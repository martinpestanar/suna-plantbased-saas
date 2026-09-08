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

// Nichos y plantillas sugeridas para restaurantes nuevos sin platos
const STARTER_PRESETS = {
  plant_based: {
    categoria: 'Bowls & Principales',
    icono: '🥗',
    platos: [
      { nombre: 'Bowl Quinua Superfood', precio: 24.50, desc: 'Mix de quinua orgánica, palta, garbanzos crocantes y vinagreta tahini.' },
      { nombre: 'Burger Proteica de Lentejas', precio: 28.00, desc: 'Medallón artesanal de lentejas con cebolla caramelizada y papas rústicas.' },
      { nombre: 'Kombucha Artesanal 350ml', precio: 12.00, desc: 'Bebida fermentada viva con notas de frutos rojos y jengibre.' }
    ]
  },
  restobar: {
    categoria: 'Cócteles & Tapas',
    icono: '🍸',
    platos: [
      { nombre: 'Chilcano Clásico Quebranta', precio: 22.00, desc: 'Pisco premium, ginger ale artesanal, zumo de limón y gotas de amargo.' },
      { nombre: 'Alitas Glaseadas BBQ Ahumada', precio: 29.00, desc: '8 piezas crujientes con salsa BBQ de la casa y bastones de apio.' },
      { nombre: 'Tequeños Rellenos de Queso', precio: 19.00, desc: '10 tequeños crocantes acompañados de guacamole tradicional.' }
    ]
  },
  cafeteria: {
    categoria: 'Cafés & Pastelería',
    icono: '☕',
    platos: [
      { nombre: 'Capuccino Especial Doble', precio: 11.50, desc: 'Espresso de origen con leche vaporizada y suave microespuma.' },
      { nombre: 'Croissant Mantequilla Almendras', precio: 9.00, desc: 'Hojaldre artesanal francés relleno de crema frangipane y láminas tostadas.' },
      { nombre: 'Tostón de Palta & Huevo Poché', precio: 18.00, desc: 'Pan de masa madre tostado, palta fresca, semillas y aceite de oliva.' }
    ]
  },
  restaurante: {
    categoria: 'Platos de Fondo',
    icono: '🍽️',
    platos: [
      { nombre: 'Lomo Saltado Criollo', precio: 34.00, desc: 'Tierno lomo fino salteado al wok con cebolla, tomate, papas fritas y arroz.' },
      { nombre: 'Arroz con Mariscos a la Brasa', precio: 36.00, desc: 'Arroz meloso con mariscos frescos del día, toque de ají amarillo y salsa criolla.' },
      { nombre: 'Ceviche Clásico de Pesca del Día', precio: 32.00, desc: 'Cubos frescos marinados en leche de tigre con choclo y camote glaseado.' }
    ]
  }
};

/* ═══════════════════════════════════════════════════════════
   GESTIÓN DE CARTA — Toggle disponibilidad + Editor de Catálogo
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Modales
  const [itemModalOpen, setItemModalOpen]   = useState(false);
  const [editingItem, setEditingItem]       = useState(null); // null = nuevo plato
  const [catModalOpen, setCatModalOpen]     = useState(false);
  const [editingCat, setEditingCat]         = useState(null);
  const [savingItem, setSavingItem]         = useState(false);
  const [savingCat, setSavingCat]           = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Form State: Plato
  const [formNombre, setFormNombre]             = useState('');
  const [formPrecio, setFormPrecio]             = useState('');
  const [formDesc, setFormDesc]                 = useState('');
  const [formCatId, setFormCatId]               = useState('');
  const [formImgUrl, setFormImgUrl]             = useState('');
  const [formEnOferta, setFormEnOferta]         = useState(false);
  const [formPrecioOferta, setFormPrecioOferta] = useState('');
  const [formEtiquetaPromo, setFormEtiquetaPromo] = useState('');

  // Form State: Categoría
  const [formCatNombre, setFormCatNombre] = useState('');
  const [formCatIcon, setFormCatIcon]     = useState('🍽️');

  const dragCategories = useDragScroll({ horizontal: true, vertical: false, stopPropagation: true });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // URL pública de la carta digital
  const publicMenuSlug = activeRestaurant?.slug || activeRestaurant?.id;
  const publicMenuUrl = publicMenuSlug
    ? `${window.location.origin}/${publicMenuSlug}`
    : `${window.location.origin}/ordenar`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicMenuUrl);
    setCopiedLink(true);
    showToast('🔗 ¡Enlace de carta copiado al portapapeles!');
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  useEffect(() => {
    if (!activeRestaurant?.id) return;
    fetchData();
  }, [activeRestaurant?.id]);

  const fetchData = async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const { data: catData, error: catErr } = await supabase
        .from('categorias_menu')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('nombre');

      if (catErr) throw catErr;

      const { data: itemData, error: iErr } = await supabase
        .from('items_menu')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('nombre');

      if (iErr) throw iErr;

      setCats(catData || []);
      setItems((itemData || []).map(i => ({
        ...i,
        precio: parseFloat(i.precio || 0),
        precio_oferta: i.precio_oferta ? parseFloat(i.precio_oferta) : null
      })));
    } catch (e) {
      console.error('Error cargando carta:', e);
      showToast('Error cargando carta', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Precargar plantilla de ejemplo si la carta está vacía ── */
  const handleSeedStarterMenu = async () => {
    if (!activeRestaurant?.id) return;
    const presetKey = activeRestaurant?.nicho_preset || 'plant_based';
    const preset = STARTER_PRESETS[presetKey] || STARTER_PRESETS.plant_based;

    setSeedingLoading(true);
    try {
      const { data: newCat, error: cErr } = await supabase
        .from('categorias_menu')
        .insert({
          restaurante_id: activeRestaurant.id,
          nombre: preset.categoria,
          icon: preset.icono,
        })
        .select()
        .single();

      if (cErr) throw cErr;

      const itemsToInsert = preset.platos.map(p => ({
        restaurante_id: activeRestaurant.id,
        categoria_id: newCat.id,
        nombre: p.nombre,
        precio: p.precio,
        descripcion: p.desc,
        disponible: true,
      }));

      const { error: pErr } = await supabase
        .from('items_menu')
        .insert(itemsToInsert);

      if (pErr) throw pErr;

      showToast('✨ ¡Plantilla creada! Ya puedes personalizar tus platos.');
      await fetchData();
    } catch (err) {
      console.error('Error al precargar menú:', err);
      showToast('Error al precargar plantilla', 'error');
    } finally {
      setSeedingLoading(false);
    }
  };

  /* ── Abrir modal para crear plato nuevo ── */
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setFormNombre('');
    setFormPrecio('');
    setFormDesc('');
    setFormCatId(cats.length > 0 ? (activeCat !== 'all' ? activeCat : cats[0].id) : '');
    setFormImgUrl('');
    setFormEnOferta(false);
    setFormPrecioOferta('');
    setFormEtiquetaPromo('');
    setItemModalOpen(true);
  };

  /* ── Abrir modal para editar plato existente ── */
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setFormNombre(item.nombre || '');
    setFormPrecio(item.precio ? String(item.precio) : '');
    setFormDesc(item.descripcion || '');
    setFormCatId(item.categoria_id || (cats[0]?.id ?? ''));
    setFormImgUrl(item.imagen_url || '');
    setFormEnOferta(Boolean(item.en_oferta));
    setFormPrecioOferta(item.precio_oferta ? String(item.precio_oferta) : '');
    setFormEtiquetaPromo(item.etiqueta_promo || '');
    setItemModalOpen(true);
  };

  /* ── Guardar Plato (Crear o Actualizar) ── */
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!formNombre.trim()) return showToast('Ingresa el nombre del plato', 'error');
    if (!formPrecio || isNaN(parseFloat(formPrecio)) || parseFloat(formPrecio) <= 0) {
      return showToast('Ingresa un precio válido mayor a 0', 'error');
    }
    if (!formCatId && cats.length > 0) {
      return showToast('Selecciona una categoría para el plato', 'error');
    }

    setSavingItem(true);
    try {
      const payload = {
        restaurante_id: activeRestaurant.id,
        nombre: formNombre.trim(),
        precio: parseFloat(formPrecio),
        descripcion: formDesc.trim() || null,
        categoria_id: formCatId || null,
        imagen_url: formImgUrl.trim() || null,
        en_oferta: formEnOferta,
        precio_oferta: formEnOferta && formPrecioOferta ? parseFloat(formPrecioOferta) : null,
        etiqueta_promo: formEnOferta && formEtiquetaPromo ? formEtiquetaPromo.trim() : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('items_menu')
          .update(payload)
          .eq('id', editingItem.id);

        if (error) throw error;
        showToast('✅ Plato actualizado correctamente');
      } else {
        payload.disponible = true;
        const { error } = await supabase
          .from('items_menu')
          .insert([payload]);

        if (error) throw error;
        showToast('🎉 Plato agregado al menú');
      }

      setItemModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Error guardando plato:', err);
      showToast('Error al guardar el plato', 'error');
    } finally {
      setSavingItem(false);
    }
  };

  /* ── Eliminar Plato ── */
  const handleDeleteItem = async (itemId, itemName) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar "${itemName}" de tu carta?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('items_menu')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      showToast('🗑️ Plato eliminado');
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Error al eliminar plato:', err);
      showToast('No se pudo eliminar el plato', 'error');
    }
  };

  /* ── Guardar / Crear Categoría ── */
  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!formCatNombre.trim()) return showToast('Ingresa el nombre de la categoría', 'error');

    setSavingCat(true);
    try {
      if (editingCat) {
        const { error } = await supabase
          .from('categorias_menu')
          .update({ nombre: formCatNombre.trim(), icon: formCatIcon.trim() || '🍽️' })
          .eq('id', editingCat.id);

        if (error) throw error;
        showToast('Categoría actualizada');
      } else {
        const { data, error } = await supabase
          .from('categorias_menu')
          .insert([{
            restaurante_id: activeRestaurant.id,
            nombre: formCatNombre.trim(),
            icon: formCatIcon.trim() || '🍽️'
          }])
          .select()
          .single();

        if (error) throw error;
        showToast('🎉 Nueva categoría creada');
        if (data) setActiveCat(data.id);
      }

      setCatModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error('Error con categoría:', err);
      showToast('Error al guardar categoría', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  const filtered = items.filter(it => {
    const inCat = activeCat === 'all' || it.categoria_id === activeCat;
    const inQ = !searchQ || it.nombre.toLowerCase().includes(searchQ.toLowerCase());
    return inCat && inQ;
  });

  const disponibles = filtered.filter(i => i.disponible).length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>

      {/* ── BANNER LINK PÚBLICO CARTA DIGITAL (HERO MOBILE) ── */}
      <div style={{
        margin: '12px 16px 16px',
        padding: '16px 18px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 100%)',
        border: '1.5px solid rgba(16,185,129,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 18px rgba(16,185,129,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: 'var(--color-primary, #10B981)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
            }}>
              🌐
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)' }}>
                Tu Carta Digital Pública
              </p>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit, sans-serif' }}>
                {activeRestaurant?.nombre || 'Mi Restaurante'}
              </h4>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={copyPublicLink}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                background: copiedLink ? '#10B981' : 'var(--color-surface, #fff)',
                color: copiedLink ? '#fff' : 'var(--color-primary, #10B981)',
                border: '1.5px solid var(--color-primary, #10B981)',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                transition: 'all 200ms',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              {copiedLink ? '✓ Copiado' : '📋 Copiar Link'}
            </button>
            <a
              href={publicMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                background: 'var(--color-primary, #10B981)',
                color: '#fff', textDecoration: 'none',
                fontSize: 12, fontWeight: 800,
                boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
              }}
            >
              Ver Carta ↗
            </a>
          </div>
        </div>

        {/* URL chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--color-surface, #fff)', padding: '6px 12px',
          borderRadius: 10, border: '1px solid var(--color-surface-3, #E2E8F0)',
          overflow: 'hidden'
        }}>
          <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>🔗</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary, #10B981)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {publicMenuUrl}
          </span>
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN PRINCIPALES: NUEVO PLATO & NUEVA CATEGORÍA ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px 12px', gap: 10, flexWrap: 'wrap'
      }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)' }}>
            Carta & Menú
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
            Administra platos, precios, ofertas y disponibilidad en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 'max-content' }}>
          <button
            onClick={() => { setEditingCat(null); setFormCatNombre(''); setFormCatIcon('🍽️'); setCatModalOpen(true); }}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 14,
              background: 'var(--color-surface, #fff)', border: '1.5px solid var(--color-surface-3, #CBD5E1)',
              color: 'var(--color-on-surface)', fontSize: 12, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)', whiteSpace: 'nowrap'
            }}
          >
            📁 + Categoría
          </button>

          <button
            onClick={handleOpenCreateItem}
            style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 14,
              background: 'var(--color-primary, #10B981)', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)', whiteSpace: 'nowrap'
            }}
          >
            🍔 + Nuevo Plato
          </button>
        </div>
      </div>

      {/* Sub-header STICKY — Buscador y chips de categorías */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        padding: '12px 16px 10px',
        background: 'var(--color-surface, #fff)',
        borderBottom: '1px solid var(--color-surface-3, #E2E8F0)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2.5" strokeLinecap="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text" placeholder="Buscar por nombre de plato..."
            value={searchQ} onChange={e => setSearchQ(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 36, borderRadius: 14, fontSize: 13, height: 42 }}
          />
        </div>

        {/* Category chips con drag horizontal */}
        <div 
          ref={dragCategories}
          className="category-strip" 
          style={{ padding: '0 4px 2px', gap: 6 }}
        >
          <button
            onClick={() => setActiveCat('all')}
            className={`chip ${activeCat === 'all' ? 'chip-active' : 'chip-default'}`}
            style={{ fontSize: 12, borderRadius: 12, padding: '6px 14px', fontWeight: 800 }}
          >
            ✨ Todo ({items.length})
          </button>
          {cats.map(c => {
            const count = items.filter(it => it.categoria_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`chip ${activeCat === c.id ? 'chip-active' : 'chip-default'}`}
                style={{ fontSize: 12, borderRadius: 12, padding: '6px 14px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>{c.icon || '🍽️'}</span>
                <span>{c.nombre}</span>
                <span style={{ opacity: 0.6, fontSize: 10 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row informativa */}
      {!loading && items.length > 0 && (
        <div style={{
          padding: '8px 16px', background: 'var(--color-surface-2, #F8FAFC)',
          borderBottom: '1px solid var(--color-surface-3, #E2E8F0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontWeight: 700, color: 'var(--color-muted)' }}>
              <span style={{ color: '#10B981', fontWeight: 900 }}>{disponibles}</span> disponibles
            </span>
            <span style={{ fontWeight: 700, color: 'var(--color-muted)' }}>
              <span style={{ color: '#EF4444', fontWeight: 900 }}>{filtered.length - disponibles}</span> pausados
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>
            Toca ✏️ Editar para cambiar precios
          </span>
        </div>
      )}

      {/* LISTADO DE PLATOS */}
      <div style={{ padding: '16px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        ) : items.length === 0 ? (
          /* Estado Vacío Intuitivo con opción de precarga */
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--color-surface, #fff)',
            borderRadius: 24, border: '2px dashed var(--color-surface-3, #CBD5E1)',
            margin: '8px 0'
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>
              🍽️
            </div>
            <h3 style={{ margin: '0 0 6px', fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Tu carta aún está vacía
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.5 }}>
              Agrega tus platos con sus precios y fotos para que tus clientes puedan verlos y pedir inmediatamente por tu carta digital o WhatsApp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
              <button
                onClick={handleOpenCreateItem}
                style={{
                  padding: '12px 24px', borderRadius: 14,
                  background: 'var(--color-primary, #10B981)', color: '#fff', border: 'none',
                  fontSize: 14, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                }}
              >
                + Crear Primer Plato
              </button>

              <button
                onClick={handleSeedStarterMenu}
                disabled={seedingLoading}
                style={{
                  padding: '12px 20px', borderRadius: 14,
                  background: 'var(--color-surface-2, #F1F5F9)', color: 'var(--color-on-surface)',
                  border: '1.5px solid var(--color-surface-3, #CBD5E1)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer'
                }}
              >
                {seedingLoading ? 'Cargando...' : '✨ Cargar 3 platos sugeridos para empezar'}
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-muted)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔍</p>
            <p style={{ fontWeight: 800, color: 'var(--color-on-surface)' }}>No se encontraron platos</p>
            <p style={{ fontSize: 12 }}>Prueba con otro término de búsqueda o categoría</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {filtered.map(item => {
              const itemCat = cats.find(c => c.id === item.categoria_id);
              return (
                <div key={item.id} style={{
                  display: 'flex', flexDirection: 'column', gap: 12,
                  padding: '16px', borderRadius: 20,
                  background: item.en_oferta ? 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.02) 100%)' : 'var(--color-surface, #fff)',
                  border: item.en_oferta ? '1.5px solid rgba(16,185,129,0.3)' : '1px solid var(--color-surface-3, #E2E8F0)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  opacity: item.disponible ? 1 : 0.65,
                  transition: 'all 200ms ease',
                }}>
                  {/* Fila Superior: Foto, Datos principales y Switch Disponibilidad */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Foto o placeholder */}
                    <div style={{
                      width: 68, height: 68, borderRadius: 16, flexShrink: 0,
                      background: 'var(--color-surface-2, #F1F5F9)',
                      border: '1px solid var(--color-surface-3, #E2E8F0)',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 26
                    }}>
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url} alt={item.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span>{itemCat?.icon || '🍽️'}</span>
                      )}
                    </div>

                    {/* Datos */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {itemCat && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', background: 'var(--color-surface-2, #F1F5F9)', padding: '2px 6px', borderRadius: 6 }}>
                            {itemCat.icon} {itemCat.nombre}
                          </span>
                        )}
                        {item.en_oferta && (
                          <span style={{ fontSize: 10, fontWeight: 900, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: 6 }}>
                            🔥 {item.etiqueta_promo || 'OFERTA'}
                          </span>
                        )}
                      </div>

                      <h4 style={{
                        margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800,
                        color: 'var(--color-on-surface)', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        textDecoration: item.disponible ? 'none' : 'line-through'
                      }}>
                        {item.nombre}
                      </h4>

                      {item.descripcion && (
                        <p style={{
                          margin: '3px 0 6px', fontSize: 11, color: 'var(--color-muted)',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden', lineHeight: 1.3
                        }}>
                          {item.descripcion}
                        </p>
                      )}

                      {/* Precio */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                        <span style={{
                          fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900,
                          color: item.en_oferta ? 'var(--color-muted)' : 'var(--color-primary, #10B981)',
                          textDecoration: item.en_oferta ? 'line-through' : 'none'
                        }}>
                          S/. {item.precio.toFixed(2)}
                        </span>
                        {item.en_oferta && item.precio_oferta && (
                          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: '#EF4444' }}>
                            S/. {item.precio_oferta.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Switch Disponible */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                        {item.disponible ? 'Activo' : 'Pausado'}
                      </span>
                      <Toggle
                        value={item.disponible}
                        onChange={() => toggleItem(item.id, item.disponible)}
                        disabled={!!toggling[item.id]}
                      />
                    </div>
                  </div>

                  {/* Fila Inferior de Botones Rápidos (First Mobile) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-surface-3, #F1F5F9)'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditItem(item)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 10,
                        background: 'var(--color-surface-2, #F1F5F9)',
                        border: '1px solid var(--color-surface-3, #E2E8F0)',
                        fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️ Editar Plato y Precios
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.nombre)}
                      title="Eliminar plato"
                      style={{
                        padding: '6px 10px', borderRadius: 10,
                        background: 'transparent', border: 'none',
                        fontSize: 13, color: '#EF4444', cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREAR / EDITAR PLATO (DRAWER FIRST MOBILE)      */}
      {/* ────────────────────────────────────────────────────────── */}
      {itemModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={e => { if (e.target === e.currentTarget) setItemModalOpen(false); }}>
          <div style={{
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--color-surface, #fff)',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px 32px',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'sheet-up 250ms cubic-bezier(0.16,1,0.3,1)'
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--color-surface-3, #CBD5E1)', margin: '0 auto 4px' }}/>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: 'var(--color-on-surface)' }}>
                  {editingItem ? '✏️ Editar Plato' : '🍔 Nuevo Plato'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                  Aparecerá inmediatamente en tu carta digital y en el bot
                </p>
              </div>
              <button
                onClick={() => setItemModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--color-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  Nombre del Plato *
                </label>
                <input
                  type="text" required placeholder="Ej. Lomo Saltado Criollo, Burger Clásica"
                  value={formNombre} onChange={e => setFormNombre(e.target.value)}
                  className="input-field"
                  style={{ borderRadius: 12, fontSize: 13, height: 42 }}
                />
              </div>

              {/* Precio y Categoría */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                    Precio (S/.) *
                  </label>
                  <input
                    type="number" step="any" required placeholder="28.50"
                    value={formPrecio} onChange={e => setFormPrecio(e.target.value)}
                    className="input-field"
                    style={{ borderRadius: 12, fontSize: 14, fontWeight: 800, height: 42 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                    Categoría
                  </label>
                  <select
                    value={formCatId} onChange={e => setFormCatId(e.target.value)}
                    className="input-field"
                    style={{ borderRadius: 12, fontSize: 13, height: 42 }}
                  >
                    <option value="">Seleccionar...</option>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.icon || '🍽️'} {c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  Descripción / Ingredientes (Opcional)
                </label>
                <textarea
                  rows={2} placeholder="Detalla ingredientes, guarniciones o notas para tentar al cliente..."
                  value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  className="input-field"
                  style={{ borderRadius: 12, fontSize: 12, resize: 'none', padding: '8px 12px' }}
                />
              </div>

              {/* Foto URL */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url" placeholder="https://ejemplo.com/foto-plato.jpg"
                  value={formImgUrl} onChange={e => setFormImgUrl(e.target.value)}
                  className="input-field"
                  style={{ borderRadius: 12, fontSize: 12, height: 38 }}
                />
              </div>

              {/* Sección Oferta Especial */}
              <div style={{
                background: 'var(--color-surface-2, #F8FAFC)', padding: '12px 14px',
                borderRadius: 16, border: '1px solid var(--color-surface-3, #E2E8F0)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)' }}>
                    🔥 Activar Precio de Oferta
                  </span>
                  <Toggle value={formEnOferta} onChange={setFormEnOferta} />
                </div>

                {formEnOferta && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 3 }}>
                        Precio Oferta (S/.)
                      </label>
                      <input
                        type="number" step="any" placeholder="19.90"
                        value={formPrecioOferta} onChange={e => setFormPrecioOferta(e.target.value)}
                        className="input-field"
                        style={{ borderRadius: 10, fontSize: 13, height: 38 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 3 }}>
                        Etiqueta (Ej: 2x1, -20%)
                      </label>
                      <input
                        type="text" placeholder="-20% HOY"
                        value={formEtiquetaPromo} onChange={e => setFormEtiquetaPromo(e.target.value)}
                        className="input-field"
                        style={{ borderRadius: 10, fontSize: 13, height: 38 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Guardar */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button
                  type="button" onClick={() => setItemModalOpen(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 14,
                    background: 'var(--color-surface-2, #F1F5F9)', border: '1px solid var(--color-surface-3, #CBD5E1)',
                    fontSize: 13, fontWeight: 800, color: 'var(--color-muted)', cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={savingItem}
                  style={{
                    flex: 2, padding: '12px', borderRadius: 14,
                    background: 'var(--color-primary, #10B981)', border: 'none',
                    fontSize: 14, fontWeight: 900, color: '#fff', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
                  }}
                >
                  {savingItem ? 'Guardando...' : editingItem ? 'Actualizar Plato' : 'Guardar y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CREAR / EDITAR CATEGORÍA                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {catModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }} onClick={e => { if (e.target === e.currentTarget) setCatModalOpen(false); }}>
          <div style={{
            width: '100%', maxWidth: 400,
            background: 'var(--color-surface, #fff)',
            borderRadius: 24, padding: '22px 20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: 'var(--color-on-surface)' }}>
                {editingCat ? 'Editar Categoría' : '📁 Nueva Categoría'}
              </h3>
              <button onClick={() => setCatModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCat} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  Nombre de Categoría *
                </label>
                <input
                  type="text" required placeholder="Ej. Hamburguesas, Tragos, Postres"
                  value={formCatNombre} onChange={e => setFormCatNombre(e.target.value)}
                  className="input-field"
                  style={{ borderRadius: 12, fontSize: 13, height: 42 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 4 }}>
                  Emoji o Ícono
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['🍔', '🍕', '🥗', '☕', '🍸', '🍰', '🥩', '🍣', '🍟', '🥤'].map(emoji => (
                    <button
                      key={emoji} type="button"
                      onClick={() => setFormCatIcon(emoji)}
                      style={{
                        padding: '6px 8px', borderRadius: 8, fontSize: 18,
                        background: formCatIcon === emoji ? 'var(--color-primary, #10B981)' : 'var(--color-surface-2, #F1F5F9)',
                        border: 'none', cursor: 'pointer',
                        transform: formCatIcon === emoji ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 150ms'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button" onClick={() => setCatModalOpen(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12,
                    background: 'var(--color-surface-2, #F1F5F9)', border: '1px solid var(--color-surface-3, #CBD5E1)',
                    fontSize: 12, fontWeight: 800, color: 'var(--color-muted)', cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={savingCat}
                  style={{
                    flex: 2, padding: '10px', borderRadius: 12,
                    background: 'var(--color-primary, #10B981)', border: 'none',
                    fontSize: 13, fontWeight: 900, color: '#fff', cursor: 'pointer'
                  }}
                >
                  {savingCat ? 'Guardando...' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notificación */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 85, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-on-surface, #0F172A)', color: '#fff',
          padding: '10px 20px', borderRadius: 999, fontSize: 12, fontWeight: 800,
          whiteSpace: 'nowrap', zIndex: 9999, animation: 'toast-in 250ms ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
