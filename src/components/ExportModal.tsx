import {
  Car,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  LineChart,
  Table,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { exportDashboardCsv, exportDashboardPdf, ExportDataType } from '../services/exportService.js';
import { DealershipDashboardData } from '../types/dealership.js';

interface ExportModalProps {
  data: DealershipDashboardData | null;
  onClose: () => void;
  defaultType?: ExportDataType;
}

export const ExportModal: React.FC<ExportModalProps> = ({ data, onClose, defaultType = 'inventory' }) => {
  const [selectedType, setSelectedType] = useState<ExportDataType>(defaultType);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [recentlyExported, setRecentlyExported] = useState<string | null>(null);

  if (!data) return null;

  const exportOptions: Array<{
    id: ExportDataType;
    label: string;
    description: string;
    icon: React.ElementType;
    badge: string;
    rowsCount: number;
  }> = [
    {
      id: 'inventory',
      label: 'Current Inventory Table',
      description: 'All lot vehicles with VIN, pricing, days on lot, risk tier, and markdown',
      icon: Car,
      badge: `${data.inventoryRisk.allUnits.length} Vehicles`,
      rowsCount: data.inventoryRisk.allUnits.length,
    },
    {
      id: 'sales_by_month',
      label: 'Sales by Month Chart Data',
      description: 'Monthly revenue, units closed, gross profit, and profit margins',
      icon: LineChart,
      badge: `${data.standingCharts.salesByMonth.length} Months`,
      rowsCount: data.standingCharts.salesByMonth.length,
    },
    {
      id: 'leaderboard',
      label: 'Salesperson Leaderboard',
      description: 'Individual rep rankings, units sold, win rates %, and active pipeline',
      icon: Users,
      badge: `${data.standingCharts.repLeaderboard.length} Reps`,
      rowsCount: data.standingCharts.repLeaderboard.length,
    },
    {
      id: 'pipeline_forecast',
      label: 'Pipeline Forecast Summary',
      description: 'Stage conversion probabilities, opportunity value, and weighted revenue',
      icon: TrendingUp,
      badge: `${data.forecastPipeline.stages.length} Stages`,
      rowsCount: data.forecastPipeline.stages.length,
    },
    {
      id: 'executive_summary',
      label: 'Executive Dealership Report',
      description: 'Comprehensive report combining KPIs, Forecasts, and Leaderboards',
      icon: Table,
      badge: 'Full Digest',
      rowsCount: 4,
    },
  ];

  const handleExport = (type: ExportDataType, format: 'csv' | 'pdf') => {
    setIsExporting(`${type}_${format}`);
    try {
      if (format === 'csv') {
        exportDashboardCsv(type, data);
      } else {
        exportDashboardPdf(type, data);
      }
      setRecentlyExported(`${type}_${format}`);
      setTimeout(() => {
        setRecentlyExported(null);
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const selectedOption = exportOptions.find((o) => o.id === selectedType) || exportOptions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#151518] border border-[#27272A] rounded-[4px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-[#27272A] flex items-center justify-between sticky top-0 bg-[#151518] z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Export Dashboard Data
              </h2>
              <p className="text-[10px] text-[#71717A] font-mono">
                Download structured data in CSV or executive formatted PDF
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

        {/* Modal Content */}
        <div className="p-4 space-y-3.5 text-xs font-mono">
          {/* Dataset Selector Grid */}
          <div>
            <span className="text-[10px] text-[#71717A] uppercase tracking-wider block font-mono mb-2">
              Select Dataset to Export
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exportOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id)}
                    className={`p-2.5 rounded-[3px] text-left transition-all border cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#1E1E24] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#0A0A0B] border-[#27272A] text-[#D1D5DB] hover:bg-[#151518] hover:border-[#3F3F46]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-[2px] mt-0.5 ${
                        isSelected ? 'bg-blue-500/20 text-[#3B82F6]' : 'bg-[#27272A] text-[#71717A]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] truncate">{opt.label}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded-[2px] bg-[#27272A] text-[#71717A] font-mono shrink-0">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-[#71717A] font-mono line-clamp-1 mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Dataset Detail & Direct Actions */}
          <div className="p-3.5 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-xs">{selectedOption.label}</span>
                  <span className="text-[9px] text-[#4ADE80] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#4ADE80]/10 border border-[#4ADE80]/30">
                    {selectedOption.rowsCount} records ready
                  </span>
                </div>
                <p className="text-[10px] text-[#71717A] font-mono mt-0.5">
                  {selectedOption.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* CSV Button */}
                <button
                  onClick={() => handleExport(selectedType, 'csv')}
                  disabled={!!isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#151518] hover:bg-[#27272A] border border-[#27272A] text-[#4ADE80] hover:text-white font-mono text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Download as CSV spreadsheet"
                >
                  {isExporting === `${selectedType}_csv` ? (
                    <Download className="w-3.5 h-3.5 animate-bounce" />
                  ) : recentlyExported === `${selectedType}_csv` ? (
                    <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Export CSV</span>
                </button>

                {/* PDF Button */}
                <button
                  onClick={() => handleExport(selectedType, 'pdf')}
                  disabled={!!isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#3B82F6] hover:bg-blue-500 text-white font-mono text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Download formatted PDF report"
                >
                  {isExporting === `${selectedType}_pdf` ? (
                    <Download className="w-3.5 h-3.5 animate-bounce" />
                  ) : recentlyExported === `${selectedType}_pdf` ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Quick Preview Table of Selected Dataset */}
            <div className="mt-3">
              <span className="text-[9px] text-[#71717A] uppercase tracking-wider block font-mono mb-1.5">
                Data Preview Sample
              </span>
              <div className="max-h-36 overflow-x-auto overflow-y-auto border border-[#27272A] rounded-[2px] bg-[#151518]">
                {selectedType === 'inventory' && (
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-[#0A0A0B] text-[#71717A] sticky top-0 border-b border-[#27272A]">
                      <tr>
                        <th className="p-1.5">VIN</th>
                        <th className="p-1.5">Vehicle</th>
                        <th className="p-1.5 text-right">Age</th>
                        <th className="p-1.5 text-right">Cost</th>
                        <th className="p-1.5 text-right">List Price</th>
                        <th className="p-1.5">Risk Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A] text-[#D1D5DB]">
                      {data.inventoryRisk.allUnits.slice(0, 4).map((u) => (
                        <tr key={u.vin} className="hover:bg-[#1E1E24]">
                          <td className="p-1.5 text-[#71717A]">{u.vin.slice(0, 10)}...</td>
                          <td className="p-1.5">{u.year} {u.make} {u.model}</td>
                          <td className="p-1.5 text-right">{u.days_on_lot}d</td>
                          <td className="p-1.5 text-right">${u.cost.toLocaleString()}</td>
                          <td className="p-1.5 text-right">${u.list_price.toLocaleString()}</td>
                          <td className="p-1.5">
                            <span className="px-1 py-0.2 rounded-[2px] bg-[#27272A] text-[9px]">
                              {u.riskTier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedType === 'sales_by_month' && (
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-[#0A0A0B] text-[#71717A] sticky top-0 border-b border-[#27272A]">
                      <tr>
                        <th className="p-1.5">Month</th>
                        <th className="p-1.5 text-right">Units Sold</th>
                        <th className="p-1.5 text-right">Total Revenue</th>
                        <th className="p-1.5 text-right">Gross Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A] text-[#D1D5DB]">
                      {data.standingCharts.salesByMonth.slice(0, 4).map((m) => (
                        <tr key={m.month} className="hover:bg-[#1E1E24]">
                          <td className="p-1.5 font-bold">{m.month}</td>
                          <td className="p-1.5 text-right">{m.unitsSold}</td>
                          <td className="p-1.5 text-right">${m.revenue.toLocaleString()}</td>
                          <td className="p-1.5 text-right text-[#4ADE80]">${m.gross.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedType === 'leaderboard' && (
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-[#0A0A0B] text-[#71717A] sticky top-0 border-b border-[#27272A]">
                      <tr>
                        <th className="p-1.5">Sales Rep</th>
                        <th className="p-1.5 text-right">Units</th>
                        <th className="p-1.5 text-right">Revenue</th>
                        <th className="p-1.5 text-right">Gross Profit</th>
                        <th className="p-1.5 text-right">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A] text-[#D1D5DB]">
                      {data.standingCharts.repLeaderboard.slice(0, 4).map((r) => (
                        <tr key={r.rep} className="hover:bg-[#1E1E24]">
                          <td className="p-1.5 font-bold">{r.rep}</td>
                          <td className="p-1.5 text-right">{r.unitsSold}</td>
                          <td className="p-1.5 text-right">${r.totalRevenue.toLocaleString()}</td>
                          <td className="p-1.5 text-right text-[#4ADE80]">${r.grossProfit.toLocaleString()}</td>
                          <td className="p-1.5 text-right">{(r.winRate * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedType === 'pipeline_forecast' && (
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-[#0A0A0B] text-[#71717A] sticky top-0 border-b border-[#27272A]">
                      <tr>
                        <th className="p-1.5">Stage</th>
                        <th className="p-1.5 text-right">Deals</th>
                        <th className="p-1.5 text-right">Opportunity</th>
                        <th className="p-1.5 text-right">Close Rate</th>
                        <th className="p-1.5 text-right">Weighted Forecast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A] text-[#D1D5DB]">
                      {data.forecastPipeline.stages.slice(0, 4).map((s) => (
                        <tr key={s.stage} className="hover:bg-[#1E1E24]">
                          <td className="p-1.5 font-bold">{s.stage}</td>
                          <td className="p-1.5 text-right">{s.dealCount}</td>
                          <td className="p-1.5 text-right">${s.totalOpportunity.toLocaleString()}</td>
                          <td className="p-1.5 text-right">{(s.closeRate * 100).toFixed(0)}%</td>
                          <td className="p-1.5 text-right text-[#3B82F6] font-bold">${s.weightedRevenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {selectedType === 'executive_summary' && (
                  <div className="p-2 text-[10px] text-[#71717A] space-y-1">
                    <p>• Executive Summary includes 7 Operational KPIs + Forecast Metrics</p>
                    <p>• Full breakdown of Pipeline Stage Probabilities & Weighted Revenue</p>
                    <p>• Salesperson Leaderboard and Volume distribution</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#27272A] flex items-center justify-between sticky bottom-0 bg-[#151518]">
          <span className="text-[10px] text-[#71717A] font-mono">
            {recentlyExported ? '✓ File generated successfully' : 'Ready to export clean format'}
          </span>
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
