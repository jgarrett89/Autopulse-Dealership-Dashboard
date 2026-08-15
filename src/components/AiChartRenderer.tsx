import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { AiAskResponse } from '../types/dealership.js';

interface AiChartRendererProps {
  spec: AiAskResponse;
}

const PALETTE = ['#3B82F6', '#4ADE80', '#FBBF24', '#818CF8', '#F472B6', '#38BDF8'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#151518] border border-[#27272A] rounded-[3px] p-2.5 shadow-2xl text-xs font-mono text-[#D1D5DB]">
        <p className="font-semibold text-white mb-1">{label || payload[0]?.payload?.name || payload[0]?.payload?.vehicle || ''}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 py-0.5">
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

export const AiChartRenderer: React.FC<AiChartRendererProps> = ({ spec }) => {
  const { chartType, data, xKey, yKeys } = spec;

  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-[#71717A] text-xs font-mono">
        No tabular data returned for this query.
      </div>
    );
  }

  // 1. Table
  if (chartType === 'table') {
    const columns = Object.keys(data[0] || {});
    return (
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#0A0A0B] text-[#71717A] font-mono uppercase tracking-wider text-[9px] sticky top-0 border-b border-[#27272A]">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-2.5 py-1.5">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272A] font-mono text-[10px]">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#151518] transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-2.5 py-1.5 text-[#D1D5DB]">
                    {typeof row[col] === 'number'
                      ? col.toLowerCase().includes('price') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('gross') || col.toLowerCase().includes('val')
                        ? `$${row[col].toLocaleString()}`
                        : row[col]
                      : String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. Pie Chart
  if (chartType === 'pie') {
    const pieKey = yKeys[0] || 'value';
    const nameKey = xKey || 'name';
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(val) => <span className="text-[#D1D5DB]">{val}</span>}
            />
            <Pie
              data={data}
              dataKey={pieKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={75}
              innerRadius={40}
              paddingAngle={3}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} stroke="#0A0A0B" strokeWidth={1.5} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 3. Area Chart
  if (chartType === 'area') {
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aiAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="aiAreaGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey={xKey} stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
            <YAxis
              stroke="#71717A"
              tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(val) => <span className="text-[#D1D5DB]">{val}</span>}
            />
            {yKeys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PALETTE[idx % PALETTE.length]}
                fill={`url(#aiAreaGradient${idx === 0 ? '' : '2'})`}
                strokeWidth={1.5}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 4. Line Chart
  if (chartType === 'line') {
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis dataKey={xKey} stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
            <YAxis
              stroke="#71717A"
              tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
              formatter={(val) => <span className="text-[#D1D5DB]">{val}</span>}
            />
            {yKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PALETTE[idx % PALETTE.length]}
                strokeWidth={1.5}
                dot={{ fill: PALETTE[idx % PALETTE.length], r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 5. Scatter Chart
  if (chartType === 'scatter') {
    return (
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis
              type="number"
              dataKey={xKey || 'daysOnLot'}
              name="Days on Lot"
              stroke="#71717A"
              tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            />
            <YAxis
              type="number"
              dataKey={yKeys[0] || 'listPrice'}
              name="Price"
              stroke="#71717A"
              tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <ZAxis type="number" range={[40, 40]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Vehicles" data={data} fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: Bar Chart
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
          <XAxis dataKey={xKey} stroke="#71717A" tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
          <YAxis
            stroke="#71717A"
            tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }}
            formatter={(val) => <span className="text-[#D1D5DB]">{val}</span>}
          />
          {yKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={PALETTE[idx % PALETTE.length]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
