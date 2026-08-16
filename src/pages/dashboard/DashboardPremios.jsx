import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

/* ── Toggle iOS Component ── */
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--color-primary)' : 'var(--color-surface-3)',
        border: 'none', position: 'relative', cursor: disabled ? 'default' : 'pointer',
        padding: 0, opacity: disabled ? 0.6 : 1, transition: 'background 200ms'
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 10, background: '#fff',
        position: 'absolute', top: 2, left: value ? 22 : 2,
        transition: 'left 200ms', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}/>
    </button>
  );
}

export default function DashboardPremios() {
  const { activeRestaurant } = useAuth();
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form states
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [costoPuntos, setCostoPuntos] = useState(50);
  const [emoji, setEmoji] = useState('🎁');
  const [activo, setActivo] = useState(true);

  // Estados de Campaña Google Reviews
  const [googleReviewActivo, setGoogleReviewActivo] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [googleReviewTipoPremio, setGoogleReviewTipoPremio] = useState('regalo_fisico');
  const [googleReviewPuntos, setGoogleReviewPuntos] = useState(100);
  const [googleReviewRegaloNombre, setGoogleReviewRegaloNombre] = useState('Bebida Gratis de la Casa');
  const [googleReviewMensaje, setGoogleReviewMensaje] = useState('¡Déjanos tu reseña de 5 estrellas en Google y recibe una Bebida Gratis al instante!');
  const [savingGoogleConfig, setSavingGoogleConfig] = useState(false);

  const fetchPremios = async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('premios')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('costo_puntos', { ascending: true });

      if (error) throw error;
      setPremios(data || []);
    } catch (e) {
      console.error("Error cargando premios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPremios();
    if (activeRestaurant) {
      setGoogleReviewActivo(Boolean(activeRestaurant.google_review_activo));
      setGoogleMapsUrl(activeRestaurant.google_maps_url || '');
      setGoogleReviewTipoPremio(activeRestaurant.google_review_tipo_premio || 'regalo_fisico');
      setGoogleReviewPuntos(activeRestaurant.google_review_puntos || 100);
      setGoogleReviewRegaloNombre(activeRestaurant.google_review_regalo_nombre || 'Bebida Gratis de la Casa');
      setGoogleReviewMensaje(activeRestaurant.google_review_mensaje || '¡Déjanos tu reseña de 5 estrellas en Google y recibe una Bebida Gratis al instante!');
    }
  }, [activeRestaurant]);

  const handleSaveGoogleConfig = async () => {
    if (!activeRestaurant?.id) return;
    setSavingGoogleConfig(true);
    try {
      const { error } = await supabase
        .from('restaurantes')
        .update({
          google_review_activo: googleReviewActivo,
          google_maps_url: googleMapsUrl,
          google_review_tipo_premio: googleReviewTipoPremio,
          google_review_puntos: parseInt(googleReviewPuntos) || 100,
          google_review_regalo_nombre: googleReviewRegaloNombre,
          google_review_mensaje: googleReviewMensaje
        })
        .eq('id', activeRestaurant.id);

      if (error) throw error;
      alert('¡Configuración de campaña de reseñas guardada con éxito!');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la configuración de reseñas');
    } finally {
      setSavingGoogleConfig(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    setCostoPuntos(50);
    setEmoji('🎁');
    setActivo(true);
    setModalOpen(true);
  };

  const openEditModal = (premio) => {
    setEditingId(premio.id);
    setNombre(premio.nombre);
    setDescripcion(premio.descripcion || '');
    setCostoPuntos(premio.costo_puntos);
    setEmoji(premio.emoji || '🎁');
    setActivo(premio.activo);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !costoPuntos) return;
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('premios')
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            costo_puntos: parseInt(costoPuntos),
            emoji: emoji.trim(),
            activo
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('premios')
          .insert([{
            restaurante_id: activeRestaurant.id,
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            costo_puntos: parseInt(costoPuntos),
            emoji: emoji.trim(),
            activo
          }]);

        if (error) throw error;
      }
      setModalOpen(false);
      fetchPremios();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el premio");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este premio?")) return;
    try {
      const { error } = await supabase
        .from('premios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPremios();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el premio");
    }
  };

  const handleToggleActivo = async (id, currentVal) => {
    try {
      const { error } = await supabase
        .from('premios')
        .update({ activo: !currentVal })
        .eq('id', id);

      if (error) throw error;
      setPremios(prev => prev.map(p => p.id === id ? { ...p, activo: !currentVal } : p));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 24, minHeight: '80vh', color: 'var(--color-on-surface)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, margin: 0 }}>
            🎁 Premios Club Lealtad
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '4px 0 0' }}>
            Gestiona los productos o premios que tus clientes pueden canjear con sus puntos.
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            padding: '12px 20px', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          ➕ Nuevo Premio
        </button>
      </div>

      {/* SECCIÓN: CAMPAÑA DE RESEÑAS EN GOOGLE MAPS */}
      <div style={{
        background: 'var(--color-surface)', border: '1.5px solid #3B82F6',
        borderRadius: 24, padding: 24, marginBottom: 32, boxShadow: '0 8px 30px rgba(59,130,246,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>⭐</span>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, margin: 0, color: '#1D4ED8' }}>
                Campaña de Reseñas en Google Maps (Exclusivo Salón)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '2px 0 0' }}>
                Configura el premio que recibirán tus clientes de mesa al mostrar su reseña de 5 estrellas en caja/recepción.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800 }}>Activar Campaña:</span>
            <Toggle value={googleReviewActivo} onChange={setGoogleReviewActivo} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              🔗 Enlace Directo a Reseña en Google Maps
            </label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={e => setGoogleMapsUrl(e.target.value)}
              placeholder="Ej. https://g.page/r/YOUR_MAPS_LINK/review"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              🎁 Tipo de Recompensa
            </label>
            <select
              value={googleReviewTipoPremio}
              onChange={e => setGoogleReviewTipoPremio(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', fontSize: 12, fontWeight: 700 }}
            >
              <option value="regalo_fisico">🍺 Regalo Físico (Bebida / Postre Gratis)</option>
              <option value="puntos">🪙 Puntos del Club Lealtad</option>
            </select>
          </div>

          {googleReviewTipoPremio === 'puntos' ? (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                🪙 Cantidad de Puntos a Regalar
              </label>
              <input
                type="number"
                value={googleReviewPuntos}
                onChange={e => setGoogleReviewPuntos(e.target.value)}
                placeholder="100"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', fontSize: 12 }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                🍺 Nombre del Regalo Físico
              </label>
              <input
                type="text"
                value={googleReviewRegaloNombre}
                onChange={e => setGoogleReviewRegaloNombre(e.target.value)}
                placeholder="Ej: Bebida Gratis de la Casa / Postre del Día"
                style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', fontSize: 12 }}
              />
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              ✍️ Mensaje Promocional del Banner
            </label>
            <input
              type="text"
              value={googleReviewMensaje}
              onChange={e => setGoogleReviewMensaje(e.target.value)}
              placeholder="Ej: ¡Déjanos tu reseña de 5 estrellas en Google y recibe una Bebida Gratis al instante!"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', fontSize: 12 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleSaveGoogleConfig}
            disabled={savingGoogleConfig}
            style={{
              padding: '10px 22px', background: '#2563EB', color: '#fff',
              border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
              opacity: savingGoogleConfig ? 0.7 : 1
            }}
          >
            {savingGoogleConfig ? 'Guardando...' : '💾 Guardar Configuración de Reseñas'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontSize: 14, color: 'var(--color-muted)' }}>
          Cargando premios...
        </div>
      ) : premios.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px dashed var(--color-surface-3)',
          borderRadius: 24, padding: '60px 20px', textAlign: 'center', color: 'var(--color-muted)'
        }}>
          <span style={{ fontSize: 48 }}>🎁</span>
          <p style={{ fontSize: 15, fontWeight: 700, margin: '16px 0 6px' }}>No hay premios configurados</p>
          <p style={{ fontSize: 12, margin: '0 0 20px' }}>Crea tu primer premio para que tus clientes puedan empezar a canjear sus puntos.</p>
          <button onClick={openAddModal} style={{ padding: '10px 18px', background: 'var(--color-surface-2)', border: '1px solid var(--color-surface-3)', borderRadius: 10, fontWeight: 700, cursor: 'pointer', color: 'var(--color-on-surface)' }}>
            Crear Primer Premio
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {premios.map(premio => (
            <div
              key={premio.id}
              style={{
                background: 'var(--color-surface)', border: '1.5px solid var(--color-surface-3)',
                borderRadius: 20, padding: 18, position: 'relative', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', opacity: premio.activo ? 1 : 0.7, transition: 'all 200ms'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 28, width: 48, height: 48, borderRadius: 14, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {premio.emoji || '🎁'}
                    </span>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{premio.nombre}</h4>
                      <span style={{ fontSize: 11, background: 'var(--color-accent)', color: 'var(--color-primary)', fontWeight: 800, padding: '3px 8px', borderRadius: 8, marginTop: 4, display: 'inline-block' }}>
                        🪙 {premio.costo_puntos} puntos
                      </span>
                    </div>
                  </div>
                  <Toggle value={premio.activo} onChange={() => handleToggleActivo(premio.id, premio.activo)} />
                </div>
                {premio.descripcion && (
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0, lineHeight: 1.4 }}>
                    {premio.descripcion}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 18, borderTop: '1px solid var(--color-surface-3)', paddingTop: 14 }}>
                <button
                  onClick={() => openEditModal(premio)}
                  style={{
                    flex: 1, padding: '8px 12px', background: 'var(--color-surface-2)',
                    color: 'var(--color-on-surface)', border: 'none', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(premio.id)}
                  style={{
                    padding: '8px 12px', background: 'transparent',
                    color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over / Modal Form */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <form
            onSubmit={handleSave}
            style={{
              background: 'var(--color-surface)', width: '100%', maxWidth: 450,
              borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)', margin: 20
            }}
          >
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, margin: 0 }}>
              {editingId ? '✏️ Editar Premio' : '➕ Nuevo Premio'}
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Nombre del Premio</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Hamburguesa Smash Gratis"
                style={{ width: '100%', padding: '12px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Emoji</label>
                <input
                  type="text"
                  maxLength={10}
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  placeholder="🎁"
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', textAlign: 'center' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Costo en Puntos</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={costoPuntos}
                  onChange={e => setCostoPuntos(e.target.value)}
                  placeholder="50"
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Descripción</label>
              <textarea
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Explica qué incluye este premio o condiciones..."
                style={{ width: '100%', padding: '12px 14px', background: 'var(--color-surface-2)', border: '1.5px solid var(--color-surface-3)', borderRadius: 12, color: 'var(--color-on-surface)', outline: 'none', minHeight: 80, resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Premio activo para canje</span>
              <Toggle value={activo} onChange={setActivo} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ flex: 1, padding: '12px', background: 'var(--color-surface-2)', color: 'var(--color-on-surface)', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
