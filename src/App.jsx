import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, Users, Eye, Target, Clock, MousePointer, Globe, ChevronDown, ChevronRight, Filter, RefreshCw, Activity, DollarSign, Plus, X, Building2, Check, Lock, LogOut, User as UserIcon, Eye as EyeIcon, EyeOff } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzGdRgh4p6iJtTvk_CPDUUkLrgfuo1k-RuTPc7VtVrlenEv58LTMAP07l-CxPpgcCqtVw/exec';

const GORUTY = {
  primary: '#5b4bff',
  secondary: '#7c6dff',
  tertiary: '#a594ff',
  light: '#c9bdff',
  accent: '#4936e8',
  pink: '#d4baff',
  deepPurple: '#3a2bd4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// =============================================
// LOGO GROUTY (usa imagen del repo /public/grouty-logo.jpg)
// =============================================
const GorutyLogo = ({ size = 40 }) => (
  <img
    src="/grouty-logo.jpg"
    alt="Grouty"
    className="rounded-xl shadow-lg shadow-violet-300 object-cover"
    style={{ width: size, height: size }}
  />
);

// =============================================
// PANTALLA DE LOGIN
// =============================================
function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!usuario.trim() || !pass.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = `${API_URL}?action=login&user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(pass)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        // Guardar sesión
        localStorage.setItem('grouty_session', JSON.stringify({
          token: data.token,
          usuario: data.usuario,
          nombre: data.nombre,
          rol: data.rol,
          cliente: data.cliente,
          clientes: data.clientes,
          loginTime: Date.now()
        }));
        onLogin(data);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-violet-100 rounded-2xl shadow-xl shadow-violet-100/50 overflow-hidden">
          <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}10, ${GORUTY.tertiary}10)` }}>
            <div className="flex justify-center mb-4">
              <GorutyLogo size={64} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard Grouty</h1>
            <p className="text-sm text-slate-500">Powered by Grouty</p>
          </div>

          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
              <Lock className="w-5 h-5" style={{ color: GORUTY.primary }} />
              Iniciar sesión
            </h2>
            <p className="text-sm text-slate-500 mb-6">Ingresa tus credenciales para acceder</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Usuario</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="Tu usuario"
                    className="w-full bg-violet-50/50 border border-violet-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    placeholder="••••••••"
                    className="w-full bg-violet-50/50 border border-violet-200 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <X className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Ingresar
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-violet-100 text-center">
              <p className="text-xs text-slate-400">
                ¿Problemas para acceder? Contacta a tu administrador
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-slate-400">
          🔐 Acceso seguro · Datos confidenciales
        </div>
      </div>
    </div>
  );
}

