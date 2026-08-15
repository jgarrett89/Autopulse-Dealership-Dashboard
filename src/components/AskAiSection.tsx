import {
  AlertCircle,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { AiAskResponse } from '../types/dealership.js';
import { AiChartRenderer } from './AiChartRenderer.js';

interface AskAiSectionProps {
  onAsk: (question: string) => Promise<AiAskResponse>;
  isLoading: boolean;
}

const QUICK_PROMPTS = [
  'Pipeline weighted revenue by stage',
  'Which units need urgent markdowns?',
  'Salesperson gross profit leaderboard',
  'Monthly revenue & gross margin trend',
  'Inventory distribution by brand',
];

export const AskAiSection: React.FC<AskAiSectionProps> = ({ onAsk, isLoading }) => {
  const [question, setQuestion] = useState('');
  const [activeResponse, setActiveResponse] = useState<AiAskResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || isLoading) return;

    setErrorMessage(null);
    try {
      const response = await onAsk(question.trim());
      if (response.error) {
        setErrorMessage(response.insight || response.error);
        setActiveResponse(null);
      } else {
        setActiveResponse(response);
      }
    } catch (err: any) {
      setErrorMessage(
        "Couldn't read that one. Try naming a metric like forecast, markdown, sales, inventory, or leads."
      );
      setActiveResponse(null);
    }
  };

  const handleQuickPrompt = async (promptText: string) => {
    setQuestion(promptText);
    setErrorMessage(null);
    try {
      const response = await onAsk(promptText);
      if (response.error) {
        setErrorMessage(response.insight || response.error);
        setActiveResponse(null);
      } else {
        setActiveResponse(response);
      }
    } catch (err: any) {
      setErrorMessage(
        "Couldn't read that one. Try naming a metric like forecast, markdown, sales, inventory, or leads."
      );
    }
  };

  return (
    <section className="mb-4" aria-label="AI Dealership Copilot">
      <div className="rounded-[4px] bg-[#151518] border border-[#27272A] shadow-none overflow-hidden relative">
        {/* Top Header bar of AI Assistant */}
        <div className="px-3 py-2 bg-[#1C1C21] border-b border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[2px] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#3B82F6]" />
            </div>
            <span className="text-xs font-mono font-semibold text-white flex items-center gap-2">
              Gemini Dealership Copilot
              <span className="text-[9px] font-mono font-normal uppercase px-1 py-0.2 rounded-[2px] bg-blue-500/10 text-[#3B82F6] border border-blue-500/30">
                Ground-Truth Math
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-[2px] text-[#71717A] hover:text-[#D1D5DB] hover:bg-[#27272A] transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse AI panel' : 'Expand AI panel'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3">
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative flex items-center mb-2.5">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3B82F6]">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <input
                id="input-ai-ask"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask dealership queries (e.g. 'Pipeline weighted revenue by stage' or 'Which units need markdown?')..."
                className="w-full pl-9 pr-20 py-2 rounded-[3px] bg-[#0A0A0B] border border-[#27272A] text-xs text-[#D1D5DB] placeholder-[#71717A] focus:outline-none focus:border-[#3B82F6] transition-all font-mono"
                disabled={isLoading}
              />
              <button
                id="btn-ai-submit"
                type="submit"
                disabled={isLoading || !question.trim()}
                className="absolute right-1.5 px-2.5 py-1 rounded-[2px] bg-[#3B82F6] hover:bg-blue-500 disabled:bg-[#27272A] text-white disabled:text-[#71717A] text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Run...</span>
                  </>
                ) : (
                  <>
                    <span>Query</span>
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Prompt Badges */}
            <div className="flex items-center flex-wrap gap-1 mb-1">
              <span className="text-[10px] text-[#71717A] font-mono mr-1">Quick:</span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isLoading}
                  className="px-2 py-0.5 rounded-[2px] text-[11px] font-mono bg-[#0A0A0B] hover:bg-[#1C1C21] text-[#D1D5DB] hover:text-white border border-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                id="ai-error-callout"
                className="mt-2.5 p-2.5 rounded-[3px] bg-[#151518] border border-[#FBBF24] text-[#FBBF24] text-xs flex items-start gap-2 font-mono"
              >
                <AlertCircle className="w-3.5 h-3.5 text-[#FBBF24] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Query Notice</p>
                  <p className="mt-0.5 opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Active AI Response Chart & Insight */}
            {activeResponse && !errorMessage && (
              <div id="ai-response-panel" className="mt-3 pt-3 border-t border-[#27272A]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <h3 className="text-xs font-semibold text-white font-mono">
                      {activeResponse.title}
                    </h3>
                    <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded-[2px] bg-[#0A0A0B] text-[#71717A] border border-[#27272A]">
                      {activeResponse.chartType}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveResponse(null)}
                    className="text-[#71717A] hover:text-[#D1D5DB] text-xs flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Render Chart */}
                <div className="bg-[#0A0A0B] rounded-[3px] p-2.5 border border-[#27272A]">
                  <AiChartRenderer spec={activeResponse} />
                </div>

                {/* Insight Callout */}
                <div className="mt-2 p-2.5 rounded-[3px] bg-[#151518] border border-[#3B82F6]/40 text-xs text-[#D1D5DB] flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#3B82F6] block font-mono text-[10px] uppercase tracking-wider mb-0.5">
                      Executive Insight
                    </span>
                    <p className="leading-relaxed font-sans text-xs">{activeResponse.insight}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
