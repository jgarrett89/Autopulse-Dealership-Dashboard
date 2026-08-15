import {
  AgingBucketPoint,
  Assumptions,
  DealershipDashboardData,
  DealershipKpis,
  FunnelStagePoint,
  InventoryItem,
  InventoryRiskResult,
  LeadItem,
  MakeCountPoint,
  MonthlySalesPoint,
  PipelineForecastResult,
  PipelineStage,
  PriceScatterPoint,
  RepLeaderboardItem,
  RiskInventoryItem,
  RiskTier,
  StagePipelineForecast,
  StandingChartsData,
} from '../src/types/dealership.js';

export function getRiskTier(daysOnLot: number): RiskTier {
  if (daysOnLot >= 90) return 'Aged';
  if (daysOnLot >= 60) return 'At risk';
  if (daysOnLot >= 45) return 'Watch';
  return 'OK';
}

export function getMarkdownPct(daysOnLot: number, ladder: Assumptions['markdownLadder']): number {
  // Find largest min_days_on_lot <= daysOnLot
  let bestPct = 0;
  let maxMinDays = -1;
  for (const tier of ladder) {
    if (daysOnLot >= tier.min_days_on_lot && tier.min_days_on_lot > maxMinDays) {
      maxMinDays = tier.min_days_on_lot;
      bestPct = tier.markdown_pct;
    }
  }
  return bestPct;
}

export function computeInventoryRisk(
  inventory: InventoryItem[],
  assumptions: Assumptions
): InventoryRiskResult {
  const allUnits: RiskInventoryItem[] = inventory.map((unit) => {
    const riskTier = getRiskTier(unit.days_on_lot);
    const markdownPct = getMarkdownPct(unit.days_on_lot, assumptions.markdownLadder);
    const rawDiscountedPrice = unit.list_price * (1 - markdownPct);
    const suggestedPrice = Math.max(unit.cost, Math.round(rawDiscountedPrice));
    const isCostFloorApplied = rawDiscountedPrice < unit.cost;
    const markdownAmount = unit.list_price - suggestedPrice;

    return {
      ...unit,
      riskTier,
      markdownPct,
      markdownAmount,
      suggestedPrice,
      isCostFloorApplied,
    };
  });

  // Sort worst days_on_lot first
  allUnits.sort((a, b) => b.days_on_lot - a.days_on_lot);

  const tierCounts = {
    Aged: 0,
    'At risk': 0,
    Watch: 0,
    OK: 0,
  };

  let totalInventoryValue = 0;
  for (const u of allUnits) {
    tierCounts[u.riskTier]++;
    totalInventoryValue += u.list_price;
  }

  // Filter at-risk units (Aged, At risk, Watch) or top aged for the risk table
  const atRiskUnits = allUnits.filter((u) => u.riskTier !== 'OK');

  return {
    tierCounts,
    totalInventoryCount: allUnits.length,
    totalInventoryValue,
    atRiskUnits,
    allUnits,
  };
}

export function computePipelineForecast(
  leads: LeadItem[],
  assumptions: Assumptions,
  currentMonthWonRevenue: number
): PipelineForecastResult {
  const openStages: PipelineStage[] = ['New', 'Contacted', 'Test Drive', 'Negotiation'];
  
  const stageStats: Record<PipelineStage, { dealCount: number; totalOpportunity: number }> = {
    New: { dealCount: 0, totalOpportunity: 0 },
    Contacted: { dealCount: 0, totalOpportunity: 0 },
    'Test Drive': { dealCount: 0, totalOpportunity: 0 },
    Negotiation: { dealCount: 0, totalOpportunity: 0 },
    Won: { dealCount: 0, totalOpportunity: 0 },
    Lost: { dealCount: 0, totalOpportunity: 0 },
  };

  for (const lead of leads) {
    if (stageStats[lead.pipeline_stage]) {
      stageStats[lead.pipeline_stage].dealCount++;
      stageStats[lead.pipeline_stage].totalOpportunity += lead.opportunity_value || 0;
    }
  }

  let weightedOpen = 0;
  let openDealCount = 0;
  let totalOpenPipelineValue = 0;

  const stages: StagePipelineForecast[] = openStages.map((stage) => {
    const count = stageStats[stage].dealCount;
    const totalOpp = stageStats[stage].totalOpportunity;
    const rate = assumptions.closeRates[stage] ?? 0;
    const weighted = totalOpp * rate;

    weightedOpen += weighted;
    openDealCount += count;
    totalOpenPipelineValue += totalOpp;

    return {
      stage,
      dealCount: count,
      totalOpportunity: totalOpp,
      closeRate: rate,
      weightedRevenue: weighted,
    };
  });

  const bookedWon = currentMonthWonRevenue;
  const projectedTotal = bookedWon + weightedOpen;

  return {
    stages,
    weightedOpen,
    bookedWon,
    projectedTotal,
    openDealCount,
    totalOpenPipelineValue,
  };
}

