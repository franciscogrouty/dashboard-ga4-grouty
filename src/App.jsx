import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, FunnelChart, Funnel, LabelList } from 'recharts';
import { TrendingUp, Users, Eye, Target, Clock, MousePointer, Globe, ChevronDown, ChevronRight, Filter, RefreshCw, Activity, DollarSign, Plus, X, Building2, Check, Lock, LogOut, User as UserIcon, Eye as EyeIcon, EyeOff, AlertCircle, Bot, Send, MessageSquare, Trash2, Copy, CheckCheck, TrendingDown, AlertTriangle, ShoppingCart, CreditCard, Heart, Move, ArrowDownRight, Search } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzGdRgh4p6iJtTvk_CPDUUkLrgfuo1k-RuTPc7VtVrlenEv58LTMAP07l-CxPpgcCqtVw/exec';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

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

const GorutyLogo = ({ size = 40 }) => (
  <img
    src="/grouty-logo.jpg"
    alt="Grouty"
    className="rounded-xl shadow-lg shadow-violet-300 object-cover"
    style={{ width: size, height: size }}
  />
);

function buildDataContext(liveData, kpis, currentClient, dateRange, daysCount, trendData) {
  return {
    cliente: currentClient?.nombre,
    periodo: {
      tipo: dateRange === 'all' ? 'Todo el período disponible' : (dateRange === 'custom' ? 'Personalizado' : `Últimos ${daysCount} días`),
      diasIncluidos: daysCount,
      fechaInicio: trendData?.[0]?.fechaCompleta || null,
      fechaFin: trendData?.[trendData.length - 1]?.fechaCompleta || null,
    },
    kpis: {
      usuariosActivos: kpis.usuarios,
      usuariosNuevos: kpis.usuariosNuevos,
      sesiones: kpis.sesiones,
      sesionesComprometidas: kpis.sesionesEng,
      vistas: kpis.vistas,
      conversiones: kpis.conversiones,
      valorCompras: kpis.valorPurchase,
      tasaEngagement: kpis.tasaEngagement,
      tasaRebote: kpis.tasaRebote,
      duracionPromedioSegundos: kpis.duracionPromedio,
      sesionesPorUsuario: kpis.sesionesPorUsuario,
      vistasPorSesion: kpis.vistasPorSesion,
      tasaConversion: kpis.tasaConversionSesion,
      conteoEventos: kpis.eventos
    },
    datosDiarios: (trendData || []).map(d => ({
      fecha: d.fechaCompleta,
      usuarios: d.usuarios,
      usuariosNuevos: d.usuariosNuevos,
      sesiones: d.sesiones,
      sesionesComprometidas: d.sesionesEng,
      vistas: d.vistas,
      conversiones: d.conversiones,
      valorPurchase: d.valorPurchase,
      tasaEngagement: d.tasaEngagement,
      tasaRebote: d.tasaRebote,
      duracionSegundos: d.duracion,
      eventos: d.eventos
    })),
    topCanales: (liveData?.fuentesTrafico || []).reduce((acc, row) => {
      const canal = row['Canal'] || 'Otro';
      const usuarios = Number(row['Usuarios']) || 0;
      const sesiones = Number(row['Sesiones']) || 0;
      const conversiones = Number(row['Conversiones']) || 0;
      const ex = acc.find(c => c.canal === canal);
      if (ex) { ex.usuarios += usuarios; ex.sesiones += sesiones; ex.conversiones += conversiones; }
      else acc.push({ canal, usuarios, sesiones, conversiones });
      return acc;
    }, []).sort((a, b) => b.usuarios - a.usuarios).slice(0, 12),
    topFuentes: (liveData?.fuentesTrafico || []).reduce((acc, row) => {
      const fuente = row['Source/Medium'] || 'unknown';
      const sesiones = Number(row['Sesiones']) || 0;
      const conversiones = Number(row['Conversiones']) || 0;
      const ex = acc.find(c => c.fuente === fuente);
      if (ex) { ex.sesiones += sesiones; ex.conversiones += conversiones; }
      else acc.push({ fuente, sesiones, conversiones });
      return acc;
    }, []).sort((a, b) => b.sesiones - a.sesiones).slice(0, 20),
    topPaises: (liveData?.geografia || []).reduce((acc, row) => {
      const pais = row['País'] || 'Otros';
      const usuarios = Number(row['Usuarios']) || 0;
      const sesiones = Number(row['Sesiones']) || 0;
      const ex = acc.find(c => c.pais === pais);
      if (ex) { ex.usuarios += usuarios; ex.sesiones += sesiones; }
      else acc.push({ pais, usuarios, sesiones });
      return acc;
    }, []).sort((a, b) => b.usuarios - a.usuarios).slice(0, 15),
    topCiudades: (liveData?.geografia || []).reduce((acc, row) => {
      const ciudad = row['Ciudad'] || '(not set)';
      if (ciudad === '(not set)' || !ciudad) return acc;
      const usuarios = Number(row['Usuarios']) || 0;
      const ex = acc.find(c => c.ciudad === ciudad);
      if (ex) ex.usuarios += usuarios;
      else acc.push({ ciudad, usuarios });
      return acc;
    }, []).sort((a, b) => b.usuarios - a.usuarios).slice(0, 10),
    topPaginas: (liveData?.paginas || []).reduce((acc, row) => {
      const path = row['Path sin Query String'] || row['Página (Path)'] || '/';
      const vistas = Number(row['Vistas']) || 0;
      const usuarios = Number(row['Usuarios']) || 0;
      const ex = acc.find(p => p.path === path);
      if (ex) { ex.vistas += vistas; ex.usuarios += usuarios; }
      else acc.push({ path, titulo: row['Título'] || '', vistas, usuarios });
      return acc;
    }, []).sort((a, b) => b.vistas - a.vistas).slice(0, 15),
    dispositivos: (liveData?.dispositivos || []).reduce((acc, row) => {
      const tipo = (row['Categoría Dispositivo'] || 'unknown').toLowerCase();
      const usuarios = Number(row['Usuarios']) || 0;
      const sesiones = Number(row['Sesiones']) || 0;
      const ex = acc.find(d => d.tipo === tipo);
      if (ex) { ex.usuarios += usuarios; ex.sesiones += sesiones; }
      else acc.push({ tipo, usuarios, sesiones });
      return acc;
    }, []).sort((a, b) => b.usuarios - a.usuarios),
    eventos: (liveData?.eventos || []).reduce((acc, row) => {
      const ev = row['Nombre del Evento'] || 'unknown';
      const conteo = Number(row['Conversiones']) || 0;
      const usuarios = Number(row['Usuarios']) || 0;
      const valor = Number(row['Valor del Evento']) || 0;
      const esConv = row['¿Es Conversión?'] === 'TRUE' || row['¿Es Conversión?'] === true;
      const ex = acc.find(e => e.evento === ev);
      if (ex) { ex.conteo += conteo; ex.usuarios += usuarios; ex.valor += valor; }
      else acc.push({ evento: ev, conteo, usuarios, valor, esConversion: esConv });
      return acc;
    }, []).sort((a, b) => b.conteo - a.conteo).slice(0, 25),

    // 🔍 CONTEXTO SEO (si está disponible)
    seo: (() => {
      const seoData = liveData?.seo;
      if (!seoData?.disponible) return { disponible: false };

      const keywords = seoData.keywords || [];
      const paginas = seoData.paginasSEO || [];
      const tendencia = seoData.tendenciaSEO || [];
      const movimientos = seoData.posicionesSEO || [];

      const totalClics = keywords.reduce((s, k) => s + (Number(k['Clics']) || 0), 0);
      const totalImpr = keywords.reduce((s, k) => s + (Number(k['Impresiones']) || 0), 0);
      const ctrPromedio = totalImpr > 0 ? ((totalClics / totalImpr) * 100).toFixed(2) : 0;
      const posicionPromedio = keywords.length > 0
        ? (keywords.reduce((s, k) => s + (Number(k['Posición Promedio']) || 0), 0) / keywords.length).toFixed(1)
        : 0;

      const quickWins = keywords.filter(k => {
        const pos = Number(k['Posición Promedio']) || 999;
        const impr = Number(k['Impresiones']) || 0;
        return pos >= 5 && pos <= 15 && impr >= 100;
      }).sort((a, b) => (Number(b['Impresiones']) || 0) - (Number(a['Impresiones']) || 0)).slice(0, 20);

      const topKeywords = [...keywords]
        .sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0))
        .slice(0, 30)
        .map(k => ({
          keyword: k['Keyword'],
          clics: Number(k['Clics']) || 0,
          impresiones: Number(k['Impresiones']) || 0,
          ctr: k['CTR (%)'],
          posicion: Number(k['Posición Promedio']) || 0
        }));

      const subidas = movimientos.filter(m => {
        const cambio = Number(m['Cambio']) || 0;
        return cambio > 0;
      }).sort((a, b) => (Number(b['Cambio']) || 0) - (Number(a['Cambio']) || 0)).slice(0, 10).map(m => ({
        keyword: m['Keyword'],
        posActual: Number(m['Pos. Actual (7d)']) || 0,
        posAnterior: Number(m['Pos. Anterior (7d)']) || 0,
        cambio: Number(m['Cambio']) || 0
      }));

      const caidas = movimientos.filter(m => {
        const cambio = Number(m['Cambio']) || 0;
        return cambio < 0;
      }).sort((a, b) => (Number(a['Cambio']) || 0) - (Number(b['Cambio']) || 0)).slice(0, 10).map(m => ({
        keyword: m['Keyword'],
        posActual: Number(m['Pos. Actual (7d)']) || 0,
        posAnterior: Number(m['Pos. Anterior (7d)']) || 0,
        cambio: Number(m['Cambio']) || 0
      }));

      const topPaginas = [...paginas]
        .sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0))
        .slice(0, 15)
        .map(p => ({
          url: p['URL'],
          clics: Number(p['Clics']) || 0,
          impresiones: Number(p['Impresiones']) || 0,
          ctr: p['CTR (%)'],
          posicion: Number(p['Posición Promedio']) || 0,
          seccion: p['Sección']
        }));

      return {
        disponible: true,
        totales: { totalClics, totalImpresiones: totalImpr, ctrPromedio, posicionPromedio, totalKeywords: keywords.length },
        quickWins,
        topKeywords,
        subidas,
        caidas,
        topPaginas,
        tendenciaDiaria: tendencia.slice(-40).map(t => ({
          fecha: t['Fecha'],
          clics: Number(t['Clics']) || 0,
          impresiones: Number(t['Impresiones']) || 0,
          ctr: t['CTR (%)'],
          posicion: Number(t['Posición Promedio']) || 0
        }))
      };
    })()
  };
}

