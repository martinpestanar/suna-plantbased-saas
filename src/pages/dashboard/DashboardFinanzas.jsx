import { useState, useEffect } from 'react';
import { useAuth } from '../../router.jsx';
import { supabase } from '../../supabaseClient';

/* ── Íconos SVG Inline ── */
const IcoDollar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IcoUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IcoTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcoX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoRepeat = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IcoBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

/* ── Paleta de categorías ── */
const EXPENSE_CATEGORIES = [
  { id: 'alquiler',  label: 'Alquiler',   icon: '🏠', accent: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)' },
  { id: 'luz',       label: 'Luz',        icon: '⚡', accent: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)' },
  { id: 'agua',      label: 'Agua',       icon: '💧', accent: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.25)' },
  { id: 'insumos',   label: 'Insumos',    icon: '📦', accent: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)' },
  { id: 'marketing', label: 'Publicidad', icon: '📣', accent: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' },
  { id: 'otros',     label: 'Otros',      icon: '☕', accent: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' },
];

/* ── Estilos globales ── */
const S = {
  // Layout
  root: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100, margin: '0 auto', paddingBottom: 40 },
  
  // Tab bar
  tabBar: {
    display: 'flex', gap: 6, padding: 5,
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 24, overflowX: 'auto',
    scrollbarWidth: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
  tabBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 18px', borderRadius: 18,
    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
    border: 'none', cursor: 'pointer',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    transition: 'all 250ms cubic-bezier(0.34,1.56,0.64,1)',
    background: active ? 'linear-gradient(135deg, #1b4332, #2d9d6e)' : 'transparent',
    color: active ? '#ffffff' : 'var(--color-muted)',
    boxShadow: active ? '0 8px 20px rgba(27,67,50,0.25)' : 'none',
    transform: active ? 'scale(1.02) translateY(-1px)' : 'none',
  }),

  // Section header
  sectionLabel: {
    fontSize: 11, fontWeight: 800, color: 'var(--color-muted)',
    textTransform: 'uppercase', letterSpacing: '0.14em',
    marginBottom: 10, marginLeft: 4,
  },

  // Cards base
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)',
    transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
  },

  // Metric cards row
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 },
  metricCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 24, padding: '22px 24px',
    position: 'relative', overflow: 'hidden',
    cursor: 'default',
    boxShadow: '0 12px 30px -10px rgba(0,0,0,0.03)',
    transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
  },
  metricLabel: { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', marginBottom: 8 },
  metricValue: (color) => ({ fontSize: 28, fontWeight: 900, color: color || 'var(--color-on-surface)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.03em', lineHeight: 1.1 }),

  // Progress bar
  progressWrap: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 24, padding: '20px 24px',
    boxShadow: '0 12px 30px -10px rgba(0,0,0,0.03)',
  },
  progressTrack: { height: 10, background: 'var(--color-surface-2)', borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  progressFill: (pct) => ({
    height: '100%', width: `${pct}%`,
    background: 'linear-gradient(90deg, #1b4332, #40916c, #52b788)',
    borderRadius: 99,
    transition: 'width 1000ms cubic-bezier(0.34,1.56,0.64,1)',
    boxShadow: '0 0 16px rgba(64,145,108,0.4)',
  }),

  // Quick access categories grid
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  catBtn: (accent, bg, border) => ({
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 22, padding: '20px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    boxShadow: '0 4px 20px -6px rgba(0,0,0,0.02)',
  }),
  catIcon: (bg, border) => ({
    fontSize: 24, width: 52, height: 52,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, border: `1px solid ${border}`,
    borderRadius: 16, lineHeight: 1,
    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.04)',
  }),
  catLabel: { fontSize: 12, fontWeight: 700, color: 'var(--color-on-surface)', textAlign: 'center' },

  // List item
  listItem: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 20, padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
    boxShadow: '0 4px 15px -4px rgba(0,0,0,0.015)',
  },
  iconBox: (accent, bg) => ({
    width: 44, height: 44, borderRadius: 14,
    background: bg || 'rgba(64,145,108,0.1)',
    border: `1px solid ${accent ? accent + '25' : 'rgba(64,145,108,0.2)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0,
  }),

  // Badges
  badge: (bg, color, border) => ({
    fontSize: 10, fontWeight: 800, padding: '4px 10px',
    background: bg, color, borderRadius: 10,
    border: `1px solid ${border || 'transparent'}`,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    letterSpacing: '0.02em',
  }),

  // Buttons
  btnPrimary: {
    background: 'linear-gradient(135deg, #1b4332, #2d9d6e)',
    color: '#ffffff', border: 'none', borderRadius: 16,
    padding: '14px 24px', fontSize: 13, fontWeight: 700,
    display: 'flex', alignItems: 'center', gap: 8,
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(27,67,50,0.25)',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    transition: 'all 200ms ease',
  },
  btnSecondary: {
    background: 'var(--color-surface-2)', color: 'var(--color-on-surface)',
    border: '1px solid var(--color-surface-3)', borderRadius: 16,
    padding: '14px 24px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
    transition: 'all 200ms ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  btnGhost: {
    background: 'transparent', color: 'rgba(217,4,41,0.85)',
    border: 'none', cursor: 'pointer', padding: '8px',
    borderRadius: 10, display: 'flex', alignItems: 'center',
    transition: 'all 200ms ease',
  },

  // Input
  input: {
    width: '100%', background: 'var(--color-surface-2)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 16, padding: '14px 18px',
    color: 'var(--color-on-surface)', fontSize: 14, outline: 'none',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    boxSizing: 'border-box', transition: 'all 200ms ease',
  },
  inputLarge: {
    width: '100%', background: 'var(--color-surface-2)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 18, padding: '18px 20px',
    color: 'var(--color-on-surface)', fontSize: 26, fontWeight: 900,
    outline: 'none', fontFamily: 'Outfit, sans-serif',
    boxSizing: 'border-box',
    transition: 'all 200ms ease',
  },
  label: { fontSize: 11, fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 },
  select: {
    width: '100%', background: 'var(--color-surface-2)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 16, padding: '14px 18px',
    color: 'var(--color-on-surface)', fontSize: 14, outline: 'none',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
    transition: 'all 200ms ease',
  },

  // Modal overlay (Portal-like styles without being cut by layout context transforms)
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(15,26,21,0.5)', backdropFilter: 'blur(16px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 460,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-surface-3)',
    borderRadius: 28,
    padding: '24px 24px 32px',
    maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    position: 'relative',
    scrollbarWidth: 'none',
  },
  modalHandle: {
    display: 'none',
  },

  // Divider
  divider: { height: 1, background: 'var(--color-surface-3)', margin: '6px 0' },

  // Empty state
  emptyState: {
    padding: '44px 20px', textAlign: 'center',
    color: 'var(--color-muted)', fontSize: 14,
    background: 'var(--color-surface-2)',
    border: '1px dashed var(--color-surface-3)',
    borderRadius: 24,
  },

  // Loader
  loader: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 },

  // Section wrap
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
};

/* ─── UTILITY HELPERS ─── */
const fmt = (val) => 'S/ ' + parseFloat(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getDaysInfo(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  due.setHours(0,0,0,0); today.setHours(0,0,0,0);
  const diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return { text: `Vencido hace ${Math.abs(diff)}d`, color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
  if (diff === 0) return { text: 'Vence hoy', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
  return { text: `Vence en ${diff}d`, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' };
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */
export default function DashboardFinanzas() {
  const { activeRestaurant } = useAuth();
  const businessId = activeRestaurant?.id;

  const [activeTab, setActiveTab] = useState('egresos');
  const [isLoading, setIsLoading] = useState(true);

  const [expenses, setExpenses]   = useState([]);
  const [payments, setPayments]   = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [margins, setMargins]     = useState([]);
  
  const [summary, setSummary] = useState({ total_pendiente: 0, vencidos: 0, por_vencer: 0, pagado_mes: 0 });
  const [taxData, setTaxData] = useState({
    regimen: 'RUS', ventas_totales: 0, compras_totales: 0,
    ventas_base: 0, ventas_igv: 0, compras_base: 0, compras_igv: 0,
    igv_neto: 0, renta_estimada: 0, cuota_rus: 0, alerta_rus: ''
  });

  // Modales
  const [modalGasto, setModalGasto]     = useState(false);
  const [modalNomina, setModalNomina]   = useState(false);
  const [selectedCat, setSelectedCat]   = useState(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc]     = useState('');
  const [expenseRecurring, setExpenseRecurring] = useState(false);
  const [expenseStatus, setExpenseStatus] = useState('pagado');
  const [expenseDueDate, setExpenseDueDate] = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [isRegimenOpen, setIsRegimenOpen] = useState(false);

  const [newPayroll, setNewPayroll] = useState({
    staff_name: '', staff_id: '', payment_type: 'base',
    base_amount: '', commission_rate: '', commission_sales: '', amount: '',
    period_start: '', period_end: '', payment_method: '',
    reference_code: '', notes: '', payment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { if (businessId) loadAllData(); }, [businessId, activeTab]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'egresos') {
        const { data: expData } = await supabase
          .from('finances_expenses').select('*').eq('business_id', businessId)
          .order('expense_date', { ascending: false });
        setExpenses(expData || []);

        const { data: rpcData } = await supabase.rpc('obtener_resumen_gastos_pendientes', { p_business_id: businessId });
        if (rpcData) setSummary({
          total_pendiente: parseFloat(rpcData.total_pendiente || 0),
          vencidos: parseInt(rpcData.vencidos || 0),
          por_vencer: parseInt(rpcData.por_vencer || 0),
          pagado_mes: parseFloat(rpcData.pagado_mes || 0)
        });

      } else if (activeTab === 'nomina') {
        const { data: pData } = await supabase.from('finances_payroll').select('*')
          .eq('business_id', businessId).order('payment_date', { ascending: false });
        setPayments(pData || []);

        const { data: sData } = await supabase.from('repartidores').select('id, nombre').eq('activo', true);
        setStaffList(sData || []);

      } else if (activeTab === 'sunat') {
        const now = new Date();
        const { data: rpcData } = await supabase.rpc('calcular_impuestos_sunat', {
          p_business_id: businessId, p_year: now.getFullYear(), p_month: now.getMonth() + 1
        });
        if (rpcData) setTaxData({
          regimen: rpcData.regimen,
          ventas_totales: parseFloat(rpcData.ventas_totales || 0),
          compras_totales: parseFloat(rpcData.compras_totales || 0),
          ventas_base: parseFloat(rpcData.ventas_base || 0),
          ventas_igv: parseFloat(rpcData.ventas_igv || 0),
          compras_base: parseFloat(rpcData.compras_base || 0),
          compras_igv: parseFloat(rpcData.compras_igv || 0),
          igv_neto: parseFloat(rpcData.igv_neto || 0),
          renta_estimada: parseFloat(rpcData.renta_estimada || 0),
          cuota_rus: parseFloat(rpcData.cuota_rus || 0),
          alerta_rus: rpcData.alerta_rus || ''
        });

      } else if (activeTab === 'margenes') {
        const { data: rpcData } = await supabase.rpc('calcular_margen_platos');
        setMargins(rpcData || []);
      }
    } catch (e) {
      console.error('Error finanzas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!selectedCat || !expenseAmount || parseFloat(expenseAmount) <= 0) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('finances_expenses').insert([{
        business_id: businessId,
        amount: parseFloat(expenseAmount),
        category: selectedCat.id,
        description: expenseDesc || selectedCat.label,
        expense_date: new Date().toISOString().split('T')[0],
        is_recurring: expenseRecurring,
        status: expenseStatus,
        due_date: expenseStatus === 'pendiente' && expenseDueDate ? expenseDueDate : null
      }]);
      if (error) throw error;
      setModalGasto(false);
      loadAllData();
    } catch (e) { alert('Error al guardar'); } finally { setIsSaving(false); }
  };

  const handlePayExpense = async (id) => {
    try {
      await supabase.from('finances_expenses')
        .update({ status: 'pagado', expense_date: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await supabase.from('finances_expenses').delete().eq('id', id);
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('finances_payroll').insert([{
        business_id: businessId,
        staff_name: newPayroll.staff_name,
        staff_id: newPayroll.staff_id ? parseInt(newPayroll.staff_id) : null,
        amount: parseFloat(newPayroll.amount) || 0,
        payment_type: newPayroll.payment_type,
        base_amount: parseFloat(newPayroll.base_amount) || null,
        commission_rate: parseFloat(newPayroll.commission_rate) || null,
        commission_sales: parseFloat(newPayroll.commission_sales) || null,
        commission_amount: (parseFloat(newPayroll.commission_sales) * parseFloat(newPayroll.commission_rate) / 100) || null,
        payment_date: newPayroll.payment_date,
        period_start: newPayroll.period_start || null,
        period_end: newPayroll.period_end || null,
        payment_method: newPayroll.payment_method || null,
        reference_code: newPayroll.reference_code || null,
        notes: newPayroll.notes || null
      }]);
      if (error) throw error;
      setModalNomina(false);
      loadAllData();
    } catch (err) { alert('Error al registrar nómina'); } finally { setIsSaving(false); }
  };

  const handleUpdateRegime = async (regime) => {
    try {
      await supabase.from('finances_settings').upsert({ business_id: businessId, tax_regime: regime, updated_at: new Date().toISOString() });
      setIsRegimenOpen(false);
      loadAllData();
    } catch (e) { console.error(e); }
  };

  const openCatModal = (cat) => {
    setSelectedCat(cat);
    setExpenseAmount(''); setExpenseDesc('');
    setExpenseRecurring(false); setExpenseStatus('pagado'); setExpenseDueDate('');
    setModalGasto(true);
  };

  const TABS = [
    { id: 'egresos',  label: 'Egresos y Servicios', Icon: IcoDollar },
    { id: 'nomina',   label: 'Planilla',            Icon: IcoUsers },
    { id: 'sunat',    label: 'SUNAT',               Icon: IcoFile },
    { id: 'margenes', label: 'Márgenes',            Icon: IcoTrend },
  ];

  const paidPct = summary.pagado_mes + summary.total_pendiente > 0
    ? Math.round((summary.pagado_mes / (summary.pagado_mes + summary.total_pendiente)) * 100)
    : 0;

  const pendingExpenses = expenses.filter(e => e.status === 'pendiente');

  return (
    <div style={S.root}>

      {/* ══ TAB BAR ════════════════════════════════════════════ */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={S.tabBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            <t.Icon />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ LOADING ════════════════════════════════════════════ */}
      {isLoading ? (
        <div style={S.loader}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(45,157,110,0.2)',
            borderTop: '2px solid #2d9d6e',
            animation: 'spin 0.9s linear infinite',
          }} />
          <span style={{ fontSize: 12, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
            Cargando datos financieros...
          </span>
        </div>
      ) : (
        <>

          {/* ══════════════════════════════════════════════════
              TAB: EGRESOS Y SERVICIOS
              ══════════════════════════════════════════════════ */}
          {activeTab === 'egresos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Métricas */}
              <div style={S.metricsRow}>
                {/* Pagado */}
                <div style={S.metricCard}>
                  <div style={{ position: 'absolute', right: 16, top: 16, opacity: 0.06, color: '#34d399' }}>
                    <IcoCheck />
                  </div>
                  <p style={S.metricLabel}>Pagado del Mes</p>
                  <p style={S.metricValue('var(--color-on-surface)')}>{fmt(summary.pagado_mes)}</p>
                  <div style={{ marginTop: 10, width: 32, height: 2, background: 'rgba(52,211,153,0.5)', borderRadius: 99 }} />
                </div>

                {/* Pendiente */}
                <div style={S.metricCard}>
                  <div style={{ position: 'absolute', right: 16, top: 16, opacity: 0.06 }}>
                    <IcoClock />
                  </div>
                  <p style={S.metricLabel}>Cuentas por Pagar</p>
                  <p style={S.metricValue('#fbbf24')}>{fmt(summary.total_pendiente)}</p>
                  <div style={{ marginTop: 10, width: 32, height: 2, background: 'rgba(251,191,36,0.5)', borderRadius: 99 }} />
                </div>

                {/* Alertas */}
                <div style={{ ...S.metricCard, gridColumn: window.innerWidth < 560 ? 'span 2' : 'span 1' }}>
                  <p style={S.metricLabel}>Alertas de Pago</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {summary.vencidos > 0 && (
                      <span style={S.badge('rgba(248,113,113,0.12)', '#f87171', 'rgba(248,113,113,0.25)')}>
                        <IcoAlert /> {summary.vencidos} Vencidos
                      </span>
                    )}
                    {summary.por_vencer > 0 && (
                      <span style={S.badge('rgba(251,191,36,0.1)', '#fbbf24', 'rgba(251,191,36,0.25)')}>
                        <IcoClock /> {summary.por_vencer} por vencer
                      </span>
                    )}
                    {summary.vencidos === 0 && summary.por_vencer === 0 && (
                      <span style={S.badge('rgba(52,211,153,0.1)', '#34d399', 'rgba(52,211,153,0.25)')}>
                        <IcoCheck /> Todo al día ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de progreso mensual */}
              {(summary.pagado_mes + summary.total_pendiente) > 0 && (
                <div style={S.progressWrap}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                      Progreso de egresos del mes
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#2d9d6e', fontFamily: 'Outfit' }}>
                      {paidPct}% cubierto
                    </span>
                  </div>
                  <div style={S.progressTrack}>
                    <div style={S.progressFill(paidPct)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                      Pagado: {fmt(summary.pagado_mes)}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                      Pendiente: {fmt(summary.total_pendiente)}
                    </span>
                  </div>
                </div>
              )}

              {/* Registro Rápido */}
              <div style={S.section}>
                <p style={S.sectionLabel}>Registro Rápido de Gastos</p>
                <div style={S.catGrid}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      style={S.catBtn(cat.accent, cat.bg, cat.border)}
                      onClick={() => openCatModal(cat)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cat.accent}20`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={S.catIcon(cat.bg, cat.border)}>{cat.icon}</div>
                      <span style={S.catLabel}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recibos Pendientes */}
              {pendingExpenses.length > 0 && (
                <div style={S.section}>
                  <p style={S.sectionLabel}>Recibos Pendientes ({pendingExpenses.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pendingExpenses.map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[5];
                      const dInfo = getDaysInfo(exp.due_date);
                      return (
                        <div key={exp.id} style={{
                          background: 'linear-gradient(145deg, rgba(17,28,22,0.9), rgba(12,20,16,0.9))',
                          border: `1px solid ${cat.border}`,
                          borderRadius: 18, padding: '16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={S.iconBox(cat.accent, cat.bg)}>{cat.icon}</div>
                              <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>
                                  {exp.description}
                                </p>
                                <p style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans', marginTop: 2 }}>
                                  {cat.label}
                                </p>
                              </div>
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', fontFamily: 'Outfit' }}>
                              {fmt(exp.amount)}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                            {dInfo ? (
                              <span style={S.badge(dInfo.bg, dInfo.color, dInfo.border)}>
                                <IcoClock /> {dInfo.text}
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>Sin fecha</span>
                            )}
                            <button
                              onClick={() => handlePayExpense(exp.id)}
                              style={S.btnPrimary}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                              <IcoCheck /> Marcar pagado
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Historial */}
              <div style={S.section}>
                <p style={S.sectionLabel}>Historial de Movimientos</p>
                {expenses.length === 0 ? (
                  <div style={S.emptyState}>
                    <p style={{ fontSize: 20, marginBottom: 8 }}>💸</p>
                    <p>Sin egresos registrados aún.</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>Usa el registro rápido arriba para añadir uno.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {expenses.map(exp => {
                      const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[5];
                      return (
                        <div
                          key={exp.id}
                          style={S.listItem}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(20,34,26,0.9)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'linear-gradient(145deg, rgba(17,28,22,0.8), rgba(12,20,16,0.8))'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                            <div style={S.iconBox(cat.accent, cat.bg)}>{cat.icon}</div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {exp.description}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                                  {new Date(exp.expense_date).toLocaleDateString('es-PE')}
                                </span>
                                {exp.is_recurring && (
                                  <span style={S.badge('rgba(52,211,153,0.08)', '#34d399', 'rgba(52,211,153,0.2)')}>
                                    <IcoRepeat /> Fijo
                                  </span>
                                )}
                                {exp.status === 'pendiente' && (
                                  <span style={S.badge('rgba(251,191,36,0.1)', '#fbbf24', 'rgba(251,191,36,0.25)')}>
                                    Pendiente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: exp.status === 'pendiente' ? '#fbbf24' : 'var(--color-on-surface)', fontFamily: 'Outfit' }}>
                              {fmt(exp.amount)}
                            </span>
                            <button
                              style={S.btnGhost}
                              onClick={() => handleDeleteExpense(exp.id)}
                              title="Eliminar"
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,100,100,0.5)'; }}
                            >
                              <IcoTrash />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB: PLANILLA Y PERSONAL
              ══════════════════════════════════════════════════ */}
          {activeTab === 'nomina' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Header acción */}
              <div style={{
                ...S.card, padding: '18px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: 'Outfit' }}>Nómina y Liquidaciones</p>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, fontFamily: 'Plus Jakarta Sans' }}>
                    Registra pagos, sueldos fijos y comisiones de tu equipo.
                  </p>
                </div>
                <button
                  style={S.btnPrimary}
                  onClick={() => setModalNomina(true)}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <IcoPlus /> Registrar Pago
                </button>
              </div>

              {/* Lista de pagos */}
              <div style={S.section}>
                <p style={S.sectionLabel}>Registro de Liquidaciones</p>
                {payments.length === 0 ? (
                  <div style={S.emptyState}>
                    <p style={{ fontSize: 20, marginBottom: 8 }}>👥</p>
                    <p>No hay liquidaciones registradas.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {payments.map(p => (
                      <div
                        key={p.id}
                        style={S.listItem}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ ...S.iconBox('#34d399', 'rgba(52,211,153,0.1)'), fontSize: 16 }}>
                            <IcoUsers />
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>{p.staff_name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                                {new Date(p.payment_date).toLocaleDateString('es-PE')}
                              </span>
                              <span style={S.badge('rgba(52,211,153,0.1)', '#34d399', 'rgba(52,211,153,0.2)')}>
                                {p.payment_type === 'base' ? 'Sueldo fijo' : p.payment_type === 'commission' ? 'Comisión' : 'Mixto'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit' }}>{fmt(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB: SUNAT
              ══════════════════════════════════════════════════ */}
          {activeTab === 'sunat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Régimen actual */}
              <div style={{ ...S.card, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={S.metricLabel}>Régimen SUNAT activo</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit', letterSpacing: '-0.01em' }}>
                    Régimen {taxData.regimen}
                  </p>
                </div>
                <button
                  style={{ ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}
                  onClick={() => setIsRegimenOpen(v => !v)}
                >
                  <IcoSettings /> Cambiar Régimen
                </button>
              </div>

              {/* Selector régimen */}
              {isRegimenOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {['RUS', 'RER', 'MYPE', 'GENERAL'].map(r => (
                    <button
                      key={r}
                      onClick={() => handleUpdateRegime(r)}
                      style={{
                        padding: '14px 8px',
                        borderRadius: 14, border: '1px solid',
                        borderColor: taxData.regimen === r ? '#2d9d6e' : 'rgba(255,255,255,0.08)',
                        background: taxData.regimen === r ? 'rgba(45,157,110,0.12)' : 'rgba(255,255,255,0.02)',
                        color: taxData.regimen === r ? '#34d399' : 'rgba(255,255,255,0.4)',
                        fontSize: 12, fontWeight: 800,
                        cursor: 'pointer', textAlign: 'center',
                        fontFamily: 'Outfit',
                        transition: 'all 200ms',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Comparativa ventas vs compras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ ...S.card, padding: '18px' }}>
                  <p style={S.metricLabel}>Ventas Netas</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit', letterSpacing: '-0.01em', margin: '6px 0 12px' }}>
                    S/ {taxData.ventas_totales.toFixed(2)}
                  </p>
                  <div style={S.divider} />
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>Base imponible</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>S/ {taxData.ventas_base.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>IGV (18%)</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>S/ {taxData.ventas_igv.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ ...S.card, padding: '18px' }}>
                  <p style={S.metricLabel}>Compras Declaradas</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit', letterSpacing: '-0.01em', margin: '6px 0 12px' }}>
                    S/ {taxData.compras_totales.toFixed(2)}
                  </p>
                  <div style={S.divider} />
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>Base imponible</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>S/ {taxData.compras_base.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>IGV (18%)</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>S/ {taxData.compras_igv.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resultado tributario */}
              <div style={{ ...S.card, padding: '20px' }}>
                <p style={{ ...S.metricLabel, marginBottom: 16 }}>Simulación Tributaria</p>
                {taxData.regimen === 'RUS' ? (
                  taxData.alerta_rus ? (
                    <div style={{ padding: 16, borderRadius: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', gap: 12 }}>
                      <span style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}><IcoAlert /></span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#f87171', fontFamily: 'Plus Jakarta Sans' }}>Límite RUS superado</p>
                        <p style={{ fontSize: 12, color: 'rgba(248,113,113,0.7)', marginTop: 4, lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans' }}>{taxData.alerta_rus}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, background: 'rgba(45,157,110,0.08)', border: '1px solid rgba(45,157,110,0.2)' }}>
                      <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700, fontFamily: 'Plus Jakarta Sans' }}>Cuota RUS sugerida</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#34d399', fontFamily: 'Outfit' }}>{fmt(taxData.cuota_rus)}</span>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>IGV Neto (Ventas - Compras)</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: taxData.igv_neto > 0 ? '#fbbf24' : '#34d399', fontFamily: 'Outfit' }}>
                        {taxData.igv_neto > 0 ? fmt(taxData.igv_neto) : `${fmt(Math.abs(taxData.igv_neto))} (Crédito)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>
                        Renta a cuenta ({taxData.regimen === 'MYPE' ? '1%' : '1.5%'})
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: 'Outfit' }}>{fmt(taxData.renta_estimada)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 14, background: 'rgba(45,157,110,0.08)', border: '1px solid rgba(45,157,110,0.2)', marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#34d399', fontFamily: 'Plus Jakarta Sans' }}>Total impuesto estimado</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#34d399', fontFamily: 'Outfit' }}>
                        {fmt(Math.max(0, taxData.igv_neto) + taxData.renta_estimada)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              TAB: OPTIMIZAR MÁRGENES
              ══════════════════════════════════════════════════ */}
          {activeTab === 'margenes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ ...S.card, padding: '16px 20px' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-on-surface)', fontFamily: 'Outfit' }}>Análisis de Rentabilidad por Plato</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, fontFamily: 'Plus Jakarta Sans' }}>
                  Basado en el costo de ingredientes de tus recetas vs. precio de venta.
                </p>
              </div>

              {margins.length === 0 ? (
                <div style={S.emptyState}>
                  <p style={{ fontSize: 20, marginBottom: 8 }}>📊</p>
                  <p>Sin recetas vinculadas al inventario.</p>
                  <p style={{ fontSize: 11, marginTop: 4 }}>Asigna costos de ingredientes en la sección de Carta.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {margins.map(item => {
                    const mPct = parseFloat(item.margen_porcentaje);
                    // Usamos colores elegantes premium acordes a la forestería de Suna
                    const isGood    = mPct >= 60;
                    const isWarning = mPct >= 45 && mPct < 60;
                    const isBad     = mPct < 45;
                    
                    const color  = isGood ? '#2d9d6e' : isWarning ? '#d97706' : '#dc2626';
                    const bgC    = isGood ? 'rgba(45,157,110,0.08)' : isWarning ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)';
                    const borC   = isGood ? 'rgba(45,157,110,0.2)'  : isWarning ? 'rgba(217,119,6,0.2)'  : 'rgba(220,38,38,0.2)';
                    const sug60  = parseFloat(item.costo_receta) / 0.40;

                    return (
                      <div key={item.item_id} style={{ ...S.card, padding: 18 }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'Plus Jakarta Sans' }}>{item.item_nombre}</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                                Venta: S/ {parseFloat(item.precio).toFixed(2)}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>·</span>
                              <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'Plus Jakarta Sans' }}>
                                Costo: S/ {parseFloat(item.costo_receta).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color, background: bgC, border: `1px solid ${borC}`, padding: '4px 10px', borderRadius: 10, fontFamily: 'Outfit', flexShrink: 0 }}>
                            {mPct.toFixed(1)}%
                          </span>
                        </div>

                        {/* Barra de margen */}
                        <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
                          <div style={{ height: '100%', width: `${Math.min(mPct, 100)}%`, background: color, borderRadius: 99, boxShadow: `0 0 8px ${color}30` }} />
                        </div>

                        {/* Sugerencia */}
                        {parseFloat(item.costo_receta) > 0 ? (
                          isGood ? (
                            <div style={{ fontSize: 11, color: '#2d9d6e', background: 'rgba(45,157,110,0.06)', border: '1px solid rgba(45,157,110,0.15)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Plus Jakarta Sans' }}>
                               <IcoCheck /> Plato altamente rentable ✓
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color, background: bgC, border: `1px solid ${borC}`, borderRadius: 10, padding: '8px 12px', fontFamily: 'Plus Jakarta Sans' }}>
                              <span>{isBad ? '⚠️ Margen crítico' : '📈 Margen bajo'} — Precio sugerido</span>
                              <span style={{ fontWeight: 900, fontSize: 13, fontFamily: 'Outfit' }}>S/ {sug60.toFixed(2)}</span>
                            </div>
                          )
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--color-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Plus Jakarta Sans' }}>
                            <IcoBook /> Sin receta de costos vinculada.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: AGREGAR GASTO — Bottom Sheet nativo
          ═══════════════════════════════════════════════════════ */}
      {modalGasto && selectedCat && (
        <div style={S.overlay} onClick={() => setModalGasto(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            
            {/* Handle */}
            <div style={S.modalHandle} />

            {/* Close */}
            <button
              onClick={() => setModalGasto(false)}
              style={{ position: 'absolute', top: 20, right: 20, ...S.btnGhost, color: 'var(--color-muted)' }}
            >
              <IcoX />
            </button>

            {/* Título */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ ...S.iconBox(selectedCat.accent, selectedCat.bg), width: 56, height: 56, fontSize: 26, margin: '0 auto 12px', borderRadius: 18 }}>
                {selectedCat.icon}
              </div>
              <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit' }}>
                Registrar {selectedCat.label}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, fontFamily: 'Plus Jakarta Sans' }}>
                Ingresa el monto y los detalles del gasto
              </p>
            </div>

            {/* Monto */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Monto del egreso</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', fontSize: 16, fontWeight: 800, fontFamily: 'Outfit' }}>S/</span>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ ...S.inputLarge, paddingLeft: 44 }}
                  autoFocus
                />
              </div>
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Descripción (opcional)</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={e => setExpenseDesc(e.target.value)}
                placeholder={`Recibo ${selectedCat.label} del mes`}
                style={S.input}
              />
            </div>

            {/* Estado */}
            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Estado de pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 6 }}>
                {['pagado', 'pendiente'].map(s => (
                  <button
                    key={s}
                    onClick={() => setExpenseStatus(s)}
                    style={{
                      padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 700,
                      textTransform: 'capitalize', transition: 'all 200ms',
                      background: expenseStatus === s ? 'linear-gradient(135deg,#1a6040,#2d9d6e)' : 'transparent',
                      color: expenseStatus === s ? '#fff' : 'var(--color-muted)',
                      boxShadow: expenseStatus === s ? '0 2px 10px rgba(27,96,64,0.4)' : 'none',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha vencimiento */}
            {expenseStatus === 'pendiente' && (
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Fecha de vencimiento</label>
                <input
                  type="date"
                  value={expenseDueDate}
                  onChange={e => setExpenseDueDate(e.target.value)}
                  style={S.input}
                />
              </div>
            )}

            {/* Recurrente */}
            <button
              onClick={() => setExpenseRecurring(v => !v)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 14, border: '1px solid',
                borderColor: expenseRecurring ? '#2d9d6e' : 'var(--color-surface-3)',
                background: expenseRecurring ? 'rgba(45,157,110,0.1)' : 'var(--color-surface-2)',
                borderColor: expenseRecurring ? 'var(--color-success)' : 'var(--color-surface-3)',
                background: expenseRecurring ? 'var(--color-success-dim)' : 'var(--color-surface-2)',
                color: expenseRecurring ? 'var(--color-success)' : 'var(--color-muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'Plus Jakarta Sans', marginBottom: 20, transition: 'all 200ms',
              }}
            >
              <IcoRepeat /> {expenseRecurring ? '✓ Gasto recurrente mensual activado' : 'Marcar como recurrente mensual'}
            </button>

            {/* Acciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button
                onClick={() => setModalGasto(false)}
                style={{ ...S.btnSecondary, padding: '14px' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExpense}
                disabled={isSaving || !expenseAmount}
                style={{ ...S.btnPrimary, justifyContent: 'center', padding: '14px', opacity: (!expenseAmount || isSaving) ? 0.5 : 1 }}
              >
                {isSaving ? 'Guardando...' : `Registrar S/ ${expenseAmount || '0.00'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: AGREGAR NÓMINA — Bottom Sheet
          ═══════════════════════════════════════════════════════ */}
      {modalNomina && (
        <div style={S.overlay} onClick={() => setModalNomina(false)}>
          <form style={S.modal} onSubmit={handleSavePayroll} onClick={e => e.stopPropagation()}>
            
            <div style={S.modalHandle} />
            {/* Close */}
            <button type="button" onClick={() => setModalNomina(false)} style={{ position: 'absolute', top: 20, right: 20, ...S.btnGhost, color: 'var(--color-muted)' }}>
              <IcoX />
            </button>

            <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-on-surface)', fontFamily: 'Outfit', textAlign: 'center', marginBottom: 6 }}>Liquidar Pago de Planilla</p>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', marginBottom: 24, fontFamily: 'Plus Jakarta Sans' }}>Registra sueldo, comisión o liquidación mixta</p>

            {/* Empleado */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Empleado / Repartidor</label>
              <select
                required
                value={newPayroll.staff_id}
                onChange={e => setNewPayroll({ ...newPayroll, staff_id: e.target.value, staff_name: e.target.options[e.target.selectedIndex].text })}
                style={S.select}
              >
                <option value="">Selecciona un empleado</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                <option value="0">Personal Eventual</option>
              </select>
            </div>

            {/* Periodo */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Periodo de liquidación</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="date" value={newPayroll.period_start} onChange={e => setNewPayroll({ ...newPayroll, period_start: e.target.value })} style={S.input} />
                <input type="date" value={newPayroll.period_end} onChange={e => setNewPayroll({ ...newPayroll, period_end: e.target.value })} style={S.input} />
              </div>
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Tipo de pago</label>
              <select
                value={newPayroll.payment_type}
                onChange={e => setNewPayroll({ ...newPayroll, payment_type: e.target.value })}
                style={S.select}
              >
                <option value="base">Sueldo Fijo</option>
                <option value="commission">Comisión por ventas</option>
                <option value="mixed">Mixto (Fijo + Comisión)</option>
              </select>
            </div>

            {newPayroll.payment_type !== 'commission' && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Monto sueldo fijo (S/)</label>
                <input
                  type="number"
                  value={newPayroll.base_amount}
                  onChange={e => setNewPayroll({ ...newPayroll, base_amount: e.target.value, amount: e.target.value })}
                  placeholder="0.00"
                  style={S.input}
                />
              </div>
            )}

            {newPayroll.payment_type !== 'base' && (
              <div style={{ marginBottom: 14, background: 'var(--color-surface)', border: '1px solid var(--color-surface-3)', borderRadius: 14, padding: '14px' }}>
                <label style={S.label}>Datos de comisión</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ ...S.label, marginBottom: 6 }}>Comisión (%)</label>
                    <input type="number" placeholder="%" value={newPayroll.commission_rate} onChange={e => setNewPayroll({ ...newPayroll, commission_rate: e.target.value })} style={S.input} />
                  </div>
                  <div>
                    <label style={{ ...S.label, marginBottom: 6 }}>Ventas del periodo</label>
                    <input type="number" placeholder="0.00" value={newPayroll.commission_sales} onChange={e => setNewPayroll({ ...newPayroll, commission_sales: e.target.value })} style={S.input} />
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Total a liquidar (S/)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-secondary)', fontSize: 16, fontWeight: 800, fontFamily: 'Outfit' }}>S/</span>
                <input
                  type="number"
                  required
                  value={newPayroll.amount}
                  onChange={e => setNewPayroll({ ...newPayroll, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ ...S.inputLarge, paddingLeft: 44, color: 'var(--color-secondary)', border: '1px solid var(--color-surface-3)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <button type="button" onClick={() => setModalNomina(false)} style={{ ...S.btnSecondary, padding: '14px' }}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || !newPayroll.amount}
                style={{
                  ...S.btnPrimary,
                  justifyContent: 'center',
                  padding: '14px',
                  opacity: (!newPayroll.amount || isSaving) ? 0.6 : 1,
                  background: 'var(--color-primary)',
                  color: 'var(--color-surface)',
                  border: '1px solid var(--color-primary-dk)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                }}
              >
                {isSaving ? 'Guardando...' : 'Confirmar Liquidación'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
