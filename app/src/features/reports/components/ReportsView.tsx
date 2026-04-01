import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Clock, Briefcase, Zap, Folder, ChevronRight } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import { cn } from '../../../lib/utils';
import { ROUTES } from '../../../app/router/routeConfig';
import type { Project, DiaryEntry, Company } from '../../../shared/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  parseISO,
  subDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export default function ReportsView({ projects, entries, company }: { projects: Project[], entries: DiaryEntry[], company: Company | null }) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'30d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const brandColor = company?.brandColor || 'var(--color-accent)';

  const filteredEntries = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (dateRange) {
      case 'thisMonth':
        start = startOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = startOfDay(parseISO(customStart));
          end = endOfDay(parseISO(customEnd));
        } else {
          start = subDays(now, 30);
        }
        break;
      case '30d':
      default:
        start = subDays(now, 30);
        break;
    }

    return entries.filter(e => {
      const d = parseISO(e.entryDate);
      return d >= start && d <= end;
    }).sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [entries, dateRange, customStart, customEnd]);

  const stats = useMemo(() => {
    const totalHours = filteredEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const totalWorkers = filteredEntries.reduce((acc, curr) => acc + curr.workersCount, 0);
    const avgHoursPerEntry = filteredEntries.length > 0 ? (totalHours / filteredEntries.length).toFixed(1) : 0;

    const statusData = filteredEntries.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusData).map(([name, value]) => ({ name, value: value as number }));

    // Prepare data for bar chart (hours per day)
    const dailyHours: Record<string, number> = {};
    filteredEntries.forEach(e => {
      dailyHours[e.entryDate] = (dailyHours[e.entryDate] || 0) + e.hours;
    });

    const barData = Object.entries(dailyHours)
      .map(([date, hours]) => ({ date: format(parseISO(date), 'dd.MM.'), hours, fullDate: date }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-14); // Last 14 days of data in range

    // Material analytics
    const materials: Record<string, { qty: number; unit: string }> = {};
    filteredEntries.forEach(e => {
      e.lineItems?.forEach(item => {
        if (!materials[item.name]) {
          materials[item.name] = { qty: 0, unit: item.unit || 'kom' };
        }
        materials[item.name].qty += item.quantity;
      });
    });

    const topMaterials = Object.entries(materials)
      .map(([name, { qty, unit }]) => ({ name, qty, unit }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalHours, totalWorkers, avgHoursPerEntry, pieData, barData, topMaterials, statusData };
  }, [filteredEntries]);

  const COLORS = ['#16a34a', '#0ea5e9', '#ea580c', '#dc2626', '#9333ea'];

  const exportToCSV = () => {
    const headers = ['Datum', 'Projekt', 'Tip rada', 'Sati', 'Radnici', 'Status', 'Vrijeme', 'Temperatura'];
    const rows = filteredEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      return [
        e.entryDate,
        project?.projectName || 'Nepoznato',
        e.workType,
        e.hours,
        e.workersCount,
        e.status,
        e.weatherCondition || '',
        e.temperature || 0
      ];
    });

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `izvjestaj_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();

    // Resolve brand color to hex (CSS vars cannot be passed to jsPDF)
    const resolvedBrandColor = (company?.brandColor && !company.brandColor.startsWith('var('))
      ? company.brandColor
      : '#3ab9e3';
    const hexToRgb = (hex: string) => {
      const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] as [number, number, number] : [58, 185, 227] as [number, number, number];
    };
    const [br, bg, bb] = hexToRgb(resolvedBrandColor);

    // Load Roboto font for Croatian characters
    try {
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
      const response = await fetch(fontUrl);
      const fontBuffer = await response.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(fontBuffer);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const fontBase64 = window.btoa(binary);
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    } catch (_e) {
      doc.setFont('helvetica');
    }

    // Header
    doc.setFontSize(20);
    doc.setTextColor(br, bg, bb);
    doc.text(company?.name || 'Građevinski Dnevnik Online', 14, 22);

    const rangeLabel: Record<string, string> = {
      '30d': 'Zadnjih 30 dana',
      'thisMonth': 'Ovaj mjesec',
      'lastMonth': 'Prošli mjesec',
      'thisYear': 'Ova godina',
      'custom': customStart && customEnd ? `${customStart} – ${customEnd}` : 'Prilagođeno'
    };

    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Razdoblje: ${rangeLabel[dateRange] || dateRange}`, 14, 29);
    doc.text(`Generirano: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 34);

    // Summary stats box
    doc.setFillColor(248, 249, 250);
    doc.rect(14, 38, 182, 28, 'F');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Ukupno sati: ${stats.totalHours}h`, 20, 47);
    doc.text(`Broj unosa: ${filteredEntries.length}`, 20, 55);
    doc.text(`Aktivni projekti: ${projects.filter(p => p.status === 'active').length}`, 105, 47);
    doc.text(`Prosjek sati/unos: ${stats.avgHoursPerEntry}h`, 105, 55);

    let currentY = 75;

    // Drawn bar chart — hours per day (last 14 data points)
    if (stats.barData.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Trend radnih sati (zadnjih 14 unosa)', 14, currentY);
      currentY += 5;

      const chartX = 14;
      const chartY = currentY;
      const chartW = 182;
      const chartH = 40;
      const maxHours = Math.max(...stats.barData.map(d => d.hours), 1);
      const barCount = stats.barData.length;
      const barGap = 2;
      const barW = barCount > 0 ? Math.floor((chartW - barGap * (barCount - 1)) / barCount) : 10;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

      doc.setFillColor(br, bg, bb);
      stats.barData.forEach((d, i) => {
        const barH = Math.max(2, Math.round((d.hours / maxHours) * chartH));
        const bx = chartX + i * (barW + barGap);
        const by = chartY + chartH - barH;
        doc.rect(bx, by, barW, barH, 'F');
      });

      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      stats.barData.forEach((d, i) => {
        if (i % 3 === 0) {
          const bx = chartX + i * (barW + barGap);
          doc.text(d.date, bx, chartY + chartH + 5);
        }
      });

      currentY = chartY + chartH + 12;
    }

    // Project breakdown table
    const projectBreakdown = projects.map(p => {
      const pEntries = filteredEntries.filter(e => e.projectId === p.id);
      const pHours = pEntries.reduce((a, c) => a + c.hours, 0);
      const lastE = [...pEntries].sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0];
      return [
        p.projectName,
        p.clientName || '-',
        pEntries.length.toString(),
        `${pHours}h`,
        lastE ? format(parseISO(lastE.entryDate), 'dd.MM.yyyy') : '-'
      ];
    }).filter(row => parseInt(row[2]) > 0);

    if (projectBreakdown.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Projekt', 'Klijent', 'Unosa', 'Sati', 'Zadnji unos']],
        body: projectBreakdown,
        headStyles: { fillColor: [br, bg, bb] as [number, number, number] },
        theme: 'striped',
        styles: { font: 'Roboto', fontSize: 8 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Materials table (top 10)
    const materialsData = Object.entries(
      filteredEntries.flatMap(e => e.lineItems || []).reduce((acc: Record<string, { qty: number; unit: string }>, item) => {
        if (!acc[item.name]) acc[item.name] = { qty: 0, unit: item.unit || 'kom' };
        acc[item.name].qty += item.quantity;
        return acc;
      }, {})
    ).sort(([, a], [, b]) => b.qty - a.qty).slice(0, 10)
      .map(([name, { qty, unit }]) => [name, `${qty} ${unit}`]);

    if (materialsData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Materijal', 'Količina']],
        body: materialsData,
        headStyles: { fillColor: [br, bg, bb] as [number, number, number] },
        theme: 'striped',
        styles: { font: 'Roboto', fontSize: 8 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Entries table
    const tableData = filteredEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      return [
        format(parseISO(e.entryDate), 'dd.MM.yyyy'),
        project?.projectName || '',
        e.workType,
        e.hours,
        e.status,
        e.weatherCondition ? `${e.weatherCondition} (${e.temperature}°C)` : '-'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Datum', 'Projekt', 'Tip rada', 'Sati', 'Status', 'Vrijeme']],
      body: tableData,
      headStyles: { fillColor: [br, bg, bb] as [number, number, number] },
      theme: 'striped',
      styles: { font: 'Roboto', fontSize: 8 },
    });

    // Footer on each page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(`Stranica ${i} od ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`izvjestaj_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Izvještaji</h1>
          <p className="text-zinc-500">Analitika i pregled poslovanja u realnom vremenu.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold gap-2"
            onClick={exportToCSV}
          >
            <Download size={14} /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-bold gap-2"
            onClick={exportToPDF}
          >
            <FileText size={14} /> PDF
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 bg-zinc-100 p-1.5 rounded border border-zinc-200 w-fit">
        {[
          { id: '30d', label: 'Zadnjih 30 dana' },
          { id: 'thisMonth', label: 'Ovaj mjesec' },
          { id: 'lastMonth', label: 'Prošli mjesec' },
          { id: 'thisYear', label: 'Ova godina' },
          { id: 'custom', label: 'Prilagođeno' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setDateRange(opt.id as any)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded transition-all",
              dateRange === opt.id ? "bg-white text-text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
            style={dateRange === opt.id ? { color: brandColor } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {dateRange === 'custom' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Od:</span>
            <input
              type="date"
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Do:</span>
            <input
              type="date"
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ukupno sati</p>
          <p className="text-3xl font-bold text-text-primary">{stats.totalHours}h</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Briefcase size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Aktivni projekti</p>
          <p className="text-3xl font-bold text-text-primary">{projects.filter(p => p.status === 'active').length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '80' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Broj unosa</p>
          <p className="text-3xl font-bold text-text-primary">{filteredEntries.length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '40' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Zap size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Prosjek sati/unos</p>
          <p className="text-3xl font-bold text-text-primary">{stats.avgHoursPerEntry}h</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '20' }}></div>
        </Card>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Hours per day */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Trend radnih sati</h3>
            <p className="text-xs text-zinc-400 font-medium">Zadnjih 14 unosa u razdoblju</p>
          </div>
          <div className="h-[300px] w-full overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  cursor={{ fill: brandColor + '08' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar
                  dataKey="hours"
                  fill={brandColor}
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6 space-y-6">
          <h3 className="font-bold text-lg">Statusi radova</h3>
          <div className="h-[200px] w-full relative overflow-hidden">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{filteredEntries.length}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Ukupno</span>
            </div>
          </div>
          <div className="space-y-2">
            {stats.pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-zinc-600 capitalize">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Material Usage */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Korišteni materijal</h3>
            <div className="p-2 bg-zinc-50 rounded-lg">
              <Folder size={18} className="text-zinc-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.topMaterials.map((m, i) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-700 truncate max-w-[180px]">{m.name}</span>
                  <span className="font-bold">{m.qty} {m.unit}</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(m.qty / stats.topMaterials[0].qty) * 100}%`,
                      backgroundColor: brandColor
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.topMaterials.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-zinc-400 italic">Nema zabilježenog materijala u ovom razdoblju.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Projects Activity */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Zadnja aktivnost po projektima</h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold" style={{ color: brandColor }} onClick={() => navigate(ROUTES.PROJECTS)}>
              Vidi sve <ChevronRight size={14} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-100">
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Projekt</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Zadnji unos</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Status</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest text-right">Sati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {projects.slice(0, 5).map(p => {
                  const projectEntries = entries.filter(e => e.projectId === p.id);
                  const lastEntry = projectEntries.sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0];
                  const projectHours = projectEntries.reduce((acc, curr) => acc + curr.hours, 0);

                  return (
                    <tr key={p.id} className="group hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="py-4">
                        <div className="font-bold text-text-primary group-hover:translate-x-1 transition-transform">{p.projectName}</div>
                        <div className="text-[10px] text-zinc-400">{p.clientName}</div>
                      </td>
                      <td className="py-4 text-zinc-500">
                        {lastEntry ? format(parseISO(lastEntry.entryDate), 'dd.MM.yyyy') : 'Nema unosa'}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          p.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        )}>
                          {p.status === 'active' ? 'Aktivan' : 'Završen'}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-text-primary">
                        {projectHours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
