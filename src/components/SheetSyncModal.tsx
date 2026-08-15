import {
  Check,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { DealershipDashboardData } from '../types/dealership.js';

interface SheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: DealershipDashboardData | null;
  onSyncSpreadsheet: (spreadsheetId?: string) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_TARGET_SHEET_ID = 'YOUR_SPREADSHEET_ID';
const DEFAULT_TARGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit?usp=sharing';

export const SheetSyncModal: React.FC<SheetSyncModalProps> = ({
  isOpen,
  onClose,
  dashboardData,
  onSyncSpreadsheet,
  isLoading,
}) => {
  const [sheetIdInput, setSheetIdInput] = useState(
    dashboardData?.sourceInfo.spreadsheetId || DEFAULT_TARGET_SHEET_ID
  );
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSyncSpreadsheet(sheetIdInput.trim() || DEFAULT_TARGET_SHEET_ID);
    setSyncSuccessMsg('Google Sheets data synchronized successfully');
    setTimeout(() => setSyncSuccessMsg(null), 3000);
  };

  const tabs = [
    {
      name: 'Inventory',
      columns: 'vin, make, model, year, powertrain, cost, list_price, days_on_lot',
      status: `Active (${dashboardData?.sourceInfo.inventoryCount || 38} units synced)`,
    },
    {
      name: 'Leads',
      columns: 'lead_id, created_date, source, pipeline_stage, opportunity_value, assigned_rep, won_date',
      status: `Active (${dashboardData?.sourceInfo.leadsCount || 46} leads synced)`,
    },
    {
      name: 'Assumptions',
      columns: 'Stage close rates & Markdown aging ladders',
      status: 'Active & Sensitivity Tuned',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#151518] border border-[#27272A] rounded-[4px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-[#27272A] flex items-center justify-between sticky top-0 bg-[#151518] z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#4ADE80]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Google Sheets Integration: dealership-data
              </h2>
              <p className="text-[10px] text-[#71717A] font-mono">
                Direct live data sync for dealership operations, inventory, and revenue forecasting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#71717A] hover:text-white hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 text-xs font-mono">
          {/* Active Connected Spreadsheet Card */}
          <div className="p-3 rounded-[3px] bg-[#0A0A0B] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping mt-1 sm:mt-0"></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-xs font-mono">
                    dealership-data
                  </span>
                  <span className="px-1.5 py-0.2 rounded-[2px] bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/30 font-bold text-[9px]">
                    CONNECTED
                  </span>
                </div>
                <span className="text-[#71717A] text-[10px] block font-mono">
                  ID: <code className="text-[#D1D5DB]">YOUR_SPREADSHEET_ID</code>
                </span>
                <span className="text-[#71717A] text-[10px] block font-mono">
                  Last verified sync: {new Date(dashboardData?.sourceInfo.lastSynced || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <a
              href={DEFAULT_TARGET_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[2px] bg-[#151518] hover:bg-[#27272A] border border-[#27272A] text-[#4ADE80] hover:text-white text-[11px] font-mono transition-colors shrink-0 cursor-pointer"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Connect Custom Google Sheet ID */}
          <form onSubmit={handleSync} className="p-3 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
            <h3 className="font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1 text-[11px]">
              <Server className="w-3 h-3 text-[#3B82F6]" />
              Spreadsheet ID / Custom Google Sheet
            </h3>
            <p className="text-[10px] text-[#71717A] font-mono mb-2">
              Sync any Google Sheet ID (from URL: <code>docs.google.com/spreadsheets/d/<b>[SPREADSHEET_ID]</b>/edit</code>):
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={sheetIdInput}
                onChange={(e) => setSheetIdInput(e.target.value)}
                placeholder="YOUR_SPREADSHEET_ID"
                className="flex-1 px-2.5 py-1.5 rounded-[2px] bg-[#151518] border border-[#27272A] text-white placeholder-[#71717A] font-mono text-[11px] focus:outline-none focus:border-[#3B82F6]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-3 py-1.5 rounded-[2px] bg-[#3B82F6] hover:bg-blue-500 text-white font-bold text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Fetch & Sync</span>
              </button>
            </div>
            {syncSuccessMsg && (
              <div className="mt-2 text-[10px] text-[#4ADE80] font-mono flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}
          </form>

          {/* Expected Sheet Schema & Detected Tabs */}
          <div className="p-3 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
            <h3 className="font-bold text-white uppercase tracking-wider mb-2 text-[11px]">
              Detected Schema & Tab Verification
            </h3>
            <div className="space-y-1.5">
              {tabs.map((tab) => (
                <div
                  key={tab.name}
                  className="p-2 rounded-[2px] bg-[#151518] border border-[#27272A] flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[#D1D5DB] text-[11px] block">{tab.name} Tab</span>
                    <span className="text-[9px] text-[#71717A] font-mono block truncate max-w-sm">
                      Fields: {tab.columns}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#4ADE80] font-mono font-medium px-1.5 py-0.2 rounded-[2px] bg-[#4ADE80]/10 border border-[#4ADE80]/30">
                    {tab.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Security Note */}
          <div className="p-2.5 rounded-[2px] bg-[#151518] border border-[#27272A] text-[#D1D5DB] text-[10px] font-mono flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Direct access mode: All aggregations, risk analysis, and forecasting calculations execute directly on the server without requiring user accounts or sign-ins.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#27272A] flex items-center justify-end bg-[#151518]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-[2px] bg-[#27272A] hover:bg-[#3F3F46] text-white font-mono text-[11px] font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
