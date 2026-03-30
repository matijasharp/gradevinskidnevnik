import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, FileText, Clock, Briefcase, Zap, Folder, ChevronRight } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import { cn } from '../../../lib/utils';
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
  const [dateRange, setDateRange] = useState<'30d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const brandColor = company?.brandColor || '#3b82f6';

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
    const materials: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.lineItems?.forEach(item => {
        materials[item.name] = (materials[item.name] || 0) + item.quantity;
      });
    });

    const topMaterials = Object.entries(materials)
      .map(([name, qty]) => ({ name, qty }))
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(brandColor);
    doc.text('Izvještaj o radovima', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generirano: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 30);
    doc.text(`Razdoblje: ${dateRange}`, 14, 35);

    // Stats
    doc.setDrawColor(230);
    doc.line(14, 40, pageWidth - 14, 40);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Ukupno sati: ${stats.totalHours}h`, 14, 50);
    doc.text(`Broj unosa: ${filteredEntries.length}`, 14, 57);
    doc.text(`Aktivni projekti: ${projects.filter(p => p.status === 'active').length}`, 14, 64);

    // Table
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
      startY: 75,
      head: [['Datum', 'Projekt', 'Tip rada', 'Sati', 'Status', 'Vrijeme']],
      body: tableData,
      headStyles: { fillColor: brandColor },
      theme: 'striped'
    });

    doc.save(`izvjestaj_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Izvještaji</h1>
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

      <div className="flex flex-wrap items-center gap-3 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 w-fit">
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
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              dateRange === opt.id ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
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
          <p className="text-3xl font-bold text-primary">{stats.totalHours}h</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Briefcase size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Aktivni projekti</p>
          <p className="text-3xl font-bold text-primary">{projects.filter(p => p.status === 'active').length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '80' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Broj unosa</p>
          <p className="text-3xl font-bold text-primary">{filteredEntries.length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '40' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Zap size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Prosjek sati/unos</p>
          <p className="text-3xl font-bold text-primary">{stats.avgHoursPerEntry}h</p>
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
          <div className="h-[300px] w-full">
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
          <div className="h-[200px] w-full relative">
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
                  <span className="font-bold">{m.qty} kom</span>
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
            <Button variant="ghost" size="sm" className="text-xs font-bold" style={{ color: brandColor }}>
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
                    <tr key={p.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-primary group-hover:translate-x-1 transition-transform">{p.projectName}</div>
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
                      <td className="py-4 text-right font-bold text-primary">
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
