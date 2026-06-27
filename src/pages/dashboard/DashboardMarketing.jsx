import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../router.jsx';

export default function DashboardMarketing() {
  const { activeRestaurant } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [segments, setSegments] = useState({
    vip: 0,
    inactivo_15d: 0,
    nuevo: 0,
    frecuente: 0,
    fin_de_semana: 0,
    hamburguesas_lovers: 0,
    bowls_lovers: 0,
    todas: 0
  });
  const [loading, setLoading] = useState(true);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  // Estados de Responsividad y Navegación
  const [activeTab, setActiveTab] = useState('campanas');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 900);
  const [animatingId, setAnimatingId] = useState(null);

  // Estados de Formulario de Campaña Avanzada
  const [selectedSegment, setSelectedSegment] = useState('inactivo_15d');
  const [promoTitle, setPromoTitle] = useState('');
  const [promocionVal, setPromocionVal] = useState('');
  const [diaSemanaVal, setDiaSemanaVal] = useState('hoy Viernes');
  const [reachLimit, setReachLimit] = useState(0);
  
  // Banco de Plantillas
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateText, setTemplateText] = useState('');
  
  // Estados para Biblioteca de Copys
  const templateBodyRef = useRef(null);
  const campaignBodyRef = useRef(null);
  const [templateTitleInput, setTemplateTitleInput] = useState('');
  const [templateBodyInput, setTemplateBodyInput] = useState('');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [sending, setSending] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState(false);
  const [campaignIdCreated, setCampaignIdCreated] = useState(null);

  // Estados de Triggers Automáticos (Simulado/Config)
  const [autoMermas, setAutoMermas] = useState(true);
  const [autoStockOut, setAutoStockOut] = useState(true);
  const [discountPct, setDiscountPct] = useState(15);

  // Toast
  const [toast, setToast] = useState(null);

  // Estados de Combo del Día
  const [menuItems, setMenuItems] = useState([]);
  const [hamburgers, setHamburgers] = useState([]);
  const [drinks, setDrinks] = useState([]);
  const [selectedBurgerId, setSelectedBurgerId] = useState('');
  const [selectedDrinkId, setSelectedDrinkId] = useState('');
  const [comboPromoPrice, setComboPromoPrice] = useState(39.00);
  const [comboOrigPrice, setComboOrigPrice] = useState(46.00);
  const [comboExpiryHours, setComboExpiryHours] = useState(6);
  const [comboActive, setComboActive] = useState(true);

  // Estados para el Drawer de Clientes del Segmento
  const [showClientsDrawer, setShowClientsDrawer] = useState(false);
  const [drawerClients, setDrawerClients] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [cooldownDays, setCooldownDays] = useState(7);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenClientsDrawer = async (segmentId) => {
    setSelectedSegment(segmentId);
    setShowClientsDrawer(true);
    setDrawerLoading(true);
    setDrawerSearchQuery('');
    try {
      const { data, error } = await supabase.rpc('get_clientes_by_audiencia', { p_audiencia_id: segmentId });
      if (!error && data) {
        setDrawerClients(data);
      } else {
        setDrawerClients([]);
        console.error('Error fetching clients for drawer:', error);
      }
    } catch (err) {
      console.error('Error loading clients for drawer:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const exportToCSV = (clientsList, segmentLabel) => {
    if (!clientsList || clientsList.length === 0) return;
    
    const headers = ['Nombre', 'Telefono', 'Pedidos', 'Total Gastado (S/.)', 'Razon'];
    const rows = clientsList.map(c => [
      c.nombre || '',
      c.telefono || '',
      c.orders_count || 0,
      c.total_spent || 0,
      c.reason || segmentLabel
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Clientes_${segmentLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 CSV descargado');
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchActiveComboSettings = async () => {
    try {
      const [{ data: itemsData }, { data: activeComboData }] = await Promise.all([
        supabase.from('items_menu').select('*').eq('disponible', true),
        supabase.from('combo_del_dia').select('*').order('created_at', { ascending: false }).limit(1)
      ]);

      if (itemsData) {
        setMenuItems(itemsData);
        setHamburgers(itemsData.filter(i => i.nombre.toLowerCase().includes('hamburguesa') || i.nombre.toLowerCase().includes('burger')));
        setDrinks(itemsData.filter(i => i.nombre.toLowerCase().includes('kombucha') || i.nombre.toLowerCase().includes('jugo') || i.nombre.toLowerCase().includes('limonada') || i.nombre.toLowerCase().includes('bebida')));
      }

      if (activeComboData && activeComboData.length > 0) {
        const active = activeComboData[0];
        setSelectedBurgerId(active.hamburguesa_id);
        setSelectedDrinkId(active.bebida_id);
        setComboPromoPrice(parseFloat(active.precio_oferta));
        setComboOrigPrice(parseFloat(active.precio_original));
        setComboActive(active.activo);
      }
    } catch (err) {
      console.error('Error fetching active combo settings:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTemplates(selectedSegment);
  }, [selectedSegment]);

  useEffect(() => {
    const size = segments[selectedSegment] || 0;
    setReachLimit(size);
  }, [selectedSegment, segments]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchSegments(), fetchProposals(), fetchActiveComboSettings()]);
    setLoading(false);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!selectedBurgerId || !selectedDrinkId) {
      showToast('Selecciona una hamburguesa y una bebida');
      return;
    }

    try {
      const burger = menuItems.find(i => i.id === selectedBurgerId);
      const drink = menuItems.find(i => i.id === selectedDrinkId);
      const orig = (burger ? parseFloat(burger.precio) : 0) + (drink ? parseFloat(drink.precio) : 0);

      const { error } = await supabase
        .from('combo_del_dia')
        .insert([
          {
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            hamburguesa_id: selectedBurgerId,
            bebida_id: selectedDrinkId,
            precio_oferta: parseFloat(comboPromoPrice),
            precio_original: orig || parseFloat(comboOrigPrice),
            expira_en: new Date(Date.now() + comboExpiryHours * 60 * 60 * 1000).toISOString(),
            activo: comboActive
          }
        ]);

      if (error) throw error;
      showToast('¡Combo del Día publicado en la PWA! 🍔🥤');
    } catch (err) {
      console.error('Error saving combo:', err);
      showToast('Error al guardar el combo');
    }
  };

  // Carga conteos en tiempo real para las 8 audiencias desde la RPC de Supabase
  const fetchSegments = async () => {
    try {
      const segmentsList = ['vip', 'inactivo_15d', 'frecuente', 'nuevo', 'fin_de_semana', 'hamburguesas_lovers', 'bowls_lovers', 'todas'];
      const counts = {};
      
      await Promise.all(segmentsList.map(async (seg) => {
        const { data, error } = await supabase.rpc('get_clientes_by_audiencia', { p_audiencia_id: seg });
        if (!error && data) {
          counts[seg] = data.length;
        } else {
          counts[seg] = 0;
        }
      }));
      
      setSegments(counts);
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  // Carga plantillas del segmento seleccionado
  const fetchTemplates = async (segmentId) => {
    try {
      const { data, error } = await supabase
        .from('plantillas_mensajes')
        .select('*')
        .eq('segmento_id', segmentId);
      
      if (!error && data) {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
          setTemplateText(data[0].mensaje_plantilla);
        } else {
          setSelectedTemplate(null);
          setTemplateText('');
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const { data, error } = await supabase
        .from('propuestas_sistema')
        .select('*')
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const now = new Date();
        const validProposals = data.filter(prop => {
          if (!prop.expires_at) return true;
          return new Date(prop.expires_at) > now;
        });
        setProposals(validProposals);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleApprove = async (prop) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setAnimatingId(prop.id);
    
    setTimeout(async () => {
      try {
        const { plato_id, precio_sugerido, precio_oferta, etiqueta_promo } = prop.meta_data;

        if (prop.tipo_propuesta === 'sugerencia_oferta') {
          const { error: menuErr } = await supabase
            .from('items_menu')
            .update({
              en_oferta: true,
              precio_oferta: parseFloat(precio_oferta),
              etiqueta_promo: etiqueta_promo
            })
            .eq('id', plato_id);
          if (menuErr) throw menuErr;
          
          const instructionText = `Hoy empuja la venta de ${prop.meta_data.plato_nombre} porque nos queda mucho stock de ${prop.meta_data.insumo_nombre.toLowerCase()}.`;
          await updateBotContext(instructionText);
        } 
        else if (prop.tipo_propuesta === 'ajuste_precio') {
          const { error: menuErr } = await supabase
            .from('items_menu')
            .update({ precio: parseFloat(precio_sugerido) })
            .eq('id', plato_id);
          if (menuErr) throw menuErr;
        } 
        else if (prop.tipo_propuesta === 'quiebre_stock') {
          const { error: menuErr } = await supabase
            .from('items_menu')
            .update({ disponible: false })
            .eq('id', plato_id);
          if (menuErr) throw menuErr;
        }

        const { error: propErr } = await supabase
          .from('propuestas_sistema')
          .update({ estado: 'aprobado' })
          .eq('id', prop.id);
        if (propErr) throw propErr;

        showToast(`✅ Sugerencia aprobada con éxito`);
        setProposals(prev => prev.filter(p => p.id !== prop.id));
      } catch (err) {
        console.error(err);
        showToast(`❌ Error al aprobar: ${err.message}`);
      } finally {
        setAnimatingId(null);
      }
    }, 300);
  };

  const handleDiscard = async (propId) => {
    if (navigator.vibrate) navigator.vibrate(5);
    setAnimatingId(propId);

    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('propuestas_sistema')
          .update({ estado: 'descartado' })
          .eq('id', propId);
        if (error) throw error;
        
        showToast(`🗑️ Sugerencia descartada`);
        setProposals(prev => prev.filter(p => p.id !== propId));
      } catch (err) {
        console.error(err);
        showToast(`❌ Error al descartar`);
      } finally {
        setAnimatingId(null);
      }
    }, 300);
  };

  const updateBotContext = async (instruction) => {
    try {
      const { data: existingContext } = await supabase
        .from('restaurante_info_contexto')
        .select('*')
        .eq('clave', 'promocion_activa')
        .single();

      if (existingContext) {
        await supabase
          .from('restaurante_info_contexto')
          .update({ contenido: instruction, updated_at: new Date().toISOString() })
          .eq('id', existingContext.id);
      } else {
        await supabase
          .from('restaurante_info_contexto')
          .insert([{
            restaurante_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            clave: 'promocion_activa',
            contenido: instruction
          }]);
      }
    } catch (err) {
      console.error('Error updating bot context:', err);
    }
  };

  // Lanza la campaña llamando a la RPC de Supabase y disparando el webhook de n8n
  const handleLaunchCampaign = async (e) => {
    e.preventDefault();
    if (!promoTitle.trim() || !templateText.trim()) return;
    setSending(true);
    setCampaignSuccess(false);

    try {
      // 1. Ejecutar RPC en Supabase para encolar envíos individuales pre-compilados
      const { data: campanaId, error: dbErr } = await supabase.rpc('lanzar_campana_marketing', {
        p_nombre: promoTitle,
        p_audiencia_id: selectedSegment,
        p_promocion: promocionVal || 'un descuento especial',
        p_dia_semana: diaSemanaVal || 'hoy',
        p_plantilla_mensaje: templateText,
        p_reach_limit: parseInt(reachLimit) || 1,
        p_cooldown_days: cooldownDays
      });

      if (dbErr) throw dbErr;

      setCampaignIdCreated(campanaId);

      // 2. Notificar a n8n por Webhook para que despache la cola
      const WEBHOOK_URL = 'https://hooks.koratflow.agency/webhook/campanas/enviar-suna';
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_campana: promoTitle,
            segmento_id: selectedSegment,
            promocion: promocionVal || 'un descuento especial',
            dia: diaSemanaVal || 'hoy',
            plantilla_mensaje: templateText,
            business_id: activeRestaurant?.id || '8c7a6e1a-1d5b-43ad-8d99-c990263f45bb',
            cooldown_days: cooldownDays
          })
        });
      } catch (webhookErr) {
        console.warn("n8n Webhook connection warning (campaign created in DB):", webhookErr);
      }

      if (navigator.vibrate) navigator.vibrate([40, 80, 40]);
      setCampaignSuccess(true);
      setPromoTitle('');
      setPromocionVal('');
      setDiaSemanaVal('hoy Viernes');
      
      // Recargar segmentos
      fetchSegments();
    } catch (err) {
      console.error(err);
      showToast('❌ Error al iniciar campaña');
    } finally {
      setSending(false);
    }
  };

  const getEstimatedReach = () => {
    return segments[selectedSegment] || 0;
  };

  const getHoursLeft = (expiresAt) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt) - new Date();
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    if (hours <= 0) return 'Vence pronto';
    return `Expira en ${hours}h`;
  };

  // Compila el preview resaltando las variables en HTML
  const getPreviewHtml = () => {
    let text = templateText || 'Elige una plantilla para ver la vista previa...';
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Variables dinámicas resaltadas como tags premium
    const nameBadge = `<span style="background: rgba(216, 160, 32, 0.15); color: #B5800E; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(216, 160, 32, 0.25); font-size: 11px;">{nombre}</span>`;
    const dayBadge = `<span style="background: rgba(64, 145, 108, 0.15); color: #2D6A4F; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(64, 145, 108, 0.25); font-size: 11px;">${diaSemanaVal || '{dia}'}</span>`;
    const promoBadge = `<span style="background: rgba(27, 67, 50, 0.15); color: #1B4332; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(27, 67, 50, 0.25); font-size: 11px;">${promocionVal || '{promocion}'}</span>`;
    const platoBadge = `<span style="background: rgba(255, 122, 0, 0.15); color: #FF7A00; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(255, 122, 0, 0.25); font-size: 11px;">{plato_favorito}</span>`;
    const diasBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(239, 68, 68, 0.25); font-size: 11px;">{dias_inactivo}</span>`;
    const saludoBadge = `<span style="background: rgba(64, 145, 108, 0.15); color: #40916C; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(64, 145, 108, 0.25); font-size: 11px;">{saludo_temporal}</span>`;
    const sucursalBadge = `<span style="background: rgba(106, 27, 154, 0.15); color: #6A1B9A; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(106, 27, 154, 0.25); font-size: 11px;">{sucursal_cercana}</span>`;
    const restauranteBadge = `<span style="background: rgba(27, 67, 50, 0.15); color: #1B4332; padding: 2px 6px; border-radius: 6px; font-weight: 800; border: 1px solid rgba(27, 67, 50, 0.25); font-size: 11px;">${activeRestaurant?.nombre || 'Suna Gourmet'}</span>`;

    // Reemplazos regex
    text = text.replace(/{nombre}/gi, nameBadge);
    text = text.replace(/{dia}/gi, dayBadge);
    text = text.replace(/{promocion}/gi, promoBadge);
    text = text.replace(/{plato_favorito}/gi, platoBadge);
    text = text.replace(/{dias_inactivo}/gi, diasBadge);
    text = text.replace(/{saludo_temporal}/gi, saludoBadge);
    text = text.replace(/{sucursal_cercana}/gi, sucursalBadge);
    text = text.replace(/{nombre_restaurante}/gi, restauranteBadge);
    
    // Saltos de línea
    text = text.replace(/\n/g, '<br/>');
    return text;
  };

  const getSegmentName = (id) => {
    const names = {
      vip: '⭐ VIPs',
      inactivo_15d: '💤 Inactivos',
      frecuente: '🔄 Frecuentes',
      nuevo: '🌱 Nuevos',
      fin_de_semana: '🥳 Fines de Semana',
      hamburguesas_lovers: '🍔 Burger Lovers',
      bowls_lovers: '🥗 Bowl Lovers',
      todas: '✨ Todos'
    };
    return names[id] || id;
  };

  /* ── Estilos Premium Compartidos ── */
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-surface-3)',
    borderRadius: 14,
    color: 'var(--color-on-surface)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 13,
    transition: 'all 200ms ease',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
  };

  /* ── FUNCIONES CRUD BIBLIOTECA DE COPYS ── */

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!templateTitleInput.trim() || !templateBodyInput.trim()) return;

    try {
      const { error } = await supabase
        .from('plantillas_mensajes')
        .insert([
          {
            segmento_id: selectedSegment,
            titulo: templateTitleInput,
            mensaje_plantilla: templateBodyInput
          }
        ]);

      if (error) throw error;
      showToast('✅ Copy creado en Biblioteca');
      setTemplateTitleInput('');
      setTemplateBodyInput('');
      setShowNewTemplateForm(false);
      fetchTemplates(selectedSegment);
    } catch (err) {
      console.error('Error creating template:', err);
      showToast('❌ Error al crear plantilla');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!templateTitleInput.trim() || !templateBodyInput.trim() || !editingTemplateId) return;

    try {
      const { error } = await supabase
        .from('plantillas_mensajes')
        .update({
          titulo: templateTitleInput,
          mensaje_plantilla: templateBodyInput
        })
        .eq('id', editingTemplateId);

      if (error) throw error;
      showToast('✅ Copy actualizado');
      setTemplateTitleInput('');
      setTemplateBodyInput('');
      setIsEditingTemplate(false);
      setEditingTemplateId(null);
      setShowNewTemplateForm(false);
      fetchTemplates(selectedSegment);
    } catch (err) {
      console.error('Error updating template:', err);
      showToast('❌ Error al actualizar plantilla');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta plantilla de la biblioteca?')) return;
    try {
      const { error } = await supabase
        .from('plantillas_mensajes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('🗑️ Copy eliminado');
      fetchTemplates(selectedSegment);
    } catch (err) {
      console.error('Error deleting template:', err);
      showToast('❌ Error al eliminar plantilla');
    }
  };

  const handleSelectToEdit = (template) => {
    setTemplateTitleInput(template.titulo);
    setTemplateBodyInput(template.mensaje_plantilla);
    setEditingTemplateId(template.id);
    setIsEditingTemplate(true);
    setShowNewTemplateForm(true);
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handleLoadTemplate = (t) => {
    if (!t) return;
    setSelectedTemplate(t);
    setTemplateText(t.mensaje_plantilla);
    
    // Auto-nombre de campaña (Propuesta A)
    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    setPromoTitle(`${t.titulo} - ${dateStr}`);
    
    showToast('📥 Copy cargado y campaña auto-nombrada');
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handleSelectCampaignTemplate = (templateId) => {
    if (!templateId) {
      setSelectedTemplate(null);
      setTemplateText('');
      setPromoTitle('');
      return;
    }
    const found = templates.find(t => t.id === templateId);
    if (found) {
      handleLoadTemplate(found);
    }
  };

  const insertVariableAtCursor = (variable, isCampaignEditor = false) => {
    const textarea = isCampaignEditor ? campaignBodyRef.current : templateBodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = isCampaignEditor ? templateText : templateBodyInput;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    if (isCampaignEditor) {
      setTemplateText(before + variable + after);
    } else {
      setTemplateBodyInput(before + variable + after);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  /* ── RENDER COMPONENTES AUXILIARES ── */

  const renderSegmentosSection = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
            👥 Marketplace de Audiencias & Segmentos
          </h3>
          <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
            Selecciona una audiencia para configurar tu campaña de mensajería
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {[
            { id: 'vip', label: '⭐ VIPs', count: segments.vip, desc: 'Pedidos >= 5 o gastado >= S/.150', color: '#D8A020', bg: 'rgba(216,160,32,0.06)' },
            { id: 'inactivo_15d', label: '💤 Inactivos (>15d)', count: segments.inactivo_15d, desc: 'Sin compras en 15 días', color: '#EF4444', bg: 'rgba(239,68,68,0.06)' },
            { id: 'frecuente', label: '🔄 Frecuentes', count: segments.frecuente, desc: 'Fieles recurrentes en local', color: '#1B4332', bg: 'rgba(27,67,50,0.06)' },
            { id: 'nuevo', label: '🌱 Nuevos', count: segments.nuevo, desc: 'Registrados con 0 o 1 pedido', color: 'var(--color-secondary)', bg: 'rgba(64,145,108,0.06)' },
            { id: 'fin_de_semana', label: '🥳 Fieles Fin de Semana', count: segments.fin_de_semana, desc: 'Piden Viernes, Sábado o Domingo', color: '#FF7A00', bg: 'rgba(255,122,0,0.06)' },
            { id: 'hamburguesas_lovers', label: '🍔 Burger Lovers', count: segments.hamburguesas_lovers, desc: 'Su plato favorito es Hamburguesa', color: '#B58D3D', bg: 'rgba(181,141,61,0.06)' },
            { id: 'bowls_lovers', label: '🥗 Bowl Lovers', count: segments.bowls_lovers, desc: 'Consumen ensaladas y bowls', color: '#2E7D32', bg: 'rgba(46,125,50,0.06)' },
            { id: 'todas', label: '✨ Todos los Clientes', count: segments.todas, desc: 'Base de datos completa', color: '#6A1B9A', bg: 'rgba(106,27,154,0.06)' }
          ].map(seg => {
            const isSelected = selectedSegment === seg.id;
            const percentage = segments.todas > 0 ? ((seg.count / segments.todas) * 100).toFixed(0) : 0;

            return (
              <div
                key={seg.id}
                onClick={() => { 
                  handleOpenClientsDrawer(seg.id); 
                  if (navigator.vibrate) navigator.vibrate(5); 
                }}
                style={{
                  background: isSelected ? 'var(--color-surface)' : seg.bg,
                  border: isSelected ? `2.5px solid ${seg.color}` : '1.5px solid var(--color-surface-3)',
                  borderRadius: 20,
                  padding: '14px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isSelected ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
                  boxShadow: isSelected ? '0 12px 24px rgba(0,0,0,0.08)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 110,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Background visual indicator percentage bar */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: 4,
                    width: `${percentage}%`,
                    background: seg.color,
                    transition: 'width 300ms ease'
                  }} />
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)' }}>{seg.label}</p>
                    <span style={{ 
                      fontSize: 9, 
                      fontWeight: 800, 
                      color: seg.color, 
                      background: 'rgba(255,255,255,0.7)', 
                      padding: '2px 5px', 
                      borderRadius: 6 
                    }}>
                      {percentage}%
                    </span>
                  </div>
                  <p style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.2 }}>{seg.desc}</p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ fontSize: 9, color: seg.color, fontWeight: 700, opacity: 0.8, display: 'flex', alignItems: 'center', gap: 3 }}>
                    🔍 Ver lista
                  </span>
                  <p style={{ fontSize: 24, fontWeight: 900, color: seg.color, letterSpacing: '-0.02em', margin: 0 }}>
                    {loading ? '...' : seg.count}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCopyLibrarySection = () => {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              📚 Biblioteca de Copys & Plantillas
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Administra tus copys recurrentes para {getSegmentName(selectedSegment)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showNewTemplateForm) {
                setShowNewTemplateForm(false);
                setIsEditingTemplate(false);
                setTemplateTitleInput('');
                setTemplateBodyInput('');
              } else {
                setShowNewTemplateForm(true);
              }
              if (navigator.vibrate) navigator.vibrate(5);
            }}
            style={{
              background: showNewTemplateForm ? 'var(--color-surface-3)' : 'var(--color-primary)',
              color: showNewTemplateForm ? 'var(--color-on-surface)' : '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: showNewTemplateForm ? 'none' : '0 4px 10px rgba(0,0,0,0.06)',
              transition: 'all 200ms ease'
            }}
          >
            {showNewTemplateForm ? 'Cancelar' : '➕ Crear Copy'}
          </button>
        </div>

        {/* Formulario de Creación / Edición */}
        {showNewTemplateForm && (
          <form onSubmit={isEditingTemplate ? handleUpdateTemplate : handleCreateTemplate} style={{ background: 'var(--color-surface-2)', padding: 16, borderRadius: 20, border: '1px solid var(--color-surface-3)', display: 'flex', flexDirection: 'column', gap: 12 }} className="animate-fade-up">
            <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)' }}>
              {isEditingTemplate ? '✏️ Editar Copy en Biblioteca' : '➕ Registrar Nuevo Copy'}
            </p>
            
            <div>
              <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 5 }}>Título del Copy</label>
              <input
                required
                type="text"
                placeholder="Ej. Promo Reactivación - 20% dscto"
                value={templateTitleInput}
                onChange={e => setTemplateTitleInput(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>Texto del Copy</label>
                
                {/* Chips de variables dinámicas */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {[
                    { var: '{nombre}', color: '#B5800E', bg: 'rgba(216, 160, 32, 0.15)' },
                    { var: '{dia}', color: '#2D6A4F', bg: 'rgba(64, 145, 108, 0.15)' },
                    { var: '{promocion}', color: '#1B4332', bg: 'rgba(27, 67, 50, 0.15)' },
                    { var: '{plato_favorito}', color: '#FF7A00', bg: 'rgba(255, 122, 0, 0.15)' },
                    { var: '{dias_inactivo}', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
                    { var: '{saludo_temporal}', color: '#40916C', bg: 'rgba(64, 145, 108, 0.15)' },
                    { var: '{sucursal_cercana}', color: '#6A1B9A', bg: 'rgba(106, 27, 154, 0.15)' },
                    { var: '{nombre_restaurante}', color: '#1B4332', bg: 'rgba(27, 67, 50, 0.15)' }
                  ].map(chip => (
                    <button
                      key={chip.var}
                      type="button"
                      onClick={() => insertVariableAtCursor(chip.var)}
                      style={{
                        background: chip.bg,
                        color: chip.color,
                        border: 'none',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 9,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +{chip.var}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                ref={templateBodyRef}
                required
                rows="4"
                placeholder="¡Hola {nombre}! 🎉 Te saludamos de {nombre_restaurante}..."
                value={templateBodyInput}
                onChange={e => setTemplateBodyInput(e.target.value)}
                style={{ ...inputStyle, background: '#fff', resize: 'none', lineHeight: 1.5 }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(27,67,50,0.1)'
              }}
            >
              {isEditingTemplate ? '💾 Guardar Cambios' : '💾 Registrar en Biblioteca'}
            </button>
          </form>
        )}

        {/* Listado de Copys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-muted)', border: '1.5px dashed var(--color-surface-3)', borderRadius: 20 }}>
              💡 No hay copys registrados para este segmento. Haz clic en "Crear Copy" para registrar el primero.
            </div>
          ) : (
            templates.map(t => (
              <div
                key={t.id}
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-surface-3)',
                  borderRadius: 18,
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)' }}>{t.titulo}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSelectToEdit(t)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 10.5, color: 'var(--color-muted)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {t.mensaje_plantilla}
                </p>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate(t)}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-3)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    marginTop: 2
                  }}
                >
                  🎯 Usar este copy
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    );
  };

  const renderCopilotoSection = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6 }}>
            🧠 Buzón del Copiloto Inteligente
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#40916C',
              display: 'inline-block',
              animation: 'pulse-dot 2s infinite'
            }} />
          </h3>
          <span style={{ fontSize: 10, color: 'var(--color-secondary)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={fetchProposals}>
            🔄 Sincronizar
          </span>
        </div>

        {proposalsLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-muted)', background: 'var(--color-surface)', borderRadius: 20, border: '1.5px solid var(--color-surface-3)' }}>
            Cargando sugerencias de IA...
          </div>
        ) : proposals.length === 0 ? (
          <div style={{ background: 'var(--color-surface)', border: '1.5px dashed var(--color-surface-3)', borderRadius: 20, padding: '36px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>✨</span>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)' }}>¡Todo en orden!</p>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>El copiloto no tiene recomendaciones de inventario o precios pendientes.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proposals.map(prop => {
              let theme = { bg: 'rgba(64,145,108,0.06)', border: 'rgba(64,145,108,0.2)', badge: 'RECOMENDACIÓN', badgeColor: '#40916C', icon: '💡' };
              if (prop.tipo_propuesta === 'sugerencia_oferta') {
                theme = { bg: 'rgba(217,4,41,0.04)', border: 'rgba(217,4,41,0.15)', badge: '🔥 EVITAR MERMA', badgeColor: '#D90429', icon: '🍎' };
              } else if (prop.tipo_propuesta === 'ajuste_precio') {
                theme = { bg: 'rgba(216,160,32,0.04)', border: 'rgba(216,160,32,0.15)', badge: '💸 PRECIO SUGERIDO', badgeColor: '#D8A020', icon: '💰' };
              } else if (prop.tipo_propuesta === 'quiebre_stock') {
                theme = { bg: 'rgba(239,68,68,0.04)', border: 'rgba(239,68,68,0.15)', badge: '⚠️ STOCK CRÍTICO', badgeColor: '#EF4444', icon: '📦' };
              } else if (prop.tipo_propuesta === 'cliente_inactivo') {
                theme = { bg: 'rgba(111,66,193,0.04)', border: 'rgba(111,66,193,0.15)', badge: '💤 CLIENTE INACTIVO', badgeColor: '#6F42C1', icon: '👥' };
              } else if (prop.tipo_propuesta === 'combo_inteligente') {
                theme = { bg: 'rgba(27,67,50,0.04)', border: 'rgba(27,67,50,0.15)', badge: '🎯 COMBO COMPRA', badgeColor: '#1B4332', icon: '🍔' };
              }

              const isAnimating = animatingId === prop.id;

              return (
                <div
                  key={prop.id}
                  style={{
                    background: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    borderRadius: 20,
                    padding: isAnimating ? '0px 16px' : '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isAnimating ? 0 : 12,
                    opacity: isAnimating ? 0 : 1,
                    transform: isAnimating ? 'scale(0.9) translateY(12px)' : 'scale(1) translateY(0)',
                    maxHeight: isAnimating ? 0 : 500,
                    margin: 0,
                    overflow: 'hidden',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{theme.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: theme.badgeColor, background: 'var(--color-surface)', padding: '3px 8px', borderRadius: 8, border: `1px solid ${theme.border}` }}>
                        {theme.badge}
                      </span>
                    </div>
                    {prop.expires_at && (
                      <span style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 800, background: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: 6 }}>
                        ⏳ {getHoursLeft(prop.expires_at)}
                      </span>
                    )}
                  </div>

                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)', lineHeight: 1.45 }}>
                      {prop.descripcion}
                    </p>
                    
                    {prop.tipo_propuesta === 'sugerencia_oferta' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Plato: <strong>{prop.meta_data.plato_nombre}</strong> · Oferta: <span style={{ color: '#D90429', fontWeight: 800 }}>S/. {parseFloat(prop.meta_data.precio_oferta).toFixed(2)}</span> ({prop.meta_data.etiqueta_promo})
                      </p>
                    )}
                    {prop.tipo_propuesta === 'ajuste_precio' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Plato: <strong>{prop.meta_data.plato_nombre}</strong> · Precio actual: S/. {prop.meta_data.precio_actual.toFixed(2)} → <span style={{ color: '#D8A020', fontWeight: 800 }}>Sugerido: S/. {prop.meta_data.precio_sugerido.toFixed(2)}</span>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'quiebre_stock' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Plato a pausar: <strong>{prop.meta_data.plato_nombre}</strong> por quiebre de <strong>{prop.meta_data.insumo_nombre}</strong>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'cliente_inactivo' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Cliente: <strong>{prop.meta_data.cliente_nombre}</strong> · Favorito: <strong>{prop.meta_data.plato_favorito}</strong>
                      </p>
                    )}
                    {prop.tipo_propuesta === 'combo_inteligente' && (
                      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6 }}>
                        Combo: <strong>{prop.meta_data.combo_nombre}</strong> · Sugerido: <span style={{ color: '#1B4332', fontWeight: 800 }}>S/. {prop.meta_data.precio_combo.toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px dashed rgba(0,0,0,0.06)', paddingTop: 12, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(prop)}
                      style={{
                        flex: 1, padding: '10px 14px', background: theme.badgeColor, color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                        textAlign: 'center', boxShadow: `0 4px 12px ${theme.badgeColor}33`,
                        transition: 'transform 150ms ease'
                      }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      👍 Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscard(prop.id)}
                      style={{
                        padding: '10px 16px', background: 'var(--color-surface)', color: 'var(--color-muted)',
                        border: '1.5px solid var(--color-surface-3)', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        transition: 'background 150ms'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--color-surface)'}
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTriggersSection = () => {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 20 }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          ⚡ Automatizaciones Suna (Database Triggers)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)' }}>Crear Alerta por Merma Próxima</p>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.35 }}>
                Genera alertas sugeridas en el buzón al detectar ingredientes que vencen en menos de 48 horas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setAutoMermas(p => !p); if (navigator.vibrate) navigator.vibrate(5); }}
              style={{
                width: 46, height: 26, borderRadius: 13,
                background: autoMermas ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: autoMermas ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, borderTop: '1.5px dashed var(--color-surface-3)', paddingTop: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)' }}>Alerta por Quiebre de Stock</p>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 3, lineHeight: 1.35 }}>
                Propone pausar platos en la carta cuando un ingrediente fundamental llega a 0 en el almacén.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setAutoStockOut(p => !p); if (navigator.vibrate) navigator.vibrate(5); }}
              style={{
                width: 46, height: 26, borderRadius: 13,
                background: autoStockOut ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: autoStockOut ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderComboSection = () => {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🍔</span>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Configurar Combo Suna del Día
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Define el plato, bebida y precio de oferta visible en la PWA del cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCombo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Hamburguesa Principal</label>
              {hamburgers.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cargando hamburguesas...</p>
              ) : (
                <select
                  value={selectedBurgerId}
                  onChange={e => setSelectedBurgerId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona...</option>
                  {hamburgers.map(h => (
                    <option key={h.id} value={h.id}>{h.nombre} (S/. {parseFloat(h.precio).toFixed(2)})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Bebida Base</label>
              {drinks.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>Cargando bebidas...</p>
              ) : (
                <select
                  value={selectedDrinkId}
                  onChange={e => setSelectedDrinkId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Selecciona...</option>
                  {drinks.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre} (S/. {parseFloat(d.precio).toFixed(2)})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Precio Oferta (S/.)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="Ej. 39.00"
                value={comboPromoPrice}
                onChange={e => setComboPromoPrice(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Duración de la Oferta</label>
              <select
                value={comboExpiryHours}
                onChange={e => setComboExpiryHours(parseInt(e.target.value))}
                style={inputStyle}
              >
                <option value="2">2 Horas</option>
                <option value="4">4 Horas</option>
                <option value="6">6 Horas</option>
                <option value="12">12 Horas</option>
                <option value="24">24 Horas</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px dashed var(--color-surface-3)', paddingTop: 16, marginTop: 4 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)' }}>Combo Activo en PWA</p>
              <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>Muestra el combo destacado arriba de la carta de tus comensales.</p>
            </div>
            <button
              type="button"
              onClick={() => { setComboActive(p => !p); if (navigator.vibrate) navigator.vibrate(5); }}
              style={{
                width: 46, height: 26, borderRadius: 13,
                background: comboActive ? 'var(--color-primary)' : 'var(--color-surface-3)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 250ms'
              }}
            >
              <div style={{ position: 'absolute', top: 3, left: comboActive ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </button>
          </div>

          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              textAlign: 'center',
              width: '100%',
              marginTop: 6,
              boxShadow: '0 6px 18px rgba(27,67,50,0.18)',
              transition: 'transform 150ms ease'
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            💾 Guardar y Publicar Combo del Día
          </button>
        </form>
      </div>
    );
  };

  const renderCampanasSection = () => {
    return (
      <div style={{ background: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, rgba(27,67,50,0.03) 100%)', border: '1.5px solid rgba(64,145,108,0.25)', borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>🚀</span>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 900, color: 'var(--color-on-surface)' }}>
              Lanzador de Campañas Masivas (WhatsApp Gateway)
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
              Crea colas de mensajes en Supabase y dispáralos por WhatsApp usando n8n
            </p>
          </div>
        </div>

        <form onSubmit={handleLaunchCampaign} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Selector de Plantilla de Biblioteca (Propuesta B) */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>
              📚 Cargar Copy de tu Biblioteca
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={e => handleSelectCampaignTemplate(e.target.value)}
              style={{ ...inputStyle, background: 'rgba(255, 255, 255, 0.7)', border: '1.5px solid var(--color-secondary)' }}
            >
              <option value="">-- Seleccionar un copy predefinido (opcional) --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.titulo}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Nombre de la Campaña</label>
            <input
              required type="text"
              placeholder="Ej. Campaña Reactivación de Invierno"
              value={promoTitle}
              onChange={e => setPromoTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Segmento Activo</p>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.6)', fontWeight: 800, border: '1px solid rgba(0,0,0,0.05)' }}>
                {getSegmentName(selectedSegment)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>Tamaño Máximo</p>
              <div style={{ ...inputStyle, background: 'rgba(255,255,255,0.6)', fontWeight: 800, border: '1px solid rgba(0,0,0,0.05)' }}>
                {loading ? 'Calculando...' : `${getEstimatedReach()} clientes`}
              </div>
            </div>
          </div>

          {/* Cooldown selector */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.03em' }}>
              ⏳ Frecuencia de Envío por Cliente (Cooldown)
            </label>
            <select
              value={cooldownDays}
              onChange={e => setCooldownDays(parseInt(e.target.value))}
              style={{ ...inputStyle, background: 'rgba(255, 255, 255, 0.7)', border: '1.5px solid var(--color-secondary)' }}
            >
              <option value={7}>7 días (Recomendado - Evita Spam)</option>
              <option value={15}>15 días (Fidelización espaciada)</option>
              <option value={30}>30 días (Mensual)</option>
              <option value={0}>Sin Cooldown (Enviar siempre)</option>
            </select>
          </div>

          {getEstimatedReach() > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-on-surface)' }}>Límite de Envío Personalizado</label>
                <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-primary)' }}>
                  {reachLimit} / {getEstimatedReach()} Clientes
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="range" 
                  min={1} 
                  max={getEstimatedReach()} 
                  value={reachLimit} 
                  onChange={e => setReachLimit(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--color-secondary)', cursor: 'pointer', height: 6 }}
                />
                <input
                  type="number"
                  min={1}
                  max={getEstimatedReach()}
                  value={reachLimit}
                  onChange={e => setReachLimit(Math.min(getEstimatedReach(), Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{ ...inputStyle, width: 75, padding: '8px', textAlign: 'center', background: '#fff' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.4)', padding: 14, borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.02em' }}>1. {`{dia}`} de la promo</label>
              <input
                type="text"
                placeholder="Ej. hoy Viernes"
                value={diaSemanaVal}
                onChange={e => setDiaSemanaVal(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.02em' }}>2. {`{promocion}`} sugerida</label>
              <input
                type="text"
                placeholder="Ej. 20% dscto en burgers"
                value={promocionVal}
                onChange={e => setPromocionVal(e.target.value)}
                style={{ ...inputStyle, background: '#fff' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Contenido Personalizado del Mensaje</label>
              
              {/* Chips de variables dinámicas para campaña */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[
                  { var: '{nombre}', color: '#B5800E', bg: 'rgba(216, 160, 32, 0.15)' },
                  { var: '{dia}', color: '#2D6A4F', bg: 'rgba(64, 145, 108, 0.15)' },
                  { var: '{promocion}', color: '#1B4332', bg: 'rgba(27, 67, 50, 0.15)' },
                  { var: '{plato_favorito}', color: '#FF7A00', bg: 'rgba(255, 122, 0, 0.15)' },
                  { var: '{dias_inactivo}', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
                  { var: '{saludo_temporal}', color: '#40916C', bg: 'rgba(64, 145, 108, 0.15)' },
                  { var: '{sucursal_cercana}', color: '#6A1B9A', bg: 'rgba(106, 27, 154, 0.15)' },
                  { var: '{nombre_restaurante}', color: '#1B4332', bg: 'rgba(27, 67, 50, 0.15)' }
                ].map(chip => (
                  <button
                    key={chip.var}
                    type="button"
                    onClick={() => insertVariableAtCursor(chip.var, true)}
                    style={{
                      background: chip.bg,
                      color: chip.color,
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 9,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    +{chip.var}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea
              ref={campaignBodyRef}
              required rows="4"
              value={templateText}
              onChange={e => setTemplateText(e.target.value)}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5, background: '#fff' }}
            />
            <p style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 5, lineHeight: 1.3 }}>
              💡 <strong>Tip:</strong> Deja las variables <code>{`{nombre}`}</code>, <code>{`{dia}`}</code> y <code>{`{promocion}`}</code> para autocompilar con los datos de cada cliente.
            </p>
          </div>

          {/* VISTA PREVIA SIMULADA DE WHATSAPP */}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.03em' }}>Vista Previa en Tiempo Real (WhatsApp)</label>
            <div style={{
              background: '#efeae2',
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundSize: 'cover',
              borderRadius: 22,
              border: '1.5px solid var(--color-surface-3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* WhatsApp Header */}
              <div style={{
                background: '#075E54',
                color: '#fff',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#075E54',
                  fontSize: 15,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  🌱
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>Suna Plant-Based</p>
                  <p style={{ fontSize: 9, opacity: 0.8, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4cff00', display: 'inline-block' }} />
                    en línea
                  </p>
                </div>
              </div>
              
              {/* WhatsApp Body */}
              <div style={{
                padding: '16px 12px',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  background: '#e2f9cb',
                  color: '#303030',
                  borderRadius: '12px 12px 0 12px',
                  padding: '12px 14px',
                  fontSize: 12,
                  lineHeight: 1.5,
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  position: 'relative',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  border: '1.5px solid rgba(7, 94, 84, 0.04)'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                  <span style={{ fontSize: 8, color: '#727272', float: 'right', marginTop: 4, marginLeft: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} 
                    <span style={{ color: '#4fc3f7', fontWeight: 'bold' }}>✓✓</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {campaignSuccess && (
            <div style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#065F46', padding: 12, borderRadius: 14, fontSize: 11, fontWeight: 800, textAlign: 'center' }}>
              🎉 ¡Campaña encolada y lanzada con éxito! Supabase procesó {reachLimit} mensajes y notificó a n8n para el despacho vía WhatsApp. (ID: {campaignIdCreated?.slice(0, 8)})
            </div>
          )}

          <button
            type="submit"
            disabled={sending || reachLimit <= 0}
            style={{
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: (sending || reachLimit <= 0) ? 'not-allowed' : 'pointer',
              opacity: (sending || reachLimit <= 0) ? 0.75 : 1,
              textAlign: 'center',
              width: '100%',
              marginTop: 4,
              boxShadow: '0 6px 18px rgba(27,67,50,0.2)',
              transition: 'transform 150ms'
            }}
            onMouseDown={e => { if(!sending && reachLimit > 0) e.currentTarget.style.transform = 'scale(0.98)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {sending ? 'Procesando en Supabase...' : '🚀 Encolar y Despachar Campaña'}
          </button>
        </form>
      </div>
    );
  };

  /* ── MAIN COMPONENT RENDER ── */

  return (
    <div style={{ padding: '20px 20px calc(80px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-on-surface)', lineHeight: 1.2 }}>
            Copiloto de Marketing e IA
          </h1>
          <p style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600, marginTop: 3 }}>
            Gestión inteligente de promociones, mermas y fidelización de clientes
          </p>
        </div>
      </div>

      {/* Navegación por Pestañas (Solo visible en móviles) */}
      {!isDesktop && (
        <div style={{
          display: 'flex',
          background: 'var(--color-surface-2)',
          padding: 4,
          borderRadius: 18,
          border: '1.5px solid var(--color-surface-3)',
          marginBottom: 6
        }}>
          {[
            { id: 'campanas', label: '🎯 Campañas', desc: 'WhatsApp & Leads' },
            { id: 'copiloto', label: '🧠 Copiloto IA', desc: 'Sugerencias IA' },
            { id: 'combos', label: '🍔 Combos', desc: 'PWA Combo' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (navigator.vibrate) navigator.vibrate(5); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '10px 4px',
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                  border: 'none',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'all 200ms ease',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.04)' : 'none'
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800 }}>{tab.label}</span>
                <span style={{ fontSize: 8, opacity: 0.7, fontWeight: 700 }}>{tab.desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Layout Principal: Doble columna en Desktop, Filtrado por Pestañas en Móvil */}
      {isDesktop ? (
        <div className="dash-layout-main" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 28, alignItems: 'start' }}>
          
          {/* Columna Izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {renderSegmentosSection()}
            {renderCopyLibrarySection()}
            {renderCampanasSection()}
          </div>

          {/* Columna Derecha (Sticky) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 20 }}>
            {renderCopilotoSection()}
            {renderTriggersSection()}
            {renderComboSection()}
          </div>

        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-up">
          {activeTab === 'campanas' && (
            <>
              {renderSegmentosSection()}
              {renderCopyLibrarySection()}
              {renderCampanasSection()}
            </>
          )}
          {activeTab === 'copiloto' && (
            <>
              {renderCopilotoSection()}
              {renderTriggersSection()}
            </>
          )}
          {activeTab === 'combos' && (
            <>
              {renderComboSection()}
            </>
          )}
        </div>
      )}

      {/* Drawer Lateral / Bottom Sheet de Clientes */}
      {showClientsDrawer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: isDesktop ? 'flex-end' : 'center',
          alignItems: isDesktop ? 'stretch' : 'flex-end',
          animation: 'fade-in 200ms ease'
        }}
        onClick={() => setShowClientsDrawer(false)}
        >
          <div 
            style={{
              background: 'var(--color-surface)',
              width: isDesktop ? '440px' : '100%',
              maxHeight: isDesktop ? '100%' : '85vh',
              borderRadius: isDesktop ? '24px 0 0 24px' : '24px 24px 0 0',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: isDesktop ? 'slide-left 250ms ease-out' : 'slide-up 250ms ease-out',
              boxSizing: 'border-box'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Drawer */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-surface-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', margin: 0 }}>
                  Clientes: {getSegmentName(selectedSegment)}
                </h3>
                <p style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2, margin: 0 }}>
                  Detalle y preferencias del segmento seleccionado
                </p>
              </div>
              <button 
                onClick={() => setShowClientsDrawer(false)}
                style={{
                  background: 'var(--color-surface-2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-on-surface)',
                  fontWeight: 'bold',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Buscador */}
            <div style={{ padding: '16px 24px 8px 24px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={drawerSearchQuery}
                onChange={e => setDrawerSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--color-surface-2)',
                  border: '1.5px solid var(--color-surface-3)',
                  borderRadius: 12,
                  color: 'var(--color-on-surface)',
                  outline: 'none',
                  fontSize: 12,
                  boxSizing: 'border-box',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}
              />
            </div>

            {/* Lista Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
              {drawerLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>
                  Cargando lista de clientes...
                </div>
              ) : (
                (() => {
                  const filtered = drawerClients.filter(c => {
                    const q = drawerSearchQuery.toLowerCase();
                    return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)', fontSize: 12 }}>
                        No se encontraron clientes en este segmento.
                      </div>
                    );
                  }

                  // Estadísticas rápidas del listado filtrado
                  const totalSpentSum = filtered.reduce((acc, curr) => acc + parseFloat(curr.total_spent || 0), 0);
                  const avgSpent = filtered.length > 0 ? (totalSpentSum / filtered.length).toFixed(1) : 0;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Tarjetas Resumen */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div style={{ background: 'var(--color-surface-2)', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-surface-3)' }}>
                          <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>Clientes</p>
                          <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-primary)', margin: '2px 0 0 0' }}>{filtered.length}</p>
                        </div>
                        <div style={{ background: 'var(--color-surface-2)', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--color-surface-3)' }}>
                          <p style={{ fontSize: 8, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', margin: 0 }}>Ticket Promedio</p>
                          <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-secondary)', margin: '2px 0 0 0' }}>S/. {avgSpent}</p>
                        </div>
                      </div>

                      {filtered.map((client, idx) => {
                        const initials = (client.nombre || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        // Dynamic color based on spend index or name index
                        const colors = ['#40916C', '#1B4332', '#B58D3D', '#6A1B9A', '#D8A020', '#2E7D32'];
                        const avatarBg = colors[idx % colors.length];

                        return (
                          <div 
                            key={client.id || idx}
                            style={{
                              background: 'var(--color-surface-2)',
                              border: '1px solid var(--color-surface-3)',
                              borderRadius: 16,
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12,
                              transition: 'all 200ms ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: avatarBg,
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {initials}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-on-surface)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {client.nombre}
                                </p>
                                <p style={{ fontSize: 10, color: 'var(--color-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  📱 {client.telefono || 'Sin celular'}
                                </p>
                                <span style={{ 
                                  fontSize: 8, 
                                  fontWeight: 800, 
                                  color: 'var(--color-primary)', 
                                  background: 'rgba(64,145,108,0.1)', 
                                  padding: '2px 6px', 
                                  borderRadius: 6,
                                  display: 'inline-block',
                                  marginTop: 4
                                }}>
                                  {client.reason || 'Segmentado'}
                                </span>
                                {(() => {
                                  if (!client.ultimo_envio_at) return null;
                                  const lastSent = new Date(client.ultimo_envio_at);
                                  const now = new Date();
                                  const diffTime = Math.abs(now - lastSent);
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  const inCooldown = cooldownDays > 0 && diffDays <= cooldownDays;
                                  if (!inCooldown) return null;
                                  return (
                                    <span style={{ 
                                      fontSize: 8, 
                                      fontWeight: 800, 
                                      color: '#727272', 
                                      background: '#e0e0e0', 
                                      padding: '2px 6px', 
                                      borderRadius: 6,
                                      display: 'inline-block',
                                      marginTop: 4,
                                      marginLeft: 6
                                    }}>
                                      ⏳ Cooldown activo ({diffDays}d)
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-on-surface)', margin: 0 }}>
                                  S/. {parseFloat(client.total_spent || 0).toFixed(2)}
                                </p>
                                <p style={{ fontSize: 9, color: 'var(--color-muted)', margin: 0 }}>
                                  {client.orders_count} ord.
                                </p>
                              </div>
                              
                              {/* WhatsApp quick contact action */}
                              {client.telefono && (
                                <a 
                                  href={`https://wa.me/${client.telefono.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    textDecoration: 'none',
                                    fontSize: 10,
                                    background: '#25D366',
                                    color: '#fff',
                                    padding: '3px 8px',
                                    borderRadius: 8,
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    boxShadow: '0 2px 4px rgba(37, 211, 102, 0.2)'
                                  }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  💬 WA
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer del Drawer */}
            {!drawerLoading && drawerClients.length > 0 && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-surface-3)', display: 'flex', gap: 12 }}>
                <button
                  onClick={() => exportToCSV(drawerClients, getSegmentName(selectedSegment))}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-on-surface)',
                    border: '1.5px solid var(--color-surface-3)',
                    borderRadius: 12,
                    padding: '10px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  📥 Exportar CSV
                </button>
                <button
                  onClick={() => setShowClientsDrawer(false)}
                  style={{
                    flex: 1,
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Listo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-on-surface)', color: '#fff',
          padding: '10px 22px', borderRadius: 999, fontSize: 12, fontWeight: 800,
          whiteSpace: 'nowrap', zIndex: 99999, animation: 'toast-in 250ms ease',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

    </div>
  );
}