function renderMarkdown(text, gorutyPrimary) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let listKey = 0;

  const parseInline = (s) => {
    let result = s.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #1e293b">$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result = result.replace(/`(.+?)`/g, '<code style="background: #f3f0ff; color: #5b4bff; padding: 2px 6px; border-radius: 4px; font-size: 0.85em">$1</code>');
    return result;
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="space-y-1.5 mb-3 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
              <span style={{ color: gorutyPrimary }} className="font-bold flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) { flushList(); elements.push(<h3 key={`h3-${idx}`} className="text-base font-bold text-slate-900 mt-4 mb-2">{trimmed.replace('## ', '')}</h3>); }
    else if (trimmed.startsWith('# ')) { flushList(); elements.push(<h2 key={`h2-${idx}`} className="text-lg font-bold text-slate-900 mt-3 mb-2">{trimmed.replace('# ', '')}</h2>); }
    else if (/^[\-\*]\s/.test(trimmed)) listItems.push(trimmed.replace(/^[\-\*]\s/, ''));
    else if (/^\d+\.\s/.test(trimmed)) listItems.push(trimmed.replace(/^\d+\.\s/, ''));
    else if (trimmed === '') flushList();
    else { flushList(); elements.push(<p key={`p-${idx}`} className="text-sm text-slate-700 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />); }
  });
  flushList();
  return elements;
}

function LoginScreen({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!usuario.trim() || !pass.trim()) { setError('Ingresa usuario y contraseña'); return; }
    setLoading(true); setError('');
    try {
      const url = `${API_URL}?action=login&user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(pass)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.ok) {
        localStorage.setItem('grouty_session', JSON.stringify({ token: data.token, usuario: data.usuario, nombre: data.nombre, rol: data.rol, cliente: data.cliente, clientes: data.clientes, loginTime: Date.now() }));
        onLogin(data);
      } else { setError(data.error || 'Credenciales incorrectas'); }
    } catch (err) { setError('Error al conectar. Verifica tu conexión.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-violet-100 rounded-2xl shadow-xl shadow-violet-100/50 overflow-hidden">
          <div className="p-8 text-center" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}10, ${GORUTY.tertiary}10)` }}>
            <div className="flex justify-center mb-4"><GorutyLogo size={64} /></div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard Grouty</h1>
            <p className="text-sm text-slate-500">Powered by Grouty</p>
          </div>
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2"><Lock className="w-5 h-5" style={{ color: GORUTY.primary }} />Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mb-6">Ingresa tus credenciales para acceder</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Usuario</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="Tu usuario" className="w-full bg-violet-50/50 border border-violet-200 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" autoFocus />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" className="w-full bg-violet-50/50 border border-violet-200 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}</button>
                </div>
              </div>
              {error && (<div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><X className="w-4 h-4 flex-shrink-0" />{error}</div>)}
              <button onClick={handleSubmit} disabled={loading} className="w-full px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>
                {loading ? (<><RefreshCw className="w-4 h-4 animate-spin" />Validando...</>) : (<><Lock className="w-4 h-4" />Ingresar</>)}
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-violet-100 text-center"><p className="text-xs text-slate-400">¿Problemas para acceder? Contacta a tu administrador</p></div>
          </div>
        </div>
        <div className="text-center mt-4 text-xs text-slate-400">🔐 Acceso seguro · Datos confidenciales</div>
      </div>
    </div>
  );
}

