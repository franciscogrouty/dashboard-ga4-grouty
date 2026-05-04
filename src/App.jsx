import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, FunnelChart, Funnel, LabelList } from 'recharts';
import { TrendingUp, Users, Eye, Target, Clock, MousePointer, Globe, ChevronDown, ChevronRight, Filter, RefreshCw, Activity, DollarSign, Plus, X, Building2, Check, Lock, LogOut, User as UserIcon, Eye as EyeIcon, EyeOff, AlertCircle, Bot, Send, MessageSquare, Trash2, Copy, CheckCheck, TrendingDown, AlertTriangle, ShoppingCart, CreditCard, Heart, Move, ArrowDownRight, Megaphone, Award, Image as ImageIcon, MapPin, History, Layers, FileText, Mail } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbzGdRgh4p6iJtTvk_CPDUUkLrgfuo1k-RuTPc7VtVrlenEv58LTMAP07l-CxPpgcCqtVw/exec';

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY || '';
const CLAUDE_MODEL = 'claude-opus-4-7';

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

// 🆕 v8 — HELPER: Agrega data diaria de Google Ads por dimensión
function aggregateAdsData(rows, groupByField) {
  const map = {};
  rows.forEach(r => {
    const key = r[groupByField] || 'Sin definir';
    if (!map[key]) {
      map[key] = {
        [groupByField]: key,
        impressions: 0, clicks: 0, cost: 0,
        conversions: 0, conversions_value: 0,
        all_conversions: 0, all_conversions_value: 0,
        _meta: {}
      };
    }
    map[key].impressions += Number(r.impressions) || 0;
    map[key].clicks += Number(r.clicks) || 0;
    map[key].cost += Number(r.cost) || 0;
    map[key].conversions += Number(r.conversions) || 0;
    map[key].conversions_value += Number(r.conversions_value) || 0;
    map[key].all_conversions += Number(r.all_conversions) || 0;
    map[key].all_conversions_value += Number(r.all_conversions_value) || 0;
    if (r.campaign_channel_type && !map[key]._meta.channel_type) map[key]._meta.channel_type = r.campaign_channel_type;
    if (r.campaign_status && !map[key]._meta.status) map[key]._meta.status = r.campaign_status;
    if (r.bidding_strategy && !map[key]._meta.bidding_strategy) map[key]._meta.bidding_strategy = r.bidding_strategy;
    if (r.campaign_name && !map[key]._meta.campaign_name) map[key]._meta.campaign_name = r.campaign_name;
    if (r.ad_group_name && !map[key]._meta.ad_group_name) map[key]._meta.ad_group_name = r.ad_group_name;
    if (r.ad_type && !map[key]._meta.ad_type) map[key]._meta.ad_type = r.ad_type;
    if (r.ad_final_urls && !map[key]._meta.ad_final_urls) map[key]._meta.ad_final_urls = r.ad_final_urls;
  });
  return Object.values(map).map(r => ({
    ...r,
    ctr: r.impressions > 0 ? r.clicks / r.impressions : 0,
    avg_cpc: r.clicks > 0 ? r.cost / r.clicks : 0,
    cost_per_conversion: r.conversions > 0 ? r.cost / r.conversions : 0,
    conversion_rate: r.clicks > 0 ? r.conversions / r.clicks : 0
  }));
}

// 🆕 v9 — HELPER: Construye serie diaria filtrada por una dimensión específica
function buildTimeSeriesByValue(rows, filterField, filterValue) {
  const filtered = rows.filter(r => r[filterField] === filterValue);
  const dayMap = {};
  filtered.forEach(r => {
    const fecha = String(r.date || '').slice(0, 10);
    if (!fecha) return;
    if (!dayMap[fecha]) dayMap[fecha] = { fechaCompleta: fecha, fecha: fecha.slice(5), cost: 0, clicks: 0, impressions: 0, conversions: 0, conversions_value: 0 };
    dayMap[fecha].cost += Number(r.cost) || 0;
    dayMap[fecha].clicks += Number(r.clicks) || 0;
    dayMap[fecha].impressions += Number(r.impressions) || 0;
    dayMap[fecha].conversions += Number(r.conversions) || 0;
    dayMap[fecha].conversions_value += Number(r.conversions_value) || 0;
  });
  return Object.values(dayMap)
    .map(d => ({
      ...d,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      cpl: d.conversions > 0 ? d.cost / d.conversions : 0,
      roas: d.cost > 0 ? d.conversions_value / d.cost : 0
    }))
    .sort((a, b) => a.fechaCompleta.localeCompare(b.fechaCompleta));
}

