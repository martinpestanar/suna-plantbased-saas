import { useState } from 'react';
import { GrAd } from "react-icons/gr";
import { supabase } from './supabaseClient.js';
import { useRouter } from './router.jsx';

const Icon = {
  check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline className="animated-check" points="20 6 9 17 4 12"/></svg>,
  plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  wand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M10.2 6.2L9 5M3 21l9-9M12.2 9.2l1.6-1.6a2 2 0 1 1 2.8 2.8l-1.6 1.6"/></svg>,
};

export default function Onboarding() {
  const { navigate } = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward'); // 'forward' | 'backward'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Data State
  const [restaurant, setRestaurant] = useState({ nombre: '', telefono: '', direccion: '' });
  const [categories, setCategories] = useState([{ nombre: 'Platos Principales', icon: '🍲' }]);
  const [items, setItems] = useState([
    { nombre: '', precio: '', categoria_index: 0, ingredientes: '' }
  ]);
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handlers Categorías
  const addCategory = () => setCategories([...categories, { nombre: '', icon: '🍽️' }]);
  const updateCategory = (index, field, value) => {
    const newCats = [...categories];
    newCats[index][field] = value;
    setCategories(newCats);
  };
  const removeCategory = (index) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
      setItems(items.map(it => it.categoria_index === index ? { ...it, categoria_index: 0 } : it));
    }
  };

  // Handlers Platos
  const addItem = () => setItems([...items, { nombre: '', precio: '', categoria_index: 0, ingredientes: '' }]);
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  const removeItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const handleStepChange = (nextStep, dir = 'forward') => {
    setDirection(dir);
    setStep(nextStep);
  };

  // Submit Final
  const handleSubmit = async () => {
    if (!email || !password) return alert("Completa tu correo y contraseña");

    setLoading(true);
    
    try {
      // 1. Crear cuenta en Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw new Error(authError.message);

      // 2. Insertar Restaurante en Supabase (para que aparezca en el Dashboard)
      try {
        await supabase.from('restaurantes').insert({
          nombre: restaurant.nombre,
          direccion: restaurant.direccion,
          telefono: restaurant.telefono,
        });
      } catch (e) {
        console.warn("No se pudo insertar el restaurante en DB:", e);
      }

      // 3. Enviar a n8n (Webhook IA)
      const payload = {
        restaurante: restaurant,
        categorias: categories,
        platos: items.map(it => ({
          ...it,
          categoria_nombre: categories[it.categoria_index]?.nombre,
          precio: parseFloat(it.precio)
        }))
      };
      
      const WEBHOOK_URL = 'https://hooks.koratflow.agency/webhook/onboarding-ia'; 
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (webhookErr) {
        console.warn("Error en el webhook n8n:", webhookErr);
      }

      // Éxito
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ocurrió un error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  /* ── VISTAS (STEPS) ── */
  const renderStep1 = () => (
    <div className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900, marginBottom:8 }}>Tu Restaurante</h2>
      <p style={{ color:'var(--color-muted)', fontSize:14, marginBottom:24 }}>Empecemos con lo básico. ¿Cómo te encuentran tus clientes?</p>
      
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Nombre del negocio</label>
          <input className="input-field" placeholder="Ej. Suna Gourmet" value={restaurant.nombre} onChange={e=>setRestaurant({...restaurant, nombre: e.target.value})} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>WhatsApp de Pedidos</label>
          <input className="input-field" placeholder="Ej. +51900000000" type="tel" value={restaurant.telefono} onChange={e=>setRestaurant({...restaurant, telefono: e.target.value})} />
          <p style={{ fontSize:10, color:'var(--color-muted)', marginTop:4 }}>Debe ser exacto. Se usará para enrutar los pedidos.</p>
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Dirección (Opcional)</label>
          <input className="input-field" placeholder="Ej. Av. Principal 123" value={restaurant.direccion} onChange={e=>setRestaurant({...restaurant, direccion: e.target.value})} />
        </div>
      </div>

      <button className="btn-primary shimmer-sweep" style={{ marginTop:32, width:'100%' }} onClick={()=>handleStepChange(2, 'forward')} disabled={!restaurant.nombre || !restaurant.telefono}>
        Continuar a Categorías
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>handleStepChange(1, 'backward')} style={{ background:'transparent', border:'none', color:'var(--color-primary)', fontWeight:800, cursor:'pointer' }}>← Atrás</button>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900 }}>Categorías</h2>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {categories.map((cat, idx) => (
          <div key={idx} style={{ display:'flex', gap:8, alignItems:'center', background:'var(--color-surface-2)', padding:12, borderRadius:16, border:'1px solid var(--color-surface-3)' }}>
            <input className="input-field" style={{ width:50, padding:'0', textAlign:'center', fontSize:20 }} value={cat.icon} onChange={e=>updateCategory(idx, 'icon', e.target.value)} placeholder="🍔" />
            <input className="input-field" style={{ flex:1 }} value={cat.nombre} onChange={e=>updateCategory(idx, 'nombre', e.target.value)} placeholder="Nombre de categoría" />
            <button onClick={()=>removeCategory(idx)} style={{ background:'transparent', border:'none', color:'#EF4444', padding:8, cursor:'pointer', opacity: categories.length > 1 ? 1 : 0.5 }}>
              {Icon.trash()}
            </button>
          </div>
        ))}
      </div>

      <button onClick={addCategory} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'14px', marginTop:16, background:'transparent', border:'2px dashed var(--color-surface-3)', borderRadius:16, color:'var(--color-muted)', fontWeight:700, cursor:'pointer' }}>
        {Icon.plus()} Añadir otra categoría
      </button>

      <button className="btn-primary" style={{ marginTop:32, width:'100%' }} onClick={()=>handleStepChange(3, 'forward')} disabled={categories.some(c=>!c.nombre)}>
        Continuar al Menú
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>handleStepChange(2, 'backward')} style={{ background:'transparent', border:'none', color:'var(--color-primary)', fontWeight:800, cursor:'pointer' }}>← Atrás</button>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900 }}>Tus Platos</h2>
      </div>
      <p style={{ color:'var(--color-muted)', fontSize:14, marginBottom:24 }}>
        Dinos los ingredientes exactos y nuestra IA creará perfiles de sabor atractivos.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ background:'var(--color-surface-2)', padding:16, borderRadius:20, border:'1px solid var(--color-surface-3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:12, fontWeight:800, color:'var(--color-primary)', textTransform:'uppercase' }}>Plato {idx+1}</span>
              <button onClick={()=>removeItem(idx)} style={{ background:'transparent', border:'none', color:'#EF4444', cursor:'pointer', padding:4, opacity: items.length > 1 ? 1 : 0.5 }}>
                {Icon.trash()}
              </button>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input className="input-field" placeholder="Nombre del plato" value={item.nombre} onChange={e=>updateItem(idx, 'nombre', e.target.value)} />
              
              <div style={{ display:'flex', gap:12 }}>
                <select className="input-field" style={{ flex:2, appearance:'none' }} value={item.categoria_index} onChange={e=>updateItem(idx, 'categoria_index', parseInt(e.target.value))}>
                  {categories.map((c, i) => <option key={i} value={i}>{c.icon} {c.nombre}</option>)}
                </select>
                <input className="input-field" type="number" placeholder="Precio (S/.)" style={{ flex:1 }} value={item.precio} onChange={e=>updateItem(idx, 'precio', e.target.value)} />
              </div>

              <textarea className="input-field" rows="3" placeholder="Ingredientes separados por comas..." value={item.ingredientes} onChange={e=>updateItem(idx, 'ingredientes', e.target.value)} style={{ resize:'none' }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={addItem} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'14px', marginTop:16, background:'transparent', border:'2px dashed var(--color-surface-3)', borderRadius:16, color:'var(--color-primary)', fontWeight:700, cursor:'pointer' }}>
        {Icon.plus()} Añadir otro plato
      </button>

      <button onClick={()=>handleStepChange(4, 'forward')} disabled={items.some(i => !i.nombre || !i.precio || !i.ingredientes)} className="btn-primary" style={{ marginTop:32, width:'100%' }}>
        Continuar a la Cuenta
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={()=>handleStepChange(3, 'backward')} style={{ background:'transparent', border:'none', color:'var(--color-primary)', fontWeight:800, cursor:'pointer' }}>← Atrás</button>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:900 }}>Crea tu Cuenta</h2>
      </div>
      <p style={{ color:'var(--color-muted)', fontSize:14, marginBottom:24 }}>
        Crea tu acceso para guardar el restaurante y acceder al panel de administración.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Correo Electrónico</label>
          <input className="input-field" type="email" placeholder="tu@correo.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:800, color:'var(--color-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Contraseña</label>
          <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading || !email || !password} className="btn-process btn-primary shimmer-sweep" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'16px', marginTop:32, color:'var(--color-accent)', border:'none', borderRadius:20, fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 8px 16px rgba(27, 67, 50, 0.25)', transition: 'all 0.3s ease' }}>
        {loading ? 'Creando cuenta...' : <><GrAd size={24} className="icon-vibrate" /> Finalizar y Entrar</>}
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="animate-fade-up" style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'#D1FAE5', color:'#10B981', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
        {Icon.check()}
      </div>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:900, marginBottom:16 }}>¡Cuenta Creada!</h2>
      <p style={{ color:'var(--color-muted)', fontSize:15, lineHeight:1.6, marginBottom:32 }}>
        Tu restaurante está configurado. Nuestra Inteligencia Artificial está procesando tu menú.
      </p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ width: '100%' }}>
        Ir a mi Panel de Control
      </button>
    </div>
  );

  return (
    <div style={{ width:'100%', minHeight:'100dvh', background:'#0F1A15', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <span className="desktop-orb-3" />
      <style>{`
        .btn-process:hover { transform: translateY(-2px); box-shadow: 0 12px 20px rgba(27, 67, 50, 0.35) !important; }
        .btn-process:hover .icon-vibrate { animation: vibrate 0.3s linear infinite both; }
        @keyframes vibrate {
          0% { transform: translate(0) }
          20% { transform: translate(-1px, 1px) }
          40% { transform: translate(-1px, -1px) }
          60% { transform: translate(1px, 1px) }
          80% { transform: translate(1px, -1px) }
          100% { transform: translate(0) }
        }
      `}</style>
      <div className="app-shell">
        <div className="shell-content" style={{ padding:'32px 24px', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          
          {/* Progress Bar */}
          {!success && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:32, flexShrink: 0 }}>
              <div className="onboarding-progress-bar">
                <div className="onboarding-progress-fill" style={{ width: `${(step/4)*100}%` }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:10, color:'var(--color-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Progreso de registro</span>
                <span style={{ fontSize:11, color:'var(--color-primary)', fontWeight:800 }}>Paso {step} de 4</span>
              </div>
            </div>
          )}

          {/* Dynamic Views */}
          <div style={{ flex: 1 }}>
            {success ? renderSuccess() : (
              step === 1 ? renderStep1() :
              step === 2 ? renderStep2() :
              step === 3 ? renderStep3() :
              renderStep4()
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