export function computeStandingCharts(
  inventory: InventoryItem[],
  leads: LeadItem[],
  assumptions: Assumptions
): StandingChartsData {
  // 1. Monthly sales & units (area chart)
  const monthMap: Record<string, { revenue: number; gross: number; unitsSold: number }> = {};
  
  // Initialize last 4 months
  const months = ['2026-05', '2026-06', '2026-07', '2026-08'];
  for (const m of months) {
    monthMap[m] = { revenue: 0, gross: 0, unitsSold: 0 };
  }

  for (const lead of leads) {
    if (lead.pipeline_stage === 'Won' && lead.won_date) {
      const ym = lead.won_date.substring(0, 7);
      if (!monthMap[ym]) {
        monthMap[ym] = { revenue: 0, gross: 0, unitsSold: 0 };
      }
      monthMap[ym].revenue += lead.opportunity_value;
      // Dealership front-end and back-end gross margin (~13.5%)
      monthMap[ym].gross += Math.round(lead.opportunity_value * 0.135);
      monthMap[ym].unitsSold += 1;
    }
  }

  const monthLabels: Record<string, string> = {
    '2026-05': 'May 2026',
    '2026-06': 'Jun 2026',
    '2026-07': 'Jul 2026',
    '2026-08': 'Aug 2026 (MTD)',
  };

  const salesByMonth: MonthlySalesPoint[] = Object.keys(monthMap)
    .sort()
    .map((ym) => ({
      month: monthLabels[ym] || ym,
      revenue: monthMap[ym].revenue,
      gross: monthMap[ym].gross,
      unitsSold: monthMap[ym].unitsSold,
    }));

  // 2. Inventory aging buckets: 0-30 / 31-60 / 61-90 / 90+
  const buckets: Record<string, { count: number; value: number }> = {
    '0-30': { count: 0, value: 0 },
    '31-60': { count: 0, value: 0 },
    '61-90': { count: 0, value: 0 },
    '90+': { count: 0, value: 0 },
  };

  for (const item of inventory) {
    const d = item.days_on_lot;
    if (d <= 30) {
      buckets['0-30'].count++;
      buckets['0-30'].value += item.list_price;
    } else if (d <= 60) {
      buckets['31-60'].count++;
      buckets['31-60'].value += item.list_price;
    } else if (d <= 90) {
      buckets['61-90'].count++;
      buckets['61-90'].value += item.list_price;
    } else {
      buckets['90+'].count++;
      buckets['90+'].value += item.list_price;
    }
  }

  const agingBuckets: AgingBucketPoint[] = [
    { bucket: '0-30', count: buckets['0-30'].count, value: buckets['0-30'].value, isAmber: false },
    { bucket: '31-60', count: buckets['31-60'].count, value: buckets['31-60'].value, isAmber: false },
    { bucket: '61-90', count: buckets['61-90'].count, value: buckets['61-90'].value, isAmber: false },
    { bucket: '90+', count: buckets['90+'].count, value: buckets['90+'].value, isAmber: true },
  ];

  // 3. Units by make
  const makeMap: Record<string, { count: number; totalValue: number }> = {};
  for (const item of inventory) {
    if (!makeMap[item.make]) {
      makeMap[item.make] = { count: 0, totalValue: 0 };
    }
    makeMap[item.make].count++;
    makeMap[item.make].totalValue += item.list_price;
  }

  const unitsByMake: MakeCountPoint[] = Object.keys(makeMap)
    .map((make) => ({
      make,
      count: makeMap[make].count,
      totalValue: makeMap[make].totalValue,
      avgPrice: Math.round(makeMap[make].totalValue / makeMap[make].count),
    }))
    .sort((a, b) => b.count - a.count);

  // 4. List price vs days on lot (scatter)
  const priceVsDaysScatter: PriceScatterPoint[] = inventory.map((item) => {
    const riskTier = getRiskTier(item.days_on_lot);
    const markdownPct = getMarkdownPct(item.days_on_lot, assumptions.markdownLadder);
    const suggestedPrice = Math.max(item.cost, Math.round(item.list_price * (1 - markdownPct)));
    return {
      vin: item.vin,
      vehicle: `${item.year} ${item.make} ${item.model}`,
      daysOnLot: item.days_on_lot,
      listPrice: item.list_price,
      cost: item.cost,
      suggestedPrice,
      riskTier,
      margin: item.list_price - item.cost,
    };
  });

  // 5. Lead funnel by stage
  const stageOrder: PipelineStage[] = ['New', 'Contacted', 'Test Drive', 'Negotiation', 'Won', 'Lost'];
  const funnelMap: Record<PipelineStage, { count: number; totalValue: number }> = {
    New: { count: 0, totalValue: 0 },
    Contacted: { count: 0, totalValue: 0 },
    'Test Drive': { count: 0, totalValue: 0 },
    Negotiation: { count: 0, totalValue: 0 },
    Won: { count: 0, totalValue: 0 },
    Lost: { count: 0, totalValue: 0 },
  };

  for (const lead of leads) {
    if (funnelMap[lead.pipeline_stage]) {
      funnelMap[lead.pipeline_stage].count++;
      funnelMap[lead.pipeline_stage].totalValue += lead.opportunity_value;
    }
  }

  const totalLeadsCount = leads.length || 1;
  const leadFunnel: FunnelStagePoint[] = stageOrder.map((stage) => ({
    stage,
    count: funnelMap[stage].count,
    totalValue: funnelMap[stage].totalValue,
    conversionRate: Math.round((funnelMap[stage].count / totalLeadsCount) * 100),
  }));

  // 6. Salesperson leaderboard by gross
  const repMap: Record<
    string,
    { unitsSold: number; totalRevenue: number; grossProfit: number; wonCount: number; totalAssigned: number; openPipeline: number; activeDeals: number }
  > = {};

  for (const lead of leads) {
    const rep = lead.assigned_rep || 'Unassigned';
    if (!repMap[rep]) {
      repMap[rep] = { unitsSold: 0, totalRevenue: 0, grossProfit: 0, wonCount: 0, totalAssigned: 0, openPipeline: 0, activeDeals: 0 };
    }
    repMap[rep].totalAssigned++;

    if (lead.pipeline_stage === 'Won') {
      repMap[rep].unitsSold++;
      repMap[rep].wonCount++;
      repMap[rep].totalRevenue += lead.opportunity_value;
      repMap[rep].grossProfit += Math.round(lead.opportunity_value * 0.135);
    } else if (lead.pipeline_stage !== 'Lost') {
      repMap[rep].activeDeals++;
      repMap[rep].openPipeline += lead.opportunity_value;
    }
  }

  const repLeaderboard: RepLeaderboardItem[] = Object.keys(repMap)
    .map((rep) => ({
      rep,
      unitsSold: repMap[rep].unitsSold,
      grossProfit: repMap[rep].grossProfit,
      totalRevenue: repMap[rep].totalRevenue,
      winRate: Math.round((repMap[rep].wonCount / (repMap[rep].totalAssigned || 1)) * 100),
      openPipeline: repMap[rep].openPipeline,
      activeDeals: repMap[rep].activeDeals,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit);

  return {
    salesByMonth,
    agingBuckets,
    unitsByMake,
    priceVsDaysScatter,
    leadFunnel,
    repLeaderboard,
  };
}

export function computeDealershipData(
  inventory: InventoryItem[],
  leads: LeadItem[],
  assumptions: Assumptions,
  sourceInfoExtra: {
    type: 'google_sheets' | 'live_dataset';
    spreadsheetId?: string;
    sheetName?: string;
    isMockOrFallback: boolean;
  }
): DealershipDashboardData {
  // Current month (August 2026) vs Prior month (July 2026)
  let unitsSoldThisMonth = 0;
  let revenueThisMonth = 0;
  let grossThisMonth = 0;

  let unitsSoldLastMonth = 0;
  let revenueLastMonth = 0;
  let grossLastMonth = 0;

  let totalWonLeads = 0;

  for (const lead of leads) {
    if (lead.pipeline_stage === 'Won') {
      totalWonLeads++;
      if (lead.won_date?.startsWith('2026-08')) {
        unitsSoldThisMonth++;
        revenueThisMonth += lead.opportunity_value;
        grossThisMonth += Math.round(lead.opportunity_value * 0.135);
      } else if (lead.won_date?.startsWith('2026-07')) {
        unitsSoldLastMonth++;
        revenueLastMonth += lead.opportunity_value;
        grossLastMonth += Math.round(lead.opportunity_value * 0.135);
      }
    }
  }

  // Inventory stats
  const unitsOnLot = inventory.length;
  const sumDays = inventory.reduce((acc, curr) => acc + curr.days_on_lot, 0);
  const avgDaysOnLot = unitsOnLot > 0 ? Math.round(sumDays / unitsOnLot) : 0;
  const avgDaysAmber = avgDaysOnLot > 45;

  const unitsAged90Plus = inventory.filter((item) => item.days_on_lot >= 90).length;
  const unitsAged90Amber = unitsAged90Plus > 0;

  const leadConversionRate = leads.length > 0 ? Number(((totalWonLeads / leads.length) * 100).toFixed(1)) : 0;

  const inventoryRisk = computeInventoryRisk(inventory, assumptions);
  const forecastPipeline = computePipelineForecast(leads, assumptions, revenueThisMonth);
  const standingCharts = computeStandingCharts(inventory, leads, assumptions);

  const kpis: DealershipKpis = {
    unitsOnLot,
    avgDaysOnLot,
    avgDaysAmber,
    unitsSoldThisMonth,
    unitsSoldDelta: unitsSoldThisMonth - unitsSoldLastMonth,
    grossThisMonth,
    grossDelta: grossThisMonth - grossLastMonth,
    pipelineForecastOpen: Math.round(forecastPipeline.weightedOpen),
    leadConversionRate,
    unitsAged90Plus,
    unitsAged90Amber,
  };

  return {
    kpis,
    forecastPipeline,
    inventoryRisk,
    standingCharts,
    assumptions,
    sourceInfo: {
      ...sourceInfoExtra,
      lastSynced: new Date().toISOString(),
      inventoryCount: inventory.length,
      leadsCount: leads.length,
    },
  };
}
