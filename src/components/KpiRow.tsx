import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Car,
  Clock,
  DollarSign,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import { DealershipKpis } from '../types/dealership.js';

interface KpiRowProps {
  kpis?: DealershipKpis;
  isLoading?: boolean;
}

export const KpiRow: React.FC<KpiRowProps> = ({ kpis, isLoading }) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-4">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-[4px] bg-[#151518] border border-[#27272A] animate-pulse p-2.5 flex flex-col justify-between"
          >
            <div className="w-16 h-2.5 bg-[#27272A] rounded-[2px]"></div>
            <div className="w-20 h-5 bg-[#27272A] rounded-[2px]"></div>
            <div className="w-16 h-2 bg-[#27272A] rounded-[2px]"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="mb-4" aria-label="Dealership Live KPIs">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {/* KPI 1: Units on lot */}
        <div
          id="kpi-units-on-lot"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-2.5 flex flex-col justify-between shadow-none relative overflow-hidden transition-all hover:border-[#3F3F46]"
        >
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-mono uppercase tracking-wider">Units on Lot</span>
            <Car className="w-3 h-3 text-[#71717A]" />
          </div>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {kpis.unitsOnLot}
            </span>
            <span className="text-[10px] text-[#71717A] font-mono ml-1">veh</span>
          </div>
          <div className="text-[10px] text-[#4ADE80] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></span>
            Active floor
          </div>
        </div>

        {/* KPI 2: Average days on lot (turn tile amber if > 45) */}
        <div
          id="kpi-avg-days-on-lot"
          className={`rounded-[4px] p-2.5 flex flex-col justify-between relative overflow-hidden transition-all ${
            kpis.avgDaysAmber
              ? 'bg-[#151518] border border-[#FBBF24]'
              : 'bg-[#151518] border border-[#27272A] hover:border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                kpis.avgDaysAmber ? 'text-[#FBBF24] font-semibold' : 'text-[#71717A]'
              }`}
            >
              Avg Days on Lot
            </span>
            <Clock className={`w-3 h-3 ${kpis.avgDaysAmber ? 'text-[#FBBF24]' : 'text-[#71717A]'}`} />
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold font-mono tracking-tight ${
                kpis.avgDaysAmber ? 'text-[#FBBF24]' : 'text-white'
              }`}
            >
              {kpis.avgDaysOnLot}
            </span>
            <span className={`text-[10px] font-mono ml-1 ${kpis.avgDaysAmber ? 'text-[#FBBF24]' : 'text-[#71717A]'}`}>
              days
            </span>
          </div>
          <div
            className={`text-[10px] font-mono flex items-center gap-1 ${
              kpis.avgDaysAmber ? 'text-[#FBBF24]' : 'text-[#71717A]'
            }`}
          >
            {kpis.avgDaysAmber ? (
              <>
                <AlertTriangle className="w-2.5 h-2.5 text-[#FBBF24] shrink-0" />
                <span>&gt;45d threshold</span>
              </>
            ) : (
              <span>Optimal velocity</span>
            )}
          </div>
        </div>

        {/* KPI 3: Units sold this month, with vs-last-month delta */}
        <div
          id="kpi-units-sold-month"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-2.5 flex flex-col justify-between shadow-none relative overflow-hidden transition-all hover:border-[#3F3F46]"
        >
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-mono uppercase tracking-wider">Units MTD</span>
            <Calendar className="w-3 h-3 text-[#71717A]" />
          </div>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {kpis.unitsSoldThisMonth}
            </span>
            <span className="text-[10px] text-[#71717A] font-mono ml-1">sold</span>
          </div>
          <div
            className={`text-[10px] font-mono flex items-center gap-0.5 ${
              kpis.unitsSoldDelta >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'
            }`}
          >
            {kpis.unitsSoldDelta >= 0 ? (
              <ArrowUpRight className="w-2.5 h-2.5" />
            ) : (
              <ArrowDownRight className="w-2.5 h-2.5" />
            )}
            <span>
              {kpis.unitsSoldDelta >= 0 ? `+${kpis.unitsSoldDelta}` : kpis.unitsSoldDelta} vs prior
            </span>
          </div>
        </div>

        {/* KPI 4: Gross this month, with delta */}
        <div
          id="kpi-gross-month"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-2.5 flex flex-col justify-between shadow-none relative overflow-hidden transition-all hover:border-[#3F3F46]"
        >
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-mono uppercase tracking-wider">Gross MTD</span>
            <DollarSign className="w-3 h-3 text-[#4ADE80]" />
          </div>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-[#4ADE80] tracking-tight">
              ${(kpis.grossThisMonth / 1000).toFixed(1)}k
            </span>
          </div>
          <div
            className={`text-[10px] font-mono flex items-center gap-0.5 ${
              kpis.grossDelta >= 0 ? 'text-[#4ADE80]' : 'text-[#EF4444]'
            }`}
          >
            {kpis.grossDelta >= 0 ? (
              <ArrowUpRight className="w-2.5 h-2.5" />
            ) : (
              <ArrowDownRight className="w-2.5 h-2.5" />
            )}
            <span>
              {kpis.grossDelta >= 0 ? `+$${(kpis.grossDelta / 1000).toFixed(1)}k` : `-$${(Math.abs(kpis.grossDelta) / 1000).toFixed(1)}k`}
            </span>
          </div>
        </div>

        {/* KPI 5: Pipeline forecast (open) — outlined to stand out */}
        <div
          id="kpi-pipeline-forecast"
          className="rounded-[4px] bg-[#151518] border border-[#3B82F6] p-2.5 flex flex-col justify-between relative overflow-hidden ring-1 ring-[#3B82F6]/30 shadow-none"
        >
          <div className="flex items-center justify-between text-[#3B82F6]">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1 text-[#3B82F6]">
              <Sparkles className="w-2.5 h-2.5 text-[#3B82F6]" />
              Pipeline Exp
            </span>
            <TrendingUp className="w-3 h-3 text-[#3B82F6]" />
          </div>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-[#3B82F6] tracking-tight">
              ${(kpis.pipelineForecastOpen / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="text-[10px] text-[#3B82F6] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
            Weighted open
          </div>
        </div>

        {/* KPI 6: Lead conversion rate */}
        <div
          id="kpi-lead-conversion"
          className="rounded-[4px] bg-[#151518] border border-[#27272A] p-2.5 flex flex-col justify-between shadow-none relative overflow-hidden transition-all hover:border-[#3F3F46]"
        >
          <div className="flex items-center justify-between text-[#71717A]">
            <span className="text-[10px] font-mono uppercase tracking-wider">Lead Conv</span>
            <Target className="w-3 h-3 text-[#71717A]" />
          </div>
          <div className="my-1">
            <span className="text-xl font-bold font-mono text-white tracking-tight">
              {kpis.leadConversionRate}%
            </span>
          </div>
          <div className="text-[10px] text-[#71717A] font-mono">
            Won / total leads
          </div>
        </div>

        {/* KPI 7: Units aged 90+ days (amber if > 0) */}
        <div
          id="kpi-units-aged-90"
          className={`rounded-[4px] p-2.5 flex flex-col justify-between relative overflow-hidden transition-all ${
            kpis.unitsAged90Amber
              ? 'bg-[#151518] border border-[#FBBF24]'
              : 'bg-[#151518] border border-[#27272A] hover:border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                kpis.unitsAged90Amber ? 'text-[#FBBF24] font-semibold' : 'text-[#71717A]'
              }`}
            >
              Aged 90+ Days
            </span>
            <AlertTriangle
              className={`w-3 h-3 ${
                kpis.unitsAged90Amber ? 'text-[#FBBF24]' : 'text-[#71717A]'
              }`}
            />
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-bold font-mono tracking-tight ${
                kpis.unitsAged90Amber ? 'text-[#FBBF24]' : 'text-white'
              }`}
            >
              {kpis.unitsAged90Plus}
            </span>
            <span className={`text-[10px] font-mono ml-1 ${kpis.unitsAged90Amber ? 'text-[#FBBF24]' : 'text-[#71717A]'}`}>
              units
            </span>
          </div>
          <div
            className={`text-[10px] font-mono flex items-center gap-1 ${
              kpis.unitsAged90Amber ? 'text-[#FBBF24]' : 'text-[#71717A]'
            }`}
          >
            {kpis.unitsAged90Amber ? (
              <span>Flagged for markdown</span>
            ) : (
              <span>0 aged units</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
