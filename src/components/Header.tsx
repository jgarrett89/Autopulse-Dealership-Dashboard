import {
  Car,
  Check,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Gauge,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { DealershipDashboardData } from '../types/dealership.js';

interface HeaderProps {
  data: DealershipDashboardData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenAssumptions: () => void;
  onOpenSheetsModal: () => void;
  onOpenExportModal: () => void;
  sensitivityDelta: number;
  lastRefreshedTime?: string;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  isLoading,
  onRefresh,
  onOpenAssumptions,
  onOpenSheetsModal,
  onOpenExportModal,
  sensitivityDelta,
  lastRefreshedTime,
}) => {
  const [justRefreshed, setJustRefreshed] = useState(false);

  const handleManualRefresh = () => {
    onRefresh();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 2500);
  };

  const formattedTime = lastRefreshedTime
    ? new Date(lastRefreshedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : data?.sourceInfo.lastSynced
    ? new Date(data.sourceInfo.lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live';

  return (
    <header className="border-b border-[#27272A] bg-[#151518] sticky top-0 z-30 px-3 py-2 transition-colors">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Brand & Instrument Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-[#3B82F6] flex items-center justify-center border border-blue-400 shrink-0">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-1.5 font-display">
                AutoPulse <span className="text-[9px] sm:text-[10px] font-mono font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-[2px] bg-blue-500/20 text-[#3B82F6] border border-blue-500/40">OPS & FORECAST</span>
              </span>
              {sensitivityDelta !== 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-amber-500/20 text-[#FBBF24] border border-amber-500/40 flex items-center gap-1">
                  <SlidersHorizontal className="w-2.5 h-2.5" />
                  Sens {sensitivityDelta > 0 ? `+${sensitivityDelta}%` : `${sensitivityDelta}%`}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#71717A] font-sans">
              Apex Motors Group • Live Inventory & Revenue Cockpit
            </p>
          </div>
        </div>

        {/* Status Indicators & Control Actions */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs">
          {/* Google Sheets Live Status */}
          <button
            id="btn-sheets-sync-status"
            onClick={onOpenSheetsModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] bg-[#0A0A0B] hover:bg-[#1C1C21] border border-emerald-500/30 text-[#D1D5DB] transition-colors cursor-pointer"
            title="Google Sheet: dealership-data (Click to configure or view schema)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#4ADE80]" />
            <div className="text-left">
              <span className="text-[9px] text-[#4ADE80] font-bold uppercase tracking-wider block font-mono flex items-center gap-1">
                dealership-data
              </span>
              <span className="text-[#D1D5DB] font-mono text-[10px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span>
                {data?.sourceInfo.inventoryCount || 38} Cars • {data?.sourceInfo.leadsCount || 46} Leads
              </span>
            </div>
          </button>

          {/* Export Data Button */}
          <button
            id="btn-export-dashboard"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#0A0A0B] hover:bg-[#1C1C21] border border-[#27272A] text-[#4ADE80] hover:text-white font-mono text-xs font-medium transition-colors cursor-pointer"
            title="Export dashboard data in CSV or PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>Export</span>
          </button>

          {/* Assumptions & Sensitivity Editor */}
          <button
            id="btn-open-assumptions"
            onClick={onOpenAssumptions}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#0A0A0B] hover:bg-[#1C1C21] border border-[#27272A] text-[#3B82F6] hover:text-blue-300 font-mono text-xs font-medium transition-colors cursor-pointer"
            title="Adjust close rate probabilities and markdown ladder"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="hidden sm:inline">Assumptions</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            id="btn-refresh-dashboard"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] bg-[#0A0A0B] hover:bg-[#1C1C21] border border-[#27272A] text-[#D1D5DB] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            title={`Fetch latest data from dealership-data Google Sheet (Last synced: ${formattedTime})`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? 'animate-spin text-[#3B82F6]' : justRefreshed ? 'text-[#4ADE80]' : 'text-[#71717A]'
              }`}
            />
            <div className="text-left font-mono">
              <span className="text-[10px] sm:text-[11px] block font-bold leading-tight">
                {isLoading ? 'Syncing...' : justRefreshed ? 'Updated!' : 'Refresh'}
              </span>
              <span className="text-[8px] text-[#71717A] block leading-none">
                {formattedTime}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