// =============================================
// 🔍 SEO SECTION — Google Search Console
// =============================================
function SEOSection({ liveData, currentClient }) {
  const seoData = liveData?.seo;

  const seoComputed = useMemo(() => {
    if (!seoData?.disponible) return null;

    const keywords = seoData.keywords || [];
    const paginas = seoData.paginasSEO || [];
    const tendencia = seoData.tendenciaSEO || [];
    const movimientos = seoData.posicionesSEO || [];

    // KPIs totales
    const totalClics = keywords.reduce((s, k) => s + (Number(k['Clics']) || 0), 0);
    const totalImpresiones = keywords.reduce((s, k) => s + (Number(k['Impresiones']) || 0), 0);
    const ctrPromedio = totalImpresiones > 0 ? ((totalClics / totalImpresiones) * 100) : 0;
    const posicionPromedio = keywords.length > 0
      ? (keywords.reduce((s, k) => s + (Number(k['Posición Promedio']) || 0), 0) / keywords.length)
      : 0;

    // Quick Wins: posición 5-15 + impresiones >= 100
    const quickWins = keywords.filter(k => {
      const pos = Number(k['Posición Promedio']) || 999;
      const impr = Number(k['Impresiones']) || 0;
      return pos >= 5 && pos <= 15 && impr >= 100;
    }).sort((a, b) => (Number(b['Impresiones']) || 0) - (Number(a['Impresiones']) || 0)).slice(0, 25);

    // Top Keywords (por clics)
    const topKeywords = [...keywords]
      .sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0))
      .slice(0, 25);

    // Movimientos
    const subidas = movimientos.filter(m => (Number(m['Cambio']) || 0) > 0)
      .sort((a, b) => (Number(b['Cambio']) || 0) - (Number(a['Cambio']) || 0))
      .slice(0, 15);
    const caidas = movimientos.filter(m => (Number(m['Cambio']) || 0) < 0)
      .sort((a, b) => (Number(a['Cambio']) || 0) - (Number(b['Cambio']) || 0))
      .slice(0, 15);

    // Top Páginas
    const topPaginas = [...paginas]
      .sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0))
      .slice(0, 20);

    // Tendencia diaria — últimos 40 días
    const trendData = tendencia.slice(-40).map(t => ({
      fecha: String(t['Fecha'] || '').slice(5, 10),
      fechaCompleta: String(t['Fecha'] || '').slice(0, 10),
      clics: Number(t['Clics']) || 0,
      impresiones: Number(t['Impresiones']) || 0,
      posicion: Number(t['Posición Promedio']) || 0
    }));

    return {
      totalClics, totalImpresiones, ctrPromedio, posicionPromedio,
      totalKeywords: keywords.length,
      quickWins, topKeywords, subidas, caidas, topPaginas, trendData
    };
  }, [seoData]);

  if (!seoData?.disponible) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">SEO no disponible para este cliente</h3>
        <p className="text-sm text-slate-600">
          Aún no se ha configurado el Sheet de Google Search Console para <strong>{currentClient?.nombre}</strong>.
        </p>
      </div>
    );
  }

  if (!seoComputed) return null;

  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const tooltipStyle = {
    contentStyle: { background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: 12 },
    labelStyle: { color: '#5b4bff', fontWeight: 600 }
  };

  return (
    <div className="space-y-6">
      {/* KPIs SEO */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b4bff20' }}>
              <span className="text-base">🔍</span>
            </div>
            <span className="text-xs font-medium text-slate-500">Clics SEO</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{fmt(seoComputed.totalClics)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8b5cf620' }}>
              <span className="text-base">👁️</span>
            </div>
            <span className="text-xs font-medium text-slate-500">Impresiones</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{fmt(seoComputed.totalImpresiones)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}>
              <span className="text-base">📊</span>
            </div>
            <span className="text-xs font-medium text-slate-500">CTR Promedio</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{seoComputed.ctrPromedio.toFixed(2)}%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}>
              <span className="text-base">🎯</span>
            </div>
            <span className="text-xs font-medium text-slate-500">Posición Prom.</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{seoComputed.posicionPromedio.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
              <span className="text-base">⚡</span>
            </div>
            <span className="text-xs font-medium text-white/90">Quick Wins</span>
          </div>
          <div className="text-2xl font-bold text-white">{seoComputed.quickWins.length}</div>
          <div className="text-[10px] text-white/80 mt-0.5">Oportunidades a atacar</div>
        </div>
      </div>

      {/* Gráfico tendencia diaria */}
      {seoComputed.trendData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Tendencia Diaria SEO</h3>
              <p className="text-xs text-slate-500">Clics e impresiones por día (últimos 40 días)</p>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">
              {seoComputed.totalKeywords} keywords
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={seoComputed.trendData}>
              <defs>
                <linearGradient id="seoClicsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b4bff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#5b4bff" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="seoImprGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
              <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" style={{ fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area yAxisId="right" type="monotone" dataKey="impresiones" name="Impresiones" stroke="#8b5cf6" fill="url(#seoImprGrad)" strokeWidth={2} />
              <Area yAxisId="left" type="monotone" dataKey="clics" name="Clics" stroke="#5b4bff" fill="url(#seoClicsGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Wins */}
      {seoComputed.quickWins.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <span>⚡</span> Quick Wins — Oportunidades Top
              </h3>
              <p className="text-xs text-slate-500">Keywords en posición 5–15 con muchas impresiones. Atacarlas = subida fuerte de tráfico.</p>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-3 font-semibold">Keyword</th>
                  <th className="py-2 px-3 text-right font-semibold">Clics</th>
                  <th className="py-2 px-3 text-right font-semibold">Impresiones</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR</th>
                  <th className="py-2 px-3 text-right font-semibold">Posición</th>
                </tr>
              </thead>
              <tbody>
                {seoComputed.quickWins.map((k, i) => (
                  <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                    <td className="py-2 px-3 text-slate-700 font-medium">{k['Keyword']}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{fmt(k['Clics'])}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{fmt(k['Impresiones'])}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{k['CTR (%)']}</td>
                    <td className="py-2 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f59e0b20', color: '#b45309' }}>
                        {Number(k['Posición Promedio']).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Top Keywords + Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Keywords */}
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>🏆</span> Top 25 Keywords
            </h3>
            <p className="text-xs text-slate-500">Ordenadas por clics</p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-3 font-semibold">Keyword</th>
                  <th className="py-2 px-3 text-right font-semibold">Clics</th>
                  <th className="py-2 px-3 text-right font-semibold">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {seoComputed.topKeywords.map((k, i) => (
                  <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                    <td className="py-2 px-3 text-slate-700 truncate max-w-[200px]" title={k['Keyword']}>{k['Keyword']}</td>
                    <td className="py-2 px-3 text-right font-semibold" style={{ color: '#5b4bff' }}>{fmt(k['Clics'])}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{Number(k['Posición Promedio']).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movimientos */}
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>📈</span> Movimientos de Posición
            </h3>
            <p className="text-xs text-slate-500">Subidas y caídas más relevantes</p>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {seoComputed.subidas.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                  🚀 SUBIDAS ({seoComputed.subidas.length})
                </div>
                <div className="space-y-1.5">
                  {seoComputed.subidas.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-sm">
                      <span className="text-slate-700 truncate max-w-[180px]" title={m['Keyword']}>{m['Keyword']}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{Number(m['Pos. Anterior (7d)']).toFixed(0)} → {Number(m['Pos. Actual (7d)']).toFixed(0)}</span>
                        <span className="font-semibold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">+{Number(m['Cambio']).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {seoComputed.caidas.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                  📉 CAÍDAS ({seoComputed.caidas.length})
                </div>
                <div className="space-y-1.5">
                  {seoComputed.caidas.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100 text-sm">
                      <span className="text-slate-700 truncate max-w-[180px]" title={m['Keyword']}>{m['Keyword']}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{Number(m['Pos. Anterior (7d)']).toFixed(0)} → {Number(m['Pos. Actual (7d)']).toFixed(0)}</span>
                        <span className="font-semibold text-red-700 px-2 py-0.5 rounded-full bg-red-100">{Number(m['Cambio']).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top URLs SEO */}
      {seoComputed.topPaginas.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>🌐</span> Top URLs por Tráfico SEO
            </h3>
            <p className="text-xs text-slate-500">Páginas con más tráfico orgánico</p>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-3 font-semibold">URL</th>
                  <th className="py-2 px-3 text-right font-semibold">Clics</th>
                  <th className="py-2 px-3 text-right font-semibold">Impr.</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR</th>
                  <th className="py-2 px-3 text-right font-semibold">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {seoComputed.topPaginas.map((p, i) => {
                  const urlDisplay = String(p['URL'] || '').replace(/^https?:\/\/[^\/]+/, '') || '/';
                  return (
                    <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                      <td className="py-2 px-3 font-mono text-xs text-slate-700 truncate max-w-[300px]" title={p['URL']}>{urlDisplay}</td>
                      <td className="py-2 px-3 text-right font-semibold" style={{ color: '#5b4bff' }}>{fmt(p['Clics'])}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{fmt(p['Impresiones'])}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{p['CTR (%)']}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{Number(p['Posición Promedio']).toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// 🎯 FUNNEL DE CONVERSIÓN — NUEVO COMPONENTE
// =============================================
function ConversionFunnel({ liveData, kpis, dateFilter, currentClient }) {
  const funnelData = useMemo(() => {
    if (!liveData?.eventos) return null;

    // Agregamos los eventos del período filtrado
    const eventosAgregados = {};
    liveData.eventos.filter(row => dateFilter(row['Fecha'])).forEach(row => {
      const ev = row['Nombre del Evento'] || '';
      const usuarios = Number(row['Usuarios']) || 0;
      const conteo = Number(row['Conversiones']) || 0;
      const valor = Number(row['Valor del Evento']) || 0;

      if (!eventosAgregados[ev]) eventosAgregados[ev] = { usuarios: 0, conteo: 0, valor: 0 };
      eventosAgregados[ev].usuarios += usuarios;
      eventosAgregados[ev].conteo += conteo;
      eventosAgregados[ev].valor += valor;
    });

    // Construir el funnel de 5 pasos
    const sesiones = kpis.sesiones || 0;
    const sesionesEng = kpis.sesionesEng || 0;
    const scrollUsers = eventosAgregados['scroll']?.usuarios || 0;
    const beginCheckout = eventosAgregados['begin_checkout']?.usuarios || 0;
    const purchase = eventosAgregados['purchase']?.usuarios || eventosAgregados['purchase']?.conteo || 0;
    const purchaseValor = eventosAgregados['purchase']?.valor || 0;

    const pasos = [
      {
        nombre: 'Sesiones',
        descripcion: 'Visitas iniciadas al sitio',
        valor: sesiones,
        icon: Users,
        color: GORUTY.primary,
        emoji: '👥'
      },
      {
        nombre: 'Engagement',
        descripcion: 'Sesiones >10s o múltiples páginas',
        valor: sesionesEng,
        icon: Heart,
        color: GORUTY.secondary,
        emoji: '💖'
      },
      {
        nombre: 'Interés Profundo',
        descripcion: 'Hicieron scroll completo',
        valor: scrollUsers,
        icon: Move,
        color: GORUTY.tertiary,
        emoji: '📜'
      },
      {
        nombre: 'Inicio Checkout',
        descripcion: 'Llegaron al proceso de compra',
        valor: beginCheckout,
        icon: ShoppingCart,
        color: GORUTY.accent,
        emoji: '🛒'
      },
      {
        nombre: 'Compra',
        descripcion: 'Completaron la compra',
        valor: purchase,
        icon: CreditCard,
        color: GORUTY.deepPurple,
        emoji: '💰'
      }
    ];

    // Calcular % vs total y % vs paso anterior, y drop-off
    const total = sesiones || 1; // evita división por 0
    const pasosCalc = pasos.map((paso, idx) => {
      const pct = total ? (paso.valor / total) * 100 : 0;
      const pctAnterior = idx === 0 ? 100 : (pasos[idx - 1].valor ? (paso.valor / pasos[idx - 1].valor) * 100 : 0);
      const dropOff = idx === 0 ? 0 : 100 - pctAnterior;
      const perdidos = idx === 0 ? 0 : pasos[idx - 1].valor - paso.valor;
      return { ...paso, pct, pctAnterior, dropOff, perdidos };
    });

    // Detectar el cuello de botella (paso con mayor drop-off, excluyendo el primero)
    let mayorDropOff = { paso: null, pct: 0 };
    pasosCalc.forEach((p, i) => {
      if (i > 0 && p.dropOff > mayorDropOff.pct && pasos[i - 1].valor > 0) {
        mayorDropOff = { paso: p, pct: p.dropOff, anterior: pasosCalc[i - 1] };
      }
    });

    return { pasos: pasosCalc, total, purchaseValor, mayorDropOff };
  }, [liveData, kpis, dateFilter]);

  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const fmtMoney = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

  if (!funnelData || funnelData.total === 0) {
    return (
      <div className="bg-white border border-violet-100 rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: GORUTY.warning }} />
        <p className="text-sm text-slate-500">No hay datos suficientes para mostrar el funnel en este período.</p>
      </div>
    );
  }

  const { pasos, total, purchaseValor, mayorDropOff } = funnelData;
  const tasaConversion = pasos[pasos.length - 1].pct.toFixed(2);
  const valorPorSesion = total ? (purchaseValor / total) : 0;

  return (
    <div className="space-y-6">
      {/* Métricas resumen del funnel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">🎯 Tasa Conversión Global</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.primary }}>{tasaConversion}%</div>
          <div className="text-[10px] text-slate-400 mt-1">Sesiones → Compra</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">💰 Ingresos Totales</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.deepPurple }}>{fmtMoney(purchaseValor)}</div>
          <div className="text-[10px] text-slate-400 mt-1">{fmt(pasos[pasos.length - 1].valor)} compras</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">📊 Valor por Sesión</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.accent }}>${fmt(Math.round(valorPorSesion))}</div>
          <div className="text-[10px] text-slate-400 mt-1">Promedio</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">⚠️ Mayor Caída</div>
          <div className="text-2xl font-bold text-rose-600">{mayorDropOff.paso ? `${mayorDropOff.pct.toFixed(1)}%` : '—'}</div>
          <div className="text-[10px] text-slate-400 mt-1">{mayorDropOff.paso ? `En ${mayorDropOff.paso.nombre}` : 'Sin datos'}</div>
        </div>
      </div>

      {/* FUNNEL VISUAL — barras horizontales en forma de embudo */}
      <div className="bg-white border border-violet-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-800">🎯 Etapas del Funnel</h3>
          <span className="text-xs text-slate-400">% sobre total de sesiones</span>
        </div>
        <div className="space-y-2">
          {pasos.map((paso, idx) => {
            const Icon = paso.icon;
            // Width proporcional al porcentaje vs total (con un mínimo de 8% para que se vea)
            const width = Math.max(paso.pct, paso.valor > 0 ? 8 : 2);
            const isFirst = idx === 0;
            const drop = !isFirst && paso.dropOff > 0;

            return (
              <div key={idx}>
                {/* Indicador de drop-off entre etapas */}
                {drop && (
                  <div className="flex items-center justify-center my-1 text-[10px] font-semibold text-rose-500 gap-1">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>-{paso.dropOff.toFixed(1)}% ({fmt(paso.perdidos)} usuarios perdidos)</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {/* Icono y nombre */}
                  <div className="flex items-center gap-2 w-44 flex-shrink-0">
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${paso.color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: paso.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{paso.emoji} {paso.nombre}</div>
                      <div className="text-[10px] text-slate-400 truncate">{paso.descripcion}</div>
                    </div>
                  </div>

                  {/* Barra del funnel */}
                  <div className="flex-1 relative h-12 bg-slate-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full flex items-center justify-between px-4 transition-all duration-500 rounded-lg"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${paso.color}, ${paso.color}cc)`,
                        minWidth: paso.valor > 0 ? '120px' : '60px'
                      }}
                    >
                      <span className="text-white font-bold text-sm drop-shadow">{fmt(paso.valor)}</span>
                      <span className="text-white text-xs font-semibold opacity-90 drop-shadow">
                        {paso.pct.toFixed(2)}%
                      </span>
                    </div>
                    {/* Si la barra es muy chica, mostrar el número fuera */}
                    {paso.valor > 0 && width < 15 && (
                      <span className="absolute top-1/2 -translate-y-1/2 left-[125px] text-[10px] font-semibold text-slate-600">
                        {paso.pct.toFixed(2)}%
                      </span>
                    )}
                  </div>

                  {/* % vs paso anterior */}
                  {!isFirst && (
                    <div className="w-24 text-right flex-shrink-0">
                      <div className="text-xs font-bold" style={{ color: paso.pctAnterior > 50 ? GORUTY.success : (paso.pctAnterior > 10 ? GORUTY.warning : GORUTY.danger) }}>
                        {paso.pctAnterior.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-slate-400">vs anterior</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight automático */}
      {mayorDropOff.paso && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 mb-1">💡 Insight: Cuello de botella detectado</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                La mayor caída está entre <strong>{mayorDropOff.anterior?.nombre}</strong> ({fmt(mayorDropOff.anterior?.valor)}) y <strong>{mayorDropOff.paso.nombre}</strong> ({fmt(mayorDropOff.paso.valor)}).
                Pierdes el <strong className="text-rose-600">{mayorDropOff.pct.toFixed(1)}%</strong> de los usuarios en este paso.
                Si lograras reducir esa caída en un 10%, ganarías <strong className="text-emerald-600">~{fmt(Math.round(mayorDropOff.paso.perdidos * 0.1))} usuarios adicionales</strong> que podrían avanzar al siguiente paso.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de detalle */}
      <div className="bg-white border border-violet-100 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">📋 Detalle por Etapa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-violet-100">
                <th className="py-2 px-3 font-semibold">Etapa</th>
                <th className="py-2 px-3 text-right font-semibold">Usuarios</th>
                <th className="py-2 px-3 text-right font-semibold">% vs Total</th>
                <th className="py-2 px-3 text-right font-semibold">% vs Anterior</th>
                <th className="py-2 px-3 text-right font-semibold">Drop-off</th>
                <th className="py-2 px-3 text-right font-semibold">Perdidos</th>
              </tr>
            </thead>
            <tbody>
              {pasos.map((paso, i) => (
                <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{paso.emoji}</span>
                      <span className="font-semibold text-slate-800">{paso.nombre}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{fmt(paso.valor)}</td>
                  <td className="py-2.5 px-3 text-right" style={{ color: paso.color }}>{paso.pct.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right text-slate-700">{i === 0 ? '—' : `${paso.pctAnterior.toFixed(1)}%`}</td>
                  <td className="py-2.5 px-3 text-right">{i === 0 ? '—' : <span className="text-rose-600 font-semibold">{paso.dropOff.toFixed(1)}%</span>}</td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{i === 0 ? '—' : fmt(paso.perdidos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =============================================
// 💬 CHAT CONVERSACIONAL (sin cambios)
// =============================================
function AIChatPanel({ liveData, kpis, currentClient, dateRange, daysCount, trendData }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'; } }, [inputValue]);

  const sendMessage = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;
    if (!CLAUDE_API_KEY) { setError('La API key de Claude no está configurada.'); return; }

    const newUserMessage = { role: 'user', content: trimmed, timestamp: new Date() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages); setInputValue(''); setError(''); setLoading(true);

    const dataContext = buildDataContext(liveData, kpis, currentClient, dateRange, daysCount, trendData);
    const tieneSEO = dataContext.seo?.disponible;
    const systemPrompt = `Eres un experto analista de marketing digital, Google Analytics 4 y SEO (Google Search Console) que ayuda al cliente "${currentClient?.nombre}".

DATOS COMPLETOS DEL CLIENTE:
${JSON.stringify(dataContext, null, 2)}

⚠️ IMPORTANTE — TIENES ACCESO A:
- KPIs agregados del período seleccionado
- Detalle DÍA POR DÍA en el array "datosDiarios"
- Top canales, fuentes, países, ciudades, páginas, dispositivos, eventos${tieneSEO ? `
- 🔍 DATOS SEO COMPLETOS de Google Search Console en el objeto "seo":
  • Totales (clics, impresiones, CTR, posición promedio, total de keywords)
  • "quickWins": keywords en posición 5-15 con +100 impresiones (oportunidades top)
  • "topKeywords": las 30 keywords con más clics
  • "subidas" y "caidas": movimientos de posición más relevantes
  • "topPaginas": URLs con más tráfico orgánico segmentadas por sección
  • "tendenciaDiaria": clics/impresiones/posición día por día (últimos 40 días)` : ''}

INSTRUCCIONES:
- Responde SIEMPRE en español
- Tono profesional pero amigable
- Usa formato Markdown
- Cita datos específicos (números reales del JSON)
- NO inventes datos
- Sé directo y práctico${tieneSEO ? `
- Para preguntas SEO, prioriza Quick Wins, analiza caídas con causa probable y sugiere acciones concretas (mejorar title, contenido, snippets)
- Distingue entre "tráfico SEO" (orgánico, del objeto seo) y "tráfico GA4" (todos los canales)` : ''}`;

    const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 1500, system: systemPrompt, messages: apiMessages })
      });
      if (!response.ok) { const errText = await response.text(); throw new Error(`Error ${response.status}: ${errText.slice(0, 200)}`); }
      const data = await response.json();
      const text = data.content?.[0]?.text || 'No pude generar una respuesta.';
      setMessages(prev => [...prev, { role: 'assistant', content: text, timestamp: new Date() }]);
    } catch (err) { setError(err.message || 'Error al enviar mensaje'); setMessages(updatedMessages); }
    finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const clearChat = () => { if (messages.length === 0 || window.confirm('¿Iniciar una nueva conversación?')) { setMessages([]); setError(''); } };
  const copyMessage = (text, idx) => { navigator.clipboard.writeText(text); setCopiedIndex(idx); setTimeout(() => setCopiedIndex(null), 2000); };

  return (
    <div className="bg-white border border-violet-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5 border-b border-violet-100" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}08, ${GORUTY.tertiary}08)` }}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}><MessageSquare className="w-5 h-5 text-white" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Pregunta a Claude
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>💬 Chat</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🔒 Solo Admin</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Conversa libremente sobre los datos de {currentClient?.emoji} {currentClient?.nombre} · {messages.length > 0 ? `${messages.length} mensajes` : 'Sin mensajes'}</p>
          </div>
        </div>
        {messages.length > 0 && (<button onClick={clearChat} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium border border-slate-200 hover:border-rose-200"><Trash2 className="w-3.5 h-3.5" />Nueva conversación</button>)}
      </div>

      <div className="p-5 max-h-[600px] overflow-y-auto">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4"><div className="p-4 rounded-full" style={{ backgroundColor: `${GORUTY.primary}10` }}><MessageSquare className="w-8 h-8" style={{ color: GORUTY.primary }} /></div></div>
            <p className="text-sm text-slate-700 font-semibold mb-2">¡Hola! Soy Claude 👋</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">Tengo acceso a todos los datos GA4 de <strong>{currentClient?.nombre}</strong>, incluyendo el detalle día por día y el funnel de conversión.</p>
            <p className="text-xs text-slate-400 mt-4">Escribe tu pregunta abajo para empezar</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 mb-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0">
              {msg.role === 'user' ? (<div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: `linear-gradient(135deg, ${GORUTY.tertiary}, ${GORUTY.secondary})` }}>TÚ</div>) : (<div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Bot className="w-4 h-4 text-white" /></div>)}
            </div>
            <div className={`flex-1 ${msg.role === 'user' ? 'max-w-[80%]' : 'max-w-[90%]'}`}>
              <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm border border-violet-100'}`} style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` } : { backgroundColor: '#fafaff' }}>
                {msg.role === 'user' ? (<p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{msg.content}</p>) : (<div className="prose prose-slate max-w-none">{renderMarkdown(msg.content, GORUTY.primary)}</div>)}
              </div>
              <div className={`flex items-center gap-2 mt-1.5 px-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                <span className="text-[10px] text-slate-400">{msg.timestamp?.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.role === 'assistant' && (<button onClick={() => copyMessage(msg.content, idx)} className="text-[10px] text-slate-400 hover:text-violet-600 flex items-center gap-1">{copiedIndex === idx ? (<><CheckCheck className="w-3 h-3" /> Copiado</>) : (<><Copy className="w-3 h-3" /> Copiar</>)}</button>)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 mb-5">
            <div className="flex-shrink-0"><div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Bot className="w-4 h-4 text-white" /></div></div>
            <div className="flex-1">
              <div className="rounded-2xl rounded-tl-sm border border-violet-100 px-4 py-3 inline-flex items-center gap-2" style={{ backgroundColor: '#fafaff' }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-slate-500 ml-1">Claude está escribiendo...</span>
              </div>
            </div>
          </div>
        )}
        {error && (<div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2 mt-3"><AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" /><div className="flex-1"><p className="text-xs font-medium text-rose-800">Error</p><p className="text-xs text-rose-600">{error}</p></div></div>)}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-violet-100 p-4 bg-white">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Pregúntale a Claude sobre ${currentClient?.nombre}...`} rows={1} disabled={loading || !liveData} className="w-full bg-violet-50/50 border border-violet-200 rounded-xl px-4 py-3 pr-12 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800 resize-none disabled:opacity-50 disabled:cursor-not-allowed" style={{ minHeight: '48px', maxHeight: '150px' }} />
            <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">Enter ⏎ para enviar · Shift+Enter para nueva línea</div>
          </div>
          <button onClick={sendMessage} disabled={loading || !inputValue.trim() || !liveData} className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ session, onLogout }) {
  const [dateRange, setDateRange] = useState('all');
  const [customStart, setCustomStart] = useState('2026-03-20');
  const [customEnd, setCustomEnd] = useState('2026-04-23');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [activeClient, setActiveClient] = useState(session.cliente === '*' ? session.clientes[0]?.id : session.cliente);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({ current: 0, total: 0, clientName: '' });
  const [clientCache, setClientCache] = useState({});
  const liveData = clientCache[activeClient]?.data || null;
  const lastUpdate = clientCache[activeClient]?.lastUpdate || null;
  const currentClient = session.clientes.find(c => c.id === activeClient) || session.clientes[0];
  const isAdmin = session.rol === 'admin';

  const fetchClientData = async (clientId) => {
    const url = `${API_URL}?token=${encodeURIComponent(session.token)}&cliente=${clientId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.requiereLogin) { onLogout(); return null; }
    if (data.error) throw new Error(data.error);
    return data;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true); setRefreshError(null); setRefreshSuccess(false);
    const clientesACargar = session.clientes || [];
    if (clientesACargar.length === 0) { setRefreshError('No hay clientes asignados'); setIsRefreshing(false); return; }
    setRefreshProgress({ current: 0, total: clientesACargar.length, clientName: '' });
    try {
      const promises = clientesACargar.map(async (client) => {
        try {
          const data = await fetchClientData(client.id);
          setRefreshProgress(prev => ({ ...prev, current: prev.current + 1, clientName: client.nombre }));
          return { id: client.id, data, error: null };
        } catch (err) {
          setRefreshProgress(prev => ({ ...prev, current: prev.current + 1, clientName: client.nombre }));
          return { id: client.id, data: null, error: err.message };
        }
      });
      const results = await Promise.all(promises);
      const newCache = { ...clientCache };
      const errores = [];
      const now = new Date();
      results.forEach(r => {
        if (r.data) newCache[r.id] = { data: r.data, lastUpdate: now };
        else if (r.error) { const cliente = session.clientes.find(c => c.id === r.id); errores.push(`${cliente?.nombre}: ${r.error}`); }
      });
      setClientCache(newCache); setRefreshKey(k => k + 1);
      if (errores.length === 0) { setRefreshSuccess(true); setTimeout(() => setRefreshSuccess(false), 4000); }
      else if (errores.length < clientesACargar.length) { setRefreshSuccess(true); setRefreshError(`Algunos errores: ${errores.join(' · ')}`); setTimeout(() => setRefreshSuccess(false), 4000); setTimeout(() => setRefreshError(null), 6000); }
      else { setRefreshError(`No se cargaron clientes: ${errores[0]}`); setTimeout(() => setRefreshError(null), 6000); }
    } catch (error) { setRefreshError(error.message || 'Error al conectar'); setTimeout(() => setRefreshError(null), 5000); }
    finally { setIsRefreshing(false); setRefreshProgress({ current: 0, total: 0, clientName: '' }); }
  };

  useEffect(() => { if (Object.keys(clientCache).length === 0) handleRefresh(); /* eslint-disable-next-line */ }, []);

  const [sections, setSections] = useState({
    aiChat: true,
    funnel: true,  // 🆕 Funnel abierto por defecto
    seo: true,     // 🔍 SEO abierto por defecto
    acquisition: true,
    audience: true,
    behavior: true,
    engagement: true,
    events: false,
    advanced: false,
  });

  const toggleSection = (key) => setSections({ ...sections, [key]: !sections[key] });
  const chartColors = [GORUTY.primary, GORUTY.secondary, GORUTY.tertiary, GORUTY.accent, GORUTY.deepPurple, GORUTY.light, GORUTY.pink];

  const allTrendData = useMemo(() => {
    if (!liveData?.resumenDiario || liveData.resumenDiario.length === 0) return [];
    return liveData.resumenDiario.map(row => {
      const fecha = String(row['Fecha'] || '').slice(5, 10);
      const fechaCompleta = String(row['Fecha'] || '').slice(0, 10);
      return {
        fecha, fechaCompleta,
        usuarios: Number(row['Usuarios Activos']) || 0,
        usuariosNuevos: Number(row['Usuarios Nuevos']) || 0,
        sesiones: Number(row['Sesiones']) || 0,
        sesionesEng: Number(row['Sesiones Comprometidas']) || 0,
        vistas: Number(row['Vistas de Página']) || 0,
        conversiones: 0, valorPurchase: 0,
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
        map[fecha] = { conv: Number(ev['Conversiones']) || 0, valor: Number(ev['Valor del Evento']) || 0 };
      }
    });
    return map;
  }, [liveData]);

  const trendDataConConversiones = useMemo(() => allTrendData.map(d => ({ ...d, conversiones: conversionesPorFecha[d.fecha]?.conv || d.conversiones, valorPurchase: conversionesPorFecha[d.fecha]?.valor || d.valorPurchase })), [allTrendData, conversionesPorFecha]);

  const trendData = useMemo(() => {
    const data = trendDataConConversiones;
    if (dateRange === 'all') return data;
    if (dateRange === '7d') return data.slice(-7);
    if (dateRange === '14d') return data.slice(-14);
    if (dateRange === '28d') return data.slice(-28);
    if (dateRange === 'custom') return data.filter(d => d.fechaCompleta >= customStart && d.fechaCompleta <= customEnd);
    return data;
  }, [dateRange, customStart, customEnd, trendDataConConversiones]);

  const daysCount = trendData.length;

  const dateFilter = useMemo(() => {
    const fechasValidas = new Set(trendData.map(d => d.fechaCompleta).filter(Boolean));
    return (fechaRaw) => {
      if (!fechaRaw) return true;
      const fecha = String(fechaRaw).slice(0, 10);
      if (dateRange === 'all') return true;
      return fechasValidas.has(fecha);
    };
  }, [dateRange, trendData]);

  const kpis = useMemo(() => {
    const totals = trendData.reduce((acc, d) => ({
      usuarios: acc.usuarios + d.usuarios, usuariosNuevos: acc.usuariosNuevos + d.usuariosNuevos,
      sesiones: acc.sesiones + d.sesiones, sesionesEng: acc.sesionesEng + d.sesionesEng,
      vistas: acc.vistas + d.vistas, conversiones: acc.conversiones + d.conversiones,
      valorPurchase: acc.valorPurchase + d.valorPurchase, eventos: acc.eventos + d.eventos,
    }), { usuarios: 0, usuariosNuevos: 0, sesiones: 0, sesionesEng: 0, vistas: 0, conversiones: 0, valorPurchase: 0, eventos: 0 });
    const avgEngagement = trendData.length ? (trendData.reduce((s, d) => s + d.tasaEngagement, 0) / trendData.length).toFixed(1) : 0;
    const avgRebote = trendData.length ? (trendData.reduce((s, d) => s + d.tasaRebote, 0) / trendData.length).toFixed(1) : 0;
    const avgDuracion = trendData.length ? Math.round(trendData.reduce((s, d) => s + d.duracion, 0) / trendData.length) : 0;
    return {
      ...totals, tasaEngagement: avgEngagement, tasaRebote: avgRebote, duracionPromedio: avgDuracion,
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
    liveData.fuentesTrafico.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.fuentesTrafico.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.geografia.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.geografia.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.dispositivos.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.dispositivos.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.dispositivos.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.paginas.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
    liveData.eventos.filter(row => dateFilter(row['Fecha'])).forEach(row => {
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
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15` }}><Icon className="w-4 h-4" style={{ color: accentColor }} /></div>
        {trend !== undefined && (<span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>)}
      </div>
      <div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, sectionKey, subtitle, badge }) => (
    <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center justify-between py-3 px-4 bg-white border border-violet-100 hover:border-violet-300 rounded-lg mb-4 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${GORUTY.primary}15` }}><Icon className="w-4 h-4" style={{ color: GORUTY.primary }} /></div>
        <div className="text-left">
          <div className="text-slate-900 font-semibold flex items-center gap-2">{title}{badge && <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>{badge}</span>}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
      </div>
      {sections[sectionKey] ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
    </button>
  );

  const Panel = ({ title, children, className = '' }) => (
    <div className={`bg-white border border-violet-100 rounded-xl p-5 shadow-sm ${className}`}><h3 className="text-sm font-semibold text-slate-800 mb-4">{title}</h3>{children}</div>
  );

  const tooltipStyle = { contentStyle: { backgroundColor: '#fff', border: `1px solid ${GORUTY.light}`, borderRadius: '8px', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(91, 75, 255, 0.1)' }, labelStyle: { color: '#64748b', fontWeight: 600 } };

  const hasDataForActiveClient = !!liveData;
  const totalClientesEnCache = Object.keys(clientCache).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 text-slate-800 p-6">
      <div className="max-w-[1400px] mx-auto">
        {refreshSuccess && (<div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"><Check className="w-5 h-5 text-emerald-600" /><span className="text-sm font-medium">¡Datos de {totalClientesEnCache} cliente{totalClientesEnCache !== 1 ? 's' : ''} actualizados!</span></div>)}
        {refreshError && (<div className="fixed top-4 right-4 z-50 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md"><X className="w-5 h-5 text-rose-600 flex-shrink-0" /><div><div className="text-sm font-medium">Error</div><div className="text-xs">{refreshError}</div></div></div>)}
        {isRefreshing && refreshProgress.total > 0 && (<div className="fixed top-4 right-4 z-50 bg-violet-50 border border-violet-200 text-violet-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px]"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: GORUTY.primary }} /><div className="flex-1"><div className="text-sm font-medium">Cargando {refreshProgress.current} de {refreshProgress.total} clientes...</div><div className="mt-1.5 bg-violet-200 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full transition-all" style={{ background: `linear-gradient(90deg, ${GORUTY.primary}, ${GORUTY.tertiary})`, width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }}></div></div></div></div>)}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <GorutyLogo size={52} />
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Grouty</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}>Grouty</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{currentClient?.emoji} {currentClient?.nombre}</span>
                {liveData && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">✓ Datos en vivo</span>}
                {totalClientesEnCache > 0 && session.cliente === '*' && (<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{totalClientesEnCache}/{session.clientes.length} cargados</span>)}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">{lastUpdate ? (<span>Última actualización: {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>) : (<span className="text-amber-600">Sin datos cargados — pulsa Actualizar</span>)}</p>
            </div>
          </div>
          <div className="flex gap-2 items-start relative">
            <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : `Actualizar ${session.cliente === '*' ? 'todos' : ''}`}
            </button>
            {session.cliente === '*' && session.clientes.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowClientDropdown(!showClientDropdown)} className="px-4 py-2 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-sm flex items-center gap-2 transition text-slate-700 font-medium">
                  <Building2 className="w-4 h-4" style={{ color: GORUTY.primary }} />
                  <span>{currentClient?.emoji} {currentClient?.nombre}</span>
                  <ChevronDown className={`w-4 h-4 transition ${showClientDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showClientDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-violet-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-violet-100 bg-violet-50/50"><span className="text-xs font-semibold text-slate-600 px-2">CLIENTES ({session.clientes.length})</span></div>
                    {session.clientes.map(client => {
                      const hasCache = !!clientCache[client.id]?.data;
                      return (
                        <div key={client.id} onClick={() => { setActiveClient(client.id); setShowClientDropdown(false); }} className={`flex items-center gap-2 px-3 py-2.5 hover:bg-violet-50 cursor-pointer ${activeClient === client.id ? 'bg-violet-50' : ''}`}>
                          <span className="text-lg">{client.emoji}</span>
                          <span className="text-sm font-medium text-slate-800 flex-1">{client.nombre}</span>
                          {hasCache ? (<span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ Cargado</span>) : (<span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Sin datos</span>)}
                          {activeClient === client.id && <Check className="w-4 h-4" style={{ color: GORUTY.primary }} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="px-3 py-2 bg-white border border-violet-200 hover:border-violet-400 rounded-lg text-sm flex items-center gap-2 transition text-slate-700 font-medium">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}>{session.nombre?.charAt(0) || 'U'}</div>
                <ChevronDown className={`w-4 h-4 transition ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-violet-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-violet-100 bg-violet-50/50">
                    <div className="text-sm font-semibold text-slate-800">{session.nombre}</div>
                    <div className="text-xs text-slate-500">@{session.usuario}</div>
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GORUTY.primary}20`, color: GORUTY.primary }}>{isAdmin ? '👑 Administrador' : '👤 Cliente'}</span>
                  </div>
                  <button onClick={onLogout} className="w-full px-3 py-2.5 text-sm font-medium flex items-center gap-2 transition hover:bg-rose-50 text-rose-600"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {!hasDataForActiveClient && !isRefreshing && (
          <div className="bg-white border-2 border-dashed border-violet-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4"><div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${GORUTY.primary}15` }}><AlertCircle className="w-8 h-8" style={{ color: GORUTY.primary }} /></div></div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sin datos cargados</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">Pulsa <strong>Actualizar</strong> y se cargarán los datos.</p>
            <button onClick={handleRefresh} className="px-6 py-3 rounded-lg text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg mx-auto" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><RefreshCw className="w-4 h-4" />Cargar todos los datos</button>
          </div>
        )}

        {!hasDataForActiveClient && isRefreshing && (
          <div className="bg-white border border-violet-100 rounded-2xl p-12 text-center shadow-sm">
            <div className="flex justify-center mb-4"><RefreshCw className="w-12 h-12 animate-spin" style={{ color: GORUTY.primary }} /></div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Cargando {refreshProgress.total > 0 ? `${refreshProgress.current} de ${refreshProgress.total} clientes` : 'datos'}...</h2>
            <p className="text-sm text-slate-500">Estamos obteniendo los datos de Google Analytics</p>
          </div>
        )}

        {hasDataForActiveClient && (
          <>
            <div className="bg-white border border-violet-100 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Filter className="w-4 h-4" style={{ color: GORUTY.primary }} /><span className="text-sm font-semibold text-slate-800">Filtros</span></div>
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
              {showCustomDate && (<div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-violet-100"><div><label className="text-xs text-slate-500 mb-1 block font-medium">Desde</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" /></div><div><label className="text-xs text-slate-500 mb-1 block font-medium">Hasta</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" /></div></div>)}
              <div className="mt-3 text-xs text-slate-500">Mostrando <span className="font-semibold" style={{ color: GORUTY.primary }}>{daysCount} días</span> de datos{dateRange !== 'all' && <span className="ml-2 text-violet-600">· Filtro aplicado a todas las secciones</span>}</div>
            </div>

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

            {/* 🔒 CHAT IA — SOLO ADMIN */}
            {isAdmin && (
              <>
                <SectionHeader title="Chat con Claude" subtitle="Pregunta lo que quieras sobre los datos del cliente" icon={MessageSquare} sectionKey="aiChat" badge="🔒 Admin" />
                {sections.aiChat && (<div className="mb-6"><AIChatPanel liveData={liveData} kpis={kpis} currentClient={currentClient} dateRange={dateRange} daysCount={daysCount} trendData={trendData} /></div>)}
              </>
            )}

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

            {/* 🎯 FUNNEL DE CONVERSIÓN — MOVIDO AQUÍ (después de los gráficos de tendencia) */}
            <SectionHeader title="Funnel de Conversión" subtitle="Recorrido del usuario desde sesión hasta compra" icon={Target} sectionKey="funnel" badge="🎯 Nuevo" />
            {sections.funnel && (
              <div className="mb-6">
                <ConversionFunnel liveData={liveData} kpis={kpis} dateFilter={dateFilter} currentClient={currentClient} />
              </div>
            )}

            {/* 🔍 SEO — Google Search Console */}
            <SectionHeader title="SEO Orgánico" subtitle="Datos de Google Search Console — keywords, posiciones y oportunidades" icon={Search} sectionKey="seo" badge={liveData?.seo?.disponible ? '🔍 GSC' : '🔜 Pronto'} />
            {sections.seo && (
              <div className="mb-6">
                <SEOSection liveData={liveData} currentClient={currentClient} />
              </div>
            )}

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
                      <Bar dataKey="usuarios" radius={[0, 4, 4, 0]}>{canalesData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Panel>
                <Panel title="Top Fuente / Medio">
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white"><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">Source / Medium</th><th className="py-2 px-3 text-right font-semibold">Sesiones</th><th className="py-2 px-3 text-right font-semibold">Conv.</th></tr></thead>
                      <tbody>{sourceMediumData.map((row, i) => (<tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50"><td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.fuente}</td><td className="py-2 px-3 text-right text-slate-700">{fmt(row.sesiones)}</td><td className="py-2 px-3 text-right font-semibold text-emerald-600">{row.conv}</td></tr>))}</tbody>
                    </table>
                  </div>
                </Panel>
              </div>
            )}

            <SectionHeader title="Audiencia" subtitle="Ubicación y dispositivos" icon={Globe} sectionKey="audience" />
            {sections.audience && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {paisesData.length > 0 && (<Panel title="Usuarios por País" className="lg:col-span-2"><ResponsiveContainer width="100%" height={260}><BarChart data={paisesData}><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis dataKey="pais" stroke="#64748b" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} /><YAxis stroke="#94a3b8" style={{ fontSize: 11 }} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.primary} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {dispositivosData.length > 0 && (<Panel title="Dispositivos"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={dispositivosData} dataKey="usuarios" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={(e) => e.tipo}>{dispositivosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart></ResponsiveContainer></Panel>)}
                {ciudadesData.length > 0 && (<Panel title="Top Ciudades"><ResponsiveContainer width="100%" height={240}><BarChart data={ciudadesData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} /><YAxis type="category" dataKey="ciudad" stroke="#64748b" style={{ fontSize: 11 }} width={100} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.secondary} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {osData.length > 0 && (<Panel title="Sistema Operativo"><ResponsiveContainer width="100%" height={240}><BarChart data={osData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} /><YAxis type="category" dataKey="os" stroke="#64748b" style={{ fontSize: 11 }} width={90} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.tertiary} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {navegadoresData.length > 0 && (<Panel title="Navegadores"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={navegadoresData} dataKey="usuarios" nameKey="navegador" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.navegador} (${e.porcentaje}%)`} style={{ fontSize: 9 }}>{navegadoresData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart></ResponsiveContainer></Panel>)}
              </div>
            )}

            <SectionHeader title="Comportamiento" subtitle="Páginas más vistas" icon={Eye} sectionKey="behavior" />
            {sections.behavior && paginasData.length > 0 && (
              <Panel title="Páginas Más Vistas" className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">Path</th><th className="py-2 px-3 font-semibold">Título</th><th className="py-2 px-3 text-right font-semibold">Vistas</th><th className="py-2 px-3 text-right font-semibold">Usuarios</th></tr></thead>
                    <tbody>{paginasData.map((row, i) => (<tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50"><td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.primary }}>{row.path}</td><td className="py-2 px-3 text-slate-700 text-xs">{row.titulo}</td><td className="py-2 px-3 text-right text-slate-700">{fmt(row.vistas)}</td><td className="py-2 px-3 text-right text-slate-700">{fmt(row.usuarios)}</td></tr>))}</tbody>
                  </table>
                </div>
              </Panel>
            )}

            <SectionHeader title="Eventos" subtitle="Conteo de eventos" icon={MousePointer} sectionKey="events" />
            {sections.events && eventosData.length > 0 && (
              <Panel title="Top Eventos" className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">Evento</th><th className="py-2 px-3 text-right font-semibold">Conteo</th><th className="py-2 px-3 text-right font-semibold">Usuarios</th></tr></thead>
                    <tbody>{eventosData.map((row, i) => (<tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50"><td className="py-2 px-3 font-mono text-xs" style={{ color: GORUTY.accent }}>{row.evento}{row.esConversion && <span className="ml-2 text-emerald-600 font-bold">✓</span>}</td><td className="py-2 px-3 text-right text-slate-700">{fmt(row.conteo)}</td><td className="py-2 px-3 text-right text-slate-700">{fmt(row.usuarios)}</td></tr>))}</tbody>
                  </table>
                </div>
              </Panel>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-6 border-t border-violet-100">
              <GorutyLogo size={20} />
              <span>Dashboard Grouty · {currentClient?.nombre} · Powered by Grouty · 🔐 Acceso autenticado</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('grouty_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const horasTranscurridas = (Date.now() - (data.loginTime || 0)) / (1000 * 60 * 60);
        if (horasTranscurridas < 24) setSession(data);
        else localStorage.removeItem('grouty_session');
      } catch (e) { localStorage.removeItem('grouty_session'); }
    }
    setCheckingSession(false);
  }, []);

  const handleLogin = (data) => {
    setSession({ token: data.token, usuario: data.usuario, nombre: data.nombre, rol: data.rol, cliente: data.cliente, clientes: data.clientes, loginTime: Date.now() });
  };

  const handleLogout = () => { localStorage.removeItem('grouty_session'); setSession(null); };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center"><GorutyLogo size={64} /><div className="mt-4 text-slate-500 text-sm">Cargando...</div></div>
      </div>
    );
  }
  if (!session) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard session={session} onLogout={handleLogout} />;
}