// =============================================
// DASHBOARD PRINCIPAL (después de login)
// =============================================
function Dashboard({ session, onLogout }) {
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('2026-03-20');
  const [customEnd, setCustomEnd] = useState('2026-04-23');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // Inicializar cliente activo según permisos
  const [activeClient, setActiveClient] = useState(
    session.cliente === '*' ? session.clientes[0]?.id : session.cliente
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const currentClient = session.clientes.find(c => c.id === activeClient) || session.clientes[0];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(false);

    try {
      const url = `${API_URL}?token=${encodeURIComponent(session.token)}&cliente=${activeClient}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.requiereLogin) {
        // Sesión expirada
        onLogout();
        return;
      }

      if (data.error) throw new Error(data.error);

      setLiveData(data);
      setLastUpdate(new Date());
      setRefreshKey(k => k + 1);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (error) {
      setRefreshError(error.message || 'Error al conectar');
      setTimeout(() => setRefreshError(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line
  }, [activeClient]);

  const [sections, setSections] = useState({
    acquisition: true,
    audience: true,
    behavior: true,
    engagement: true,
    events: false,
    advanced: false,
  });

  const toggleSection = (key) => setSections({ ...sections, [key]: !sections[key] });

  const chartColors = [GORUTY.primary, GORUTY.secondary, GORUTY.tertiary, GORUTY.accent, GORUTY.deepPurple, GORUTY.light, GORUTY.pink];

  // Transformar data
  const allTrendData = useMemo(() => {
    if (!liveData?.resumenDiario || liveData.resumenDiario.length === 0) return [];
    return liveData.resumenDiario.map(row => {
      const fecha = String(row['Fecha'] || '').slice(5, 10);
      const fechaCompleta = String(row['Fecha'] || '').slice(0, 10);
      return {
        fecha,
        fechaCompleta,
        usuarios: Number(row['Usuarios Activos']) || 0,
        usuariosNuevos: Number(row['Usuarios Nuevos']) || 0,
        sesiones: Number(row['Sesiones']) || 0,
        sesionesEng: Number(row['Sesiones Comprometidas']) || 0,
        vistas: Number(row['Vistas de Página']) || 0,
        conversiones: 0,
        valorPurchase: 0,
        tasaEngagement: Number(row['Tasa Engagement (%)']) || 0,
        tasaRebote: Number(row['Tasa Rebote (%)']) || 0,
        duracion: Number(row['Duración Prom. Sesión (seg)']) || 0,
        eventos: Number(row['Conteo Eventos']) || 0,
        eventosUsuario: Number(row['Eventos por Usuario']) || 0,
      };
    });
  }, [liveData, refreshKey]);

  const conversionesPorFecha = useMemo(() => {
    if (!liveData?.eventos) return {};
    const map = {};
    liveData.eventos.forEach(ev => {
      if (ev['Nombre del Evento'] === 'purchase') {
        const fecha = String(ev['Fecha'] || '').slice(5, 10);
        map[fecha] = {
          conv: Number(ev['Conversiones']) || 0,
          valor: Number(ev['Valor del Evento']) || 0,
        };
      }
    });
    return map;
  }, [liveData]);

  const trendDataConConversiones = useMemo(() => {
    return allTrendData.map(d => ({
      ...d,
      conversiones: conversionesPorFecha[d.fecha]?.conv || d.conversiones,
      valorPurchase: conversionesPorFecha[d.fecha]?.valor || d.valorPurchase,
    }));
  }, [allTrendData, conversionesPorFecha]);

  const trendData = useMemo(() => {
    const data = trendDataConConversiones;
    if (dateRange === 'all') return data;
    if (dateRange === '7d') return data.slice(-7);
    if (dateRange === '14d') return data.slice(-14);
    if (dateRange === '28d') return data.slice(-28);
    if (dateRange === 'custom') {
      return data.filter(d => {
        return d.fechaCompleta >= customStart && d.fechaCompleta <= customEnd;
      });
    }
    return data;
  }, [dateRange, customStart, customEnd, trendDataConConversiones]);

  const daysCount = trendData.length;

  // ============================================================
  // 🎯 HELPER: filtro de fechas universal para TODAS las tablas
  // ============================================================
  const dateFilter = useMemo(() => {
    // Set de fechas válidas según el rango seleccionado
    const fechasValidas = new Set(trendData.map(d => d.fechaCompleta).filter(Boolean));

    return (fechaRaw) => {
      if (!fechaRaw) return true; // si la fila no tiene fecha, no la filtramos
      const fecha = String(fechaRaw).slice(0, 10);
      if (dateRange === 'all') return true;
      return fechasValidas.has(fecha);
    };
  }, [dateRange, trendData]);

  const kpis = useMemo(() => {
    const totals = trendData.reduce((acc, d) => ({
      usuarios: acc.usuarios + d.usuarios,
      usuariosNuevos: acc.usuariosNuevos + d.usuariosNuevos,
      sesiones: acc.sesiones + d.sesiones,
      sesionesEng: acc.sesionesEng + d.sesionesEng,
      vistas: acc.vistas + d.vistas,
      conversiones: acc.conversiones + d.conversiones,
      valorPurchase: acc.valorPurchase + d.valorPurchase,
      eventos: acc.eventos + d.eventos,
    }), { usuarios: 0, usuariosNuevos: 0, sesiones: 0, sesionesEng: 0, vistas: 0, conversiones: 0, valorPurchase: 0, eventos: 0 });

    const avgEngagement = trendData.length ? (trendData.reduce((s, d) => s + d.tasaEngagement, 0) / trendData.length).toFixed(1) : 0;
    const avgRebote = trendData.length ? (trendData.reduce((s, d) => s + d.tasaRebote, 0) / trendData.length).toFixed(1) : 0;
    const avgDuracion = trendData.length ? Math.round(trendData.reduce((s, d) => s + d.duracion, 0) / trendData.length) : 0;

    return {
      ...totals,
      tasaEngagement: avgEngagement,
      tasaRebote: avgRebote,
      duracionPromedio: avgDuracion,
      duracionEngagement: Math.round(avgDuracion * 0.78),
      sesionesPorUsuario: totals.usuarios ? (totals.sesiones / totals.usuarios).toFixed(2) : 0,
      vistasPorSesion: totals.sesiones ? (totals.vistas / totals.sesiones).toFixed(2) : 0,
      vistasPorUsuario: totals.usuarios ? (totals.vistas / totals.usuarios).toFixed(2) : 0,
      eventosPorUsuario: totals.usuarios ? (totals.eventos / totals.usuarios).toFixed(2) : 0,
      tasaConversionSesion: totals.sesiones ? ((totals.conversiones / totals.sesiones) * 100).toFixed(2) : 0,
      tasaConversionUsuario: totals.usuarios ? ((totals.conversiones / totals.usuarios) * 100).toFixed(2) : 0,
    };
  }, [trendData]);

  const canalesData = useMemo(() => {
    if (!liveData?.fuentesTrafico) return [];
    const map = {};
    liveData.fuentesTrafico
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const canal = row['Canal'] || 'Otro';
        if (!map[canal]) map[canal] = { nombre: canal, usuarios: 0, sesiones: 0, conversiones: 0 };
        map[canal].usuarios += Number(row['Usuarios']) || 0;
        map[canal].sesiones += Number(row['Sesiones']) || 0;
        map[canal].conversiones += Number(row['Conversiones']) || 0;
      });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 9).map((c, i) => ({ ...c, color: chartColors[i % chartColors.length] }));
  }, [liveData, dateFilter]);

  const sourceMediumData = useMemo(() => {
    if (!liveData?.fuentesTrafico) return [];
    const map = {};
    liveData.fuentesTrafico
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const fuente = row['Source/Medium'] || 'unknown';
        if (!map[fuente]) map[fuente] = { fuente, sesiones: 0, usuarios: 0, conv: 0 };
        map[fuente].sesiones += Number(row['Sesiones']) || 0;
        map[fuente].usuarios += Number(row['Usuarios']) || 0;
        map[fuente].conv += Number(row['Conversiones']) || 0;
      });
    return Object.values(map).sort((a, b) => b.sesiones - a.sesiones).slice(0, 12);
  }, [liveData, dateFilter]);

  const paisesData = useMemo(() => {
    if (!liveData?.geografia) return [];
    const map = {};
    liveData.geografia
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const pais = row['País'] || 'Otros';
        if (!map[pais]) map[pais] = { pais, usuarios: 0, sesiones: 0 };
        map[pais].usuarios += Number(row['Usuarios']) || 0;
        map[pais].sesiones += Number(row['Sesiones']) || 0;
      });
    const total = Object.values(map).reduce((s, p) => s + p.usuarios, 0);
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 10).map(p => ({ ...p, porcentaje: total ? ((p.usuarios / total) * 100).toFixed(1) : 0 }));
  }, [liveData, dateFilter]);

  const ciudadesData = useMemo(() => {
    if (!liveData?.geografia) return [];
    const map = {};
    liveData.geografia
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const ciudad = row['Ciudad'] || '(not set)';
        if (ciudad === '(not set)' || !ciudad) return;
        if (!map[ciudad]) map[ciudad] = { ciudad, usuarios: 0 };
        map[ciudad].usuarios += Number(row['Usuarios']) || 0;
      });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 8);
  }, [liveData, dateFilter]);

  const dispositivosData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    liveData.dispositivos
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const tipoRaw = row['Categoría Dispositivo'] || 'unknown';
        const tipo = tipoRaw.charAt(0).toUpperCase() + tipoRaw.slice(1);
        if (!map[tipo]) map[tipo] = { tipo, usuarios: 0, sesiones: 0 };
        map[tipo].usuarios += Number(row['Usuarios']) || 0;
        map[tipo].sesiones += Number(row['Sesiones']) || 0;
      });
    const colors = { Mobile: GORUTY.primary, Desktop: GORUTY.tertiary, Tablet: GORUTY.light };
    return Object.values(map).map(d => ({ ...d, color: colors[d.tipo] || GORUTY.secondary }));
  }, [liveData, dateFilter]);

  const osData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    liveData.dispositivos
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const os = row['Sistema Operativo'] || 'unknown';
        if (!map[os]) map[os] = { os, usuarios: 0 };
        map[os].usuarios += Number(row['Usuarios']) || 0;
      });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 5);
  }, [liveData, dateFilter]);

  const navegadoresData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    let total = 0;
    liveData.dispositivos
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const nav = row['Navegador'] || 'unknown';
        if (!map[nav]) map[nav] = { navegador: nav, usuarios: 0 };
        const u = Number(row['Usuarios']) || 0;
        map[nav].usuarios += u;
        total += u;
      });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 6).map(n => ({ ...n, porcentaje: total ? ((n.usuarios / total) * 100).toFixed(1) : 0 }));
  }, [liveData, dateFilter]);

  const paginasData = useMemo(() => {
    if (!liveData?.paginas) return [];
    const map = {};
    liveData.paginas
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const path = row['Path sin Query String'] || row['Página (Path)'] || '/';
        if (!map[path]) map[path] = { path, titulo: row['Título'] || '', vistas: 0, usuarios: 0 };
        map[path].vistas += Number(row['Vistas']) || 0;
        map[path].usuarios += Number(row['Usuarios']) || 0;
      });
    return Object.values(map).sort((a, b) => b.vistas - a.vistas).slice(0, 13);
  }, [liveData, dateFilter]);

  const eventosData = useMemo(() => {
    if (!liveData?.eventos) return [];
    const map = {};
    liveData.eventos
      .filter(row => dateFilter(row['Fecha']))
      .forEach(row => {
        const ev = row['Nombre del Evento'] || 'unknown';
        if (!map[ev]) map[ev] = { evento: ev, conteo: 0, usuarios: 0, esConversion: row['¿Es Conversión?'] === 'TRUE' || row['¿Es Conversión?'] === true };
        map[ev].conteo += Number(row['Conversiones']) || 0;
        map[ev].usuarios += Number(row['Usuarios']) || 0;
      });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 12);
  }, [liveData, dateFilter]);

  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const fmtTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const fmtMoney = (n) => `$${(n / 1000000).toFixed(1)}M`;

  const KpiCard = ({ icon: Icon, label, value, accentColor = GORUTY.primary, trend }) => (
    <div className="bg-white border border-violet-100 rounded-xl p-4 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, sectionKey, subtitle }) => (
    <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center justify-between py-3 px-4 bg-white border border-violet-100 hover:border-violet-300 rounded-lg mb-4 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${GORUTY.primary}15` }}>
          <Icon className="w-4 h-4" style={{ color: GORUTY.primary }} />
        </div>
        <div className="text-left">
          <div className="text-slate-900 font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
      {sections[sectionKey] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
  );

  const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white border border-violet-100 rounded-xl p-5 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>
      {children}
    </div>
  );

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#fff', border: `1px solid ${GORUTY.light}`, borderRadius: '8px', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(91, 75, 255, 0.1)' },
    labelStyle: { color: '#64748b', fontWeight: 600 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 text-slate-800 p-6">
      <div className="max-w-[1400px] mx-auto">

        {/* TOAST */}
        {refreshSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">¡Datos actualizados!</span>
          </div>
        )}
        {refreshError && (
          <div className="fixed top-4 right-4 z-50 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
            <X className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Error</div>
              <div className="text-xs">{refreshError}</div>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <GorutyLogo size={52} />
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Grouty</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}>Grouty</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{currentClient?.emoji} {currentClient?.nombre}</span>
                {liveData && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✓ Datos en vivo</span>}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span>Última actualización: {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-start relative">
            <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            {/* Selector cliente (solo si admin) */}
            {session.cliente === '*' && session.clientes.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowClientDropdown(!showClientDropdown)} className="px-4 py-2 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-sm flex items-center gap-2 transition text-slate-700 font-medium">
                  <Building2 className="w-4 h-4" style={{ color: GORUTY.primary }} />
                  <span>{currentClient?.emoji} {currentClient?.nombre}</span>
                  <ChevronDown className={`w-4 h-4 transition ${showClientDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showClientDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-violet-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-violet-100 bg-violet-50/50">
                      <span className="text-xs font-semibold text-slate-600 px-2">CLIENTES ({session.clientes.length})</span>
                    </div>
                    {session.clientes.map(client => (
                      <div key={client.id} onClick={() => { setActiveClient(client.id); setShowClientDropdown(false); }} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-violet-50 cursor-pointer ${activeClient === client.id ? 'bg-violet-50' : ''}`}>
                        <span className="text-lg">{client.emoji}</span>
                        <span className="text-sm font-medium text-slate-800 flex-1">{client.nombre}</span>
                        {activeClient === client.id && <Check className="w-4 h-4" style={{ color: GORUTY.primary }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Menú usuario */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="px-3 py-2 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-sm flex items-center gap-2 transition text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}>
                  {session.nombre?.charAt(0) || 'U'}
                </div>
                <ChevronDown className={`w-4 h-4 transition ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-violet-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-violet-100 bg-violet-50/50">
                    <div className="text-sm font-semibold text-slate-800">{session.nombre}</div>
                    <div className="text-xs text-slate-500">@{session.usuario}</div>
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GORUTY.primary}20`, color: GORUTY.primary }}>
                      {session.rol === 'admin' ? '👑 Administrador' : '👤 Cliente'}
                    </span>
                  </div>
                  <button onClick={onLogout} className="w-full px-3 py-2.5 text-sm font-medium flex items-center gap-2 transition hover:bg-rose-50 text-rose-600">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-violet-100 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" style={{ color: GORUTY.primary }} />
            <span className="text-sm font-semibold text-slate-800">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">📅 Rango de fechas</label>
              <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setShowCustomDate(e.target.value === 'custom'); }} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800">
                <option value="all">Todo el período</option>
                <option value="7d">Últimos 7 días</option>
                <option value="14d">Últimos 14 días</option>
                <option value="28d">Últimos 28 días</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
          {showCustomDate && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-violet-100">
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Desde</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Hasta</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" />
              </div>
            </div>
          )}
          <div className="mt-3 text-xs text-slate-500">
            Mostrando <span className="font-semibold" style={{ color: GORUTY.primary }}>{daysCount} días</span> de datos
            {dateRange !== 'all' && <span className="ml-2 text-violet-600">· Filtro aplicado a todas las secciones</span>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={Users} label="Usuarios Activos" value={fmt(kpis.usuarios)} accentColor={GORUTY.primary} trend={8.4} />
          <KpiCard icon={Users} label="Usuarios Nuevos" value={fmt(kpis.usuariosNuevos)} accentColor={GORUTY.secondary} trend={6.2} />
          <KpiCard icon={MousePointer} label="Sesiones" value={fmt(kpis.sesiones)} accentColor={GORUTY.tertiary} trend={9.1} />
          <KpiCard icon={Eye} label="Vistas" value={fmt(kpis.vistas)} accentColor={GORUTY.accent} />
          <KpiCard icon={Target} label="Conversiones" value={fmt(kpis.conversiones)} accentColor={GORUTY.deepPurple} />
          <KpiCard icon={DollarSign} label="Valor Compras" value={fmtMoney(kpis.valorPurchase)} accentColor={GORUTY.primary} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={TrendingUp} label="Tasa Engagement" value={`${kpis.tasaEngagement}%`} accentColor={GORUTY.primary} />
          <KpiCard icon={Activity} label="Tasa Rebote" value={`${kpis.tasaRebote}%`} accentColor={GORUTY.danger} />
          <KpiCard icon={Clock} label="Duración Sesión" value={fmtTime(kpis.duracionPromedio)} accentColor={GORUTY.secondary} />
          <KpiCard icon={Clock} label="Dur. Engagement" value={fmtTime(kpis.duracionEngagement)} accentColor={GORUTY.tertiary} />
          <KpiCard icon={Activity} label="Sesiones Comp." value={fmt(kpis.sesionesEng)} accentColor={GORUTY.accent} />
          <KpiCard icon={Target} label="Tasa Conv." value={`${kpis.tasaConversionSesion}%`} accentColor={GORUTY.deepPurple} />
        </div>

        <Panel title="📈 Tendencia Temporal — Usuarios, Sesiones y Conversiones" className="mb-6">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GORUTY.primary} stopOpacity={0.35} /><stop offset="95%" stopColor={GORUTY.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="gradSesiones" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={GORUTY.tertiary} stopOpacity={0.35} /><stop offset="95%" stopColor={GORUTY.tertiary} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
              <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke={GORUTY.accent} style={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="usuarios" stroke={GORUTY.primary} fill="url(#gradUsuarios)" strokeWidth={2.5} name="Usuarios" />
              <Area yAxisId="left" type="monotone" dataKey="sesiones" stroke={GORUTY.tertiary} fill="url(#gradSesiones)" strokeWidth={2.5} name="Sesiones" />
              <Bar yAxisId="right" dataKey="conversiones" fill={GORUTY.accent} name="Conversiones" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="📊 Tasa de Engagement vs Tasa de Rebote (%)" className="mb-6">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
              <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="tasaEngagement" stroke={GORUTY.primary} strokeWidth={2.5} name="Tasa Engagement" dot={false} />
              <Line type="monotone" dataKey="tasaRebote" stroke={GORUTY.danger} strokeWidth={2.5} name="Tasa Rebote" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <SectionHeader title="Adquisición" subtitle="Canales y fuentes" icon={TrendingUp} sectionKey="acquisition" />
        {sections.acquisition && canalesData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Panel title="Usuarios por Canal">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={canalesData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" stroke="#64748b" style={{ fontSize: 11 }} width={110} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="usuarios" radius={[0, 4, 4, 0]}>
                    {canalesData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Top Fuente / Medio">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-slate-500 border-b border-violet-100">
                      <th className="py-2 px-3 font-semibold">Source / Medium</th>
                      <th className="py-2 px-3 text-right font-semibold">Sesiones</th>
                      <th className="py-2 px-3 text-right font-semibold">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceMediumData.map((row, i) => (
                      <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                        <td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.fuente}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{fmt(row.sesiones)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">{row.conv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        <SectionHeader title="Audiencia" subtitle="Ubicación y dispositivos" icon={Globe} sectionKey="audience" />
        {sections.audience && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {paisesData.length > 0 && (
              <Panel title="Usuarios por País" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={paisesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis dataKey="pais" stroke="#64748b" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="usuarios" fill={GORUTY.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}
            {dispositivosData.length > 0 && (
              <Panel title="Dispositivos">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={dispositivosData} dataKey="usuarios" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={(e) => e.tipo}>
                      {dispositivosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            )}
            {ciudadesData.length > 0 && (
              <Panel title="Top Ciudades">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ciudadesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="ciudad" stroke="#64748b" style={{ fontSize: 11 }} width={100} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="usuarios" fill={GORUTY.secondary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}
            {osData.length > 0 && (
              <Panel title="Sistema Operativo">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={osData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="os" stroke="#64748b" style={{ fontSize: 11 }} width={90} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="usuarios" fill={GORUTY.tertiary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}
            {navegadoresData.length > 0 && (
              <Panel title="Navegadores">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={navegadoresData} dataKey="usuarios" nameKey="navegador" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.navegador} (${e.porcentaje}%)`} style={{ fontSize: 9 }}>
                      {navegadoresData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Panel>
            )}
          </div>
        )}

        <SectionHeader title="Comportamiento" subtitle="Páginas más vistas" icon={Eye} sectionKey="behavior" />
        {sections.behavior && paginasData.length > 0 && (
          <Panel title="Páginas Más Vistas" className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-violet-100">
                    <th className="py-2 px-3 font-semibold">Path</th>
                    <th className="py-2 px-3 font-semibold">Título</th>
                    <th className="py-2 px-3 text-right font-semibold">Vistas</th>
                    <th className="py-2 px-3 text-right font-semibold">Usuarios</th>
                  </tr>
                </thead>
                <tbody>
                  {paginasData.map((row, i) => (
                    <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                      <td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.path}</td>
                      <td className="py-2 px-3 text-slate-700 text-xs">{row.titulo}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{fmt(row.vistas)}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{fmt(row.usuarios)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <SectionHeader title="Eventos" subtitle="Conteo de eventos" icon={MousePointer} sectionKey="events" />
        {sections.events && eventosData.length > 0 && (
          <Panel title="Top Eventos" className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-violet-100">
                    <th className="py-2 px-3 font-semibold">Evento</th>
                    <th className="py-2 px-3 text-right font-semibold">Conteo</th>
                    <th className="py-2 px-3 text-right font-semibold">Usuarios</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosData.map((row, i) => (
                    <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                      <td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.accent }}>
                        {row.evento}
                        {row.esConversion && <span className="ml-2 text-emerald-600 font-bold">✓</span>}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700">{fmt(row.conteo)}</td>
                      <td className="py-2 px-3 text-right text-slate-700">{fmt(row.usuarios)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-6 border-t border-violet-100">
          <GorutyLogo size={20} />
          <span>Dashboard Grouty · {currentClient?.nombre} · Powered by Grouty · 🔐 Acceso autenticado</span>
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE ROOT (decide login o dashboard)
// =============================================
export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Recuperar sesión guardada
    const saved = localStorage.getItem('grouty_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // Validar que la sesión no tenga más de 24h
        const horasTranscurridas = (Date.now() - (data.loginTime || 0)) / (1000 * 60 * 60);
        if (horasTranscurridas < 24) {
          setSession(data);
        } else {
          localStorage.removeItem('grouty_session');
        }
      } catch (e) {
        localStorage.removeItem('grouty_session');
      }
    }
    setCheckingSession(false);
  }, []);

  const handleLogin = (data) => {
    setSession({
      token: data.token,
      usuario: data.usuario,
      nombre: data.nombre,
      rol: data.rol,
      cliente: data.cliente,
      clientes: data.clientes,
      loginTime: Date.now()
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('grouty_session');
    setSession(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <GorutyLogo size={64} />
          <div className="mt-4 text-slate-500 text-sm">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard session={session} onLogout={handleLogout} />;
}
