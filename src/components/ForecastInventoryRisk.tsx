import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import React, { useState } from 'react';
import { InventoryRiskResult, RiskTier } from '../types/dealership.js';

interface ForecastInventoryRiskProps {
  riskData: InventoryRiskResult;
  isLoading?: boolean;
}

const TIER_BADGES: Record<RiskTier, { label: string; bg: string; text: string; border: string }> = {
  Aged: {
    label: 'Aged (90+d)',
    bg: 'bg-[#151518]',
    text: 'text-[#EF4444]',
    border: 'border-[#EF4444]',
  },
  'At risk': {
    label: 'At Risk (60-89d)',
    bg: 'bg-[#151518]',
    text: 'text-[#FBBF24]',
    border: 'border-[#FBBF24]',
  },
  Watch: {
    label: 'Watch (45-59d)',
    bg: 'bg-[#151518]',
    text: 'text-[#FBBF24]',
    border: 'border-[#FBBF24]/50',
  },
  OK: {
    label: 'OK (<45d)',
    bg: 'bg-[#151518]',
    text: 'text-[#4ADE80]',
    border: 'border-[#4ADE80]/50',
  },
};

export const ForecastInventoryRisk: React.FC<ForecastInventoryRiskProps> = ({
  riskData,
  isLoading,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<RiskTier | 'ALL_RISK'>('ALL_RISK');

  if (isLoading || !riskData) {
    return (
      <div className="h-96 rounded-[4px] bg-[#151518] border border-[#27272A] animate-pulse p-4"></div>
    );
  }

  const { tierCounts, atRiskUnits, allUnits } = riskData;

  const displayedUnits =
    selectedTierFilter === 'ALL_RISK'
      ? atRiskUnits
      : allUnits.filter((u) => u.riskTier === selectedTierFilter);

  return (
    <div
      id="forecast-inventory-risk-panel"
      className="rounded-[4px] bg-[#151518] border border-[#27272A] p-3.5 shadow-none flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FBBF24]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-2">
                FORECAST 2 — STALE INVENTORY RISK
              </h2>
              <p className="text-[10px] text-[#71717A] font-mono">
                Aging markdown ladder with strict vehicle acquisition cost floors
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-amber-500/10 text-[#FBBF24] border border-amber-500/30 uppercase">
            Ladder Active
          </span>
        </div>

        {/* Tier Count Chips */}
        <div className="grid grid-cols-4 gap-2 my-2.5">
          {/* Aged (90+) */}
          <button
            onClick={() =>
              setSelectedTierFilter(selectedTierFilter === 'Aged' ? 'ALL_RISK' : 'Aged')
            }
            className={`p-2 rounded-[3px] border text-left transition-all cursor-pointer ${
              selectedTierFilter === 'Aged'
                ? 'bg-[#1C1C21] border-[#EF4444] ring-1 ring-[#EF4444]'
                : 'bg-[#0A0A0B] border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#EF4444] uppercase font-semibold">
                Aged 90+
              </span>
              <AlertOctagon className="w-3 h-3 text-[#EF4444]" />
            </div>
            <div className="text-base font-bold font-mono text-[#EF4444] mt-0.5">
              {tierCounts.Aged}
              <span className="text-[9px] text-[#71717A] ml-1 font-normal">veh</span>
            </div>
          </button>

          {/* At Risk (60-89) */}
          <button
            onClick={() =>
              setSelectedTierFilter(selectedTierFilter === 'At risk' ? 'ALL_RISK' : 'At risk')
            }
            className={`p-2 rounded-[3px] border text-left transition-all cursor-pointer ${
              selectedTierFilter === 'At risk'
                ? 'bg-[#1C1C21] border-[#FBBF24] ring-1 ring-[#FBBF24]'
                : 'bg-[#0A0A0B] border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#FBBF24] uppercase font-semibold">
                At Risk
              </span>
              <AlertTriangle className="w-3 h-3 text-[#FBBF24]" />
            </div>
            <div className="text-base font-bold font-mono text-[#FBBF24] mt-0.5">
              {tierCounts['At risk']}
              <span className="text-[9px] text-[#71717A] ml-1 font-normal">veh</span>
            </div>
          </button>

          {/* Watch (45-59) */}
          <button
            onClick={() =>
              setSelectedTierFilter(selectedTierFilter === 'Watch' ? 'ALL_RISK' : 'Watch')
            }
            className={`p-2 rounded-[3px] border text-left transition-all cursor-pointer ${
              selectedTierFilter === 'Watch'
                ? 'bg-[#1C1C21] border-[#FBBF24] ring-1 ring-[#FBBF24]'
                : 'bg-[#0A0A0B] border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#FBBF24] uppercase font-semibold">
                Watch
              </span>
              <Clock className="w-3 h-3 text-[#FBBF24]" />
            </div>
            <div className="text-base font-bold font-mono text-[#FBBF24] mt-0.5">
              {tierCounts.Watch}
              <span className="text-[9px] text-[#71717A] ml-1 font-normal">veh</span>
            </div>
          </button>

          {/* OK (<45) */}
          <button
            onClick={() =>
              setSelectedTierFilter(selectedTierFilter === 'OK' ? 'ALL_RISK' : 'OK')
            }
            className={`p-2 rounded-[3px] border text-left transition-all cursor-pointer ${
              selectedTierFilter === 'OK'
                ? 'bg-[#1C1C21] border-[#4ADE80] ring-1 ring-[#4ADE80]'
                : 'bg-[#0A0A0B] border-[#27272A] hover:border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#4ADE80] uppercase font-semibold">
                OK (&lt;45d)
              </span>
              <CheckCircle className="w-3 h-3 text-[#4ADE80]" />
            </div>
            <div className="text-base font-bold font-mono text-[#4ADE80] mt-0.5">
              {tierCounts.OK}
              <span className="text-[9px] text-[#71717A] ml-1 font-normal">veh</span>
            </div>
          </button>
        </div>

        {/* Table of At-Risk Units Sorted Worst First */}
        <div className="bg-[#0A0A0B] rounded-[3px] border border-[#27272A] overflow-hidden">
          <div className="px-2.5 py-1.5 bg-[#151518] border-b border-[#27272A] flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-[#D1D5DB] flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#3B82F6]" />
              {selectedTierFilter === 'ALL_RISK'
                ? 'At-Risk & Aging Floor Stock (Worst First)'
                : `${selectedTierFilter} Tier Vehicles`}
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">
              {displayedUnits.length} units
            </span>
          </div>

          <div className="overflow-x-auto max-h-52">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0A0A0B] text-[#71717A] font-mono uppercase tracking-wider text-[9px] sticky top-0 border-b border-[#27272A]">
                <tr>
                  <th className="px-2.5 py-1.5">Vehicle</th>
                  <th className="px-2 py-1.5 text-center">Days</th>
                  <th className="px-2 py-1.5">Tier</th>
                  <th className="px-2 py-1.5 text-right">List Price</th>
                  <th className="px-2 py-1.5 text-right">Markdown</th>
                  <th className="px-2.5 py-1.5 text-right">Suggested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A] font-mono text-[10px]">
                {displayedUnits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2.5 py-4 text-center text-[#71717A] font-mono">
                      No vehicles matching selected filter.
                    </td>
                  </tr>
                ) : (
                  displayedUnits.map((unit) => {
                    const badge = TIER_BADGES[unit.riskTier];
                    return (
                      <tr key={unit.vin} className="hover:bg-[#151518] transition-colors">
                        {/* Vehicle Year Make Model */}
                        <td className="px-2.5 py-1.5 text-[#D1D5DB]">
                          <div className="truncate max-w-[140px] sm:max-w-[180px] font-medium" title={`${unit.year} ${unit.make} ${unit.model}`}>
                            {unit.year} {unit.make} {unit.model}
                          </div>
                          <span className="text-[9px] font-mono text-[#71717A] block truncate">
                            {unit.vin} • {unit.powertrain}
                          </span>
                        </td>

                        {/* Days on lot */}
                        <td className="px-2 py-1.5 text-center">
                          <span
                            className={`font-bold ${
                              unit.days_on_lot >= 90
                                ? 'text-[#EF4444]'
                                : unit.days_on_lot >= 60
                                ? 'text-[#FBBF24]'
                                : unit.days_on_lot >= 45
                                ? 'text-[#FBBF24]'
                                : 'text-[#4ADE80]'
                            }`}
                          >
                            {unit.days_on_lot}d
                          </span>
                        </td>

                        {/* Risk Tier Badge */}
                        <td className="px-2 py-1.5">
                          <span
                            className={`text-[9px] font-mono font-medium px-1 py-0.2 rounded-[2px] border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {unit.riskTier}
                          </span>
                        </td>

                        {/* List Price */}
                        <td className="px-2 py-1.5 text-right text-[#D1D5DB]">
                          ${unit.list_price.toLocaleString()}
                        </td>

                        {/* Markdown */}
                        <td className="px-2 py-1.5 text-right text-[#EF4444]">
                          {unit.markdownAmount > 0 ? (
                            <>
                              -${unit.markdownAmount.toLocaleString()}
                              <span className="text-[8px] text-[#71717A] block">
                                ({(unit.markdownPct * 100).toFixed(0)}%)
                              </span>
                            </>
                          ) : (
                            <span className="text-[#71717A]">$0 (0%)</span>
                          )}
                        </td>

                        {/* Suggested Price with Floor check */}
                        <td className="px-2.5 py-1.5 text-right font-bold text-[#4ADE80]">
                          ${unit.suggestedPrice.toLocaleString()}
                          {unit.isCostFloorApplied && (
                            <span
                              className="text-[8px] text-[#FBBF24] block font-normal"
                              title="Cost Floor Enforced (suggested price cannot drop below dealer cost)"
                            >
                              Floor Reached
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 mt-2.5 border-t border-[#27272A] flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#71717A]">
          At-Risk Volume:{' '}
          <strong className="text-white font-mono">{atRiskUnits.length} vehicles</strong>
        </span>
        <span className="text-[#71717A]">
          Potential Markdown:{' '}
          <strong className="text-[#EF4444] font-mono">
            -${atRiskUnits.reduce((acc, u) => acc + u.markdownAmount, 0).toLocaleString()}
          </strong>
        </span>
      </div>
    </div>
  );
};
