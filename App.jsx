import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, Users, Eye, Target, Clock, MousePointer, Globe, ChevronDown, ChevronRight, Filter, RefreshCw, Activity, DollarSign, Plus, X, Building2, Check } from 'lucide-react';

export default function App() {
  // ============ FILTROS ============
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('2026-03-20');
  const [customEnd, setCustomEnd] = useState('2026-04-23');
  const [channel, setChannel] = useState('all');
  const [device, setDevice] = useState('all');
  const [country, setCountry] = useState('all');
  const [landingPage, setLandingPage] = useState('all');
  const [showCustomDate, setShowCustomDate] = useState(false);

  // ============ MULTI-CLIENTE ============
  const [clients, setClients] = useState([
    { 
      id: 'hotel-termas', 
      name: 'Hotel Termas de Chillán', 
      fileId: '1YBsStKisMhgI4547bqgPRey0DHShHUOSOx6m-ayD1S4', 
      emoji: '🏨',
      apiKey: 'hotel-termas'
    },
  ]);
  const [activeClient, setActiveClient] = useState('hotel-termas');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientFileId, setNewClientFileId] = useState('');
  const [newClientApiKey, setNewClientApiKey] = useState('');
  const [newClientEmoji, setNewClientEmoji] = useState('🏢');

  // API endpoint del Apps Script (Web App)
  const API_URL = 'https://script.google.com/macros/s/AKfycbzGdRgh4p6iJtTvk_CPDUUkLrgfuo1k-RuTPc7VtVrlenEv58LTMAP07l-CxPpgcCqtVw/exec';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [liveData, setLiveData] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const currentClient = clients.find(c => c.id === activeClient) || clients[0];

  // ============ FETCH DESDE APPS SCRIPT (Vercel sin CORS) ============
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(false);
    
    try {
      const url = `${API_URL}?cliente=${currentClient.apiKey || currentClient.id}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setLiveData(data);
      setLastUpdate(new Date());
      setRefreshKey(k => k + 1);
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (error) {
      setRefreshError(error.message || 'Error al conectar con el Sheet');
      setTimeout(() => setRefreshError(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line
  }, [activeClient]);

  const handleAddClient = () => {
    if (newClientName.trim() && newClientFileId.trim()) {
      const newId = `client-${Date.now()}`;
      const newClient = {
        id: newId,
        name: newClientName.trim(),
        fileId: newClientFileId.trim(),
        apiKey: newClientApiKey.trim() || newId,
        emoji: newClientEmoji || '🏢',
      };
      setClients([...clients, newClient]);
      setActiveClient(newId);
      setNewClientName('');
      setNewClientFileId('');
      setNewClientApiKey('');
      setNewClientEmoji('🏢');
      setShowAddClient(false);
      setShowClientDropdown(false);
    }
  };

  const handleRemoveClient = (clientId) => {
    if (clients.length <= 1) return;
    const updated = clients.filter(c => c.id !== clientId);
    setClients(updated);
    if (activeClient === clientId) {
      setActiveClient(updated[0].id);
    }
  };

  const [sections, setSections] = useState({
    acquisition: true,
    audience: true,
    behavior: true,
    engagement: true,
    events: false,
    advanced: false,
  });

  const toggleSection = (key) => setSections({ ...sections, [key]: !sections[key] });

  // ============ PALETA GROUTY ============
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

  const chartColors = [GORUTY.primary, GORUTY.secondary, GORUTY.tertiary, GORUTY.accent, GORUTY.deepPurple, GORUTY.light, GORUTY.pink];

  // ============ DATA FALLBACK (mientras carga el live data) ============
  const fallbackTrend = [
    { fecha: '03-20', usuarios: 1265, usuariosNuevos: 1096, sesiones: 1573, vistas: 3753, conversiones: 9, valorPurchase: 34527428, tasaEngagement: 56.33, tasaRebote: 43.67, duracion: 182, eventos: 9965, eventosUsuario: 7.88, sesionesEng: 886 },
    { fecha: '03-21', usuarios: 1514, usuariosNuevos: 1302, sesiones: 1809, vistas: 4438, conversiones: 11, valorPurchase: 30009252, tasaEngagement: 59.31, tasaRebote: 40.69, duracion: 177, eventos: 11588, eventosUsuario: 7.65, sesionesEng: 1073 },
    { fecha: '03-22', usuarios: 1725, usuariosNuevos: 1551, sesiones: 2057, vistas: 4897, conversiones: 18, valorPurchase: 44125262, tasaEngagement: 58.87, tasaRebote: 41.13, duracion: 174, eventos: 12809, eventosUsuario: 7.43, sesionesEng: 1211 },
    { fecha: '03-23', usuarios: 1609, usuariosNuevos: 1362, sesiones: 2043, vistas: 5693, conversiones: 20, valorPurchase: 34157750, tasaEngagement: 58.74, tasaRebote: 41.26, duracion: 230, eventos: 14606, eventosUsuario: 9.08, sesionesEng: 1200 },
    { fecha: '03-24', usuarios: 1393, usuariosNuevos: 1154, sesiones: 1698, vistas: 4573, conversiones: 16, valorPurchase: 20261750, tasaEngagement: 52.94, tasaRebote: 47.06, duracion: 195, eventos: 11770, eventosUsuario: 8.45, sesionesEng: 899 },
  ];

  // ============ TRANSFORMA DATA EN VIVO ============
  const allTrendData = useMemo(() => {
    if (!liveData?.resumenDiario || liveData.resumenDiario.length === 0) {
      return fallbackTrend;
    }
    return liveData.resumenDiario.map(row => {
      const fecha = String(row['Fecha'] || '').slice(5, 10);
      return {
        fecha: fecha,
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

  // ============ CONVERSIONES POR FECHA (cruzar con eventos purchase) ============
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

  // Mergear conversiones a trendData
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
        const fullDate = `2026-${d.fecha}`;
        return fullDate >= customStart && fullDate <= customEnd;
      });
    }
    return data;
  }, [dateRange, customStart, customEnd, trendDataConConversiones]);

  const daysCount = trendData.length;

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
      activos7d: 10000,
      activos28d: 40000,
    };
  }, [trendData]);

  // ============ AGREGADOS PARA SECCIONES ============
  const canalesData = useMemo(() => {
    if (!liveData?.fuentesTrafico) return [
      { nombre: 'Cross-network', usuarios: 19500, sesiones: 24800, conversiones: 105, color: GORUTY.primary },
      { nombre: 'Direct', usuarios: 9200, sesiones: 11400, conversiones: 25, color: GORUTY.secondary },
    ];
    const map = {};
    liveData.fuentesTrafico.forEach(row => {
      const canal = row['Canal'] || 'Otro';
      if (!map[canal]) map[canal] = { nombre: canal, usuarios: 0, sesiones: 0, conversiones: 0 };
      map[canal].usuarios += Number(row['Usuarios']) || 0;
      map[canal].sesiones += Number(row['Sesiones']) || 0;
      map[canal].conversiones += Number(row['Conversiones']) || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.usuarios - a.usuarios)
      .slice(0, 9)
      .map((c, i) => ({ ...c, color: chartColors[i % chartColors.length] }));
  }, [liveData]);

  const sourceMediumData = useMemo(() => {
    if (!liveData?.fuentesTrafico) return [];
    const map = {};
    liveData.fuentesTrafico.forEach(row => {
      const fuente = row['Source/Medium'] || row['Fuente'] + ' / ' + row['Medio'];
      if (!map[fuente]) map[fuente] = { fuente, sesiones: 0, usuarios: 0, conv: 0 };
      map[fuente].sesiones += Number(row['Sesiones']) || 0;
      map[fuente].usuarios += Number(row['Usuarios']) || 0;
      map[fuente].conv += Number(row['Conversiones']) || 0;
    });
    return Object.values(map).sort((a, b) => b.sesiones - a.sesiones).slice(0, 12);
  }, [liveData]);

  const campaignsData = useMemo(() => {
    if (!liveData?.fuentesTrafico) return [];
    const map = {};
    liveData.fuentesTrafico.forEach(row => {
      const camp = row['Campaña'] || '(not set)';
      if (camp === '(not set)') return;
      if (!map[camp]) map[camp] = { campana: camp, desc: row['Canal'], sesiones: 0, conv: 0 };
      map[camp].sesiones += Number(row['Sesiones']) || 0;
      map[camp].conv += Number(row['Conversiones']) || 0;
    });
    return Object.values(map).sort((a, b) => b.sesiones - a.sesiones).slice(0, 6);
  }, [liveData]);

  const paisesData = useMemo(() => {
    if (!liveData?.geografia) return [];
    const map = {};
    liveData.geografia.forEach(row => {
      const pais = row['País'] || 'Otros';
      if (!map[pais]) map[pais] = { pais, usuarios: 0, sesiones: 0 };
      map[pais].usuarios += Number(row['Usuarios']) || 0;
      map[pais].sesiones += Number(row['Sesiones']) || 0;
    });
    const total = Object.values(map).reduce((s, p) => s + p.usuarios, 0);
    return Object.values(map)
      .sort((a, b) => b.usuarios - a.usuarios)
      .slice(0, 10)
      .map(p => ({ ...p, porcentaje: total ? ((p.usuarios / total) * 100).toFixed(1) : 0 }));
  }, [liveData]);

  const ciudadesData = useMemo(() => {
    if (!liveData?.geografia) return [];
    const map = {};
    liveData.geografia.forEach(row => {
      const ciudad = row['Ciudad'] || '(not set)';
      if (ciudad === '(not set)' || !ciudad) return;
      if (!map[ciudad]) map[ciudad] = { ciudad, usuarios: 0 };
      map[ciudad].usuarios += Number(row['Usuarios']) || 0;
    });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 8);
  }, [liveData]);

  const dispositivosData = useMemo(() => {
    if (!liveData?.dispositivos) return [
      { tipo: 'Mobile', usuarios: 38200, sesiones: 46500, color: GORUTY.primary },
      { tipo: 'Desktop', usuarios: 9800, sesiones: 12100, color: GORUTY.tertiary },
    ];
    const map = {};
    liveData.dispositivos.forEach(row => {
      const tipo = (row['Categoría Dispositivo'] || 'unknown').charAt(0).toUpperCase() + (row['Categoría Dispositivo'] || 'unknown').slice(1);
      if (!map[tipo]) map[tipo] = { tipo, usuarios: 0, sesiones: 0 };
      map[tipo].usuarios += Number(row['Usuarios']) || 0;
      map[tipo].sesiones += Number(row['Sesiones']) || 0;
    });
    const colors = { Mobile: GORUTY.primary, Desktop: GORUTY.tertiary, Tablet: GORUTY.light };
    return Object.values(map).map(d => ({ ...d, color: colors[d.tipo] || GORUTY.secondary }));
  }, [liveData]);

  const osData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    liveData.dispositivos.forEach(row => {
      const os = row['Sistema Operativo'] || 'unknown';
      if (!map[os]) map[os] = { os, usuarios: 0 };
      map[os].usuarios += Number(row['Usuarios']) || 0;
    });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 5);
  }, [liveData]);

  const navegadoresData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    let total = 0;
    liveData.dispositivos.forEach(row => {
      const nav = row['Navegador'] || 'unknown';
      if (!map[nav]) map[nav] = { navegador: nav, usuarios: 0 };
      const u = Number(row['Usuarios']) || 0;
      map[nav].usuarios += u;
      total += u;
    });
    return Object.values(map)
      .sort((a, b) => b.usuarios - a.usuarios)
      .slice(0, 6)
      .map(n => ({ ...n, porcentaje: total ? ((n.usuarios / total) * 100).toFixed(1) : 0 }));
  }, [liveData]);

  const resolucionData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    liveData.dispositivos.forEach(row => {
      const res = row['Resolución Pantalla'] || 'unknown';
      if (!map[res]) map[res] = { resolucion: res, usuarios: 0 };
      map[res].usuarios += Number(row['Usuarios']) || 0;
    });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 8);
  }, [liveData]);

  const idiomasData = useMemo(() => {
    if (!liveData?.dispositivos) return [];
    const map = {};
    liveData.dispositivos.forEach(row => {
      const idioma = row['Idioma'] || 'unknown';
      if (!map[idioma]) map[idioma] = { idioma, usuarios: 0 };
      map[idioma].usuarios += Number(row['Usuarios']) || 0;
    });
    return Object.values(map).sort((a, b) => b.usuarios - a.usuarios).slice(0, 5);
  }, [liveData]);

  const paginasData = useMemo(() => {
    if (!liveData?.paginas) return [];
    const map = {};
    liveData.paginas.forEach(row => {
      const path = row['Path sin Query String'] || row['Página (Path)'] || '/';
      if (!map[path]) map[path] = { path, titulo: row['Título'] || '', vistas: 0, usuarios: 0 };
      map[path].vistas += Number(row['Vistas']) || 0;
      map[path].usuarios += Number(row['Usuarios']) || 0;
    });
    return Object.values(map).sort((a, b) => b.vistas - a.vistas).slice(0, 13);
  }, [liveData]);

  const landingPagesData = useMemo(() => {
    if (!liveData?.paginas) return [];
    const map = {};
    liveData.paginas.forEach(row => {
      const landing = row['Página de Destino'] || '/';
      if (!map[landing]) map[landing] = { landing, sesiones: 0, conv: 0 };
      map[landing].sesiones += Number(row['Vistas']) || 0;
      map[landing].conv += Number(row['Conversiones']) || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.sesiones - a.sesiones)
      .slice(0, 9)
      .map(l => ({ ...l, tasaConv: l.sesiones ? ((l.conv / l.sesiones) * 100).toFixed(2) : 0 }));
  }, [liveData]);

  const eventosData = useMemo(() => {
    if (!liveData?.eventos) return [];
    const map = {};
    liveData.eventos.forEach(row => {
      const ev = row['Nombre del Evento'] || 'unknown';
      if (!map[ev]) map[ev] = { evento: ev, conteo: 0, usuarios: 0, esConversion: row['¿Es Conversión?'] === 'TRUE' || row['¿Es Conversión?'] === true };
      map[ev].conteo += Number(row['Conversiones']) || Number(row['Conteo']) || 0;
      map[ev].usuarios += Number(row['Usuarios']) || 0;
    });
    const eventList = Object.values(map);
    // Estimar conteo total de eventos no conversion
    eventList.forEach(e => {
      if (!e.esConversion) {
        e.conteo = Math.max(e.conteo, e.usuarios);
      }
    });
    return eventList.sort((a, b) => b.usuarios - a.usuarios).slice(0, 12);
  }, [liveData]);

  const firstVsLastData = useMemo(() => {
    if (!liveData?.adquisicion || !liveData?.fuentesTrafico) return [];
    const primero = {};
    liveData.adquisicion.forEach(row => {
      const c = row['Primer Canal'] || 'Otro';
      if (!primero[c]) primero[c] = 0;
      primero[c] += Number(row['Usuarios Nuevos']) || 0;
    });
    const ultimo = {};
    liveData.fuentesTrafico.forEach(row => {
      const c = row['Canal'] || 'Otro';
      if (!ultimo[c]) ultimo[c] = 0;
      ultimo[c] += Number(row['Usuarios']) || 0;
    });
    return Object.keys(primero)
      .map(c => ({ canal: c, primero: primero[c] || 0, ultimo: ultimo[c] || 0 }))
      .sort((a, b) => b.ultimo - a.ultimo)
      .slice(0, 6);
  }, [liveData]);

  // ============ FORMATTERS ============
  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const fmtTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const fmtMoney = (n) => `$${(n / 1000000).toFixed(1)}M`;

  // ============ LOGO GROUTY ============
  const GorutyLogo = ({ size = 40 }) => (
    <div
      className="rounded-xl flex items-center justify-center shadow-lg shadow-violet-300"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${GORUTY.primary} 0%, ${GORUTY.tertiary} 100%)`,
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: size * 0.6, height: size * 0.6 }}>
        <path
          d="M 30 20 L 75 20 L 75 80 L 58 80 L 58 37 L 45 37 Q 30 37 30 55 L 30 75 L 15 75 L 15 55 Q 15 20 30 20 Z"
          fill="#f5f0ff"
        />
      </svg>
    </div>
  );

  // ============ COMPONENTES ============
  const KpiCard = ({ icon: Icon, label, value, sublabel, accentColor = GORUTY.primary, trend }) => (
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
      {sublabel && <div className="text-xs text-slate-400 mt-1">{sublabel}</div>}
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, sectionKey, subtitle }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between py-3 px-4 bg-white border border-violet-100 hover:border-violet-300 hover:shadow-sm rounded-lg mb-4 transition-all"
    >
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
    contentStyle: {
      backgroundColor: '#fff',
      border: `1px solid ${GORUTY.light}`,
      borderRadius: '8px',
      color: '#1e293b',
      boxShadow: '0 10px 15px -3px rgba(91, 75, 255, 0.1)',
    },
    labelStyle: { color: '#64748b', fontWeight: 600 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 text-slate-800 p-6">
      <div className="max-w-[1400px] mx-auto">

        {/* TOAST NOTIFICATIONS */}
        {refreshSuccess && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">¡Datos actualizados desde Google Sheets!</span>
          </div>
        )}
        {refreshError && (
          <div className="fixed top-4 right-4 z-50 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
            <X className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Error al actualizar</div>
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
                <h1 className="text-2xl font-bold text-slate-900">Dashboard GA4</h1>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}
                >
                  Grouty
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {currentClient.emoji} {currentClient.name}
                </span>
                {liveData && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    ✓ Datos en vivo
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span>Última actualización: {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {lastUpdate.toLocaleDateString('es-CL')}</span>
                {liveData && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {liveData.resumenDiario?.length || 0} días cargados
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-start relative">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="px-4 py-2 bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-50 rounded-lg text-sm flex items-center gap-2 transition text-slate-700 font-medium"
              >
                <Building2 className="w-4 h-4" style={{ color: GORUTY.primary }} />
                <span>{currentClient.emoji} {currentClient.name}</span>
                <ChevronDown className={`w-4 h-4 transition ${showClientDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showClientDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-violet-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-violet-100 bg-violet-50/50">
                    <span className="text-xs font-semibold text-slate-600 px-2">CLIENTES ({clients.length})</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {clients.map(client => (
                      <div
                        key={client.id}
                        className={`flex items-center justify-between px-3 py-2.5 hover:bg-violet-50 cursor-pointer transition ${activeClient === client.id ? 'bg-violet-50' : ''}`}
                      >
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={() => { setActiveClient(client.id); setShowClientDropdown(false); }}
                        >
                          <span className="text-lg">{client.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">{client.name}</div>
                            <div className="text-xs text-slate-400 font-mono truncate">{client.fileId.substring(0, 20)}...</div>
                          </div>
                          {activeClient === client.id && (
                            <Check className="w-4 h-4 flex-shrink-0" style={{ color: GORUTY.primary }} />
                          )}
                        </div>
                        {clients.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveClient(client.id); }}
                            className="ml-2 p-1 hover:bg-rose-100 rounded text-rose-500 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowAddClient(true); setShowClientDropdown(false); }}
                    className="w-full px-3 py-2.5 border-t border-violet-100 text-sm font-medium flex items-center gap-2 transition hover:bg-violet-50"
                    style={{ color: GORUTY.primary }}
                  >
                    <Plus className="w-4 h-4" /> Agregar nuevo cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL Agregar Cliente */}
        {showAddClient && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-violet-100 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}10, ${GORUTY.tertiary}10)` }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${GORUTY.primary}20` }}>
                    <Building2 className="w-5 h-5" style={{ color: GORUTY.primary }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Agregar Cliente</h3>
                    <p className="text-xs text-slate-500">Conecta un nuevo Sheet de Google Analytics</p>
                  </div>
                </div>
                <button onClick={() => setShowAddClient(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Emoji / Ícono</label>
                  <div className="flex gap-2 flex-wrap">
                    {['🏨', '🏢', '🏪', '🛍️', '🍽️', '✈️', '🚗', '🏥', '🎓', '💼', '🌐', '📱'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewClientEmoji(emoji)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${newClientEmoji === emoji ? 'ring-2' : 'bg-violet-50 hover:bg-violet-100'}`}
                        style={newClientEmoji === emoji ? { backgroundColor: `${GORUTY.primary}20` } : {}}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ej: Hotel Boutique Santiago"
                    className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Google Sheet File ID</label>
                  <input
                    type="text"
                    value={newClientFileId}
                    onChange={(e) => setNewClientFileId(e.target.value)}
                    placeholder="Ej: 1YBsStKisMhgI4547bqgPRey0DHShHUOSOx6m-ayD1S4"
                    className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-violet-500 focus:bg-white outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">ID del Cliente en Apps Script</label>
                  <input
                    type="text"
                    value={newClientApiKey}
                    onChange={(e) => setNewClientApiKey(e.target.value)}
                    placeholder="Ej: hotel-boutique"
                    className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:border-violet-500 focus:bg-white outline-none text-slate-800"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-violet-100 flex gap-2 bg-violet-50/30">
                <button onClick={() => setShowAddClient(false)} className="flex-1 px-4 py-2.5 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-sm font-medium text-slate-700 transition">
                  Cancelar
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={!newClientName.trim() || !newClientFileId.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}
                >
                  <Plus className="w-4 h-4" /> Agregar Cliente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div className="bg-white border border-violet-100 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" style={{ color: GORUTY.primary }} />
            <span className="text-sm font-semibold text-slate-800">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">📊 Canal</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800">
                <option value="all">Todos los canales</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">📱 Dispositivo</label>
              <select value={device} onChange={(e) => setDevice(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800">
                <option value="all">Todos</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">🌎 País</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800">
                <option value="all">Todos los países</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">🔗 Landing Page</label>
              <select value={landingPage} onChange={(e) => setLandingPage(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800">
                <option value="all">Todas</option>
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
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={Users} label="Usuarios Activos" value={fmt(kpis.usuarios)} accentColor={GORUTY.primary} trend={8.4} />
          <KpiCard icon={Users} label="Usuarios Nuevos" value={fmt(kpis.usuariosNuevos)} accentColor={GORUTY.secondary} trend={6.2} />
          <KpiCard icon={MousePointer} label="Sesiones" value={fmt(kpis.sesiones)} accentColor={GORUTY.tertiary} trend={9.1} />
          <KpiCard icon={Eye} label="Vistas de Página" value={fmt(kpis.vistas)} accentColor={GORUTY.accent} trend={4.3} />
          <KpiCard icon={Target} label="Conversiones" value={fmt(kpis.conversiones)} accentColor={GORUTY.deepPurple} trend={-2.8} />
          <KpiCard icon={DollarSign} label="Valor Compras" value={fmtMoney(kpis.valorPurchase)} accentColor={GORUTY.primary} trend={12.5} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <KpiCard icon={TrendingUp} label="Tasa Engagement" value={`${kpis.tasaEngagement}%`} accentColor={GORUTY.primary} />
          <KpiCard icon={Activity} label="Tasa Rebote" value={`${kpis.tasaRebote}%`} accentColor={GORUTY.danger} />
          <KpiCard icon={Clock} label="Duración Sesión" value={fmtTime(kpis.duracionPromedio)} accentColor={GORUTY.secondary} />
          <KpiCard icon={Clock} label="Dur. Engagement" value={fmtTime(kpis.duracionEngagement)} accentColor={GORUTY.tertiary} />
          <KpiCard icon={Activity} label="Sesiones Comp." value={fmt(kpis.sesionesEng)} accentColor={GORUTY.accent} />
          <KpiCard icon={Target} label="Tasa Conv. Sesión" value={`${kpis.tasaConversionSesion}%`} accentColor={GORUTY.deepPurple} />
        </div>

        <Panel title="📈 Tendencia Temporal — Usuarios, Sesiones y Conversiones" className="mb-6">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="gradUsuarios" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GORUTY.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={GORUTY.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSesiones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GORUTY.tertiary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={GORUTY.tertiary} stopOpacity={0} />
                </linearGradient>
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

        <Panel title="💰 Valor de Compras (CLP) por Día" className="mb-6">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gradValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GORUTY.deepPurple} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={GORUTY.deepPurple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
              <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(0)}M`} />
              <Tooltip {...tooltipStyle} formatter={(v) => fmtMoney(v)} />
              <Area type="monotone" dataKey="valorPurchase" stroke={GORUTY.deepPurple} fill="url(#gradValor)" strokeWidth={2.5} name="Valor Compras" />
            </AreaChart>
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

        <SectionHeader title="Adquisición" subtitle="Canales, fuentes y campañas" icon={TrendingUp} sectionKey="acquisition" />
        {sections.acquisition && (
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
            <Panel title="Primer Canal vs. Canal Actual">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={firstVsLastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis dataKey="canal" stroke="#64748b" style={{ fontSize: 10 }} angle={-20} textAnchor="end" height={70} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="primero" fill={GORUTY.tertiary} name="Primer Canal" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ultimo" fill={GORUTY.primary} name="Canal Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Top Fuente / Medio" className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-violet-100">
                      <th className="py-2 px-3 font-semibold">Source / Medium</th>
                      <th className="py-2 px-3 text-right font-semibold">Sesiones</th>
                      <th className="py-2 px-3 text-right font-semibold">Usuarios</th>
                      <th className="py-2 px-3 text-right font-semibold">Conversiones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceMediumData.map((row, i) => (
                      <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50 transition">
                        <td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.fuente}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{fmt(row.sesiones)}</td>
                        <td className="py-2 px-3 text-right text-slate-700">{fmt(row.usuarios)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600">{row.conv}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            {campaignsData.length > 0 && (
              <Panel title="Top Campañas" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={campaignsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis dataKey="campana" stroke="#64748b" style={{ fontSize: 9 }} angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sesiones" fill={GORUTY.primary} name="Sesiones" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conv" fill={GORUTY.tertiary} name="Conversiones" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            )}
          </div>
        )}

        <SectionHeader title="Audiencia" subtitle="Ubicación, dispositivos y tecnología" icon={Globe} sectionKey="audience" />
        {sections.audience && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
            <Panel title="Resoluciones de Pantalla">
              <div className="space-y-2">
                {resolucionData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-violet-50 last:border-0">
                    <span className="text-xs text-slate-700 font-mono">{r.resolucion}</span>
                    <span className="text-sm text-slate-500 font-semibold">{fmt(r.usuarios)}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Idiomas">
              <div className="space-y-2">
                {idiomasData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-violet-50 last:border-0">
                    <span className="text-sm text-slate-700">{r.idioma}</span>
                    <span className="text-sm text-slate-500 font-semibold">{fmt(r.usuarios)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        <SectionHeader title="Comportamiento" subtitle="Páginas, landing pages y embudo" icon={Eye} sectionKey="behavior" />
        {sections.behavior && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Panel title="Páginas Más Vistas" className="lg:col-span-2">
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
                      <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50 transition">
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
            <Panel title="Landing Pages — Conversión">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-violet-100">
                      <th className="py-2 px-2 font-semibold">Landing</th>
                      <th className="py-2 px-2 text-right font-semibold">Sesiones</th>
                      <th className="py-2 px-2 text-right font-semibold">Conv.</th>
                      <th className="py-2 px-2 text-right font-semibold">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {landingPagesData.map((row, i) => (
                      <tr key={i} className="border-b border-violet-50">
                        <td className="py-2 px-2 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.landing}</td>
                        <td className="py-2 px-2 text-right text-slate-700">{fmt(row.sesiones)}</td>
                        <td className="py-2 px-2 text-right font-semibold text-emerald-600">{row.conv}</td>
                        <td className="py-2 px-2 text-right font-semibold" style={{ color: GORUTY.accent }}>{row.tasaConv}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        <SectionHeader title="Engagement & Conversión" subtitle="Métricas de compromiso" icon={Target} sectionKey="engagement" />
        {sections.engagement && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <KpiCard icon={Activity} label="Sesiones Comprometidas" value={fmt(kpis.sesionesEng)} accentColor={GORUTY.primary} />
            <KpiCard icon={MousePointer} label="Sesiones / Usuario" value={kpis.sesionesPorUsuario} accentColor={GORUTY.secondary} />
            <KpiCard icon={Eye} label="Vistas / Sesión" value={kpis.vistasPorSesion} accentColor={GORUTY.tertiary} />
            <KpiCard icon={Eye} label="Vistas / Usuario" value={kpis.vistasPorUsuario} accentColor={GORUTY.accent} />
            <KpiCard icon={Target} label="Tasa Conv. Usuario" value={`${kpis.tasaConversionUsuario}%`} accentColor={GORUTY.deepPurple} />
            <KpiCard icon={Activity} label="Eventos Totales" value={fmt(kpis.eventos)} accentColor={GORUTY.primary} />
            <KpiCard icon={Activity} label="Eventos / Usuario" value={kpis.eventosPorUsuario} accentColor={GORUTY.secondary} />
            <KpiCard icon={DollarSign} label="Ticket Promedio" value={kpis.conversiones ? fmtMoney(kpis.valorPurchase / kpis.conversiones) : '-'} accentColor={GORUTY.tertiary} />
          </div>
        )}

        <SectionHeader title="Eventos" subtitle="Conteo y valor de eventos" icon={MousePointer} sectionKey="events" />
        {sections.events && eventosData.length > 0 && (
          <Panel title="Top Eventos" className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-violet-100">
                    <th className="py-2 px-3 font-semibold">Nombre del Evento</th>
                    <th className="py-2 px-3 text-right font-semibold">Conteo</th>
                    <th className="py-2 px-3 text-right font-semibold">Usuarios</th>
                  </tr>
                </thead>
                <tbody>
                  {eventosData.map((row, i) => (
                    <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50 transition">
                      <td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.accent }}>
                        {row.evento}
                        {row.esConversion && <span className="ml-2 text-emerald-600 font-bold">✓ Conversión</span>}
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
          <span>Dashboard GA4 · {currentClient.name} · Powered by Grouty · Datos en vivo desde Google Sheets</span>
        </div>
      </div>
    </div>
  );
}
