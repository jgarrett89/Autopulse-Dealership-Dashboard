import {
  Award,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Flame,
  PieChart as PieIcon,
  Tag,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { StandingChartsData } from '../types/dealership.js';

interface StandingChartsProps {
  data: StandingChartsData;
  isLoading?: boolean;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#151518] border border-[#27272A] rounded-[3px] p-2 text-xs font-mono text-[#D1D5DB]">
        <p className="font-bold text-white mb-1">{label || payload[0]?.payload?.vehicle || ''}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.2">
            <span className="flex items-center gap-1.5 text-[#71717A]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
              {entry.name || entry.dataKey}:
            </span>
            <span className="font-bold text-white">
              {typeof entry.value === 'number'
                ? entry.value >= 1000
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ScatterCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#151518] border border-[#27272A] rounded-[3px] p-2 text-xs font-mono text-[#D1D5DB] min-w-[180px]">
        <p className="font-bold text-white mb-1 text-xs">{data.vehicle}</p>
        <div className="space-y-0.5 pt-1 border-t border-[#27272A]">
          <div className="flex justify-between">
            <span className="text-[#71717A]">Days on Lot:</span>
            <span className={`font-bold ${data.daysOnLot >= 90 ? 'text-[#EF4444]' : data.daysOnLot >= 45 ? 'text-[#FBBF24]' : 'text-[#4ADE80]'}`}>
              {data.daysOnLot} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">List Price:</span>
            <span className="font-bold text-white">${data.listPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Suggested:</span>
            <span className="font-bold text-[#4ADE80]">${data.suggestedPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#71717A]">Margin:</span>
            <span className="font-bold text-[#3B82F6]">${data.margin.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const StandingCharts: React.FC<StandingChartsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-[4px] bg-[#151518] border border-[#27272A] animate-pulse"></div>
        ))}
      </div>
    );
  }

  const {
    salesByMonth,
    agingBuckets,
    unitsByMake,
    priceVsDaysScatter,
    leadFunnel,
    repLeaderboard,
  } = data;

  return (
    <section className="mb-4" aria-label="Dealership Standing Analytics">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-[#3B82F6]" />
          Core Operations & Standing Analytics
        </h2>
        <span className="text-[10px] font-mono text-[#71717A]">
          6 Diagnostic Clusters
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* CHART 1: Sales and units by month (Area Chart) */}
        <div
          id="chart-sales-by-month"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#3B82F6]" />
                Sales & Units by Month
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">Revenue & Margin Trend</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-blue-500/10 text-[#3B82F6] border border-blue-500/30">
              Area
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByMonth} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="month" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis
                  stroke="#71717A"
                  tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(val) => <span className="text-[#D1D5DB]">{val}</span>}
                />
                <Area
                  type="monotone"
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fill="url(#revenueGrad)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  name="Gross"
                  dataKey="gross"
                  stroke="#4ADE80"
                  fill="url(#grossGrad)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Inventory aging by bucket (Bar Chart, 90+ in amber) */}
        <div
          id="chart-inventory-aging"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#FBBF24]" />
                Inventory Aging
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">90+ in Amber</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-amber-500/10 text-[#FBBF24] border border-amber-500/30">
              Buckets
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingBuckets} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="bucket" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" name="Vehicles" radius={[2, 2, 0, 0]}>
                  {agingBuckets.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isAmber ? '#FBBF24' : entry.bucket === '61-90' ? '#818CF8' : '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Units by make (Bar Chart) */}
        <div
          id="chart-units-by-make"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#3B82F6]" />
                Units by Make
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">Brand Distribution</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-blue-500/10 text-[#3B82F6] border border-blue-500/30">
              Makes
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={unitsByMake.slice(0, 7)}
                layout="vertical"
                margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis type="number" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis
                  type="category"
                  dataKey="make"
                  stroke="#71717A"
                  tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  width={55}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" name="Units" fill="#3B82F6" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 4: List price vs days on lot (Scatter) */}
        <div
          id="chart-price-vs-days"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Target className="w-3 h-3 text-[#4ADE80]" />
                List Price vs Days on Lot
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">Velocity Sweet Spot (45d)</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-emerald-500/10 text-[#4ADE80] border border-emerald-500/30">
              Scatter
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                  type="number"
                  dataKey="daysOnLot"
                  name="Days on Lot"
                  stroke="#71717A"
                  tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  domain={[0, 'dataMax + 10']}
                />
                <YAxis
                  type="number"
                  dataKey="listPrice"
                  name="Price"
                  stroke="#71717A"
                  tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <ReferenceLine x={45} stroke="#FBBF24" strokeDasharray="3 3" label={{ value: '45d', fill: '#FBBF24', fontSize: 8, position: 'insideTopRight' }} />
                <Tooltip content={<ScatterCustomTooltip />} />
                <Scatter name="Inventory Units" data={priceVsDaysScatter}>
                  {priceVsDaysScatter.map((entry, index) => {
                    const color =
                      entry.daysOnLot >= 90
                        ? '#EF4444'
                        : entry.daysOnLot >= 60
                        ? '#FBBF24'
                        : entry.daysOnLot >= 45
                        ? '#FBBF24'
                        : '#4ADE80';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Lead funnel by stage (Bar Chart) */}
        <div
          id="chart-lead-funnel"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-[#3B82F6]" />
                Lead Funnel
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">Stage Progression</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-blue-500/10 text-[#3B82F6] border border-blue-500/30">
              Pipeline
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadFunnel} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="stage" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="count" name="Deals" radius={[2, 2, 0, 0]}>
                  {leadFunnel.map((entry, index) => {
                    const fill =
                      entry.stage === 'Won'
                        ? '#4ADE80'
                        : entry.stage === 'Lost'
                        ? '#71717A'
                        : entry.stage === 'Negotiation'
                        ? '#3B82F6'
                        : '#60A5FA';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 6: Salesperson leaderboard by gross (Table) */}
        <div
          id="chart-rep-leaderboard"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3 flex flex-col justify-between shadow-none"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                <Trophy className="w-3 h-3 text-[#FBBF24]" />
                Rep Leaderboard
              </h3>
              <p className="text-[9px] text-[#71717A] font-mono">Gross Delivered</p>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded-[2px] bg-amber-500/10 text-[#FBBF24] border border-amber-500/30">
              Rankings
            </span>
          </div>

          <div className="overflow-x-auto max-h-48">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0A0A0B] text-[#71717A] font-mono uppercase tracking-wider text-[9px] sticky top-0 border-b border-[#27272A]">
                <tr>
                  <th className="px-2 py-1">Rep</th>
                  <th className="px-1.5 py-1 text-center">Units</th>
                  <th className="px-1.5 py-1 text-right">Gross</th>
                  <th className="px-1.5 py-1 text-right">Win%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono text-[10px]">
                {repLeaderboard.map((rep, idx) => (
                  <tr key={rep.rep} className="hover:bg-[#0A0A0B] transition-colors">
                    <td className="px-2 py-1.5 text-[#D1D5DB] flex items-center gap-1">
                      <span
                        className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center text-[8px] font-mono font-bold ${
                          idx === 0
                            ? 'bg-[#FBBF24] text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-[#27272A] text-[#71717A]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[85px]">{rep.rep}</span>
                    </td>
                    <td className="px-1.5 py-1.5 text-center text-[#D1D5DB] font-bold">
                      {rep.unitsSold}
                    </td>
                    <td className="px-1.5 py-1.5 text-right font-bold text-[#4ADE80]">
                      ${rep.grossProfit.toLocaleString()}
                    </td>
                    <td className="px-1.5 py-1.5 text-right text-[#3B82F6]">
                      {rep.winRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
