import { GoogleGenAI, Type } from '@google/genai';
import { AiAskResponse, DealershipDashboardData } from '../src/types/dealership.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[GeminiService] GEMINI_API_KEY is not set');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askDealershipAi(
  question: string,
  dashboardData: DealershipDashboardData
): Promise<AiAskResponse> {
  const fallbackErrorMessage =
    "Couldn't read that one. Try naming a metric like forecast, markdown, sales, inventory, or leads.";

  const ai = getAiClient();
  if (!ai) {
    // Provide a smart deterministic answer if key is missing
    return generateDeterministicFallback(question, dashboardData, fallbackErrorMessage);
  }

  // Prepare condensed context so token limits are respected and answers are grounded in real data
  const contextSummary = {
    kpis: dashboardData.kpis,
    forecastPipeline: {
      stages: dashboardData.forecastPipeline.stages,
      weightedOpen: dashboardData.forecastPipeline.weightedOpen,
      bookedWon: dashboardData.forecastPipeline.bookedWon,
      projectedTotal: dashboardData.forecastPipeline.projectedTotal,
      openDealCount: dashboardData.forecastPipeline.openDealCount,
      totalOpenPipelineValue: dashboardData.forecastPipeline.totalOpenPipelineValue,
    },
    inventoryRisk: {
      tierCounts: dashboardData.inventoryRisk.tierCounts,
      totalInventoryCount: dashboardData.inventoryRisk.totalInventoryCount,
      totalInventoryValue: dashboardData.inventoryRisk.totalInventoryValue,
      topAtRiskUnits: dashboardData.inventoryRisk.atRiskUnits.slice(0, 8).map((u) => ({
        vehicle: `${u.year} ${u.make} ${u.model}`,
        vin: u.vin,
        daysOnLot: u.days_on_lot,
        riskTier: u.riskTier,
        listPrice: u.list_price,
        cost: u.cost,
        markdownPct: `${(u.markdownPct * 100).toFixed(0)}%`,
        markdownAmount: u.markdownAmount,
        suggestedPrice: u.suggestedPrice,
      })),
    },
    standingCharts: {
      salesByMonth: dashboardData.standingCharts.salesByMonth,
      agingBuckets: dashboardData.standingCharts.agingBuckets,
      unitsByMake: dashboardData.standingCharts.unitsByMake,
      leadFunnel: dashboardData.standingCharts.leadFunnel,
      repLeaderboard: dashboardData.standingCharts.repLeaderboard,
    },
    assumptions: dashboardData.assumptions,
  };

  const systemInstruction = `You are the executive AI copilot for an automotive dealership management team.
You answer plain-English dealership questions using ONLY the provided verified mathematical computations and datasets from the dealership spreadsheet.
DO NOT hallucinate or invent numbers. All calculations must trace directly to the provided context.

You must respond strictly in JSON matching the schema:
{
  "chartType": "line" | "area" | "bar" | "scatter" | "pie" | "table",
  "title": string,
  "data": array of flat objects,
  "xKey": string (the key for categorical axis or row identifier),
  "yKeys": array of strings (the numeric metrics plotted on y-axis),
  "insight": string (concise, sharp executive explanation of the numbers and tactical guidance)
}

Formatting requirements for 'data':
- Ensure numeric values are raw numbers (not string currency like "$4,000" in chart data, but formatted in insight text).
- For 'pie' or 'bar' charts, use clean keys like "name" / "value", or meaningful keys like "stage" / "weightedRevenue".
- Keep 'data' to 3 to 10 meaningful items suitable for direct visual charting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `User Query: "${question}"\n\nVerified Dealership Context:\n${JSON.stringify(contextSummary, null, 2)}`,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chartType: {
              type: Type.STRING,
              description: 'One of line, area, bar, scatter, pie, table',
            },
            title: {
              type: Type.STRING,
              description: 'Chart or table title',
            },
            data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
              },
              description: 'Flat array of objects for Recharts rendering',
            },
            xKey: {
              type: Type.STRING,
              description: 'Key representing X-axis category or primary column',
            },
            yKeys: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'Keys representing Y-axis numeric values',
            },
            insight: {
              type: Type.STRING,
              description: 'Executive takeaway and tactical recommendation',
            },
          },
          required: ['chartType', 'title', 'data', 'xKey', 'yKeys', 'insight'],
        },
      },
    });

    const responseText = response.text?.trim() || '';
    const parsed = JSON.parse(responseText);

    // Validate chartType
    const validChartTypes = ['line', 'area', 'bar', 'scatter', 'pie', 'table'];
    if (!validChartTypes.includes(parsed.chartType)) {
      parsed.chartType = 'bar';
    }

    if (!Array.isArray(parsed.data) || parsed.data.length === 0) {
      throw new Error('Empty data returned from model');
    }

    return parsed as AiAskResponse;
  } catch (err: any) {
    console.error('[GeminiService] Error generating structured response:', err?.message || err);
    return generateDeterministicFallback(question, dashboardData, fallbackErrorMessage);
  }
}

function generateDeterministicFallback(
  question: string,
  dashboardData: DealershipDashboardData,
  errorMessage: string
): AiAskResponse {
  const q = question.toLowerCase();

  if (q.includes('markdown') || q.includes('risk') || q.includes('aged') || q.includes('stale')) {
    const data = dashboardData.inventoryRisk.atRiskUnits.slice(0, 6).map((u) => ({
      vehicle: `${u.year} ${u.make} ${u.model.substring(0, 16)}`,
      daysOnLot: u.days_on_lot,
      markdownAmount: u.markdownAmount,
      suggestedPrice: u.suggestedPrice,
      listPrice: u.list_price,
    }));
    return {
      chartType: 'bar',
      title: 'Aged & At-Risk Units Markdown Priority',
      data,
      xKey: 'vehicle',
      yKeys: ['markdownAmount', 'suggestedPrice'],
      insight: `There are ${dashboardData.inventoryRisk.tierCounts.Aged} units in Aged (90+ days) and ${dashboardData.inventoryRisk.tierCounts['At risk']} units in At-Risk (60-89 days). Total recommended price markdown is $${dashboardData.inventoryRisk.atRiskUnits.reduce((a, c) => a + c.markdownAmount, 0).toLocaleString()} across the lot without breaching vehicle acquisition costs.`,
    };
  }

  if (q.includes('forecast') || q.includes('pipeline') || q.includes('revenue') || q.includes('project')) {
    const data = dashboardData.forecastPipeline.stages.map((s) => ({
      stage: s.stage,
      weightedRevenue: Math.round(s.weightedRevenue),
      totalOpportunity: s.totalOpportunity,
      closeRate: `${(s.closeRate * 100).toFixed(0)}%`,
    }));
    return {
      chartType: 'bar',
      title: 'Pipeline Weighted Revenue by Open Stage',
      data,
      xKey: 'stage',
      yKeys: ['weightedRevenue'],
      insight: `Open pipeline value is $${dashboardData.forecastPipeline.totalOpenPipelineValue.toLocaleString()} across ${dashboardData.forecastPipeline.openDealCount} active deals. Probability-weighted revenue expectation is $${Math.round(dashboardData.forecastPipeline.weightedOpen).toLocaleString()}, bringing monthly projected total to $${Math.round(dashboardData.forecastPipeline.projectedTotal).toLocaleString()} combined with $${Math.round(dashboardData.forecastPipeline.bookedWon).toLocaleString()} booked MTD.`,
    };
  }

  if (q.includes('rep') || q.includes('salesperson') || q.includes('leaderboard') || q.includes('team')) {
    const data = dashboardData.standingCharts.repLeaderboard.map((r) => ({
      rep: r.rep,
      grossProfit: r.grossProfit,
      unitsSold: r.unitsSold,
      winRate: r.winRate,
    }));
    return {
      chartType: 'bar',
      title: 'Salesperson Gross Profit Leaderboard',
      data,
      xKey: 'rep',
      yKeys: ['grossProfit'],
      insight: `Top grossing rep is ${dashboardData.standingCharts.repLeaderboard[0]?.rep || 'Leader'} with $${dashboardData.standingCharts.repLeaderboard[0]?.grossProfit.toLocaleString()} gross profit and ${dashboardData.standingCharts.repLeaderboard[0]?.unitsSold} units delivered MTD.`,
    };
  }

  if (q.includes('sales') || q.includes('gross') || q.includes('trend') || q.includes('month')) {
    return {
      chartType: 'area',
      title: 'Monthly Dealership Sales & Gross Performance',
      data: dashboardData.standingCharts.salesByMonth,
      xKey: 'month',
      yKeys: ['revenue', 'gross'],
      insight: `August MTD has generated $${dashboardData.kpis.grossThisMonth.toLocaleString()} in gross profit (${dashboardData.kpis.grossDelta >= 0 ? '+' : ''}$${dashboardData.kpis.grossDelta.toLocaleString()} vs last month) across ${dashboardData.kpis.unitsSoldThisMonth} units delivered.`,
    };
  }

  if (q.includes('make') || q.includes('brand') || q.includes('inventory')) {
    return {
      chartType: 'pie',
      title: 'Inventory Distribution by Make',
      data: dashboardData.standingCharts.unitsByMake.slice(0, 6).map((m) => ({
        name: m.make,
        value: m.count,
        avgPrice: m.avgPrice,
      })),
      xKey: 'name',
      yKeys: ['value'],
      insight: `Dealership lot holds ${dashboardData.kpis.unitsOnLot} units with average age of ${dashboardData.kpis.avgDaysOnLot} days. The top brands on lot are ${dashboardData.standingCharts.unitsByMake.slice(0, 3).map((m) => `${m.make} (${m.count} units)`).join(', ')}.`,
    };
  }

  // If unrecognized
  return {
    chartType: 'bar',
    title: 'Dealership Pipeline & Operations Overview',
    data: dashboardData.forecastPipeline.stages.map((s) => ({
      stage: s.stage,
      weightedRevenue: Math.round(s.weightedRevenue),
    })),
    xKey: 'stage',
    yKeys: ['weightedRevenue'],
    insight: errorMessage,
    error: errorMessage,
  };
}
