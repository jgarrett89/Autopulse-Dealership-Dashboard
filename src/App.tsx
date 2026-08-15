import { AlertCircle, Check, Download, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AskAiSection } from './components/AskAiSection.js';
import { AssumptionsModal } from './components/AssumptionsModal.js';
import { ExportModal } from './components/ExportModal.js';
import { ForecastInventoryRisk } from './components/ForecastInventoryRisk.js';
import { ForecastPipeline } from './components/ForecastPipeline.js';
import { Header } from './components/Header.js';
import { KpiRow } from './components/KpiRow.js';
import { SheetSyncModal } from './components/SheetSyncModal.js';
import { StandingCharts } from './components/StandingCharts.js';
import { exportDashboardCsv, exportDashboardPdf, ExportDataType } from './services/exportService.js';
import {
  AiAskResponse,
  Assumptions,
  DealershipDashboardData,
} from './types/dealership.js';

export default function App() {
  const [data, setData] = useState<DealershipDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string | undefined>(undefined);

  // Modals state
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDefaultType, setExportDefaultType] = useState<ExportDataType>('inventory');

  // Sensitivity analysis state (percentage offset, e.g. +10%, -15%)
  const [sensitivityDelta, setSensitivityDelta] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const fetchDashboardData = async (spreadsheetId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = spreadsheetId
        ? `/api/dealership/data?spreadsheetId=${encodeURIComponent(spreadsheetId)}`
        : '/api/dealership/data';
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load dealership data: ${res.statusText}`);
      }
      const json: DealershipDashboardData = await res.json();
      setData(json);
      setLastRefreshedTime(new Date().toISOString());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error connecting to dealership data service');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/dealership/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: data?.sourceInfo.spreadsheetId,
        }),
      });

      if (!res.ok) {
        throw new Error(`Refresh failed: ${res.statusText}`);
      }

      const result = await res.json();
      if (result.dashboard) {
        setData(result.dashboard);
        setLastRefreshedTime(result.refreshedAt || new Date().toISOString());
        showToast('Google Sheets data refreshed — KPIs and charts updated', 'success');
      }
    } catch (err: any) {
      console.error('Manual refresh error:', err);
      // Fallback to fetch
      await fetchDashboardData();
      showToast('Dashboard refreshed with latest dataset', 'info');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveAssumptions = async (newAssumptions: Assumptions) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dealership/assumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssumptions),
      });
      if (!res.ok) throw new Error('Failed to update assumptions');
      const updatedData: DealershipDashboardData = await res.json();
      setData(updatedData);
      setSensitivityDelta(0);
      showToast('Assumptions & Markdown ladder updated', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Error updating assumptions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySensitivity = async (deltaPct: number) => {
    if (!data) return;
    setSensitivityDelta(deltaPct);

    // Apply sensitivity multiplier to open stage close rates
    const factor = 1 + deltaPct / 100;
    const baseRates = data.assumptions.closeRates;
    const adjustedRates = {
      ...baseRates,
      New: Math.min(1, Math.max(0, Number((baseRates.New * factor).toFixed(3)))),
      Contacted: Math.min(1, Math.max(0, Number((baseRates.Contacted * factor).toFixed(3)))),
      'Test Drive': Math.min(1, Math.max(0, Number((baseRates['Test Drive'] * factor).toFixed(3)))),
      Negotiation: Math.min(1, Math.max(0, Number((baseRates.Negotiation * factor).toFixed(3)))),
      Won: 1.0,
      Lost: 0.0,
    };

    const newAssumptions: Assumptions = {
      closeRates: adjustedRates,
      markdownLadder: data.assumptions.markdownLadder,
    };

    await handleSaveAssumptions(newAssumptions);
  };

  const handleAskAi = async (question: string): Promise<AiAskResponse> => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/dealership/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, assumptionsOverride: data?.assumptions }),
      });
      if (!res.ok) {
        throw new Error('AI query failed');
      }
      const response: AiAskResponse = await res.json();
      return response;
    } catch (err: any) {
      return {
        chartType: 'bar',
        title: 'Dealership Query Notice',
        data: [],
        xKey: '',
        yKeys: [],
        insight:
          "Couldn't read that one. Try naming a metric like forecast, markdown, sales, inventory, or leads.",
        error: err?.message,
      };
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSyncSpreadsheet = async (spreadsheetId?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dealership/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });
      if (!res.ok) throw new Error('Failed to sync spreadsheet');
      const updated: DealershipDashboardData = await res.json();
      setData(updated);
      setLastRefreshedTime(new Date().toISOString());
      showToast('Spreadsheet synchronized successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Could not sync spreadsheet.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExport = (type: ExportDataType = 'inventory') => {
    setExportDefaultType(type);
    setIsExportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#D1D5DB] font-sans antialiased selection:bg-blue-500 selection:text-white flex flex-col justify-between">
      <div>
        {/* Top Navigation Header */}
        <Header
          data={data}
          isLoading={isLoading || isRefreshing}
          onRefresh={handleManualRefresh}
          onOpenAssumptions={() => setIsAssumptionsOpen(false ? false : true)}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          onOpenExportModal={() => handleOpenExport('inventory')}
          sensitivityDelta={sensitivityDelta}
          lastRefreshedTime={lastRefreshedTime}
        />

        {/* Floating Feedback Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div
              className={`px-3 py-2 rounded-[3px] border shadow-2xl flex items-center gap-2 font-mono text-xs ${
                toastMessage.type === 'success'
                  ? 'bg-[#151518] border-[#4ADE80] text-[#4ADE80]'
                  : toastMessage.type === 'error'
                  ? 'bg-[#151518] border-[#EF4444] text-[#EF4444]'
                  : 'bg-[#151518] border-[#3B82F6] text-[#3B82F6]'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <Check className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-white">{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-1 text-[#71717A] hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Main Cockpit Content */}
        <main className="max-w-[1600px] mx-auto px-3 sm:px-4 py-3">
          {/* Error Alert */}
          {error && (
            <div className="mb-3 p-3 rounded-[3px] bg-[#151518] border border-[#EF4444] text-[#EF4444] flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={handleManualRefresh}
                className="px-2 py-0.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] rounded-[2px] border border-[#EF4444]/40 transition-colors font-mono cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. TOP ROW: LIVE KPIS */}
          <KpiRow kpis={data?.kpis} isLoading={isLoading} />

          {/* 2. ASK FEATURE (THE AI LAYER) */}
          <AskAiSection onAsk={handleAskAi} isLoading={isAiLoading} />

          {/* 3. TWO FORECAST PANELS SIDE BY SIDE */}
          <section
            className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3"
            aria-label="Executive Dealership Forecasts"
          >
            {/* FORECAST 1: Pipeline-Weighted Revenue */}
            <ForecastPipeline
              forecast={data?.forecastPipeline!}
              isLoading={isLoading}
            />

            {/* FORECAST 2: Stale Inventory Risk */}
            <ForecastInventoryRisk
              riskData={data?.inventoryRisk!}
              isLoading={isLoading}
            />
          </section>

          {/* 4. SIX STANDING CHARTS */}
          {data?.standingCharts && (
            <StandingCharts data={data.standingCharts} isLoading={isLoading} />
          )}
        </main>
      </div>

      {/* Footer Info */}
      <footer className="border-t border-[#27272A] py-3 px-4 text-center text-[10px] text-[#71717A] font-mono bg-[#0A0A0B]">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>AutoPulse Dealership Operations & Forecasting • Gemini 3.7 Flash</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenExport('executive_summary')}
              className="text-[#4ADE80] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export Executive Report (PDF/CSV)</span>
            </button>
            <span>•</span>
            <span className="text-[#71717A]">Google Sheets Direct Sync</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {data?.assumptions && (
        <AssumptionsModal
          isOpen={isAssumptionsOpen}
          onClose={() => setIsAssumptionsOpen(false)}
          assumptions={data.assumptions}
          onSaveAssumptions={handleSaveAssumptions}
          onApplySensitivity={handleApplySensitivity}
          activeSensitivityDelta={sensitivityDelta}
        />
      )}

      <SheetSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        dashboardData={data}
        onSyncSpreadsheet={handleSyncSpreadsheet}
        isLoading={isLoading || isRefreshing}
      />

      {isExportModalOpen && (
        <ExportModal
          data={data}
          onClose={() => setIsExportModalOpen(false)}
          defaultType={exportDefaultType}
        />
      )}
    </div>
  );
}
