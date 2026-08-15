export type Powertrain = 'Gas' | 'Hybrid' | 'EV' | 'PHEV' | 'Diesel';

export type PipelineStage = 'New' | 'Contacted' | 'Test Drive' | 'Negotiation' | 'Won' | 'Lost';

export type RiskTier = 'OK' | 'Watch' | 'At risk' | 'Aged';

export interface InventoryItem {
  vin: string;
  make: string;
  model: string;
  year: number;
  powertrain: Powertrain;
  cost: number;
  list_price: number;
  days_on_lot: number;
}

export interface LeadItem {
  lead_id: string;
  created_date: string;
  source: string;
  pipeline_stage: PipelineStage;
  opportunity_value: number;
  assigned_rep: string;
  won_date?: string | null;
}

export interface StageCloseRate {
  stage: PipelineStage;
  close_rate: number; // e.g. 0.25 for 25%
}

export interface MarkdownTier {
  min_days_on_lot: number;
  markdown_pct: number; // e.g. 0.08 for 8%
}

export interface Assumptions {
  closeRates: Record<PipelineStage, number>;
  markdownLadder: MarkdownTier[];
}

export interface DealershipKpis {
  unitsOnLot: number;
  avgDaysOnLot: number;
  avgDaysAmber: boolean; // > 45
  unitsSoldThisMonth: number;
  unitsSoldDelta: number; // vs last month
  grossThisMonth: number;
  grossDelta: number; // vs last month
  pipelineForecastOpen: number; // weighted expected revenue (outlined)
  leadConversionRate: number; // Won / total leads
  unitsAged90Plus: number;
  unitsAged90Amber: boolean; // > 0
}

export interface StagePipelineForecast {
  stage: PipelineStage;
  dealCount: number;
  totalOpportunity: number;
  closeRate: number;
  weightedRevenue: number;
}

export interface PipelineForecastResult {
  stages: StagePipelineForecast[];
  weightedOpen: number;
  bookedWon: number;
  projectedTotal: number;
  openDealCount: number;
  totalOpenPipelineValue: number;
}

export interface RiskInventoryItem extends InventoryItem {
  riskTier: RiskTier;
  markdownPct: number;
  markdownAmount: number;
  suggestedPrice: number;
  isCostFloorApplied: boolean;
}

export interface InventoryRiskResult {
  tierCounts: {
    Aged: number;
    'At risk': number;
    Watch: number;
    OK: number;
  };
  totalInventoryCount: number;
  totalInventoryValue: number;
  atRiskUnits: RiskInventoryItem[]; // sorted worst days_on_lot first
  allUnits: RiskInventoryItem[];
}

export interface MonthlySalesPoint {
  month: string; // e.g. "2026-03" or "Mar '26"
  revenue: number;
  gross: number;
  unitsSold: number;
}

export interface AgingBucketPoint {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  count: number;
  value: number;
  isAmber: boolean;
}

export interface MakeCountPoint {
  make: string;
  count: number;
  avgPrice: number;
  totalValue: number;
}

export interface PriceScatterPoint {
  vin: string;
  vehicle: string;
  daysOnLot: number;
  listPrice: number;
  cost: number;
  suggestedPrice: number;
  riskTier: RiskTier;
  margin: number;
}

export interface FunnelStagePoint {
  stage: PipelineStage;
  count: number;
  totalValue: number;
  conversionRate: number;
}

export interface RepLeaderboardItem {
  rep: string;
  unitsSold: number;
  grossProfit: number;
  totalRevenue: number;
  winRate: number;
  openPipeline: number;
  activeDeals: number;
}

export interface StandingChartsData {
  salesByMonth: MonthlySalesPoint[];
  agingBuckets: AgingBucketPoint[];
  unitsByMake: MakeCountPoint[];
  priceVsDaysScatter: PriceScatterPoint[];
  leadFunnel: FunnelStagePoint[];
  repLeaderboard: RepLeaderboardItem[];
}

export interface DealershipDashboardData {
  kpis: DealershipKpis;
  forecastPipeline: PipelineForecastResult;
  inventoryRisk: InventoryRiskResult;
  standingCharts: StandingChartsData;
  assumptions: Assumptions;
  sourceInfo: {
    type: 'google_sheets' | 'live_dataset';
    spreadsheetId?: string;
    sheetName?: string;
    lastSynced: string;
    isMockOrFallback: boolean;
    inventoryCount: number;
    leadsCount: number;
  };
}

export interface AiAskResponse {
  chartType: 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'table';
  title: string;
  data: Array<Record<string, any>>;
  xKey: string;
  yKeys: string[];
  insight: string;
  error?: string;
}
