import {
  AlertCircle,
  Check,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Assumptions, MarkdownTier, PipelineStage } from '../types/dealership.js';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: Assumptions;
  onSaveAssumptions: (newAssumptions: Assumptions) => Promise<void>;
  onApplySensitivity: (deltaPct: number) => void;
  activeSensitivityDelta: number;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen,
  onClose,
  assumptions,
  onSaveAssumptions,
  onApplySensitivity,
  activeSensitivityDelta,
}) => {
  const [closeRates, setCloseRates] = useState<Record<PipelineStage, number>>({
    ...assumptions.closeRates,
  });
  const [markdownLadder, setMarkdownLadder] = useState<MarkdownTier[]>(
    JSON.parse(JSON.stringify(assumptions.markdownLadder))
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleStageRateChange = (stage: PipelineStage, valStr: string) => {
    const val = Number(valStr);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setCloseRates((prev) => ({
        ...prev,
        [stage]: val / 100,
      }));
    }
  };

  const handleMarkdownChange = (index: number, field: 'min_days_on_lot' | 'markdown_pct', valStr: string) => {
    const val = Number(valStr);
    if (isNaN(val)) return;

    setMarkdownLadder((prev) => {
      const updated = [...prev];
      if (field === 'markdown_pct') {
        updated[index] = { ...updated[index], markdown_pct: val / 100 };
      } else {
        updated[index] = { ...updated[index], min_days_on_lot: Math.max(0, val) };
      }
      return updated.sort((a, b) => a.min_days_on_lot - b.min_days_on_lot);
    });
  };

  const handleAddMarkdownTier = () => {
    const lastTier = markdownLadder[markdownLadder.length - 1];
    const newMinDays = lastTier ? lastTier.min_days_on_lot + 30 : 60;
    const newPct = lastTier ? Math.min(0.5, lastTier.markdown_pct + 0.05) : 0.05;
    setMarkdownLadder((prev) => [...prev, { min_days_on_lot: newMinDays, markdown_pct: newPct }].sort((a, b) => a.min_days_on_lot - b.min_days_on_lot));
  };

  const handleRemoveMarkdownTier = (index: number) => {
    if (markdownLadder.length <= 1) return;
    setMarkdownLadder((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAssumptions({
        closeRates,
        markdownLadder,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setCloseRates({
      New: 0.1,
      Contacted: 0.25,
      'Test Drive': 0.5,
      Negotiation: 0.75,
      Won: 1.0,
      Lost: 0.0,
    });
    setMarkdownLadder([
      { min_days_on_lot: 0, markdown_pct: 0.0 },
      { min_days_on_lot: 45, markdown_pct: 0.04 },
      { min_days_on_lot: 60, markdown_pct: 0.08 },
      { min_days_on_lot: 90, markdown_pct: 0.15 },
      { min_days_on_lot: 120, markdown_pct: 0.22 },
    ]);
  };

  const stages: PipelineStage[] = ['New', 'Contacted', 'Test Drive', 'Negotiation', 'Won', 'Lost'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#151518] border border-[#27272A] rounded-[4px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-[#27272A] flex items-center justify-between sticky top-0 bg-[#151518] z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[2px] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Assumptions & Sensitivity Modeling
              </h2>
              <p className="text-[10px] text-[#71717A] font-mono">
                Calibrate close rates and markdown ladder parameters
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
        <div className="p-4 space-y-4 text-xs font-mono">
          {/* Quick Sensitivity Presets */}
          <div className="p-3 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#D1D5DB] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-[#3B82F6]" />
                Live Sensitivity Multiplier
              </span>
              <span className="text-[#3B82F6] font-bold text-xs">
                {activeSensitivityDelta > 0 ? `+${activeSensitivityDelta}%` : `${activeSensitivityDelta}%`} Shift
              </span>
            </div>
            <p className="text-[10px] text-[#71717A] font-mono mb-2">
              Simulate macro market shifts across open stage close probabilities:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[-20, -10, -5, 0, 5, 10, 20].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => onApplySensitivity(delta)}
                  className={`px-2 py-1 rounded-[2px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    activeSensitivityDelta === delta
                      ? 'bg-[#3B82F6] text-white border border-[#3B82F6]'
                      : 'bg-[#151518] text-[#D1D5DB] hover:bg-[#27272A] border border-[#27272A]'
                  }`}
                >
                  {delta === 0 ? 'Baseline (0%)' : delta > 0 ? `+${delta}%` : `${delta}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Table 1: Stage Close Rates */}
            <div className="p-3 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-[11px] uppercase tracking-wider">
                  1. Stage Close Rates (%)
                </h3>
                <span className="text-[9px] text-[#71717A] font-mono">Pipeline Tab</span>
              </div>
              <p className="text-[10px] text-[#71717A] font-mono mb-2">
                Conversion probability to Won:
              </p>

              <div className="space-y-1.5">
                {stages.map((st) => (
                  <div
                    key={st}
                    className="flex items-center justify-between p-1.5 rounded-[2px] bg-[#151518] border border-[#27272A]"
                  >
                    <span className="text-[#D1D5DB] font-medium text-[11px]">{st}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round((closeRates[st] || 0) * 100)}
                        onChange={(e) => handleStageRateChange(st, e.target.value)}
                        className="w-12 px-1.5 py-0.5 rounded-[2px] bg-[#0A0A0B] border border-[#27272A] text-right text-white font-bold font-mono text-[11px] focus:outline-none focus:border-[#3B82F6]"
                        disabled={st === 'Won' || st === 'Lost'}
                      />
                      <span className="text-[#71717A] text-[10px]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reference Table 2: Markdown Ladder */}
            <div className="p-3 rounded-[3px] bg-[#0A0A0B] border border-[#27272A]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white text-[11px] uppercase tracking-wider">
                  2. Markdown Ladder
                </h3>
                <button
                  type="button"
                  onClick={handleAddMarkdownTier}
                  className="flex items-center gap-1 text-[10px] text-[#3B82F6] hover:text-blue-300 cursor-pointer font-mono"
                >
                  <Plus className="w-3 h-3" />
                  Add Step
                </button>
              </div>
              <p className="text-[10px] text-[#71717A] font-mono mb-2">
                Days on lot threshold to discount:
              </p>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {markdownLadder.map((tier, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 rounded-[2px] bg-[#151518] border border-[#27272A]"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-[#71717A] text-[9px]">≥</span>
                      <input
                        type="number"
                        min={0}
                        max={365}
                        value={tier.min_days_on_lot}
                        onChange={(e) =>
                          handleMarkdownChange(idx, 'min_days_on_lot', e.target.value)
                        }
                        className="w-12 px-1 py-0.5 rounded-[2px] bg-[#0A0A0B] border border-[#27272A] text-right text-white font-bold font-mono text-[11px] focus:outline-none focus:border-[#3B82F6]"
                      />
                      <span className="text-[#71717A] text-[9px]">d</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[#71717A] text-[9px]">Disc:</span>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={1}
                          value={Math.round(tier.markdown_pct * 100)}
                          onChange={(e) =>
                            handleMarkdownChange(idx, 'markdown_pct', e.target.value)
                          }
                          className="w-11 px-1 py-0.5 rounded-[2px] bg-[#0A0A0B] border border-[#27272A] text-right text-[#EF4444] font-bold font-mono text-[11px] focus:outline-none focus:border-[#3B82F6]"
                        />
                        <span className="text-[#71717A] text-[9px]">%</span>
                      </div>
                      {markdownLadder.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMarkdownTier(idx)}
                          className="text-[#71717A] hover:text-[#EF4444] p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-[#27272A] flex items-center justify-between sticky bottom-0 bg-[#151518] z-10">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-[#0A0A0B] hover:bg-[#27272A] border border-[#27272A] text-[#D1D5DB] font-mono text-[11px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#71717A]" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-[2px] text-[#71717A] hover:text-white font-mono text-[11px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-assumptions"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1 rounded-[2px] bg-[#3B82F6] hover:bg-blue-500 text-white font-mono text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {isSaving ? 'Recalculating...' : 'Save & Recalculate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
