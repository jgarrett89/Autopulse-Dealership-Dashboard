import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  DollarSign,
  Info,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PipelineForecastResult } from '../types/dealership.js';

interface ForecastPipelineProps {
  forecast: PipelineForecastResult;
  isLoading?: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  New: '#60A5FA', // Light blue
  Contacted: '#3B82F6', // Blue
  'Test Drive': '#2563EB', // Indigo blue
  Negotiation: '#1D4ED8', // Deep blue
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0B0F19] border border-[#232F47] rounded-lg p-3 shadow-xl text-xs font-mono text-slate-200">
        <p className="font-bold text-white mb-1.5">{label} Stage</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Deals:</span>
            <span className="font-bold text-white">{data.dealCount} active</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Unweighted Pipeline:</span>
            <span className="font-bold text-slate-200">${data.totalOpportunity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-blue-400">
            <span>Close Probability:</span>
            <span className="font-bold">{(data.closeRate * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-400 pt-1 border-t border-[#1F2B42]">
            <span>Weighted Forecast:</span>
            <span className="font-bold">${Math.round(data.weightedRevenue).toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ForecastPipeline: React.FC<ForecastPipelineProps> = ({ forecast, isLoading }) => {
  if (isLoading || !forecast) {
    return (
      <div className="h-96 rounded-[4px] bg-[#151518] border border-[#27272A] animate-pulse p-4"></div>
    );
  }

  const chartData = forecast.stages.map((s) => ({
    stage: s.stage,
    weightedRevenue: Math.round(s.weightedRevenue),
    totalOpportunity: s.totalOpportunity,
    dealCount: s.dealCount,
    closeRate: s.closeRate,
  }));

  return (
    <div
      id="forecast-pipeline-panel"
      className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3.5 shadow-none flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-2">
                FORECAST 1 — PIPELINE-WEIGHTED REVENUE
              </h2>
              <p className="text-[10px] text-[#71717A] font-mono">
                Probability-adjusted stage close rates applied to open deal values
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-blue-500/10 text-[#3B82F6] border border-blue-500/30 uppercase">
            Live
          </span>
        </div>

        {/* 3 Core Figures */}
        <div className="grid grid-cols-3 gap-2 my-2.5">
          {/* Figure 1: Weighted (open) */}
          <div className="bg-[#0A0A0B] rounded-[3px] p-2 border border-[#27272A]">
            <span className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider block mb-0.5">
              Weighted (Open)
            </span>
            <span className="text-base font-bold font-mono text-[#3B82F6]">
              ${Math.round(forecast.weightedOpen).toLocaleString()}
            </span>
            <span className="text-[9px] text-[#71717A] font-mono block mt-0.5">Expected value</span>
          </div>

          {/* Figure 2: Booked (Won) */}
          <div className="bg-[#0A0A0B] rounded-[3px] p-2 border border-[#27272A]">
            <span className="text-[9px] font-mono text-[#71717A] uppercase tracking-wider block mb-0.5">
              Booked (Won MTD)
            </span>
            <span className="text-base font-bold font-mono text-[#4ADE80]">
              ${Math.round(forecast.bookedWon).toLocaleString()}
            </span>
            <span className="text-[9px] text-[#71717A] font-mono block mt-0.5">Realized sales</span>
          </div>

          {/* Figure 3: Projected total (booked + weighted open) */}
          <div className="bg-[#0A0A0B] rounded-[3px] p-2 border border-[#3B82F6]">
            <span className="text-[9px] font-mono text-[#3B82F6] uppercase tracking-wider block mb-0.5 font-semibold">
              Projected Total
            </span>
            <span className="text-base font-bold font-mono text-white">
              ${Math.round(forecast.projectedTotal).toLocaleString()}
            </span>
            <span className="text-[9px] text-[#3B82F6] font-mono block mt-0.5">Booked + Weighted</span>
          </div>
        </div>

        {/* Bar Chart of Weighted Revenue by Stage */}
        <div className="bg-[#0A0A0B] rounded-[3px] p-2 border border-[#27272A] mt-1.5">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-[#71717A]">
            <span>Weighted Revenue by Stage ($)</span>
            <span className="text-[9px] text-[#71717A]">Probability Adjusted</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="stage" stroke="#71717A" tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }} />
                <YAxis
                  stroke="#71717A"
                  tick={{ fill: '#71717A', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="weightedRevenue" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STAGE_COLORS[entry.stage] || '#3B82F6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer Details: Open deal count & Total Open Pipeline Value */}
      <div className="pt-2 mt-2.5 border-t border-[#27272A] flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1 text-[#71717A]">
          <Info className="w-3 h-3 text-[#71717A]" />
          <span>Active Open Deals:</span>
          <span className="text-white font-bold">{forecast.openDealCount}</span>
        </div>
        <div className="flex items-center gap-1 text-[#71717A]">
          <span>Unweighted Value:</span>
          <span className="text-[#D1D5DB] font-bold">
            ${forecast.totalOpenPipelineValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
