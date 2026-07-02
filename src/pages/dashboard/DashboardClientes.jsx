import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';
import { RiWhatsappLine, RiEditLine, RiDeleteBinLine, RiUserAddLine } from 'react-icons/ri';

const AUDIENCIAS = [
  { id: 'todas', label: '👥 Todos', color: 'var(--color-primary)' },
  { id: 'vip', label: '⭐ VIPs', color: '#D8A020' },
  { id: 'nuevo', label: '🌱 Nuevos', color: 'var(--color-secondary)' },
  { id: 'inactivo', label: '💤 Inactivos', color: '#EF4444' },
];

export default function DashboardClientes() {
  const { activeRestaurant } = useAuth();
  
  // Estados CRM
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('todas');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [pointsAdjustment, setPointsAdjustment] = useState('');

  // Estados del CRUD
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetClient, setEditTargetClient] = useState(null);

  // Campos del formulario
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formPuntos, setFormPuntos] = useState('0');

  // Estados Lealtad (Programa de puntos)
  const [pointsActive, setPointsActive] = useState(true);
  const [pointsRate, setPointsRate] = useState(1); // S/. 1 = 1 Punto
  const [rewards, setRewards] = useState([
    { id: 1, name: '🥤 Gaseosa Personal', points: 40 },
    { id: 2, name: '🍟 Papas Fritas Medianas', points: 80 },
    { id: 3, name: '🍔 Hamburguesa Clásica Gratis', points: 150 },
    { id: 4, name: '🥗 Bowl Vegano + Bebida', points: 200 },
  ]);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardPoints, setNewRewardPoints] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // Carga de clientes reales
  const fetchClientes = useCallback(async () => {
    if (!activeRestaurant?.id) return;
    setLoading(true);
    try {
      // 1. Traer todos los clientes de la base de datos
      const { data: clientsData, error: clientsErr } = await supabase
        .from('clientes')
        .select('*')
        .eq('restaurante_id', activeRestaurant.id)
        .order('nombre', { ascending: true });

      if (clientsErr) throw clientsErr;

      // 2. Traer las órdenes para calcular consumos acumulados
      const { data: ordersData, error: ordersErr } = await supabase
        .from('ordenes')
        .select('total, created_at, cliente_id')
        .eq('restaurante_id', activeRestaurant.id);

      if (ordersErr) throw ordersErr;

      // Agrupar compras por cliente
      const ordersMap = {};
      ordersData?.forEach(o => {
        if (!o.cliente_id) return;
        if (!ordersMap[o.cliente_id]) {
          ordersMap[o.cliente_id] = {
            totalSpent: 0,
            ordersCount: 0,
            lastOrderDate: null,
          };
        }
        ordersMap[o.cliente_id].totalSpent += parseFloat(o.total || 0);
        ordersMap[o.cliente_id].ordersCount += 1;
        const oDate = new Date(o.created_at);
        if (!ordersMap[o.cliente_id].lastOrderDate || oDate > new Date(ordersMap[o.cliente_id].lastOrderDate)) {
          ordersMap[o.cliente_id].lastOrderDate = o.created_at;
        }
      });

      // Mapear combinando la información
      const clientsList = (clientsData || []).map(c => {
        const stats = ordersMap[c.id] || {
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: null,
        };

        // Determinar segmento
        let segment = 'nuevo';
        const daysSinceLastOrder = stats.lastOrderDate 
          ? Math.floor((Date.now() - new Date(stats.lastOrderDate)) / (1000 * 60 * 60 * 24))
          : 999;

        if (stats.ordersCount >= 5 || stats.totalSpent >= 150) {
          segment = 'vip';
        } else if (daysSinceLastOrder > 20) {
          segment = 'inactivo';
        } else if (stats.ordersCount > 1) {
          segment = 'frecuente';
        }

        return {
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          puntos: c.puntos || 0,
          totalSpent: stats.totalSpent,
          ordersCount: stats.ordersCount,
          lastOrderDate: stats.lastOrderDate,
          segment,
        };
      });

      setClientes(clientsList);
    } catch (err) {
      console.error('Error fetching CRM clients:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRestaurant]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Crear cliente (Agregar)
  const handleAddCliente = async (e) => {
    e.preventDefault();
    if (!formNombre || !formTelefono || !activeRestaurant?.id) return;
    try {
      const nuevoCliente = {
        nombre: formNombre,
        telefono: formTelefono,
        puntos: parseInt(formPuntos) || 0,
        restaurante_id: activeRestaurant.id,
      };
      
      const { error } = await supabase
        .from('clientes')
        .insert([nuevoCliente]);
      
      if (error) throw error;
      
      setFormNombre('');
      setFormTelefono('');
      setFormPuntos('0');
      setIsAddModalOpen(false);
      fetchClientes();
    } catch (err) {
      console.error('Error adding client:', err);
      alert('Error al agregar cliente: ' + err.message);
    }
  };

  // Editar cliente
  const handleEditCliente = async (e) => {
    e.preventDefault();
    if (!editTargetClient || !formNombre || !formTelefono) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          nombre: formNombre,
          telefono: formTelefono,
          puntos: parseInt(formPuntos) || 0,
        })
        .eq('id', editTargetClient.id);

      if (error) throw error;

      setIsEditModalOpen(false);
      setEditTargetClient(null);
      setFormNombre('');
      setFormTelefono('');
      setFormPuntos('0');
      
      // Actualizar el cliente seleccionado si es el mismo
      if (selectedCliente?.id === editTargetClient.id) {
        setSelectedCliente(prev => ({
          ...prev,
          nombre: formNombre,
          telefono: formTelefono,
          puntos: parseInt(formPuntos) || 0,
        }));
      }
      
      fetchClientes();
    } catch (err) {
      console.error('Error updating client:', err);
      alert('Error al actualizar cliente: ' + err.message);
    }
  };

  // Eliminar cliente
  const handleDeleteCliente = async (clienteId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar a este cliente? Esto también eliminará su historial de órdenes de forma permanente.')) return;
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;

      if (selectedCliente?.id === clienteId) {
        setSelectedCliente(null);
      }
      fetchClientes();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Error al eliminar cliente: ' + err.message);
    }
  };

  // Agregar nuevo premio de canje
  const handleAddReward = (e) => {
    e.preventDefault();
    if (!newRewardName || !newRewardPoints) return;
    const r = {
      id: Date.now(),
      name: newRewardName,
      points: parseInt(newRewardPoints),
    };
    setRewards(prev => [...prev, r]);
    setNewRewardName('');
    setNewRewardPoints('');
  };

  // Remover premio
  const handleRemoveReward = (id) => {
    setRewards(prev => prev.filter(item => item.id !== id));
  };

  // Ajuste manual de puntos (Persistido)
  const handleAdjustPoints = async (clienteId, operation) => {
    const value = parseInt(pointsAdjustment);
    if (isNaN(value) || value <= 0) return;

    const target = clientes.find(c => c.id === clienteId);
    if (!target) return;

    const currentPoints = target.puntos || 0;
    const newPoints = operation === 'add' ? currentPoints + value : Math.max(0, currentPoints - value);

    try {
      const { error } = await supabase
        .from('clientes')
        .update({ puntos: newPoints })
        .eq('id', clienteId);

      if (error) throw error;

      setClientes(prev => prev.map(c => {
        if (c.id === clienteId) {
          return { ...c, puntos: newPoints };
        }
        return c;
      }));
      setPointsAdjustment('');
      if (selectedCliente?.id === clienteId) {
        setSelectedCliente(prev => ({
          ...prev,
          puntos: newPoints
        }));
      }
    } catch (err) {
      console.error('Error adjusting points:', err);
      alert('Error al ajustar puntos: ' + err.message);
    }
  };

  // Filtros y búsquedas
  const filteredList = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(searchQ.toLowerCase()) || c.telefono.includes(searchQ);
    const matchSegment = selectedSegment === 'todas' ? true : c.segment === selectedSegment;
    return matchSearch && matchSegment;
  });

  // Estadísticas del CRM
  const stats = {
    total: clientes.length,
    vips: clientes.filter(c => c.segment === 'vip').length,
    inactivos: clientes.filter(c => c.segment === 'inactivos' || c.segment === 'inactivo').length,
    puntosEmitidos: clientes.reduce((acc, c) => acc + (c.puntos || 0), 0),
  };

  // Enlace directo de WhatsApp
  const getWhatsAppLink = (nombre, telefono, puntos) => {
    const text = `¡Hola ${nombre}! Te escribimos de Suna. Queremos contarte que tienes acumulado un total de ${puntos} Puntos en nuestro Club de Lealtad. ¡Puedes canjearlos por premios increíbles en tu próxima visita! 🍔✨`;
    return `https://wa.me/51${telefono}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* HEADER Y ESTADÍSTICAS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: 'var(--color-on-surface)', margin: 0 }}>
            Agenda de Clientes & Programa de Lealtad
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
            Administra tus contactos, consulta su historial de consumos y configura las reglas del club de puntos.
          </p>
        </div>
        <button
          onClick={() => {
            setFormNombre('');
            setFormTelefono('');
            setFormPuntos('0');
            setIsAddModalOpen(true);
          }}
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(64,145,108,0.2)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <RiUserAddLine size={16} /> Agregar Cliente
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Clientes Registrados', value: stats.total, emoji: '👥', color: 'var(--color-primary)' },
          { label: 'Clientes VIP', value: stats.vips, emoji: '⭐', color: '#D8A020' },
          { label: 'Clientes Inactivos', value: stats.inactivos, emoji: '💤', color: '#EF4444' },
          { label: 'Puntos Distribuidos', value: `${stats.puntosEmitidos} pts`, emoji: '🪙', color: 'var(--color-secondary)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-surface-3)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>{s.emoji}</span>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* CONFIGURACIÓN DEL CLUB DE PUNTOS */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1.5px solid var(--color-surface-3)',
        borderRadius: 20,
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowConfig(!showConfig)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🪙</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0 }}>Configurar Club de Puntos y Canjes</p>
              <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>Reglas de fidelización de tu marca y catálogo de premios.</p>
            </div>
          </div>
          <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: 12 }}>
            {showConfig ? 'Ocultar ajustes ▴' : 'Configurar ▾'}
          </span>
        </div>

        {showConfig && (
          <div style={{ marginTop: 20, borderTop: '1px solid var(--color-surface-3)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              
              {/* Ajustes Básicos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', margin: 0 }}>⚙️ Parámetros Generales</p>
                
                {/* Switch Activar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface-2)', padding: 12, borderRadius: 12, border: '1px solid var(--color-surface-3)' }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>Programa de Puntos</p>
                    <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0 }}>{pointsActive ? 'Activo en la web del cliente' : 'Desactivado'}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pointsActive}
                    onChange={e => setPointsActive(e.target.checked)}
                    style={{ width: 40, height: 20, cursor: 'pointer' }}
                  />
                </div>

                {/* Tasa de acumulación */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', display: 'block', marginBottom: 4 }}>Regla de acumulación:</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Por cada S/. 1 gastado obtiene:</span>
                    <input
                      type="number"
                      value={pointsRate}
                      onChange={e => setPointsRate(parseFloat(e.target.value) || 0)}
                      className="input-field"
                      style={{ width: 70, padding: '6px 8px', fontSize: 12, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>punto(s).</span>
                  </div>
                </div>
              </div>

              {/* Catálogo de Premios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', margin: 0 }}>🎁 Catálogo de Premios Canjeables</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', background: 'var(--color-surface-2)', padding: 8, borderRadius: 12, border: '1px solid var(--color-surface-3)' }}>
                  {rewards.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-surface-3)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)' }}>{item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-secondary)' }}>{item.points} pts</span>
                        <button type="button" onClick={() => handleRemoveReward(item.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulario Agregar Premio */}
                <form onSubmit={handleAddReward} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Ej. Postre del Día"
                    value={newRewardName}
                    onChange={e => setNewRewardName(e.target.value)}
                    className="input-field"
                    style={{ flex: 2, padding: '8px 10px', fontSize: 12 }}
                  />
                  <input
                    type="number"
                    placeholder="Pts"
                    value={newRewardPoints}
                    onChange={e => setNewRewardPoints(e.target.value)}
                    className="input-field"
                    style={{ flex: 1, padding: '8px 10px', fontSize: 12, textAlign: 'center' }}
                  />
                  <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    +
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* CRM DIRECTORY GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        
        {/* Tabla/Listado de Clientes */}
        <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-surface-3)', borderRadius: 20, padding: 18 }}>
          
          {/* Controles de Búsqueda & Filtros */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            {/* Buscador */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--color-muted)' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre o celular..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 30, padding: '8px 10px 8px 30px', fontSize: 12 }}
              />
            </div>
            
            {/* Filtros Segmento */}
            <div style={{ display: 'flex', gap: 6 }}>
              {AUDIENCIAS.map(aud => (
                <button
                  key={aud.id}
                  onClick={() => setSelectedSegment(aud.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    background: selectedSegment === aud.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: selectedSegment === aud.id ? '#fff' : 'var(--color-muted)',
                    border: selectedSegment === aud.id ? 'none' : '1px solid var(--color-surface-3)',
                    transition: 'all 0.15s'
                  }}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Clientes */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-muted)' }}>Cargando clientes...</div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)', fontSize: 13 }}>No se encontraron contactos.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-surface-3)' }}>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Cliente</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Contacto</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', textAlign: 'center' }}>Pedidos</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Total Consumo</th>
                    <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Saldo Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCliente(c)}
                      style={{
                        borderBottom: '1px solid var(--color-surface-3)',
                        cursor: 'pointer',
                        background: selectedCliente?.id === c.id ? 'var(--color-surface-2)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)' }}>{c.nombre}</span>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 999,
                            background: c.segment === 'vip' ? 'rgba(216,160,32,0.1)' : c.segment === 'inactivo' ? 'rgba(239,68,68,0.1)' : 'rgba(64,145,108,0.1)',
                            color: c.segment === 'vip' ? '#D8A020' : c.segment === 'inactivo' ? '#EF4444' : 'var(--color-secondary)',
                          }}>
                            {c.segment === 'vip' ? 'VIP' : c.segment === 'inactivo' ? 'Inactivo' : 'Frecuente'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--color-muted)' }}>📞 {c.telefono}</td>
                      <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{c.ordersCount}</td>
                      <td style={{ padding: '12px 8px', fontSize: 12, fontWeight: 700, textAlign: 'right', color: 'var(--color-primary)' }}>S/. {c.totalSpent.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', fontSize: 13, fontWeight: 900, textAlign: 'right', color: 'var(--color-secondary)' }}>🪙 {c.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ficha Detallada del Cliente Seleccionado */}
        <div style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-surface-3)', borderRadius: 20, padding: 18 }}>
          {selectedCliente ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>Ficha de Cliente</p>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', marginTop: 4, marginBottom: 0 }}>{selectedCliente.nombre}</h3>
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                    background: selectedCliente.segment === 'vip' ? 'rgba(216,160,32,0.1)' : selectedCliente.segment === 'inactivo' ? 'rgba(239,68,68,0.1)' : 'rgba(64,145,108,0.1)',
                    color: selectedCliente.segment === 'vip' ? '#D8A020' : selectedCliente.segment === 'inactivo' ? '#EF4444' : 'var(--color-secondary)',
                  }}>
                    {selectedCliente.segment === 'vip' ? '⭐ Cliente VIP Premium' : selectedCliente.segment === 'inactivo' ? '💤 Cliente Inactivo' : '🌱 Cliente Frecuente'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      setEditTargetClient(selectedCliente);
                      setFormNombre(selectedCliente.nombre);
                      setFormTelefono(selectedCliente.telefono);
                      setFormPuntos(String(selectedCliente.puntos));
                      setIsEditModalOpen(true);
                    }}
                    style={{
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-surface-3)',
                      borderRadius: 10,
                      padding: 8,
                      cursor: 'pointer',
                      color: 'var(--color-on-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title="Editar Cliente"
                  >
                    <RiEditLine size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCliente(selectedCliente.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 10,
                      padding: 8,
                      cursor: 'pointer',
                      color: '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    title="Eliminar Cliente"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              </div>

              {/* Info de contacto y WhatsApp */}
              <div style={{ background: 'var(--color-surface-2)', padding: 12, borderRadius: 12, border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                  <strong>Celular:</strong> {selectedCliente.telefono}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-muted)', margin: 0 }}>
                  <strong>Último pedido:</strong> {selectedCliente.lastOrderDate ? new Date(selectedCliente.lastOrderDate).toLocaleDateString() : '—'}
                </p>
                <a
                  href={getWhatsAppLink(selectedCliente.nombre, selectedCliente.telefono, selectedCliente.puntos)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: '#25D366', color: '#fff', border: 'none', borderRadius: 10,
                    padding: '8px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    textDecoration: 'none', marginTop: 4, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <RiWhatsappLine size={16} /> Enviar Mensaje Fidelización
                </a>
              </div>

              {/* Saldo y Ajustes de Puntos */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Saldo actual de Lealtad</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-surface-2)', padding: '12px 16px', borderRadius: 14, border: '1px solid var(--color-surface-3)' }}>
                  <span style={{ fontSize: 26 }}>🪙</span>
                  <div>
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 900, color: 'var(--color-secondary)', margin: 0 }}>{selectedCliente.puntos} Puntos</p>
                    <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: 0 }}>Equivale a S/. {selectedCliente.totalSpent.toFixed(0)} en consumo total.</p>
                  </div>
                </div>

                {/* Ajustes manuales */}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', display: 'block', marginBottom: 6 }}>Ajuste Manual de Puntos (Caja)</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={pointsAdjustment}
                      onChange={e => setPointsAdjustment(e.target.value)}
                      className="input-field"
                      style={{ padding: '8px 10px', fontSize: 12, flex: 1 }}
                    />
                    <button
                      onClick={() => handleAdjustPoints(selectedCliente.id, 'add')}
                      style={{ background: 'var(--color-secondary)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleAdjustPoints(selectedCliente.id, 'remove')}
                      style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 10, padding: '0 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      -
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--color-muted)' }}>
              <span style={{ fontSize: 32 }}>👆</span>
              <p style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>Selecciona un cliente de la lista para ver su ficha y gestionar sus puntos.</p>
            </div>
          )}
        </div>

      </div>

      {/* MODAL: AGREGAR CLIENTE */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-surface-3)',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, margin: 0, color: 'var(--color-on-surface)' }}>
              ➕ Registrar Nuevo Cliente
            </h3>
            <form onSubmit={handleAddCliente} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Número de Teléfono</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 987654321"
                  value={formTelefono}
                  onChange={e => setFormTelefono(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Puntos Iniciales</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formPuntos}
                  onChange={e => setFormPuntos(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-surface-3)',
                    color: 'var(--color-on-surface)',
                    borderRadius: 12,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CLIENTE */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-surface-3)',
            borderRadius: 24,
            padding: 24,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, margin: 0, color: 'var(--color-on-surface)' }}>
              ✏️ Editar Información de Cliente
            </h3>
            <form onSubmit={handleEditCliente} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Número de Teléfono</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 987654321"
                  value={formTelefono}
                  onChange={e => setFormTelefono(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)' }}>Puntos Acumulados</label>
                <input
                  type="number"
                  min="0"
                  value={formPuntos}
                  onChange={e => setFormPuntos(e.target.value)}
                  className="input-field"
                  style={{ padding: '10px 12px', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditTargetClient(null);
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-surface-3)',
                    color: 'var(--color-on-surface)',
                    borderRadius: 12,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 0',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
