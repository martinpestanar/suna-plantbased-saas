import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { useRouter } from './router.jsx';

const Icon = {
  check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  sparkles: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z"/>
    </svg>
  )
};

export default function Onboarding() {
  const { navigate, queryParams } = useRouter();
  const token = queryParams?.token || null;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [targetRestaurant, setTargetRestaurant] = useState(null);

  // Form States
  const [restaurant, setRestaurant] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    yape_numero: '',
    yape_titular: '',
    plin_numero: '',
    bot_nombre: 'Asistente Virtual',
    instrucciones_ia: '',
    politicas_negocio: ''
  });

  const [categories, setCategories] = useState([
    { id: null, nombre: 'Platos Principales', icon: '🍲' },
    { id: null, nombre: 'Bebidas & Refrescos', icon: '🥤' }
  ]);

  const [items, setItems] = useState([
    { nombre: '', precio: '', categoria_index: 0, ingredientes: '', descripcion: '' }
  ]);

  // Cargar datos si viene token (o ID / Slug)
  useEffect(() => {
    async function loadInitialData() {
      if (!token) {
        setInitLoading(false);
        return;
      }

      try {
        setInitLoading(true);
        const { data: res } = await supabase
          .from('restaurantes')
          .select('*')
          .or(`onboarding_token.eq.${token},slug.eq.${token},id.eq.${token}`)
          .maybeSingle();

        if (res) {
          setTargetRestaurant(res);
          setRestaurant({
            nombre: res.nombre || '',
            telefono: res.telefono || '',
            direccion: res.direccion || '',
            yape_numero: res.yape_numero || '',
            yape_titular: res.yape_titular || '',
            plin_numero: res.plin_numero || '',
            bot_nombre: res.bot_nombre || 'Asistente Virtual',
            instrucciones_ia: res.instrucciones_ia || '',
            politicas_negocio: res.politicas_negocio || ''
          });

          // Cargar categorías existentes
          const { data: cats } = await supabase
            .from('categorias_menu')
            .select('*')
            .eq('restaurante_id', res.id)
            .order('created_at', { ascending: true });

          if (cats && cats.length > 0) {
            setCategories(cats.map(c => ({ id: c.id, nombre: c.nombre, icon: c.icon || '🍽️' })));

            // Cargar platos existentes
            const { data: dishes } = await supabase
              .from('items_menu')
              .select('*')
              .eq('restaurante_id', res.id)
              .order('created_at', { ascending: true });

            if (dishes && dishes.length > 0) {
              setItems(dishes.map(d => {
                const catIdx = cats.findIndex(c => c.id === d.categoria_id);
                return {
                  id: d.id,
                  nombre: d.nombre,
                  precio: d.precio?.toString() || '',
                  categoria_index: catIdx >= 0 ? catIdx : 0,
                  ingredientes: d.ingredientes || '',
                  descripcion: d.descripcion || ''
                };
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error cargando datos de onboarding:', err);
      } finally {
        setInitLoading(false);
      }
    }

    loadInitialData();
  }, [token]);

  // Manejadores Categorías
  const addCategory = () => setCategories([...categories, { id: null, nombre: '', icon: '🍽️' }]);
  const updateCategory = (idx, field, value) => {
    const updated = [...categories];
    updated[idx][field] = value;
    setCategories(updated);
  };
  const removeCategory = (idx) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== idx));
      setItems(items.map(it => it.categoria_index === idx ? { ...it, categoria_index: 0 } : it));
    }
  };

  // Manejadores Platos
  const addItem = () => setItems([...items, { nombre: '', precio: '', categoria_index: 0, ingredientes: '', descripcion: '' }]);
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;
    setItems(updated);
  };
  const removeItem = (idx) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  // Guardado Total en Supabase
  const handleFinalSave = async () => {
    if (!restaurant.nombre.trim()) return alert('Por favor ingresa el nombre de tu restaurante');
    setLoading(true);

    try {
      let resId = targetRestaurant?.id;

      // 1. Si no existe restaurante previo, lo creamos
      if (!resId) {
        const cleanSlug = restaurant.nombre
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        const { data: newRes, error: createErr } = await supabase
          .from('restaurantes')
          .insert({
            nombre: restaurant.nombre.trim(),
            slug: cleanSlug,
            telefono: restaurant.telefono.trim() || null,
            direccion: restaurant.direccion.trim() || null,
            yape_numero: restaurant.yape_numero.trim() || null,
            yape_titular: restaurant.yape_titular.trim() || null,
            plin_numero: restaurant.plin_numero.trim() || null,
            bot_nombre: restaurant.bot_nombre.trim() || 'Asistente Virtual',
            instrucciones_ia: restaurant.instrucciones_ia.trim() || null,
            politicas_negocio: restaurant.politicas_negocio.trim() || null,
            onboarding_completado: true
          })
          .select()
          .single();

        if (createErr) throw createErr;
        resId = newRes.id;
      } else {
        // 2. Si ya existe, actualizamos sus datos y marcamos onboarding_completado
        const { error: updErr } = await supabase
          .from('restaurantes')
          .update({
            nombre: restaurant.nombre.trim(),
            telefono: restaurant.telefono.trim() || null,
            direccion: restaurant.direccion.trim() || null,
            yape_numero: restaurant.yape_numero.trim() || null,
            yape_titular: restaurant.yape_titular.trim() || null,
            plin_numero: restaurant.plin_numero.trim() || null,
            bot_nombre: restaurant.bot_nombre.trim() || 'Asistente Virtual',
            instrucciones_ia: restaurant.instrucciones_ia.trim() || null,
            politicas_negocio: restaurant.politicas_negocio.trim() || null,
            onboarding_completado: true
          })
          .eq('id', resId);

        if (updErr) throw updErr;
      }

      // 3. Guardar Categorías en Supabase
      const savedCategoriesMap = {};
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        if (!cat.nombre.trim()) continue;

        if (cat.id) {
          await supabase
            .from('categorias_menu')
            .update({ nombre: cat.nombre, icon: cat.icon })
            .eq('id', cat.id);
          savedCategoriesMap[i] = cat.id;
        } else {
          const { data: newCat } = await supabase
            .from('categorias_menu')
            .insert({
              restaurante_id: resId,
              nombre: cat.nombre,
              icon: cat.icon || '🍽️'
            })
            .select()
            .single();
          if (newCat) savedCategoriesMap[i] = newCat.id;
        }
      }

      // 4. Guardar Platos en Supabase
      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        if (!item.nombre.trim()) continue;

        const targetCatId = savedCategoriesMap[item.categoria_index] || Object.values(savedCategoriesMap)[0] || null;
        const parsedPrice = parseFloat(item.precio) || 0;

        if (item.id) {
          await supabase
            .from('items_menu')
            .update({
              nombre: item.nombre,
              precio: parsedPrice,
              ingredientes: item.ingredientes,
              descripcion: item.descripcion || item.ingredientes,
              categoria_id: targetCatId,
              restaurante_id: resId
            })
            .eq('id', item.id);
        } else {
          await supabase
            .from('items_menu')
            .insert({
              restaurante_id: resId,
              categoria_id: targetCatId,
              nombre: item.nombre,
              precio: parsedPrice,
              ingredientes: item.ingredientes,
              descripcion: item.descripcion || item.ingredientes,
              disponible: true
            });
        }
      }

      // 5. Notificar a n8n si hay webhook activo
      const WEBHOOK_URL = 'https://hooks.koratflow.agency/webhook/onboarding-ia';
      try {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurante_id: resId,
            restaurante: restaurant,
            categorias: categories,
            platos: items
          })
        }).catch(() => {});
      } catch (_) {}

      setSuccess(true);
    } catch (err) {
      console.error('Error guardando onboarding:', err);
      alert('Error al guardar la información: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#090F0C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#10B98120', border: '1px solid #10B98140', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          🌿
        </div>
        <span style={{ color: '#A7F3D0', fontSize: 13, fontWeight: 700 }}>Cargando ficha del negocio...</span>
      </div>
    );
  }

  /* ── STEP 1: NEGOCIO & PAGOS ── */
  const renderStep1 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paso 1 de 4</span>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', margin: '4px 0 6px', fontFamily: 'Outfit, sans-serif' }}>Datos del Negocio & Cobros</h2>
        <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
          Configura la identidad de tu local y las billeteras digitales para recibir pedidos directos.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Nombre Comercial *
          </label>
          <input
            style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Ej. Suna Plant-Based"
            value={restaurant.nombre}
            onChange={e => setRestaurant({ ...restaurant, nombre: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Teléfono WhatsApp de Pedidos
          </label>
          <input
            type="tel"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Ej. +51 987 654 321"
            value={restaurant.telefono}
            onChange={e => setRestaurant({ ...restaurant, telefono: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Dirección del Local
          </label>
          <input
            style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Ej. Av. Miraflores 1245, Lima"
            value={restaurant.direccion}
            onChange={e => setRestaurant({ ...restaurant, direccion: e.target.value })}
          />
        </div>

        {/* Sección de Cobros Yape / Plin */}
        <div style={{ background: '#121C16', border: '1px solid #23372C', borderRadius: 16, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <strong style={{ fontSize: 13, color: '#A7F3D0' }}>Cobro Digital (Yape / Plin)</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>NÚMERO YAPE</label>
              <input
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#F8FAFC', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                placeholder="987654321"
                value={restaurant.yape_numero}
                onChange={e => setRestaurant({ ...restaurant, yape_numero: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>TITULAR YAPE</label>
              <input
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#F8FAFC', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                placeholder="Nombre completo"
                value={restaurant.yape_titular}
                onChange={e => setRestaurant({ ...restaurant, yape_titular: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>NÚMERO PLIN (OPCIONAL)</label>
            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#F8FAFC', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              placeholder="987654321"
              value={restaurant.plin_numero}
              onChange={e => setRestaurant({ ...restaurant, plin_numero: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => setStep(2)}
        disabled={!restaurant.nombre.trim()}
        style={{
          marginTop: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          opacity: !restaurant.nombre.trim() ? 0.6 : 1
        }}
      >
        Continuar a Categorías →
      </button>
    </div>
  );

  /* ── STEP 2: CATEGORÍAS ── */
  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: 18, cursor: 'pointer', padding: 0 }}>
          ←
        </button>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paso 2 de 4</span>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Secciones de tu Carta</h2>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
        Organiza tu menú por categorías (ej. Entradas, Fondos, Bebidas, Postres).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#121C16', padding: '8px 10px', borderRadius: 14, border: '1.5px solid #23372C' }}>
            <input
              style={{ width: 44, height: 44, textAlign: 'center', fontSize: 20, background: '#090F0C', border: '1px solid #23372C', borderRadius: 10, color: '#FFF' }}
              value={cat.icon}
              onChange={e => updateCategory(idx, 'icon', e.target.value)}
              placeholder="🍔"
            />
            <input
              style={{ flex: 1, padding: '12px 10px', background: 'transparent', border: 'none', color: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none' }}
              value={cat.nombre}
              onChange={e => updateCategory(idx, 'nombre', e.target.value)}
              placeholder="Nombre de categoría"
            />
            <button onClick={() => removeCategory(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: 8, cursor: 'pointer', opacity: categories.length > 1 ? 1 : 0.4 }}>
              {Icon.trash()}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addCategory}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px',
          background: '#10B98114',
          border: '1.5px dashed #10B98160',
          borderRadius: 14,
          color: '#34D399',
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer'
        }}
      >
        {Icon.plus()} Añadir otra categoría
      </button>

      <button
        onClick={() => setStep(3)}
        disabled={categories.some(c => !c.nombre.trim())}
        style={{
          marginTop: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          opacity: categories.some(c => !c.nombre.trim()) ? 0.6 : 1
        }}
      >
        Continuar a Platos & Precios →
      </button>
    </div>
  );

  /* ── STEP 3: PLATOS & PRECIOS ── */
  const renderStep3 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: 18, cursor: 'pointer', padding: 0 }}>
          ←
        </button>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paso 3 de 4</span>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Tus Platos y Precios</h2>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
        Agrega los productos principales. Podrás ampliarlos o subir fotos más adelante.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ background: '#121C16', padding: '14px', borderRadius: 16, border: '1.5px solid #23372C', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>Plato #{idx + 1}</span>
              <button onClick={() => removeItem(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, opacity: items.length > 1 ? 1 : 0.4 }}>
                {Icon.trash()}
              </button>
            </div>

            <input
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#F8FAFC', fontSize: 14, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Nombre del plato (ej. Bowl Quinoa Criollo)"
              value={item.nombre}
              onChange={e => updateItem(idx, 'nombre', e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8 }}>
              <select
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#CBD5E1', fontSize: 12.5, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                value={item.categoria_index}
                onChange={e => updateItem(idx, 'categoria_index', parseInt(e.target.value))}
              >
                {categories.map((c, i) => (
                  <option key={i} value={i}>{c.icon} {c.nombre || `Cat ${i+1}`}</option>
                ))}
              </select>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 12, color: '#94A3B8', fontWeight: 800 }}>S/.</span>
                <input
                  type="number"
                  step="0.10"
                  style={{ width: '100%', padding: '10px 10px 10px 30px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#10B981', fontSize: 13, fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="0.00"
                  value={item.precio}
                  onChange={e => updateItem(idx, 'precio', e.target.value)}
                />
              </div>
            </div>

            <input
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: '#090F0C', border: '1px solid #23372C', color: '#94A3B8', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Ingredientes clave o descripción breve..."
              value={item.ingredientes}
              onChange={e => updateItem(idx, 'ingredientes', e.target.value)}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px',
          background: '#10B98114',
          border: '1.5px dashed #10B98160',
          borderRadius: 14,
          color: '#34D399',
          fontSize: 13,
          fontWeight: 800,
          cursor: 'pointer'
        }}
      >
        {Icon.plus()} Añadir otro plato
      </button>

      <button
        onClick={() => setStep(4)}
        disabled={items.some(i => !i.nombre.trim() || !i.precio)}
        style={{
          marginTop: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
          opacity: items.some(i => !i.nombre.trim() || !i.precio) ? 0.6 : 1
        }}
      >
        Continuar al Asistente IA →
      </button>
    </div>
  );

  /* ── STEP 4: ASISTENTE IA & CONFIRMACIÓN ── */
  const renderStep4 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setStep(3)} style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: 18, cursor: 'pointer', padding: 0 }}>
          ←
        </button>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paso 4 de 4</span>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F8FAFC', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Personalidad del Asistente</h2>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
        Define cómo hablará el agente en WhatsApp y sus reglas de atención.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Nombre del Bot / Asistente
          </label>
          <input
            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            placeholder="Ej: Sofia de Suna Gourmet"
            value={restaurant.bot_nombre}
            onChange={e => setRestaurant({ ...restaurant, bot_nombre: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Instrucciones Especiales / Tono de Voz
          </label>
          <textarea
            rows={3}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Ej: Sé muy amable, recomienda siempre la bebida de maracuyá y aclara que todos los pedidos tardan 35 minutos."
            value={restaurant.instrucciones_ia}
            onChange={e => setRestaurant({ ...restaurant, instrucciones_ia: e.target.value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#CBD5E1', marginBottom: 6, textTransform: 'uppercase' }}>
            Políticas de Entrega y Pagos
          </label>
          <textarea
            rows={2}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: '#121C16', border: '1.5px solid #23372C', color: '#F8FAFC', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Ej: Solo enviamos previo envío de constancia de Yape. Cobertura hasta 4km."
            value={restaurant.politicas_negocio}
            onChange={e => setRestaurant({ ...restaurant, politicas_negocio: e.target.value })}
          />
        </div>

        {targetRestaurant?.evolution_instance && (
          <div style={{ background: '#10B98114', border: '1px solid #10B98140', borderRadius: 14, padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🟢</span>
            <div>
              <strong style={{ fontSize: 12, color: '#34D399', display: 'block' }}>WhatsApp Vinculado</strong>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Instancia Evolution: <code>{targetRestaurant.evolution_instance}</code></span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleFinalSave}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Guardando en Base de Datos...' : '🚀 Guardar y Activar Negocio'}
      </button>
    </div>
  );

  /* ── PANTALLA DE ÉXITO ── */
  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#10B98120', border: '2px solid #10B981', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon.check()}
      </div>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', margin: '0 0 6px', fontFamily: 'Outfit, sans-serif' }}>¡Ficha Completada!</h2>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: 360 }}>
          El menú, cobros digitales y las reglas del bot quedaron registrados y listos para operar.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {targetRestaurant?.slug && (
          <button
            onClick={() => navigate(`/${targetRestaurant.slug}/ordenar`)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              background: '#121C16',
              border: '1px solid #10B98140',
              color: '#34D399',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            👀 Ver Menú Digital en Vivo
          </button>
        )}

        <button
          onClick={() => navigate('/superadmin')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
          }}
        >
          Ir al Panel de Control
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', background: '#090F0C', color: '#F8FAFC', display: 'flex', justifyContent: 'center', padding: '16px 12px 60px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 20px', borderBottom: '1px solid #1E2E25', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#10B98120', border: '1px solid #10B98150', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              🌿
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#F8FAFC', display: 'block', letterSpacing: '-0.02em' }}>Suna Setup</span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>{targetRestaurant ? targetRestaurant.nombre : 'Nuevo Negocio'}</span>
            </div>
          </div>
          {token && (
            <span style={{ fontSize: 10, background: '#311042', color: '#E879F9', border: '1px solid #A855F740', padding: '3px 8px', borderRadius: 8, fontWeight: 800 }}>
              Token Activo
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {!success && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 6, width: '100%', background: '#16241C', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(step / 4) * 100}%`, background: 'linear-gradient(90deg, #10B981, #34D399)', transition: 'width 300ms ease' }} />
            </div>
          </div>
        )}

        {/* Vistas Dinámicas */}
        {success ? renderSuccess() : (
          step === 1 ? renderStep1() :
          step === 2 ? renderStep2() :
          step === 3 ? renderStep3() :
          renderStep4()
        )}

      </div>
    </div>
  );
}