// 🆕 v9 — Componente: gráfico expandible de evolución temporal con toggle de métricas
function RowExpandChart({ timeSeries, label }) {
  const [vista, setVista] = useState('costo_conv');

  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs">
        No hay datos diarios para esta selección.
      </div>
    );
  }

  const fmtMoney = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${Math.round(num).toLocaleString('es-CL')}`;
  };

  const tooltipStyle = {
    contentStyle: { background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: 12 },
    labelStyle: { color: '#5b4bff', fontWeight: 600 }
  };

  const vistas = [
    { id: 'costo_conv', label: 'Costo + Conv.' },
    { id: 'clicks_ctr', label: 'Clicks + CTR' },
    { id: 'cpl_roas', label: 'CPL + ROAS' },
    { id: 'all', label: 'Las 4 (resumen)' },
  ];

  const renderChart = () => {
    if (vista === 'costo_conv') {
      return (
        <ComposedChart data={timeSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
          <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 10 }} />
          <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 10 }} tickFormatter={fmtMoney} />
          <YAxis yAxisId="right" orientation="right" stroke={GORUTY.deepPurple} style={{ fontSize: 10 }} />
          <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'Costo' ? fmtMoney(value) : Number(value).toFixed(2)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area yAxisId="left" type="monotone" dataKey="cost" name="Costo" stroke="#f59e0b" fill="#f59e0b40" strokeWidth={2} />
          <Bar yAxisId="right" dataKey="conversions" name="Conversiones" fill={GORUTY.deepPurple} radius={[3, 3, 0, 0]} />
        </ComposedChart>
      );
    }
    if (vista === 'clicks_ctr') {
      return (
        <ComposedChart data={timeSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
          <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 10 }} />
          <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}%`} />
          <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'CTR' ? `${Number(value).toFixed(2)}%` : Number(value).toLocaleString('es-CL')} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke={GORUTY.primary} fill={`${GORUTY.primary}30`} strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR" stroke="#10b981" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      );
    }
    if (vista === 'cpl_roas') {
      return (
        <ComposedChart data={timeSeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
          <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 10 }} />
          <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 10 }} tickFormatter={fmtMoney} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
          <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'CPL' ? fmtMoney(value) : `${Number(value).toFixed(2)}x`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="cpl" name="CPL" fill={GORUTY.warning} radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS" stroke="#10b981" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      );
    }
    // 'all' — mostrar las 4 métricas en mini grid
    return null;
  };

  if (vista === 'all') {
    return (
      <div>
        <div className="flex flex-wrap gap-1 mb-3">
          {vistas.map(v => (
            <button key={v.id} onClick={() => setVista(v.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${vista === v.id ? 'text-white shadow-sm' : 'text-slate-600 bg-violet-50 hover:bg-violet-100'}`}
              style={vista === v.id ? { background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` } : {}}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1">💰 Costo + Conversiones</div>
            <ResponsiveContainer width="100%" height={170}>
              <ComposedChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 9 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 9 }} tickFormatter={fmtMoney} />
                <YAxis yAxisId="right" orientation="right" stroke={GORUTY.deepPurple} style={{ fontSize: 9 }} />
                <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'Costo' ? fmtMoney(value) : Number(value).toFixed(2)} />
                <Area yAxisId="left" type="monotone" dataKey="cost" name="Costo" stroke="#f59e0b" fill="#f59e0b40" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="conversions" name="Conv." fill={GORUTY.deepPurple} radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1">🖱️ Clicks + CTR</div>
            <ResponsiveContainer width="100%" height={170}>
              <ComposedChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 9 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'CTR' ? `${Number(value).toFixed(2)}%` : Number(value).toLocaleString('es-CL')} />
                <Area yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke={GORUTY.primary} fill={`${GORUTY.primary}30`} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="ctr" name="CTR" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1">🎯 CPL diario</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 9 }} tickFormatter={fmtMoney} />
                <Tooltip {...tooltipStyle} formatter={(value) => fmtMoney(value)} />
                <Bar dataKey="cpl" name="CPL" fill={GORUTY.warning} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 mb-1">📈 ROAS</div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 9 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
                <Tooltip {...tooltipStyle} formatter={(value) => `${Number(value).toFixed(2)}x`} />
                <Line type="monotone" dataKey="roas" name="ROAS" stroke="#10b981" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {vistas.map(v => (
          <button key={v.id} onClick={() => setVista(v.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${vista === v.id ? 'text-white shadow-sm' : 'text-slate-600 bg-violet-50 hover:bg-violet-100'}`}
            style={vista === v.id ? { background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` } : {}}>
            {v.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

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

    // 🔍 CONTEXTO SEO
    seo: (() => {
      const seoData = liveData?.seo;
      if (!seoData?.disponible) return { disponible: false };
      const keywords = seoData.keywords || [];
      const paginas = seoData.paginasSEO || [];
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
        .map(k => ({ keyword: k['Keyword'], clics: Number(k['Clics']) || 0, impresiones: Number(k['Impresiones']) || 0, ctr: k['CTR (%)'], posicion: Number(k['Posición Promedio']) || 0 }));
      return {
        disponible: true,
        totales: { totalClics, totalImpresiones: totalImpr, ctrPromedio, posicionPromedio, totalKeywords: keywords.length },
        quickWins, topKeywords,
        topPaginas: [...paginas].sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0)).slice(0, 15)
      };
    })(),

    // 📢 CONTEXTO GOOGLE ADS — v8
    googleAds: (() => {
      const adsData = liveData?.googleAds;
      if (!adsData?.disponible) return { disponible: false };
      const datos = adsData.datos || [];
      const cambios = adsData.cambios || [];
      const estado = adsData.estado || [];
      const datosGrupos = adsData.datosGrupos || [];
      const datosAnuncios = adsData.datosAnuncios || [];

      const totalCosto = datos.reduce((s, r) => s + (Number(r.cost) || 0), 0);
      const totalImpr = datos.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
      const totalClicks = datos.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
      const totalConv = datos.reduce((s, r) => s + (Number(r.conversions) || 0), 0);
      const totalValor = datos.reduce((s, r) => s + (Number(r.conversions_value) || 0), 0);
      const ctr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
      const cpc = totalClicks > 0 ? totalCosto / totalClicks : 0;
      const cpl = totalConv > 0 ? totalCosto / totalConv : 0;
      const tasaConv = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0;

      const campañasAgg = aggregateAdsData(datos, 'campaign_name');
      const topCampañas = campañasAgg.sort((a, b) => b.cost - a.cost).slice(0, 25).map(c => ({
        campaña: c.campaign_name, canal: c._meta.channel_type, estado: c._meta.status,
        biddingStrategy: c._meta.bidding_strategy,
        impresiones: c.impressions, clicks: c.clicks,
        ctr: (c.ctr * 100).toFixed(2) + '%', cpc: Math.round(c.avg_cpc),
        costo: Math.round(c.cost), conversiones: Number(c.conversions.toFixed(2)),
        costoConv: Math.round(c.cost_per_conversion), valorConv: Math.round(c.conversions_value)
      }));

      const estadoCampañas = estado.filter(e => e.nivel === 'CAMPAIGN').map(e => ({
        campaña: e.name, estado: e.status, canal: e.channel_type,
        biddingStrategy: e.bidding_strategy,
        budgetLimited: e.budget_limited === true || e.budget_limited === 'TRUE',
        budgetLostIs: Number(e.budget_lost_is) || 0,
        approvalStatus: e.approval_status,
        impresiones7d: Number(e.impressions_7d) || 0,
        clicks7d: Number(e.clicks_7d) || 0,
        costo7d: Number(e.cost_7d) || 0,
        conversiones7d: Number(e.conversions_7d) || 0,
        ctr7d: ((Number(e.ctr_7d) || 0) * 100).toFixed(2) + '%'
      }));
      const alertas = estadoCampañas.filter(c => c.estado === 'ENABLED' && (c.budgetLimited || c.budgetLostIs > 0.20));

      const cambiosRecientes = [...cambios]
        .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
        .slice(0, 50)
        .map(c => ({ timestamp: c.timestamp, nivel: c.nivel, nombre: c.name, tipoCambio: c.tipo_cambio, valorAnterior: c.valor_anterior, valorNuevo: c.valor_nuevo }));

      const gruposAgg = aggregateAdsData(datosGrupos, 'ad_group_name');
      const topGrupos = gruposAgg.sort((a, b) => b.cost - a.cost).slice(0, 20).map(g => ({
        adGroup: g.ad_group_name, campaña: g._meta.campaign_name, canal: g._meta.channel_type,
        impresiones: g.impressions, clicks: g.clicks, costo: Math.round(g.cost),
        conversiones: Number(g.conversions.toFixed(2)), costoConv: Math.round(g.cost_per_conversion)
      }));

      const anunciosAgg = aggregateAdsData(datosAnuncios, 'ad_id');
      const topAnuncios = anunciosAgg.sort((a, b) => b.impressions - a.impressions).slice(0, 25).map(a => ({
        adId: a.ad_id, adType: a._meta.ad_type, campaña: a._meta.campaign_name,
        finalUrl: a._meta.ad_final_urls,
        impresiones: a.impressions, clicks: a.clicks,
        ctr: (a.ctr * 100).toFixed(2) + '%', costo: Math.round(a.cost),
        conversiones: Number(a.conversions.toFixed(2))
      }));

      return {
        disponible: true,
        totales: {
          inversion: Math.round(totalCosto), impresiones: totalImpr, clicks: totalClicks,
          ctr: ctr.toFixed(2), cpc: Math.round(cpc),
          conversiones: Number(totalConv.toFixed(2)), valorConversiones: Math.round(totalValor),
          cpl: Math.round(cpl), tasaConversion: tasaConv.toFixed(2)
        },
        topCampañas, estadoCampañas, alertas, cambiosRecientes, topGrupos, topAnuncios
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
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Grouty Marketing Agent</h1>
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

function SEOSection({ liveData, currentClient, dateFilter, dateRange }) {
  const seoData = liveData?.seo;
  const filtroActivo = dateRange && dateRange !== 'all';

  const seoComputed = useMemo(() => {
    if (!seoData?.disponible) return null;
    const keywords = seoData.keywords || [];
    const paginas = seoData.paginasSEO || [];
    const tendencia = seoData.tendenciaSEO || [];
    const movimientos = seoData.posicionesSEO || [];

    // 🆕 v9 — Tendencia filtrada por fecha (Tendencia_Diaria_GSC tiene fecha)
    const tendenciaFiltrada = dateFilter
      ? tendencia.filter(t => dateFilter(t['Fecha']))
      : tendencia;

    // KPIs derivados de la tendencia (sí filtrables)
    const totalClicsTrend = tendenciaFiltrada.reduce((s, t) => s + (Number(t['Clics']) || 0), 0);
    const totalImpresionesTrend = tendenciaFiltrada.reduce((s, t) => s + (Number(t['Impresiones']) || 0), 0);
    const ctrPromedioTrend = totalImpresionesTrend > 0 ? ((totalClicsTrend / totalImpresionesTrend) * 100) : 0;
    const posicionPromedioTrend = tendenciaFiltrada.length > 0
      ? (tendenciaFiltrada.reduce((s, t) => s + (Number(t['Posición Promedio']) || 0), 0) / tendenciaFiltrada.length)
      : 0;

    // Tablas: SIN filtro (no tienen fecha por fila — son agregados pre-calculados del sheet)
    const quickWins = keywords.filter(k => {
      const pos = Number(k['Posición Promedio']) || 999;
      const impr = Number(k['Impresiones']) || 0;
      return pos >= 5 && pos <= 15 && impr >= 100;
    }).sort((a, b) => (Number(b['Impresiones']) || 0) - (Number(a['Impresiones']) || 0)).slice(0, 25);
    const topKeywords = [...keywords].sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0)).slice(0, 25);
    const subidas = movimientos.filter(m => (Number(m['Cambio']) || 0) > 0).sort((a, b) => (Number(b['Cambio']) || 0) - (Number(a['Cambio']) || 0)).slice(0, 15);
    const caidas = movimientos.filter(m => (Number(m['Cambio']) || 0) < 0).sort((a, b) => (Number(a['Cambio']) || 0) - (Number(b['Cambio']) || 0)).slice(0, 15);
    const topPaginas = [...paginas].sort((a, b) => (Number(b['Clics']) || 0) - (Number(a['Clics']) || 0)).slice(0, 20);

    const trendData = tendenciaFiltrada.map(t => ({
      fecha: String(t['Fecha'] || '').slice(5, 10),
      fechaCompleta: String(t['Fecha'] || '').slice(0, 10),
      clics: Number(t['Clics']) || 0,
      impresiones: Number(t['Impresiones']) || 0,
      posicion: Number(t['Posición Promedio']) || 0
    })).slice(-40);

    return {
      totalClics: totalClicsTrend,
      totalImpresiones: totalImpresionesTrend,
      ctrPromedio: ctrPromedioTrend,
      posicionPromedio: posicionPromedioTrend,
      totalKeywords: keywords.length,
      quickWins, topKeywords, subidas, caidas, topPaginas, trendData,
      diasFiltrados: tendenciaFiltrada.length
    };
  }, [seoData, dateFilter, dateRange]);

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
      {filtroActivo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong>Filtro de fecha activo ({seoComputed.diasFiltrados} días):</strong> los KPIs y la tendencia diaria reflejan el período filtrado. Las tablas (Quick Wins, Top Keywords, Movimientos de Posición y URLs) son <strong>agregados pre-calculados de Search Console</strong> y no tienen fecha por fila — muestran el período completo del sheet.
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b4bff20' }}><span className="text-base">🔍</span></div><span className="text-xs font-medium text-slate-500">Clics SEO</span></div>
          <div className="text-2xl font-bold text-slate-800">{fmt(seoComputed.totalClics)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8b5cf620' }}><span className="text-base">👁️</span></div><span className="text-xs font-medium text-slate-500">Impresiones</span></div>
          <div className="text-2xl font-bold text-slate-800">{fmt(seoComputed.totalImpresiones)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}><span className="text-base">📊</span></div><span className="text-xs font-medium text-slate-500">CTR Promedio</span></div>
          <div className="text-2xl font-bold text-slate-800">{seoComputed.ctrPromedio.toFixed(2)}%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b20' }}><span className="text-base">🎯</span></div><span className="text-xs font-medium text-slate-500">Posición Prom.</span></div>
          <div className="text-2xl font-bold text-slate-800">{seoComputed.posicionPromedio.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"><span className="text-base">⚡</span></div><span className="text-xs font-medium text-white/90">Quick Wins</span></div>
          <div className="text-2xl font-bold text-white">{seoComputed.quickWins.length}</div>
          <div className="text-[10px] text-white/80 mt-0.5">Oportunidades a atacar</div>
        </div>
      </div>

      {seoComputed.trendData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-base font-semibold text-slate-800">Tendencia Diaria SEO</h3><p className="text-xs text-slate-500">Clics e impresiones por día (últimos 40 días)</p></div>
            <div className="text-xs px-3 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">{seoComputed.totalKeywords} keywords</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={seoComputed.trendData}>
              <defs>
                <linearGradient id="seoClicsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b4bff" stopOpacity={0.4} /><stop offset="100%" stopColor="#5b4bff" stopOpacity={0.05} /></linearGradient>
                <linearGradient id="seoImprGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} /></linearGradient>
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

      {seoComputed.quickWins.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="flex items-center justify-between mb-4"><div><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><span>⚡</span> Quick Wins — Oportunidades Top {filtroActivo && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📅 Período completo</span>}</h3><p className="text-xs text-slate-500">Keywords en posición 5–15 con muchas impresiones. Atacarlas = subida fuerte de tráfico.</p></div></div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">Keyword</th><th className="py-2 px-3 text-right font-semibold">Clics</th><th className="py-2 px-3 text-right font-semibold">Impresiones</th><th className="py-2 px-3 text-right font-semibold">CTR</th><th className="py-2 px-3 text-right font-semibold">Posición</th></tr></thead>
              <tbody>
                {seoComputed.quickWins.map((k, i) => (
                  <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                    <td className="py-2 px-3 text-slate-700 font-medium">{k['Keyword']}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{fmt(k['Clics'])}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{fmt(k['Impresiones'])}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{k['CTR (%)']}</td>
                    <td className="py-2 px-3 text-right"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: '#f59e0b20', color: '#b45309' }}>{Number(k['Posición Promedio']).toFixed(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><span>🏆</span> Top 25 Keywords {filtroActivo && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📅 Período completo</span>}</h3><p className="text-xs text-slate-500">Ordenadas por clics</p></div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">Keyword</th><th className="py-2 px-3 text-right font-semibold">Clics</th><th className="py-2 px-3 text-right font-semibold">Pos.</th></tr></thead>
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

        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><span>📈</span> Movimientos de Posición {filtroActivo && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📅 Período completo</span>}</h3><p className="text-xs text-slate-500">Subidas y caídas más relevantes</p></div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {seoComputed.subidas.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">🚀 SUBIDAS ({seoComputed.subidas.length})</div>
                <div className="space-y-1.5">
                  {seoComputed.subidas.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-sm">
                      <span className="text-slate-700 truncate max-w-[180px]" title={m['Keyword']}>{m['Keyword']}</span>
                      <div className="flex items-center gap-2 text-xs"><span className="text-slate-500">{Number(m['Pos. Anterior (7d)']).toFixed(0)} → {Number(m['Pos. Actual (7d)']).toFixed(0)}</span><span className="font-semibold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">+{Number(m['Cambio']).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {seoComputed.caidas.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">📉 CAÍDAS ({seoComputed.caidas.length})</div>
                <div className="space-y-1.5">
                  {seoComputed.caidas.slice(0, 8).map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 border border-red-100 text-sm">
                      <span className="text-slate-700 truncate max-w-[180px]" title={m['Keyword']}>{m['Keyword']}</span>
                      <div className="flex items-center gap-2 text-xs"><span className="text-slate-500">{Number(m['Pos. Anterior (7d)']).toFixed(0)} → {Number(m['Pos. Actual (7d)']).toFixed(0)}</span><span className="font-semibold text-red-700 px-2 py-0.5 rounded-full bg-red-100">{Number(m['Cambio']).toFixed(0)}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {seoComputed.topPaginas.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><span>🌐</span> Top URLs por Tráfico SEO {filtroActivo && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📅 Período completo</span>}</h3><p className="text-xs text-slate-500">Páginas con más tráfico orgánico</p></div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100"><th className="py-2 px-3 font-semibold">URL</th><th className="py-2 px-3 text-right font-semibold">Clics</th><th className="py-2 px-3 text-right font-semibold">Impr.</th><th className="py-2 px-3 text-right font-semibold">CTR</th><th className="py-2 px-3 text-right font-semibold">Pos.</th></tr></thead>
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

function PaidMediaSection({ liveData, currentClient, dateFilter, dateRange }) {
  const [activePlatform, setActivePlatform] = useState('googleAds');
  const tieneGoogleAds = liveData?.googleAds?.disponible;

  const platforms = [
    { id: 'googleAds', label: 'Google Ads', icon: '🟡', available: tieneGoogleAds },
    { id: 'metaAds', label: 'Meta Ads', icon: '🔜', available: false, badge: 'Pronto' },
    { id: 'linkedinAds', label: 'LinkedIn Ads', icon: '🔜', available: false, badge: 'Pronto' },
  ];

  if (!tieneGoogleAds) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">📢</div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Paid Media no disponible para este cliente</h3>
        <p className="text-sm text-slate-600">
          Aún no se ha configurado data de campañas pagadas para <strong>{currentClient?.nombre}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-2 border border-violet-100 shadow-sm flex gap-1">
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => p.available && setActivePlatform(p.id)}
            disabled={!p.available}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${activePlatform === p.id ? 'text-white shadow-md' : p.available ? 'text-slate-700 hover:bg-violet-50' : 'text-slate-400 cursor-not-allowed'}`}
            style={activePlatform === p.id ? { background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` } : {}}
          >
            <span>{p.icon}</span><span>{p.label}</span>
            {p.badge && (<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${activePlatform === p.id ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-700'}`}>{p.badge}</span>)}
          </button>
        ))}
      </div>
      {activePlatform === 'googleAds' && tieneGoogleAds && (
        <GoogleAdsTab adsData={liveData.googleAds} currentClient={currentClient} dateFilter={dateFilter} dateRange={dateRange} />
      )}
    </div>
  );
}
function GoogleAdsTab({ adsData, currentClient, dateFilter, dateRange }) {
  const [activeSubtab, setActiveSubtab] = useState('overview');
  // 🆕 v9 — Fila expandida: { table: 'campaigns'|'adgroups'|'ads', key: 'value' }
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (table, key) => {
    setExpandedRow(prev => (prev?.table === table && prev?.key === key) ? null : { table, key });
  };

  const computed = useMemo(() => {
    // 🆕 v9 — Filtrar por fecha (Datos, Datos_Grupos, Datos_Anuncios tienen columna 'date')
    // 'estado' y 'cambios' NO se filtran (estado=snapshot 7d, cambios=audit log con su propio timestamp)
    const datosRaw = adsData.datos || [];
    const datosGruposRaw = adsData.datosGrupos || [];
    const datosAnunciosRaw = adsData.datosAnuncios || [];
    const datos = dateFilter ? datosRaw.filter(r => dateFilter(r.date)) : datosRaw;
    const datosGrupos = dateFilter ? datosGruposRaw.filter(r => dateFilter(r.date)) : datosGruposRaw;
    const datosAnuncios = dateFilter ? datosAnunciosRaw.filter(r => dateFilter(r.date)) : datosAnunciosRaw;
    const cambios = adsData.cambios || [];
    const estado = adsData.estado || [];

    const totalCosto = datos.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    const totalImpr = datos.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
    const totalClicks = datos.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
    const totalConv = datos.reduce((s, r) => s + (Number(r.conversions) || 0), 0);
    const totalValor = datos.reduce((s, r) => s + (Number(r.conversions_value) || 0), 0);
    const ctr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
    const cpc = totalClicks > 0 ? totalCosto / totalClicks : 0;
    const cpl = totalConv > 0 ? totalCosto / totalConv : 0;
    const tasaConv = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0;
    const roas = totalCosto > 0 ? totalValor / totalCosto : 0;

    const trendMap = {};
    datos.forEach(d => {
      const fecha = String(d.date || '').slice(0, 10);
      if (!fecha) return;
      if (!trendMap[fecha]) trendMap[fecha] = { fechaCompleta: fecha, fecha: fecha.slice(5), cost: 0, clicks: 0, impressions: 0, conversions: 0, conversions_value: 0 };
      trendMap[fecha].cost += Number(d.cost) || 0;
      trendMap[fecha].clicks += Number(d.clicks) || 0;
      trendMap[fecha].impressions += Number(d.impressions) || 0;
      trendMap[fecha].conversions += Number(d.conversions) || 0;
      trendMap[fecha].conversions_value += Number(d.conversions_value) || 0;
    });
    const trendData = Object.values(trendMap).sort((a, b) => a.fechaCompleta.localeCompare(b.fechaCompleta));

    const campañas = aggregateAdsData(datos, 'campaign_name').sort((a, b) => b.cost - a.cost);

    const canalesMap = {};
    datos.forEach(d => {
      const canal = d.campaign_channel_type || 'Otro';
      if (!canalesMap[canal]) canalesMap[canal] = { canal, cost: 0, conversions: 0, clicks: 0, impressions: 0 };
      canalesMap[canal].cost += Number(d.cost) || 0;
      canalesMap[canal].conversions += Number(d.conversions) || 0;
      canalesMap[canal].clicks += Number(d.clicks) || 0;
      canalesMap[canal].impressions += Number(d.impressions) || 0;
    });
    const canalesArr = Object.values(canalesMap).sort((a, b) => b.cost - a.cost);

    const estadoCampañas = estado.filter(e => e.nivel === 'CAMPAIGN');
    const alertas = estadoCampañas.filter(c =>
      c.status === 'ENABLED' && (
        c.budget_limited === true || c.budget_limited === 'TRUE' ||
        (Number(c.budget_lost_is) || 0) > 0.20
      )
    );
    const cambiosOrdenados = [...cambios].sort((a, b) =>
      String(b.timestamp || '').localeCompare(String(a.timestamp || ''))
    );

    const grupos = aggregateAdsData(datosGrupos, 'ad_group_id')
      .map(g => ({ ...g, ad_group_name: g._meta.ad_group_name || g.ad_group_id, campaign_name: g._meta.campaign_name, channel_type: g._meta.channel_type }))
      .sort((a, b) => b.cost - a.cost);

    const anuncios = aggregateAdsData(datosAnuncios, 'ad_id')
      .map(a => ({ ...a, campaign_name: a._meta.campaign_name, ad_group_name: a._meta.ad_group_name, ad_type: a._meta.ad_type, ad_final_urls: a._meta.ad_final_urls }))
      .sort((a, b) => b.impressions - a.impressions);

    return {
      totales: { totalCosto, totalImpr, totalClicks, totalConv, totalValor, ctr, cpc, cpl, tasaConv, roas },
      campañas, trendData, canalesArr, estadoCampañas, alertas,
      cambios: cambiosOrdenados, grupos, anuncios,
      // 🆕 v9 — datos crudos filtrados para construir series por fila expandida
      datosFiltered: datos, datosGruposFiltered: datosGrupos, datosAnunciosFiltered: datosAnuncios,
      countCampañas: campañas.length,
      countActivas: estadoCampañas.filter(c => c.status === 'ENABLED').length
    };
  }, [adsData, dateFilter]);

  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const fmtMoney = (n) => `$${fmt(Math.round(Number(n) || 0))}`;
  const fmtMoneyShort = (n) => {
    const num = Number(n) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${fmt(Math.round(num))}`;
  };
  const fmtPct = (n) => `${(Number(n) * 100).toFixed(2)}%`;
  const fmtDate = (d) => { if (!d) return '—'; return String(d).slice(0, 16).replace('T', ' '); };

  const tooltipStyle = {
    contentStyle: { background: 'white', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: 12 },
    labelStyle: { color: '#5b4bff', fontWeight: 600 }
  };
  const PIE_COLORS = [GORUTY.primary, GORUTY.tertiary, GORUTY.accent, GORUTY.secondary, GORUTY.deepPurple, GORUTY.pink];

  const statusBadge = (status) => {
    const map = {
      'ENABLED': { bg: '#d1fae5', text: '#065f46', label: 'Activa' },
      'PAUSED': { bg: '#fef3c7', text: '#92400e', label: 'Pausada' },
      'REMOVED': { bg: '#f1f5f9', text: '#64748b', label: 'Eliminada' }
    };
    return map[status] || { bg: '#f1f5f9', text: '#64748b', label: status || '—' };
  };

  const subtabs = [
    { id: 'overview', label: 'Vista General', icon: TrendingUp },
    { id: 'campaigns', label: 'Campañas', icon: Megaphone },
    { id: 'status', label: 'Estado Actual', icon: Activity, badge: computed.alertas.length > 0 ? computed.alertas.length : null },
    { id: 'changes', label: 'Cambios', icon: History, badge: computed.cambios.length > 0 ? computed.cambios.length : null },
    { id: 'adgroups', label: 'Grupos', icon: Layers },
    { id: 'ads', label: 'Anuncios', icon: FileText },
  ];

  const filtroActivo = dateRange && dateRange !== 'all';

  return (
    <div className="space-y-6">
      {filtroActivo && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-violet-900">
            <strong>Filtro de fecha activo:</strong> los KPIs, tendencia, campañas, grupos y anuncios reflejan el período filtrado. Las pestañas <strong>Estado Actual</strong> (snapshot 7d de Google Ads) y <strong>Cambios</strong> (log de auditoría) mantienen su período propio.
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"><DollarSign className="w-4 h-4 text-white" /></div>
            <span className="text-xs font-medium text-white/90">Inversión Total</span>
          </div>
          <div className="text-2xl font-bold text-white">{fmtMoneyShort(computed.totales.totalCosto)}</div>
          <div className="text-[10px] text-white/80 mt-0.5">{computed.countCampañas} campañas · {computed.countActivas} activas</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5b4bff20' }}><Eye className="w-4 h-4" style={{ color: GORUTY.primary }} /></div><span className="text-xs font-medium text-slate-500">Impresiones</span></div>
          <div className="text-2xl font-bold text-slate-800">{fmt(computed.totales.totalImpr)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7c6dff20' }}><MousePointer className="w-4 h-4" style={{ color: GORUTY.secondary }} /></div><span className="text-xs font-medium text-slate-500">Clicks</span></div>
          <div className="text-2xl font-bold text-slate-800">{fmt(computed.totales.totalClicks)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}><Activity className="w-4 h-4" style={{ color: '#10b981' }} /></div><span className="text-xs font-medium text-slate-500">CTR</span></div>
          <div className="text-2xl font-bold text-slate-800">{computed.totales.ctr.toFixed(2)}%</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#a594ff20' }}><DollarSign className="w-4 h-4" style={{ color: GORUTY.tertiary }} /></div><span className="text-xs font-medium text-slate-500">CPC Promedio</span></div>
          <div className="text-2xl font-bold text-slate-800">{fmtMoney(computed.totales.cpc)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3a2bd420' }}><Target className="w-4 h-4" style={{ color: GORUTY.deepPurple }} /></div><span className="text-xs font-medium text-slate-500">Conversiones</span></div>
          <div className="text-2xl font-bold text-slate-800">{computed.totales.totalConv.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"><Award className="w-4 h-4 text-white" /></div><span className="text-xs font-medium text-white/90">CPL</span></div>
          <div className="text-2xl font-bold text-white">{fmtMoneyShort(computed.totales.cpl)}</div>
          <div className="text-[10px] text-white/80 mt-0.5">Costo por conversión</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b98120' }}><TrendingUp className="w-4 h-4" style={{ color: '#10b981' }} /></div><span className="text-xs font-medium text-slate-500">ROAS</span></div>
          <div className="text-2xl font-bold text-slate-800">{computed.totales.roas.toFixed(2)}x</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{fmtMoneyShort(computed.totales.totalValor)} valor conv.</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 border border-violet-100 shadow-sm flex flex-wrap gap-1">
        {subtabs.map(t => {
          const TIcon = t.icon;
          const isActive = activeSubtab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveSubtab(t.id)}
              className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${isActive ? 'text-white shadow-md' : 'text-slate-700 hover:bg-violet-50'}`}
              style={isActive ? { background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` } : {}}>
              <TIcon className="w-3.5 h-3.5" /><span>{t.label}</span>
              {t.badge !== null && t.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {activeSubtab === 'overview' && (
        <>
          {computed.trendData.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
              <div className="mb-4"><h3 className="text-base font-semibold text-slate-800">📈 Tendencia Diaria — Costo, Clicks y Conversiones</h3><p className="text-xs text-slate-500">Evolución del rendimiento día a día</p></div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={computed.trendData}>
                  <defs>
                    <linearGradient id="adsCostoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} /></linearGradient>
                    <linearGradient id="adsClicksGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b4bff" stopOpacity={0.3} /><stop offset="100%" stopColor="#5b4bff" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis dataKey="fecha" stroke="#94a3b8" style={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={GORUTY.deepPurple} style={{ fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'Costo' ? fmtMoney(value) : fmt(typeof value === 'number' ? Math.round(value * 100) / 100 : value)} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Area yAxisId="left" type="monotone" dataKey="cost" name="Costo" stroke="#f59e0b" fill="url(#adsCostoGrad)" strokeWidth={2.5} />
                  <Area yAxisId="left" type="monotone" dataKey="clicks" name="Clicks" stroke="#5b4bff" fill="url(#adsClicksGrad)" strokeWidth={2} />
                  <Bar yAxisId="right" dataKey="conversions" name="Conversiones" fill={GORUTY.deepPurple} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
              <div className="mb-4"><h3 className="text-base font-semibold text-slate-800">📊 Inversión y Conversiones por Canal</h3><p className="text-xs text-slate-500">Comparativa de eficiencia</p></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={computed.canalesArr}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis dataKey="canal" stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke={GORUTY.deepPurple} style={{ fontSize: 11 }} />
                  <Tooltip {...tooltipStyle} formatter={(value, name) => name === 'Costo' ? fmtMoney(value) : (typeof value === 'number' ? value.toFixed(2) : value)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="cost" name="Costo" fill={GORUTY.warning} radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="conversions" name="Conversiones" fill={GORUTY.deepPurple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
              <div className="mb-4"><h3 className="text-base font-semibold text-slate-800">🥧 Distribución Inversión</h3><p className="text-xs text-slate-500">Por canal</p></div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={computed.canalesArr} dataKey="cost" nameKey="canal" cx="50%" cy="50%" outerRadius={75} label={(e) => `${e.canal}\n${fmtMoneyShort(e.cost)}`} style={{ fontSize: 10 }}>
                    {computed.canalesArr.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(value) => fmtMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeSubtab === 'campaigns' && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Megaphone className="w-4 h-4" style={{ color: GORUTY.primary }} /> Performance por Campaña</h3><p className="text-xs text-slate-500">Click en una fila para ver evolución diaria</p></div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100">
                <th className="py-2 px-2 font-semibold w-6"></th>
                <th className="py-2 px-3 font-semibold">Campaña</th>
                <th className="py-2 px-3 text-center font-semibold">Canal</th>
                <th className="py-2 px-3 text-center font-semibold">Estado</th>
                <th className="py-2 px-3 text-right font-semibold">Impresiones</th>
                <th className="py-2 px-3 text-right font-semibold">Clicks</th>
                <th className="py-2 px-3 text-right font-semibold">CTR</th>
                <th className="py-2 px-3 text-right font-semibold">CPC</th>
                <th className="py-2 px-3 text-right font-semibold">Costo</th>
                <th className="py-2 px-3 text-right font-semibold">Conv.</th>
                <th className="py-2 px-3 text-right font-semibold">CPL</th>
                <th className="py-2 px-3 text-right font-semibold">Valor</th>
              </tr></thead>
              <tbody>
                {computed.campañas.map((c, i) => {
                  const sb = statusBadge(c._meta.status);
                  const isExpanded = expandedRow?.table === 'campaigns' && expandedRow?.key === c.campaign_name;
                  return (
                    <React.Fragment key={i}>
                      <tr onClick={() => toggleRow('campaigns', c.campaign_name)} className={`border-b border-violet-50 cursor-pointer transition ${isExpanded ? 'bg-violet-50' : 'hover:bg-violet-50/50'}`}>
                        <td className="py-2 px-2 text-center">{isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-violet-500 inline" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />}</td>
                        <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[280px]" title={c.campaign_name}>{c.campaign_name}</td>
                        <td className="py-2 px-3 text-center"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: c._meta.channel_type === 'SEARCH' ? '#5b4bff20' : '#a594ff30', color: c._meta.channel_type === 'SEARCH' ? GORUTY.primary : GORUTY.deepPurple }}>{c._meta.channel_type}</span></td>
                        <td className="py-2 px-3 text-center"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sb.bg, color: sb.text }}>{sb.label}</span></td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmt(c.impressions)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmt(c.clicks)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmtPct(c.ctr)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmtMoney(c.avg_cpc)}</td>
                        <td className="py-2 px-3 text-right font-semibold" style={{ color: GORUTY.warning }}>{fmtMoneyShort(c.cost)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-700">{c.conversions.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold" style={{ color: c.conversions > 0 ? GORUTY.primary : '#94a3b8' }}>{c.conversions > 0 ? fmtMoneyShort(c.cost_per_conversion) : '—'}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmtMoneyShort(c.conversions_value)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={12} className="bg-violet-50/30 border-b border-violet-100 p-4">
                            <div className="text-xs font-semibold text-slate-700 mb-2">📊 Evolución diaria — {c.campaign_name}</div>
                            <RowExpandChart timeSeries={buildTimeSeriesByValue(computed.datosFiltered, 'campaign_name', c.campaign_name)} label={c.campaign_name} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubtab === 'status' && (
        <>
          {computed.alertas.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-rose-800">⚠️ Alertas — Campañas activas con problemas de presupuesto</h3>
              </div>
              <p className="text-xs text-rose-700 mb-3">Campañas limitadas por presupuesto o que pierden &gt;20% de impression share por presupuesto.</p>
              <div className="space-y-2">
                {computed.alertas.map((a, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-rose-200 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-semibold text-slate-800">{a.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{a.channel_type} · {a.bidding_strategy}</div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {(a.budget_limited === true || a.budget_limited === 'TRUE') && (<span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">Budget limited</span>)}
                      {(Number(a.budget_lost_is) || 0) > 0.20 && (<span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">IS perdido: {((Number(a.budget_lost_is) || 0) * 100).toFixed(1)}%</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: GORUTY.primary }} /> Estado Actual de Campañas — Snapshot últimos 7 días</h3>
              <p className="text-xs text-slate-500">{computed.estadoCampañas.length} campañas · {computed.countActivas} activas · {computed.alertas.length} con alertas</p>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-3 font-semibold">Campaña</th>
                  <th className="py-2 px-3 text-center font-semibold">Canal</th>
                  <th className="py-2 px-3 text-center font-semibold">Estado</th>
                  <th className="py-2 px-3 text-center font-semibold">Bidding</th>
                  <th className="py-2 px-3 text-center font-semibold">Budget Lim.</th>
                  <th className="py-2 px-3 text-right font-semibold">IS Perdido</th>
                  <th className="py-2 px-3 text-right font-semibold">Impr. 7d</th>
                  <th className="py-2 px-3 text-right font-semibold">Clicks 7d</th>
                  <th className="py-2 px-3 text-right font-semibold">Costo 7d</th>
                  <th className="py-2 px-3 text-right font-semibold">Conv. 7d</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR 7d</th>
                </tr></thead>
                <tbody>
                  {computed.estadoCampañas.map((e, i) => {
                    const sb = statusBadge(e.status);
                    const bl = e.budget_limited === true || e.budget_limited === 'TRUE';
                    const bli = Number(e.budget_lost_is) || 0;
                    return (
                      <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                        <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[260px]" title={e.name}>{e.name}</td>
                        <td className="py-2 px-3 text-center"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: e.channel_type === 'SEARCH' ? '#5b4bff20' : '#a594ff30', color: e.channel_type === 'SEARCH' ? GORUTY.primary : GORUTY.deepPurple }}>{e.channel_type}</span></td>
                        <td className="py-2 px-3 text-center"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: sb.bg, color: sb.text }}>{sb.label}</span></td>
                        <td className="py-2 px-3 text-center text-[10px] text-slate-500 font-mono">{e.bidding_strategy}</td>
                        <td className="py-2 px-3 text-center">{bl ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">SÍ</span> : <span className="text-[10px] text-slate-400">—</span>}</td>
                        <td className="py-2 px-3 text-right" style={{ color: bli > 0.20 ? GORUTY.danger : (bli > 0.10 ? GORUTY.warning : '#64748b'), fontWeight: bli > 0.10 ? 600 : 400 }}>{(bli * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmt(e.impressions_7d)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmt(e.clicks_7d)}</td>
                        <td className="py-2 px-3 text-right" style={{ color: GORUTY.warning }}>{fmtMoneyShort(e.cost_7d)}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-700">{Number(e.conversions_7d).toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{((Number(e.ctr_7d) || 0) * 100).toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeSubtab === 'changes' && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><History className="w-4 h-4" style={{ color: GORUTY.primary }} /> Auditoría de Cambios</h3>
            <p className="text-xs text-slate-500">{computed.cambios.length} cambios registrados</p>
          </div>
          {computed.cambios.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay cambios registrados aún</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-3 font-semibold">Fecha</th>
                  <th className="py-2 px-3 text-center font-semibold">Nivel</th>
                  <th className="py-2 px-3 font-semibold">Entidad</th>
                  <th className="py-2 px-3 text-center font-semibold">Tipo Cambio</th>
                  <th className="py-2 px-3 font-semibold">Antes</th>
                  <th className="py-2 px-3 font-semibold">Después</th>
                </tr></thead>
                <tbody>
                  {computed.cambios.map((c, i) => (
                    <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{fmtDate(c.timestamp)}</td>
                      <td className="py-2 px-3 text-center"><span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{c.nivel}</span></td>
                      <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[260px]" title={c.name}>{c.name}</td>
                      <td className="py-2 px-3 text-center text-[11px] font-semibold text-slate-600">{c.tipo_cambio}</td>
                      <td className="py-2 px-3 text-rose-600 font-mono text-[11px]">{String(c.valor_anterior || '—')}</td>
                      <td className="py-2 px-3 text-emerald-600 font-mono text-[11px]">{String(c.valor_nuevo || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubtab === 'adgroups' && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Layers className="w-4 h-4" style={{ color: GORUTY.primary }} /> Grupos de Anuncios</h3>
            <p className="text-xs text-slate-500">{computed.grupos.length} grupos · click en una fila para ver evolución diaria</p>
          </div>
          {computed.grupos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay datos de grupos disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-2 font-semibold w-6"></th>
                  <th className="py-2 px-3 font-semibold">Grupo</th>
                  <th className="py-2 px-3 font-semibold">Campaña</th>
                  <th className="py-2 px-3 text-center font-semibold">Canal</th>
                  <th className="py-2 px-3 text-right font-semibold">Impresiones</th>
                  <th className="py-2 px-3 text-right font-semibold">Clicks</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR</th>
                  <th className="py-2 px-3 text-right font-semibold">CPC</th>
                  <th className="py-2 px-3 text-right font-semibold">Costo</th>
                  <th className="py-2 px-3 text-right font-semibold">Conv.</th>
                  <th className="py-2 px-3 text-right font-semibold">CPL</th>
                </tr></thead>
                <tbody>
                  {computed.grupos.map((g, i) => {
                    const isExpanded = expandedRow?.table === 'adgroups' && expandedRow?.key === g.ad_group_id;
                    return (
                      <React.Fragment key={i}>
                        <tr onClick={() => toggleRow('adgroups', g.ad_group_id)} className={`border-b border-violet-50 cursor-pointer transition ${isExpanded ? 'bg-violet-50' : 'hover:bg-violet-50/50'}`}>
                          <td className="py-2 px-2 text-center">{isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-violet-500 inline" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />}</td>
                          <td className="py-2 px-3 text-slate-700 font-medium truncate max-w-[200px]" title={g.ad_group_name}>{g.ad_group_name}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[200px]" title={g.campaign_name}>{g.campaign_name}</td>
                          <td className="py-2 px-3 text-center"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: g.channel_type === 'SEARCH' ? '#5b4bff20' : '#a594ff30', color: g.channel_type === 'SEARCH' ? GORUTY.primary : GORUTY.deepPurple }}>{g.channel_type}</span></td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmt(g.impressions)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmt(g.clicks)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmtPct(g.ctr)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmtMoney(g.avg_cpc)}</td>
                          <td className="py-2 px-3 text-right font-semibold" style={{ color: GORUTY.warning }}>{fmtMoneyShort(g.cost)}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-semibold">{g.conversions.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-bold" style={{ color: g.conversions > 0 ? GORUTY.primary : '#94a3b8' }}>{g.conversions > 0 ? fmtMoneyShort(g.cost_per_conversion) : '—'}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="bg-violet-50/30 border-b border-violet-100 p-4">
                              <div className="text-xs font-semibold text-slate-700 mb-2">📊 Evolución diaria — {g.ad_group_name}</div>
                              <RowExpandChart timeSeries={buildTimeSeriesByValue(computed.datosGruposFiltered, 'ad_group_id', g.ad_group_id)} label={g.ad_group_name} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubtab === 'ads' && (
        <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: GORUTY.primary }} /> Anuncios Individuales</h3>
            <p className="text-xs text-slate-500">{computed.anuncios.length} anuncios · click en una fila para ver evolución diaria</p>
          </div>
          {computed.anuncios.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No hay datos de anuncios disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white z-10"><tr className="text-left text-slate-500 border-b border-violet-100">
                  <th className="py-2 px-2 font-semibold w-6"></th>
                  <th className="py-2 px-3 font-semibold">Tipo</th>
                  <th className="py-2 px-3 font-semibold">Final URL</th>
                  <th className="py-2 px-3 font-semibold">Campaña</th>
                  <th className="py-2 px-3 font-semibold">Grupo</th>
                  <th className="py-2 px-3 text-right font-semibold">Impresiones</th>
                  <th className="py-2 px-3 text-right font-semibold">Clicks</th>
                  <th className="py-2 px-3 text-right font-semibold">CTR</th>
                  <th className="py-2 px-3 text-right font-semibold">Costo</th>
                  <th className="py-2 px-3 text-right font-semibold">Conv.</th>
                </tr></thead>
                <tbody>
                  {computed.anuncios.map((a, i) => {
                    const urlCorto = String(a.ad_final_urls || '—').replace(/^https?:\/\/[^/]+/, '').split('?')[0] || '/';
                    const isExpanded = expandedRow?.table === 'ads' && expandedRow?.key === a.ad_id;
                    return (
                      <React.Fragment key={i}>
                        <tr onClick={() => toggleRow('ads', a.ad_id)} className={`border-b border-violet-50 cursor-pointer transition ${isExpanded ? 'bg-violet-50' : 'hover:bg-violet-50/50'}`}>
                          <td className="py-2 px-2 text-center">{isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-violet-500 inline" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />}</td>
                          <td className="py-2 px-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{a.ad_type}</span></td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={a.ad_final_urls}>{urlCorto}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[180px]" title={a.campaign_name}>{a.campaign_name}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[160px]" title={a.ad_group_name}>{a.ad_group_name}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmt(a.impressions)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{fmt(a.clicks)}</td>
                          <td className="py-2 px-3 text-right font-semibold" style={{ color: GORUTY.primary }}>{fmtPct(a.ctr)}</td>
                          <td className="py-2 px-3 text-right" style={{ color: GORUTY.warning }}>{fmtMoneyShort(a.cost)}</td>
                          <td className="py-2 px-3 text-right text-slate-700 font-semibold">{a.conversions.toFixed(2)}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="bg-violet-50/30 border-b border-violet-100 p-4">
                              <div className="text-xs font-semibold text-slate-700 mb-2">📊 Evolución diaria — Anuncio {a.ad_id} ({a.ad_type})</div>
                              <RowExpandChart timeSeries={buildTimeSeriesByValue(computed.datosAnunciosFiltered, 'ad_id', a.ad_id)} label={String(a.ad_id)} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function ConversionFunnel({ liveData, kpis, dateFilter, currentClient, dateRange, trendData }) {
  const funnelData = useMemo(() => {
    if (!liveData?.eventos) return null;
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

    const checkoutEvents = ['begin_checkout', 'add_to_cart', 'purchase', 'add_payment_info', 'add_shipping_info'];
    const leadEvents = ['form_submit', 'generate_lead', 'contact', 'phone_click', 'whatsapp_click', 'email_click', 'sign_up', 'click_to_call'];
    const tieneCheckout = checkoutEvents.some(ev => (eventosAgregados[ev]?.usuarios || eventosAgregados[ev]?.conteo) > 0);
    const tieneLeads = leadEvents.some(ev => (eventosAgregados[ev]?.usuarios || eventosAgregados[ev]?.conteo) > 0);
    const modo = tieneCheckout ? 'b2c' : (tieneLeads ? 'b2b' : 'b2b');

    const sesiones = kpis.sesiones || 0;
    const sesionesEng = kpis.sesionesEng || 0;
    const scrollUsers = eventosAgregados['scroll']?.usuarios || 0;

    let pasos = [];
    let purchaseValor = 0;

    if (modo === 'b2c') {
      const beginCheckout = eventosAgregados['begin_checkout']?.usuarios || 0;
      const purchase = eventosAgregados['purchase']?.usuarios || eventosAgregados['purchase']?.conteo || 0;
      purchaseValor = eventosAgregados['purchase']?.valor || 0;
      pasos = [
        { nombre: 'Sesiones', descripcion: 'Visitas iniciadas al sitio', valor: sesiones, icon: Users, color: GORUTY.primary, emoji: '👥' },
        { nombre: 'Engagement', descripcion: 'Sesiones >10s o múltiples páginas', valor: sesionesEng, icon: Heart, color: GORUTY.secondary, emoji: '💖' },
        { nombre: 'Interés Profundo', descripcion: 'Hicieron scroll completo', valor: scrollUsers, icon: Move, color: GORUTY.tertiary, emoji: '📜' },
        { nombre: 'Inicio Checkout', descripcion: 'Llegaron al proceso de compra', valor: beginCheckout, icon: ShoppingCart, color: GORUTY.accent, emoji: '🛒' },
        { nombre: 'Compra', descripcion: 'Completaron la compra', valor: purchase, icon: CreditCard, color: GORUTY.deepPurple, emoji: '💰' }
      ];
    } else {
      let leadsCount = 0;
      const leadsEventosUsados = [];
      leadEvents.forEach(ev => {
        const cnt = eventosAgregados[ev]?.usuarios || eventosAgregados[ev]?.conteo || 0;
        if (cnt > 0) { leadsCount += cnt; leadsEventosUsados.push(`${ev} (${cnt})`); }
      });
      pasos = [
        { nombre: 'Sesiones', descripcion: 'Visitas iniciadas al sitio', valor: sesiones, icon: Users, color: GORUTY.primary, emoji: '👥' },
        { nombre: 'Engagement', descripcion: 'Sesiones >10s o múltiples páginas', valor: sesionesEng, icon: Heart, color: GORUTY.secondary, emoji: '💖' },
        { nombre: 'Interés Profundo', descripcion: 'Hicieron scroll completo', valor: scrollUsers, icon: Move, color: GORUTY.tertiary, emoji: '📜' },
        { nombre: 'Leads / Contacto', descripcion: leadsEventosUsados.length > 0 ? `Eventos: ${leadsEventosUsados.slice(0, 2).join(', ')}` : 'Formulario, llamada, WhatsApp, etc.', valor: leadsCount, icon: Send, color: GORUTY.deepPurple, emoji: '📧' }
      ];
    }

    const total = sesiones || 1;
    const pasosCalc = pasos.map((paso, idx) => {
      const pct = total ? (paso.valor / total) * 100 : 0;
      const pctAnterior = idx === 0 ? 100 : (pasos[idx - 1].valor ? (paso.valor / pasos[idx - 1].valor) * 100 : 0);
      const dropOff = idx === 0 ? 0 : 100 - pctAnterior;
      const perdidos = idx === 0 ? 0 : pasos[idx - 1].valor - paso.valor;
      return { ...paso, pct, pctAnterior, dropOff, perdidos };
    });

    return { pasos: pasosCalc, total, purchaseValor, modo };
  }, [liveData, kpis, dateFilter, dateRange, trendData]);

  const fmt = (n) => Number(n).toLocaleString('es-CL');
  const fmtMoney = (n) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

  if (!funnelData || funnelData.total === 0) {
    return (<div className="bg-white border border-violet-100 rounded-xl p-8 text-center shadow-sm"><AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: GORUTY.warning }} /><p className="text-sm text-slate-500">No hay datos suficientes para mostrar el funnel en este período.</p></div>);
  }

  const { pasos, total, purchaseValor, modo } = funnelData;
  const tasaConversion = pasos[pasos.length - 1].pct.toFixed(2);
  const valorPorSesion = total ? (purchaseValor / total) : 0;
  const ultimoPaso = pasos[pasos.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border" style={{ backgroundColor: modo === 'b2c' ? '#5b4bff10' : '#10b98110', borderColor: modo === 'b2c' ? '#5b4bff30' : '#10b98130' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{modo === 'b2c' ? '🛒' : '📧'}</span>
          <div>
            <span className="text-xs font-bold" style={{ color: modo === 'b2c' ? GORUTY.primary : '#059669' }}>{modo === 'b2c' ? 'Modo B2C detectado' : 'Modo B2B detectado'}</span>
            <span className="text-[10px] text-slate-500 ml-2">{modo === 'b2c' ? 'Cliente con e-commerce / checkout' : 'Cliente de captación de leads'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">🎯 Tasa Conversión Global</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.primary }}>{tasaConversion}%</div>
          <div className="text-[10px] text-slate-400 mt-1">Sesiones → {ultimoPaso.nombre}</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">{modo === 'b2c' ? '💰 Ingresos Totales' : '📧 Total Leads'}</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.deepPurple }}>{modo === 'b2c' ? fmtMoney(purchaseValor) : fmt(ultimoPaso.valor)}</div>
          <div className="text-[10px] text-slate-400 mt-1">{modo === 'b2c' ? `${fmt(ultimoPaso.valor)} compras` : 'En el período'}</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">{modo === 'b2c' ? '📊 Valor por Sesión' : '🎯 Costo Lead (sesiones)'}</div>
          <div className="text-2xl font-bold" style={{ color: GORUTY.accent }}>{modo === 'b2c' ? `$${fmt(Math.round(valorPorSesion))}` : (ultimoPaso.valor > 0 ? fmt(Math.round(total / ultimoPaso.valor)) : '—')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{modo === 'b2c' ? 'Promedio' : 'Sesiones por lead'}</div>
        </div>
        <div className="bg-white border border-violet-100 rounded-xl p-4">
          <div className="text-xs text-slate-500 mb-1 font-medium">👥 Sesiones</div>
          <div className="text-2xl font-bold text-slate-700">{fmt(total)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total entradas</div>
        </div>
      </div>

      <div className="bg-white border border-violet-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5"><h3 className="text-sm font-semibold text-slate-800">🎯 Etapas del Funnel</h3></div>
        <div className="space-y-2">
          {pasos.map((paso, idx) => {
            const Icon = paso.icon;
            const width = Math.max(paso.pct, paso.valor > 0 ? 8 : 2);
            const isFirst = idx === 0;
            const drop = !isFirst && paso.dropOff > 0;
            return (
              <div key={idx}>
                {drop && (
                  <div className="flex items-center justify-center my-1.5 gap-3">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-500"><ArrowDownRight className="w-3 h-3" /><span>-{paso.dropOff.toFixed(1)}% ({fmt(paso.perdidos)} perdidos)</span></div>
                  </div>
                )}
                <div className="flex items-center gap-3 group transition-all hover:bg-violet-50/30 rounded-lg p-1 -m-1 relative">
                  <div className="flex items-center gap-2 w-44 flex-shrink-0">
                    <div className="p-1.5 rounded-md flex-shrink-0" style={{ backgroundColor: `${paso.color}20` }}><Icon className="w-3.5 h-3.5" style={{ color: paso.color }} /></div>
                    <div className="min-w-0"><div className="text-xs font-semibold text-slate-800 truncate">{paso.emoji} {paso.nombre}</div><div className="text-[10px] text-slate-400 truncate">{paso.descripcion}</div></div>
                  </div>
                  <div className="flex-1 relative h-12 bg-slate-50 rounded-lg overflow-hidden">
                    <div className="h-full flex items-center justify-between px-4 transition-all duration-500 rounded-lg" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${paso.color}, ${paso.color}cc)`, minWidth: paso.valor > 0 ? '120px' : '60px' }}>
                      <span className="text-white font-bold text-sm drop-shadow">{fmt(paso.valor)}</span>
                      <span className="text-white text-xs font-semibold opacity-90 drop-shadow">{paso.pct.toFixed(2)}%</span>
                    </div>
                  </div>
                  {!isFirst && (<div className="w-28 text-right flex-shrink-0"><div className="text-xs font-bold" style={{ color: paso.pctAnterior > 50 ? GORUTY.success : (paso.pctAnterior > 10 ? GORUTY.warning : GORUTY.danger) }}>{paso.pctAnterior.toFixed(1)}%</div><div className="text-[9px] text-slate-400">vs anterior</div></div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AIChatPanel({ liveData, kpis, currentClient, dateRange, daysCount, trendData, session }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  // 🆕 v12 — Estado del modal de email (mailto: abre cliente del usuario)
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailError, setEmailError] = useState(null);
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
    const tieneAds = dataContext.googleAds?.disponible;
    const systemPrompt = `Eres "Grouty Agent", un analista experto en marketing digital, Google Analytics 4, SEO (Google Search Console) y Paid Media (Google Ads) que ayuda al cliente "${currentClient?.nombre}".

═══════════════════════════════════════════════════════════
🔴 REGLAS DE INTEGRIDAD (PRIORIDAD MÁXIMA — INVIOLABLES)
═══════════════════════════════════════════════════════════

1. **NO MIENTAS NUNCA**. Está terminantemente prohibido inventar números, fechas, métricas, tendencias, comparaciones, benchmarks o cualquier dato que no esté explícitamente en el JSON de contexto.

2. **SI NO SABES, DILO**. Cuando una pregunta requiera información que no está en el contexto, responde literalmente: "No tengo este dato disponible en el contexto actual" y explica qué dato específico falta. Nunca aproximes, estimes o inventes para "completar" una respuesta.

3. **SI BUSCAS O INFIERES, DECLARA LA FUENTE**. Cuando hagas una inferencia (ej: "esto sugiere que...") o uses conocimiento general (ej: "el CPL promedio del sector hotelero suele ser..."), debes:
   - Marcar la afirmación con [INFERENCIA] o [CONOCIMIENTO GENERAL]
   - Aclarar que no es un dato del cliente sino una observación tuya
   - Si es benchmark de industria, decir explícitamente "esto es referencia general, no datos validados de tu cliente"

4. **PROTOCOLO DE ETIQUETAS** — Aplica SIEMPRE estas etiquetas:
   - **[DATO CONFIRMADO]**: cuando citas un número o hecho directo del JSON. Indica de qué objeto del JSON viene (ej: "googleAds.totales.cpl = $5.430").
   - **[CÁLCULO]**: cuando derivas un número haciendo matemática sobre datos del JSON. Muestra la fórmula (ej: "CTR = 1.250 clicks / 50.000 impresiones × 100 = 2.5%").
   - **[INFERENCIA]**: cuando interpretas o conectas datos para sacar una conclusión. La conclusión debe seguir lógicamente de los datos citados.
   - **[REQUIERE VALIDACIÓN]**: cuando la conclusión depende de información que no está respaldada por los datos del contexto, o cuando hay ambigüedad sobre la causa de un fenómeno.
   - **[CONOCIMIENTO GENERAL]**: cuando uses información de tu entrenamiento (no del JSON del cliente). Aclara que es referencia, no dato del cliente.

5. **DISTINGUE ENTRE LO QUE VES Y LO QUE INFIERES**. Antes de afirmar algo, pregúntate: "¿Está esto literalmente en el JSON, o lo estoy infiriendo?". Si es lo segundo, etiquétalo.

6. **CUANDO TENGAS DUDAS, COMÉNTALO**. Es mejor decir "no estoy seguro porque [razón]" que dar una respuesta confiada equivocada. Si una pregunta es ambigua, pide aclaración antes de responder.

═══════════════════════════════════════════════════════════
DATOS DEL CLIENTE (única fuente de verdad)
═══════════════════════════════════════════════════════════

${JSON.stringify(dataContext, null, 2)}

═══════════════════════════════════════════════════════════
ESTRUCTURA DEL CONTEXTO — qué tienes disponible
═══════════════════════════════════════════════════════════

✅ KPIs agregados del período seleccionado (GA4): kpis.*
✅ Detalle DÍA POR DÍA: datosDiarios[]
✅ Top: topCanales, topFuentes, topPaises, topCiudades, topPaginas, dispositivos, eventos${tieneSEO ? `
✅ SEO de Google Search Console: seo.totales, seo.quickWins, seo.topKeywords, seo.topPaginas
   ⚠️ Las tablas SEO (keywords, páginas, movimientos) son agregados pre-calculados de GSC sin fecha por fila — reflejan el período completo del sheet, NO el filtro de fecha activo en el dashboard. Solo seo.totales y la tendencia diaria están filtrados.` : ''}${tieneAds ? `
✅ Google Ads (estructura v8) — googleAds.*:
   • totales: inversion, impresiones, clicks, ctr, cpc, conversiones, valorConversiones, cpl, tasaConversion
   • topCampañas: campaña, canal (SEARCH/DISPLAY/PERFORMANCE_MAX/etc), estado, biddingStrategy, métricas, costoConv
   • estadoCampañas: snapshot 7d con budgetLimited, budgetLostIs, approvalStatus, métricas 7d
   • alertas: campañas activas con budgetLimited o IS perdido >20%
   • cambiosRecientes: audit log con timestamp, valorAnterior, valorNuevo
   • topGrupos: ad groups agregados
   • topAnuncios: anuncios individuales con adType y finalUrl
   ⚠️ Ya NO hay datos de: keywords con QS, search terms, negative keywords, landing pages individuales, assets, audiencias. Si te preguntan por algo de eso, responde que esa data no está disponible.` : ''}

═══════════════════════════════════════════════════════════
LO QUE NO TIENES (no inventes)
═══════════════════════════════════════════════════════════

❌ Datos de períodos anteriores fuera del rango actual del JSON
❌ Información sobre la competencia del cliente
❌ Costos, margen de ganancia, ticket promedio del producto/servicio
❌ Estrategia comercial, presupuestos planificados o metas internas
❌ Información sobre otros canales (Meta Ads, LinkedIn Ads, email marketing, etc.) — solo está GA4, GSC y Google Ads
❌ Atribución multi-touch real (GA4 usa last-click por defecto)
❌ Eventos de conversión offline (llamadas, ventas presenciales, etc.) salvo que estén en eventos[]

Si te preguntan por algo de esta lista, responde: "No tengo este dato disponible en el contexto. Para responderte con precisión necesitaría que me compartieras: [dato específico]".

═══════════════════════════════════════════════════════════
ESTILO DE RESPUESTA
═══════════════════════════════════════════════════════════

- Idioma: SIEMPRE español
- Tono: profesional pero amigable, directo y práctico
- Formato: Markdown (negritas, listas, pero sin abusar de headers)
- Longitud: tan corta como sea posible sin sacrificar precisión. Si la pregunta es simple, una respuesta de 2-4 líneas es perfecta. Si es analítica, máximo 1-2 párrafos por punto.
- SIEMPRE cita el número exacto antes de interpretarlo${tieneAds ? `
- Para Google Ads: prioriza eficiencia (CPL bajo, ROAS alto) sobre volumen. Alerta sobre campañas con budgetLimited o budgetLostIs > 20%. Para preguntas de cambios, usa cambiosRecientes.` : ''}${tieneSEO ? `
- Para SEO: prioriza Quick Wins (pos 5-15 con muchas impresiones). Analiza caídas con causa probable, marcando claramente cuando es [INFERENCIA].` : ''}

═══════════════════════════════════════════════════════════
EJEMPLO DE RESPUESTA BIEN FORMADA
═══════════════════════════════════════════════════════════

Pregunta: "¿Cómo está rindiendo Google Ads este período?"

Respuesta correcta:
"En el período actual, **Google Ads invirtió $X** [DATO CONFIRMADO: googleAds.totales.inversion] generando **Y conversiones** [DATO CONFIRMADO: googleAds.totales.conversiones], lo que da un **CPL de $Z** [DATO CONFIRMADO: googleAds.totales.cpl].

[INFERENCIA] Comparando con la tasa de conversión del 2.5% [CÁLCULO: conversiones / clicks × 100], el rendimiento parece sano. Sin embargo, observo que **N campañas activas tienen budget limited** [DATO CONFIRMADO: googleAds.alertas.length], lo que sugiere que estás dejando volumen sobre la mesa.

[REQUIERE VALIDACIÓN] No tengo el target de CPL definido por el cliente, así que no puedo decir si $Z está dentro de objetivo. Si me compartes el CPL objetivo, puedo evaluarlo con más precisión."

═══════════════════════════════════════════════════════════

Recuerda: tu utilidad depende de tu CONFIABILIDAD. Es mejor decir "no sé" 10 veces que inventar una vez.`;

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

  // 🆕 v12 — Convierte markdown básico a texto plano legible (para mailto:)
  const markdownToPlainText = (md) => {
    if (!md) return '';
    return md
      .replace(/\*\*(.+?)\*\*/g, '$1')      // negritas
      .replace(/\*(.+?)\*/g, '$1')          // cursivas
      .replace(/`(.+?)`/g, '$1')            // código inline
      .replace(/^##\s+/gm, '')              // headers H2
      .replace(/^#\s+/gm, '');              // headers H1
  };

  // 🆕 v12 — Construye el cuerpo del email en texto plano y abre el cliente del usuario
  // 🆕 v13 — Acepta el provider: 'gmail', 'outlook' o 'system' (mailto:)
  const openMailClient = (provider) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const to = emailTo.trim();
    if (!emailRegex.test(to)) { setEmailError('Email inválido'); return; }
    if (messages.length === 0) { setEmailError('No hay mensajes para enviar'); return; }

    const fechaStr = new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
    const subject = `Conversación Grouty Agent — ${currentClient?.nombre || 'Cliente'}`;

    let body = `CONVERSACIÓN CON GROUTY AGENT\n`;
    body += `Cliente: ${currentClient?.nombre || ''}\n`;
    body += `Fecha: ${fechaStr}\n`;
    body += `Mensajes: ${messages.length}\n`;
    body += `${'─'.repeat(50)}\n\n`;

    messages.forEach((m, i) => {
      const label = m.role === 'user' ? 'TÚ' : 'GROUTY AGENT';
      const cleanContent = m.role === 'user' ? m.content : markdownToPlainText(m.content);
      body += `▸ ${label}:\n${cleanContent}\n\n`;
      if (i < messages.length - 1) body += `${'─'.repeat(50)}\n\n`;
    });

    body += `\n${'─'.repeat(50)}\n`;
    body += `Enviado desde Grouty Marketing Agent\n`;

    // Gmail/Outlook web aceptan URLs más largas que mailto: (≈8000 chars).
    // Solo truncamos si va por mailto: (cliente del sistema).
    const MAX_MAILTO = 1800;
    let finalBody = body;
    if (provider === 'system' && body.length > MAX_MAILTO) {
      finalBody = body.slice(0, MAX_MAILTO) + '\n\n[... conversación truncada por longitud. Para conversaciones largas, usa Gmail u Outlook.]';
    }

    let url;
    if (provider === 'gmail') {
      // Gmail web compose
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
    } else if (provider === 'outlook') {
      // Outlook web compose
      url = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
    } else {
      // 'system' — cliente de email default del sistema (Apple Mail, Thunderbird, etc.)
      url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
    }

    if (provider === 'system') {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Cerrar modal después de un breve delay
    setTimeout(() => {
      setEmailModalOpen(false);
      setEmailTo('');
      setEmailError(null);
    }, 400);
  };

  return (
    <div className="bg-white border border-violet-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 p-5 border-b border-violet-100" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}08, ${GORUTY.tertiary}08)` }}>
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.tertiary})` }}><MessageSquare className="w-5 h-5 text-white" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">Grouty Agent<span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>💬 Chat</span><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🔒 Solo Admin</span></h3>
            <p className="text-xs text-slate-500 mt-0.5">Conversa libremente sobre los datos de {currentClient?.emoji} {currentClient?.nombre} · {messages.length > 0 ? `${messages.length} mensajes` : 'Sin mensajes'}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEmailModalOpen(true); setEmailFeedback(null); }} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition text-white font-medium shadow-sm hover:shadow-md" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}>
              <Mail className="w-3.5 h-3.5" />Enviar por email
            </button>
            <button onClick={clearChat} className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-medium border border-slate-200 hover:border-rose-200"><Trash2 className="w-3.5 h-3.5" />Nueva conversación</button>
          </div>
        )}
      </div>

      <div className="p-5 max-h-[240px] overflow-y-auto">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4"><div className="p-4 rounded-full" style={{ backgroundColor: `${GORUTY.primary}10` }}><MessageSquare className="w-8 h-8" style={{ color: GORUTY.primary }} /></div></div>
            <p className="text-sm text-slate-700 font-semibold mb-2">¡Hola! Soy Grouty Agent 👋</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">Tengo acceso a todos los datos GA4, SEO y Google Ads de <strong>{currentClient?.nombre}</strong>, incluyendo el detalle día por día y el funnel de conversión.</p>
            <p className="text-xs text-slate-400 mt-4">Escribe tu pregunta abajo para empezar</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 mb-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0">{msg.role === 'user' ? (<div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: `linear-gradient(135deg, ${GORUTY.tertiary}, ${GORUTY.secondary})` }}>TÚ</div>) : (<div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Bot className="w-4 h-4 text-white" /></div>)}</div>
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
                <div className="flex gap-1"><div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '0ms' }}></div><div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '150ms' }}></div><div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: GORUTY.primary, animationDelay: '300ms' }}></div></div>
                <span className="text-xs text-slate-500 ml-1">Grouty Agent está escribiendo...</span>
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
            <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Pregúntale a Grouty Agent sobre ${currentClient?.nombre}...`} rows={1} disabled={loading || !liveData} className="w-full bg-violet-50/50 border border-violet-200 rounded-xl px-4 py-3 pr-12 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800 resize-none disabled:opacity-50 disabled:cursor-not-allowed" style={{ minHeight: '48px', maxHeight: '150px' }} />
            <div className="absolute bottom-2 right-3 text-[10px] text-slate-400">Enter ⏎ para enviar · Shift+Enter para nueva línea</div>
          </div>
          <button onClick={sendMessage} disabled={loading || !inputValue.trim() || !liveData} className="px-4 py-3 rounded-xl text-sm flex items-center gap-2 transition text-white font-medium shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Send className="w-4 h-4" /></button>
        </div>
      </div>

      {/* 🆕 v12 — Modal de envío por email (abre cliente del usuario vía mailto:) */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }} onClick={() => setEmailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-violet-100" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}10, ${GORUTY.tertiary}10)` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ background: `linear-gradient(135deg, ${GORUTY.primary}, ${GORUTY.accent})` }}><Mail className="w-4 h-4 text-white" /></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Enviar conversación por email</h3>
                    <p className="text-xs text-slate-500">{messages.length} mensaje{messages.length !== 1 ? 's' : ''} · {currentClient?.nombre}</p>
                  </div>
                </div>
                <button onClick={() => setEmailModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">Destinatario</label>
                <input type="email" value={emailTo} onChange={(e) => { setEmailTo(e.target.value); setEmailError(null); }} onKeyDown={(e) => { if (e.key === 'Enter' && emailTo.trim()) openMailClient('gmail'); }} placeholder="ejemplo@empresa.cl" autoFocus className="w-full bg-violet-50/50 border border-violet-200 rounded-lg px-3 py-2.5 text-sm focus:border-violet-500 focus:bg-white outline-none text-slate-800" />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1.5 block font-semibold uppercase tracking-wide">¿Con qué correo enviar?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => openMailClient('gmail')} disabled={!emailTo.trim()} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50 transition text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="text-xl">📧</span>
                    <span>Gmail</span>
                  </button>
                  <button onClick={() => openMailClient('outlook')} disabled={!emailTo.trim()} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50 transition text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="text-xl">📨</span>
                    <span>Outlook</span>
                  </button>
                  <button onClick={() => openMailClient('system')} disabled={!emailTo.trim()} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50 transition text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    <span className="text-xl">💻</span>
                    <span>Otro</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-violet-50/50 border border-violet-100 rounded-lg p-3">
                <strong className="text-slate-800">¿Cómo funciona?</strong>
                <ul className="mt-1.5 space-y-0.5 list-disc list-inside text-[11px] text-slate-600">
                  <li><strong>Gmail / Outlook</strong>: abre la app web en una pestaña nueva</li>
                  <li><strong>Otro</strong>: usa el cliente default del sistema (Apple Mail, Thunderbird)</li>
                  <li>El correo se enviará <strong>desde tu cuenta personal</strong></li>
                  <li>Solo tienes que apretar "Enviar" en tu correo</li>
                </ul>
              </div>

              {emailError && (
                <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-2 bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {emailError}
                </div>
              )}
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button onClick={() => setEmailModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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

const SectionHeader = ({ title, icon: Icon, sectionKey, subtitle, badge, sections, toggleSection }) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); toggleSection(sectionKey); }}
    onMouseDown={(e) => e.preventDefault()}
    className="w-full flex items-center justify-between py-3 px-4 bg-white border border-violet-100 hover:border-violet-300 rounded-lg mb-4 transition-all"
  >
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

// 🆕 v9 — Sección Maestro de Actualización de Datos (solo admin)
// 🆕 v11 — Componente presentacional: recibe data/loading/error/lastFetch desde Dashboard
// El fetch lo maneja el Dashboard (solo en mount inicial y al apretar "Actualizar todos")
function MaestroActualizacionSection({ data, loading, error, lastFetch, onRetry }) {

  // Identifica las columnas dinámicamente y clasifica
  const stats = useMemo(() => {
    if (!data?.filas || data.filas.length === 0) return null;
    const filas = data.filas;
    const headers = Object.keys(filas[0]);

    // Detecta pares "fuente / Estado fuente" automáticamente
    const fuentes = [];
    headers.forEach(h => {
      if (h.toLowerCase().startsWith('estado ')) {
        const fuenteName = h.replace(/^estado\s+/i, '').trim();
        const fuenteHeader = headers.find(x => x.toLowerCase() === fuenteName.toLowerCase());
        if (fuenteHeader) fuentes.push({ nombre: fuenteName, fechaCol: fuenteHeader, estadoCol: h });
      }
    });

    // Conteo de estados por fuente
    const conteos = fuentes.map(f => {
      const estados = { ok: 0, alerta: 0, sinData: 0, total: 0 };
      filas.forEach(fila => {
        const e = String(fila[f.estadoCol] || '').toLowerCase();
        if (!e || e === '—' || e === '-') { /* sin fuente configurada */ return; }
        estados.total++;
        if (e.includes('ok') || e.includes('✅')) estados.ok++;
        else if (e.includes('sin data') || e.includes('sin')) estados.sinData++;
        else if (e.includes('⚠') || /\d+d/.test(e)) estados.alerta++;
        else estados.alerta++;
      });
      return { ...f, ...estados };
    });

    // Total global
    const totalFuentesConfiguradas = conteos.reduce((s, c) => s + c.total, 0);
    const totalOK = conteos.reduce((s, c) => s + c.ok, 0);
    const totalAlertas = conteos.reduce((s, c) => s + c.alerta, 0);
    const totalSinData = conteos.reduce((s, c) => s + c.sinData, 0);

    // Última revisión global
    const ultimaRevisionCol = headers.find(h => h.toLowerCase().includes('última revisión') || h.toLowerCase().includes('ultima revision'));
    let ultimaRevision = null;
    if (ultimaRevisionCol) {
      const fechas = filas.map(f => f[ultimaRevisionCol]).filter(Boolean).sort();
      ultimaRevision = fechas[fechas.length - 1];
    }

    return { headers, fuentes, conteos, totalFuentesConfiguradas, totalOK, totalAlertas, totalSinData, ultimaRevision, totalClientes: filas.length };
  }, [data]);

  // Renderiza el badge de estado correctamente
  const renderEstadoBadge = (valor) => {
    const v = String(valor || '').trim();
    if (!v || v === '—' || v === '-') return <span className="text-slate-300">—</span>;
    const lower = v.toLowerCase();
    if (lower.includes('ok')) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✅ OK</span>;
    }
    if (lower.includes('sin data')) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">⚠️ Sin data</span>;
    }
    if (/\d+d/.test(lower) || lower.includes('⚠')) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚠️ {v.replace(/⚠️?/g, '').trim()}</span>;
    }
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">❌ {v}</span>;
  };

  const renderFecha = (valor) => {
    const v = String(valor || '').trim();
    if (!v || v === '—' || v === '-') return <span className="text-slate-300">—</span>;
    return <span className="font-mono text-[11px] text-slate-700">{v}</span>;
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-violet-100 shadow-sm text-center">
        <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: GORUTY.primary }} />
        <p className="text-sm text-slate-500">Cargando maestro de actualización...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-rose-800 mb-1">Error al cargar el maestro</h3>
          <p className="text-xs text-rose-700">{error}</p>
          <button onClick={onRetry} className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-white border border-rose-300 text-rose-700 font-medium hover:bg-rose-100">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data?.disponible || !stats) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-800">
        Sin datos disponibles en el sheet maestro.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tabla detalle */}
      <div className="bg-white rounded-2xl p-5 border border-violet-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><Activity className="w-4 h-4" style={{ color: GORUTY.primary }} /> Detalle por Cliente</h3>
            <p className="text-xs text-slate-500">{stats.totalClientes} clientes · estado actual de cada fuente</p>
          </div>
          {lastFetch && (
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              {loading && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: GORUTY.primary }} />}
              <span>Cargado: {lastFetch.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b border-violet-100">
              {stats.headers.map((h, i) => {
                const isEstado = h.toLowerCase().startsWith('estado ');
                const isFecha = stats.fuentes.some(f => f.fechaCol === h);
                const align = (isEstado || isFecha) ? 'text-center' : 'text-left';
                return <th key={i} className={`py-2 px-3 font-semibold ${align}`}>{h}</th>;
              })}
            </tr></thead>
            <tbody>
              {data.filas.map((fila, i) => (
                <tr key={i} className="border-b border-violet-50 hover:bg-violet-50/50">
                  {stats.headers.map((h, j) => {
                    const valor = fila[h];
                    const isEstado = h.toLowerCase().startsWith('estado ');
                    const isFecha = stats.fuentes.some(f => f.fechaCol === h);
                    const isUltima = h.toLowerCase().includes('última') || h.toLowerCase().includes('ultima');
                    if (j === 0) {
                      return <td key={j} className="py-2.5 px-3 text-slate-800 font-semibold">{valor || '—'}</td>;
                    }
                    if (isEstado) {
                      return <td key={j} className="py-2.5 px-3 text-center">{renderEstadoBadge(valor)}</td>;
                    }
                    if (isFecha) {
                      return <td key={j} className="py-2.5 px-3 text-center">{renderFecha(valor)}</td>;
                    }
                    if (isUltima) {
                      return <td key={j} className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{valor || '—'}</td>;
                    }
                    return <td key={j} className="py-2.5 px-3 text-slate-600">{valor}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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

  // 🆕 v11 — State del Maestro de Actualización (vive en Dashboard, no se desmonta)
  const [maestroData, setMaestroData] = useState(null);
  const [maestroLoading, setMaestroLoading] = useState(false);
  const [maestroError, setMaestroError] = useState(null);
  const [maestroLastFetch, setMaestroLastFetch] = useState(null);

  const fetchMaestro = async () => {
    if (!isAdmin) return;
    setMaestroLoading(true); setMaestroError(null);
    try {
      const url = `${API_URL}?action=maestroData&token=${encodeURIComponent(session.token)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.error) throw new Error(json.error);
      setMaestroData(json);
      setMaestroLastFetch(new Date());
    } catch (err) {
      setMaestroError(err.message || 'Error al cargar el maestro');
    } finally {
      setMaestroLoading(false);
    }
  };

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
      // 🆕 v11 — Refrescar maestro junto con clientes (no esperamos su resultado para mostrar el resto)
      if (isAdmin) fetchMaestro();
      if (errores.length === 0) { setRefreshSuccess(true); setTimeout(() => setRefreshSuccess(false), 4000); }
      else if (errores.length < clientesACargar.length) { setRefreshSuccess(true); setRefreshError(`Algunos errores: ${errores.join(' · ')}`); setTimeout(() => setRefreshSuccess(false), 4000); setTimeout(() => setRefreshError(null), 6000); }
      else { setRefreshError(`No se cargaron clientes: ${errores[0]}`); setTimeout(() => setRefreshError(null), 6000); }
    } catch (error) { setRefreshError(error.message || 'Error al conectar'); setTimeout(() => setRefreshError(null), 5000); }
    finally { setIsRefreshing(false); setRefreshProgress({ current: 0, total: 0, clientName: '' }); }
  };

  useEffect(() => { if (Object.keys(clientCache).length === 0) handleRefresh(); /* eslint-disable-next-line */ }, []);

  const [sections, setSections] = useState({
    aiChat: false, maestroData: false, funnel: false, seo: false, paidMedia: false,
    acquisition: false, audience: false, behavior: false, engagement: false, events: false, advanced: false,
  });

  const toggleSection = useCallback((key) => setSections(prev => ({ ...prev, [key]: !prev[key] })), []);
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
                <h1 className="text-2xl font-bold text-slate-900">Grouty Marketing Agent</h1>
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
                          {client.agentHabilitado && <span className="text-[10px] font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded" title="Grouty Agent habilitado para este cliente">✨ Agent</span>}
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
            <p className="text-sm text-slate-500">Estamos obteniendo los datos de la nube de Grouty</p>
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

            {isAdmin && (
              <div className="mb-6">
                <SectionHeader title="Estado de Actualización de Datos" subtitle="Seguimiento maestro de fuentes (GA4, GSC, Google Ads) por cliente" icon={Activity} sectionKey="maestroData" badge="🔒 Admin" sections={sections} toggleSection={toggleSection} />
                {sections.maestroData && (<MaestroActualizacionSection data={maestroData} loading={maestroLoading} error={maestroError} lastFetch={maestroLastFetch} onRetry={fetchMaestro} />)}
              </div>
            )}

            {(isAdmin || currentClient?.agentHabilitado) && (
              <div className="mb-6">
                <SectionHeader title="Grouty Agent" subtitle="Pregunta lo que quieras sobre los datos del cliente" icon={MessageSquare} sectionKey="aiChat" badge={isAdmin ? '🔒 Admin' : '✨ Habilitado'} sections={sections} toggleSection={toggleSection} />
                {sections.aiChat && (<AIChatPanel liveData={liveData} kpis={kpis} currentClient={currentClient} dateRange={dateRange} daysCount={daysCount} trendData={trendData} session={session} />)}
              </div>
            )}

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

            <SectionHeader title="Funnel de Conversión" subtitle="Recorrido del usuario desde sesión hasta compra" icon={Target} sectionKey="funnel" badge="🎯 Nuevo" sections={sections} toggleSection={toggleSection} />
            {sections.funnel && (
              <div className="mb-6">
                <ConversionFunnel liveData={liveData} kpis={kpis} dateFilter={dateFilter} currentClient={currentClient} dateRange={dateRange} trendData={trendData} />
              </div>
            )}

            <SectionHeader title="Paid Media" subtitle="Performance de campañas pagadas — Google Ads, Meta, LinkedIn" icon={Megaphone} sectionKey="paidMedia" badge={liveData?.googleAds?.disponible ? '📢 Ads' : '🔜 Pronto'} sections={sections} toggleSection={toggleSection} />
            {sections.paidMedia && (
              <div className="mb-6">
                <PaidMediaSection liveData={liveData} currentClient={currentClient} dateFilter={dateFilter} dateRange={dateRange} />
              </div>
            )}

            <SectionHeader title="SEO Orgánico" subtitle="Datos de Google Search Console — keywords, posiciones y oportunidades" icon={Globe} sectionKey="seo" badge={liveData?.seo?.disponible ? '🔍 GSC' : '🔜 Pronto'} sections={sections} toggleSection={toggleSection} />
            {sections.seo && (
              <div className="mb-6">
                <SEOSection liveData={liveData} currentClient={currentClient} dateFilter={dateFilter} dateRange={dateRange} />
              </div>
            )}

            <SectionHeader title="Adquisición" subtitle="Canales y fuentes" icon={TrendingUp} sectionKey="acquisition" sections={sections} toggleSection={toggleSection} />
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

            <SectionHeader title="Audiencia" subtitle="Ubicación y dispositivos" icon={Globe} sectionKey="audience" sections={sections} toggleSection={toggleSection} />
            {sections.audience && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {paisesData.length > 0 && (<Panel title="Usuarios por País" className="lg:col-span-2"><ResponsiveContainer width="100%" height={260}><BarChart data={paisesData}><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis dataKey="pais" stroke="#64748b" style={{ fontSize: 10 }} angle={-15} textAnchor="end" height={70} /><YAxis stroke="#94a3b8" style={{ fontSize: 11 }} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.primary} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {dispositivosData.length > 0 && (<Panel title="Dispositivos"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={dispositivosData} dataKey="usuarios" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={(e) => e.tipo}>{dispositivosData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart></ResponsiveContainer></Panel>)}
                {ciudadesData.length > 0 && (<Panel title="Top Ciudades"><ResponsiveContainer width="100%" height={240}><BarChart data={ciudadesData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} /><YAxis type="category" dataKey="ciudad" stroke="#64748b" style={{ fontSize: 11 }} width={100} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.secondary} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {osData.length > 0 && (<Panel title="Sistema Operativo"><ResponsiveContainer width="100%" height={240}><BarChart data={osData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" /><XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} /><YAxis type="category" dataKey="os" stroke="#64748b" style={{ fontSize: 11 }} width={90} /><Tooltip {...tooltipStyle} /><Bar dataKey="usuarios" fill={GORUTY.tertiary} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></Panel>)}
                {navegadoresData.length > 0 && (<Panel title="Navegadores"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={navegadoresData} dataKey="usuarios" nameKey="navegador" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.navegador} (${e.porcentaje}%)`} style={{ fontSize: 9 }}>{navegadoresData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}</Pie><Tooltip {...tooltipStyle} /></PieChart></ResponsiveContainer></Panel>)}
              </div>
            )}

            <SectionHeader title="Comportamiento" subtitle="Páginas más vistas" icon={Eye} sectionKey="behavior" sections={sections} toggleSection={toggleSection} />
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

            <SectionHeader title="Eventos" subtitle="Conteo de eventos" icon={MousePointer} sectionKey="events" sections={sections} toggleSection={toggleSection} />
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
              <span>Grouty Marketing Agent · {currentClient?.nombre} · Powered by Grouty · 🔐 Acceso autenticado</span>
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
