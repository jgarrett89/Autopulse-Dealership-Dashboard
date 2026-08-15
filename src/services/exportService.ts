import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DealershipDashboardData } from '../types/dealership.js';

export type ExportDataType = 'inventory' | 'sales_by_month' | 'leaderboard' | 'pipeline_forecast' | 'executive_summary';
export type ExportFormat = 'csv' | 'pdf';

// Helper to trigger browser download
function downloadFile(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format currency
const fmtCurrency = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

// ==========================================
// 1. CSV EXPORT IMPLEMENTATION
// ==========================================
export function exportDashboardCsv(type: ExportDataType, data: DealershipDashboardData) {
  const timestamp = new Date().toISOString().slice(0, 10);
  let csvContent = '';
  let filename = `autopulse_${type}_${timestamp}.csv`;

  switch (type) {
    case 'inventory': {
      filename = `autopulse_inventory_lot_${timestamp}.csv`;
      const headers = [
        'VIN',
        'Make',
        'Model',
        'Year',
        'Powertrain',
        'Days on Lot',
        'Cost ($)',
        'List Price ($)',
        'Risk Tier',
        'Markdown Discount (%)',
        'Markdown Amount ($)',
        'Suggested Price ($)',
        'Projected Gross ($)',
      ];

      const rows = data.inventoryRisk.allUnits.map((item) => [
        `"${item.vin}"`,
        `"${item.make}"`,
        `"${item.model}"`,
        item.year,
        `"${item.powertrain}"`,
        item.days_on_lot,
        item.cost.toFixed(2),
        item.list_price.toFixed(2),
        `"${item.riskTier}"`,
        (item.markdownPct * 100).toFixed(1) + '%',
        item.markdownAmount.toFixed(2),
        item.suggestedPrice.toFixed(2),
        (item.suggestedPrice - item.cost).toFixed(2),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      break;
    }

    case 'sales_by_month': {
      filename = `autopulse_sales_by_month_${timestamp}.csv`;
      const headers = ['Month', 'Units Sold', 'Revenue ($)', 'Gross Profit ($)', 'Gross Margin (%)'];

      const rows = data.standingCharts.salesByMonth.map((m) => {
        const marginPct = m.revenue > 0 ? ((m.gross / m.revenue) * 100).toFixed(1) + '%' : '0.0%';
        return [`"${m.month}"`, m.unitsSold, m.revenue.toFixed(2), m.gross.toFixed(2), `"${marginPct}"`];
      });

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      break;
    }

    case 'leaderboard': {
      filename = `autopulse_salesperson_leaderboard_${timestamp}.csv`;
      const headers = [
        'Rank',
        'Sales Representative',
        'Units Sold',
        'Total Revenue ($)',
        'Gross Profit ($)',
        'Win Rate (%)',
        'Active Pipeline ($)',
        'Active Deals Count',
      ];

      const sorted = [...data.standingCharts.repLeaderboard].sort((a, b) => b.unitsSold - a.unitsSold);
      const rows = sorted.map((rep, idx) => [
        idx + 1,
        `"${rep.rep}"`,
        rep.unitsSold,
        rep.totalRevenue.toFixed(2),
        rep.grossProfit.toFixed(2),
        (rep.winRate * 100).toFixed(1) + '%',
        rep.openPipeline.toFixed(2),
        rep.activeDeals,
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      break;
    }

    case 'pipeline_forecast': {
      filename = `autopulse_pipeline_forecast_summary_${timestamp}.csv`;
      const headers = [
        'Pipeline Stage',
        'Active Deals Count',
        'Total Opportunity Value ($)',
        'Historical Close Rate (%)',
        'Weighted Forecasted Revenue ($)',
      ];

      const rows = data.forecastPipeline.stages.map((st) => [
        `"${st.stage}"`,
        st.dealCount,
        st.totalOpportunity.toFixed(2),
        (st.closeRate * 100).toFixed(1) + '%',
        st.weightedRevenue.toFixed(2),
      ]);

      // Summary row
      rows.push([
        '"TOTAL / WEIGHTED FORECAST"',
        data.forecastPipeline.openDealCount,
        data.forecastPipeline.totalOpenPipelineValue.toFixed(2),
        '-',
        data.forecastPipeline.weightedOpen.toFixed(2),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      break;
    }

    case 'executive_summary': {
      filename = `autopulse_executive_full_summary_${timestamp}.csv`;
      const sections = [
        '# AUTOPULSE DEALERSHIP EXECUTIVE REPORT',
        `# Generated: ${new Date().toLocaleString()}`,
        `# Data Source: ${data.sourceInfo.type === 'google_sheets' ? 'Google Sheets' : 'Active Store'}`,
        '',
        '--- EXECUTIVE KPIS ---',
        'Metric,Value',
        `Units on Lot,${data.kpis.unitsOnLot}`,
        `Average Days on Lot,${data.kpis.avgDaysOnLot.toFixed(1)} days`,
        `Units Sold MTD,${data.kpis.unitsSoldThisMonth}`,
        `Gross Profit MTD,$${data.kpis.grossThisMonth.toFixed(2)}`,
        `Pipeline Weighted Forecast,$${data.kpis.pipelineForecastOpen.toFixed(2)}`,
        `Lead Conversion Rate,${(data.kpis.leadConversionRate * 100).toFixed(1)}%`,
        `Aged Units (90+ Days),${data.kpis.unitsAged90Plus}`,
        '',
        '--- PIPELINE FORECAST ---',
        'Stage,Deals,Opportunity ($),Close Rate (%),Weighted Revenue ($)',
        ...data.forecastPipeline.stages.map(
          (s) => `"${s.stage}",${s.dealCount},${s.totalOpportunity.toFixed(2)},${(s.closeRate * 100).toFixed(1)}%,${s.weightedRevenue.toFixed(2)}`
        ),
        '',
        '--- SALES BY MONTH ---',
        'Month,Units Sold,Revenue ($),Gross ($)',
        ...data.standingCharts.salesByMonth.map((m) => `"${m.month}",${m.unitsSold},${m.revenue.toFixed(2)},${m.gross.toFixed(2)}`),
        '',
        '--- SALESPERSON LEADERBOARD ---',
        'Salesperson,Units Sold,Revenue ($),Gross ($),Win Rate (%)',
        ...data.standingCharts.repLeaderboard.map(
          (r) => `"${r.rep}",${r.unitsSold},${r.totalRevenue.toFixed(2)},${r.grossProfit.toFixed(2)},${(r.winRate * 100).toFixed(1)}%`
        ),
      ];

      csvContent = sections.join('\r\n');
      break;
    }
  }

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

// ==========================================
// 2. PDF EXPORT IMPLEMENTATION (Clean & Readable)
// ==========================================
export function exportDashboardPdf(type: ExportDataType, data: DealershipDashboardData) {
  const doc = new jsPDF({
    orientation: type === 'inventory' || type === 'executive_summary' ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const timestamp = new Date().toLocaleString();
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = `autopulse_${type}_${dateStr}.pdf`;

  // Header Banner styling
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 20, 34); // #0F1422
  doc.rect(0, 0, pageWidth, 54, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AUTOPULSE DEALERSHIP OPERATIONS', 24, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text(`Generated: ${timestamp}  |  Apex Motors Group  |  Source: ${data.sourceInfo.type === 'google_sheets' ? 'Google Sheets' : 'Active Synchronized Store'}`, 24, 44);

  let currentY = 70;

  switch (type) {
    case 'inventory': {
      filename = `autopulse_inventory_lot_${dateStr}.pdf`;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('CURRENT VEHICLE INVENTORY & RISK TIER STATUS', 24, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Units: ${data.inventoryRisk.totalInventoryCount}  |  Total Inventory Value: ${fmtCurrency(data.inventoryRisk.totalInventoryValue)}  |  Aged Units (90+ d): ${data.kpis.unitsAged90Plus}`, 24, currentY + 14);

      currentY += 24;

      const tableData = data.inventoryRisk.allUnits.map((item) => [
        item.vin,
        `${item.year} ${item.make} ${item.model}`,
        item.powertrain,
        `${item.days_on_lot}d`,
        fmtCurrency(item.cost),
        fmtCurrency(item.list_price),
        item.riskTier,
        `${(item.markdownPct * 100).toFixed(0)}% (${fmtCurrency(item.markdownAmount)})`,
        fmtCurrency(item.suggestedPrice),
        fmtCurrency(item.suggestedPrice - item.cost),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['VIN', 'Vehicle', 'Power', 'Age', 'Cost', 'List Price', 'Tier', 'Discount', 'Sug. Price', 'Margin']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 80, font: 'courier' },
          1: { cellWidth: 120 },
          2: { cellWidth: 45 },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 55, halign: 'right' },
          5: { cellWidth: 55, halign: 'right' },
          6: { cellWidth: 50 },
          7: { cellWidth: 85, halign: 'right' },
          8: { cellWidth: 60, halign: 'right' },
          9: { cellWidth: 55, halign: 'right' },
        },
        margin: { left: 24, right: 24 },
      });
      break;
    }

    case 'sales_by_month': {
      filename = `autopulse_sales_by_month_${dateStr}.pdf`;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('MONTHLY SALES PERFORMANCE & GROSS PROFIT', 24, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Historical revenue, gross profit, and unit volume by calendar month', 24, currentY + 14);

      currentY += 24;

      const tableData = data.standingCharts.salesByMonth.map((m) => {
        const marginPct = m.revenue > 0 ? ((m.gross / m.revenue) * 100).toFixed(1) + '%' : '0.0%';
        const avgRevPerUnit = m.unitsSold > 0 ? fmtCurrency(m.revenue / m.unitsSold) : '$0';
        return [m.month, m.unitsSold.toString(), fmtCurrency(m.revenue), fmtCurrency(m.gross), marginPct, avgRevPerUnit];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Month', 'Units Sold', 'Total Revenue', 'Gross Profit', 'Gross Margin %', 'Avg Rev / Unit']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
        },
        margin: { left: 24, right: 24 },
      });
      break;
    }

    case 'leaderboard': {
      filename = `autopulse_salesperson_leaderboard_${dateStr}.pdf`;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('SALESPERSON PERFORMANCE LEADERBOARD', 24, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Rep performance metrics, units closed, win conversion rates, and active pipelines', 24, currentY + 14);

      currentY += 24;

      const sorted = [...data.standingCharts.repLeaderboard].sort((a, b) => b.unitsSold - a.unitsSold);
      const tableData = sorted.map((rep, idx) => [
        `#${idx + 1}`,
        rep.rep,
        rep.unitsSold.toString(),
        fmtCurrency(rep.totalRevenue),
        fmtCurrency(rep.grossProfit),
        fmtPct(rep.winRate),
        fmtCurrency(rep.openPipeline),
        rep.activeDeals.toString(),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Rank', 'Sales Representative', 'Units Sold', 'Revenue', 'Gross Profit', 'Win Rate %', 'Active Pipeline', 'Deals']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 35, fontStyle: 'bold' },
          1: { fontStyle: 'bold' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'right' },
        },
        margin: { left: 24, right: 24 },
      });
      break;
    }

    case 'pipeline_forecast': {
      filename = `autopulse_pipeline_forecast_${dateStr}.pdf`;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('PIPELINE REVENUE FORECAST & CONVERSION MODEL', 24, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Total Open Deals: ${data.forecastPipeline.openDealCount}  |  Gross Pipeline: ${fmtCurrency(data.forecastPipeline.totalOpenPipelineValue)}  |  Weighted Forecast: ${fmtCurrency(data.forecastPipeline.weightedOpen)}`, 24, currentY + 14);

      currentY += 24;

      const tableData = data.forecastPipeline.stages.map((st) => [
        st.stage,
        st.dealCount.toString(),
        fmtCurrency(st.totalOpportunity),
        fmtPct(st.closeRate),
        fmtCurrency(st.weightedRevenue),
      ]);

      // Add summary total row
      tableData.push([
        'TOTAL OPEN PIPELINE',
        data.forecastPipeline.openDealCount.toString(),
        fmtCurrency(data.forecastPipeline.totalOpenPipelineValue),
        'Weighted Avg',
        fmtCurrency(data.forecastPipeline.weightedOpen),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Pipeline Stage', 'Active Deals', 'Total Opportunity Value', 'Close Rate %', 'Weighted Forecast Revenue']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 6, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 24, right: 24 },
      });
      break;
    }

    case 'executive_summary': {
      filename = `autopulse_executive_report_${dateStr}.pdf`;

      // KPI Summary Grid on Page 1
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('EXECUTIVE KEY PERFORMANCE INDICATORS', 24, currentY);

      currentY += 16;

      const kpiData = [
        ['Units On Lot', `${data.kpis.unitsOnLot} units`],
        ['Average Days On Lot', `${data.kpis.avgDaysOnLot.toFixed(1)} days`],
        ['Units Sold MTD', `${data.kpis.unitsSoldThisMonth} units`],
        ['Gross Profit MTD', fmtCurrency(data.kpis.grossThisMonth)],
        ['Pipeline Weighted Revenue Forecast', fmtCurrency(data.kpis.pipelineForecastOpen)],
        ['Lead Conversion Rate', fmtPct(data.kpis.leadConversionRate)],
        ['Aged Units (>90 Days)', `${data.kpis.unitsAged90Plus} units`],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Operational KPI', 'Current Value']],
        body: kpiData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 24, right: pageWidth / 2 + 10 },
      });

      // Pipeline forecast table next to KPIs
      const pipeData = data.forecastPipeline.stages.map((st) => [
        st.stage,
        st.dealCount.toString(),
        fmtCurrency(st.totalOpportunity),
        fmtPct(st.closeRate),
        fmtCurrency(st.weightedRevenue),
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Stage', 'Deals', 'Opportunity', 'Rate %', 'Weighted Rev']],
        body: pipeData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: pageWidth / 2 - 10, right: 24 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 24;

      // Section 2: Salesperson Leaderboard
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('SALESPERSON LEADERBOARD', 24, currentY);
      currentY += 12;

      const repData = [...data.standingCharts.repLeaderboard]
        .sort((a, b) => b.unitsSold - a.unitsSold)
        .map((r, i) => [
          `#${i + 1}`,
          r.rep,
          r.unitsSold.toString(),
          fmtCurrency(r.totalRevenue),
          fmtCurrency(r.grossProfit),
          fmtPct(r.winRate),
          fmtCurrency(r.openPipeline),
        ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Rank', 'Salesperson', 'Units Sold', 'Revenue', 'Gross Profit', 'Win Rate %', 'Active Pipeline']],
        body: repData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 4, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 24, right: 24 },
      });

      break;
    }
  }

  doc.save(filename);
}
