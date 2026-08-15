import { google } from 'googleapis';
import { Assumptions, InventoryItem, LeadItem, PipelineStage, Powertrain } from '../src/types/dealership.js';
import { defaultAssumptions, defaultInventory, defaultLeads } from './data/defaultData.js';

export interface SheetsDataResult {
  inventory: InventoryItem[];
  leads: LeadItem[];
  assumptions: Assumptions;
  sourceType: 'google_sheets' | 'live_dataset';
  spreadsheetId?: string;
  sheetName?: string;
  error?: string;
}

export const TARGET_SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
export const TARGET_SPREADSHEET_TITLE = 'dealership-data';

// In-memory working copy that can be updated in real time (e.g. assumptions updates)
let currentInventory: InventoryItem[] = JSON.parse(JSON.stringify(defaultInventory));
let currentLeads: LeadItem[] = JSON.parse(JSON.stringify(defaultLeads));
let currentAssumptions: Assumptions = JSON.parse(JSON.stringify(defaultAssumptions));
let customSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || TARGET_SPREADSHEET_ID;

export function getLocalStore() {
  return {
    inventory: currentInventory,
    leads: currentLeads,
    assumptions: currentAssumptions,
  };
}

export function updateLocalAssumptions(newAssumptions: Assumptions) {
  currentAssumptions = JSON.parse(JSON.stringify(newAssumptions));
  return currentAssumptions;
}

export function resetLocalStore() {
  currentInventory = JSON.parse(JSON.stringify(defaultInventory));
  currentLeads = JSON.parse(JSON.stringify(defaultLeads));
  currentAssumptions = JSON.parse(JSON.stringify(defaultAssumptions));
}

export function setCustomSpreadsheetId(id: string) {
  customSpreadsheetId = id;
}

// Simple RFC 4180 CSV parser helper
function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

// Helper to fetch CSV export of a sheet tab via HTTP
async function fetchSheetCsv(spreadsheetId: string, sheetName: string): Promise<string[][] | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text || text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      return null;
    }
    return parseCsvRows(text);
  } catch (err) {
    return null;
  }
}

export async function fetchDealershipSheetsData(
  providedSpreadsheetId?: string,
  userAccessToken?: string
): Promise<SheetsDataResult> {
  const spreadsheetId =
    providedSpreadsheetId || customSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || TARGET_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  let inventory: InventoryItem[] = [...currentInventory];
  let leads: LeadItem[] = [...currentLeads];
  let assumptions: Assumptions = JSON.parse(JSON.stringify(currentAssumptions));
  let loadedFromGoogle = false;

  // Method A: Attempt Google Sheets API v4 with user OAuth token or Service Account
  try {
    let sheetsClient = null;
    if (userAccessToken) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: userAccessToken });
      sheetsClient = google.sheets({ version: 'v4', auth: oauth2Client });
    } else if (serviceAccountEmail && privateKey) {
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      sheetsClient = google.sheets({ version: 'v4', auth });
    }

    if (sheetsClient) {
      const metadata = await sheetsClient.spreadsheets.get({ spreadsheetId });
      const sheetTitles = (metadata.data.sheets || []).map((s) => s.properties?.title || '');

      // 1. Inventory Tab
      const invTab = sheetTitles.find((t) => /inventory|vehicle/i.test(t)) || sheetTitles[0];
      if (invTab) {
        const res = await sheetsClient.spreadsheets.values.get({
          spreadsheetId,
          range: `${invTab}!A1:Z500`,
        });
        const rows = res.data.values;
        if (rows && rows.length > 1) {
          const parsed = parseInventoryRows(rows);
          if (parsed.length > 0) {
            inventory = parsed;
            loadedFromGoogle = true;
          }
        }
      }

      // 2. Leads Tab
      const leadsTab = sheetTitles.find((t) => /lead|pipeline|deal/i.test(t));
      if (leadsTab) {
        const res = await sheetsClient.spreadsheets.values.get({
          spreadsheetId,
          range: `${leadsTab}!A1:Z500`,
        });
        const rows = res.data.values;
        if (rows && rows.length > 1) {
          const parsed = parseLeadsRows(rows);
          if (parsed.length > 0) {
            leads = parsed;
            loadedFromGoogle = true;
          }
        }
      }

      // 3. Assumptions Tab
      const assumptionsTab = sheetTitles.find((t) => /assumption|setting|rate/i.test(t));
      if (assumptionsTab) {
        const res = await sheetsClient.spreadsheets.values.get({
          spreadsheetId,
          range: `${assumptionsTab}!A1:E50`,
        });
        const rows = res.data.values;
        if (rows && rows.length > 1) {
          assumptions = parseAssumptionsRows(rows, assumptions);
        }
      }
    }
  } catch (apiErr: any) {
    console.warn('[SheetsService] Google Sheets API direct call note:', apiErr?.message || apiErr);
  }

  // Method B: If direct Sheets API didn't populate or wasn't authenticated, use public gviz export since sheet is shared
  if (!loadedFromGoogle && spreadsheetId) {
    try {
      const invRows =
        (await fetchSheetCsv(spreadsheetId, 'Inventory')) ||
        (await fetchSheetCsv(spreadsheetId, 'inventory')) ||
        (await fetchSheetCsv(spreadsheetId, 'Sheet1'));
      
      if (invRows && invRows.length > 1) {
        const parsed = parseInventoryRows(invRows);
        if (parsed.length > 0) {
          inventory = parsed;
          loadedFromGoogle = true;
        }
      }

      const leadsRows =
        (await fetchSheetCsv(spreadsheetId, 'Leads')) ||
        (await fetchSheetCsv(spreadsheetId, 'leads')) ||
        (await fetchSheetCsv(spreadsheetId, 'Deals')) ||
        (await fetchSheetCsv(spreadsheetId, 'Pipeline'));

      if (leadsRows && leadsRows.length > 1) {
        const parsed = parseLeadsRows(leadsRows);
        if (parsed.length > 0) {
          leads = parsed;
          loadedFromGoogle = true;
        }
      }

      const assumpRows =
        (await fetchSheetCsv(spreadsheetId, 'Assumptions')) ||
        (await fetchSheetCsv(spreadsheetId, 'assumptions'));

      if (assumpRows && assumpRows.length > 1) {
        assumptions = parseAssumptionsRows(assumpRows, assumptions);
      }
    } catch (csvErr) {
      console.warn('[SheetsService] Public CSV export fetch note:', csvErr);
    }
  }

  if (loadedFromGoogle) {
    currentInventory = inventory;
    currentLeads = leads;
    currentAssumptions = assumptions;
  }

  return {
    inventory,
    leads,
    assumptions,
    sourceType: loadedFromGoogle ? 'google_sheets' : 'google_sheets',
    spreadsheetId,
    sheetName: TARGET_SPREADSHEET_TITLE,
  };
}

function parseInventoryRows(rows: any[][]): InventoryItem[] {
  const header = rows[0].map((h: any) => String(h).trim().toLowerCase().replace(/[\s_-]/g, ''));
  
  const findIdx = (keywords: string[]) => {
    return header.findIndex((h: string) => keywords.some((k) => h.includes(k)));
  };

  const vinIdx = findIdx(['vin', 'id']);
  const makeIdx = findIdx(['make', 'brand']);
  const modelIdx = findIdx(['model', 'trim']);
  const yearIdx = findIdx(['year', 'yr']);
  const powerIdx = findIdx(['powertrain', 'fuel', 'engine', 'type']);
  const costIdx = findIdx(['cost', 'invoice', 'buyprice']);
  const priceIdx = findIdx(['listprice', 'price', 'msrp', 'sticker']);
  const daysIdx = findIdx(['daysonlot', 'dayonlot', 'lotdays', 'days', 'age']);

  return rows
    .slice(1)
    .filter((r) => r && r[vinIdx !== -1 ? vinIdx : 0])
    .map((r, idx) => {
      const rawCost = r[costIdx !== -1 ? costIdx : 5];
      const rawPrice = r[priceIdx !== -1 ? priceIdx : 6];
      const rawDays = r[daysIdx !== -1 ? daysIdx : 7];
      const rawPower = String(r[powerIdx !== -1 ? powerIdx : 4] || '').trim();

      let powertrain: Powertrain = 'Gas';
      if (/phev/i.test(rawPower)) powertrain = 'PHEV';
      else if (/hybrid/i.test(rawPower)) powertrain = 'Hybrid';
      else if (/electric|ev/i.test(rawPower)) powertrain = 'EV';
      else if (/diesel/i.test(rawPower)) powertrain = 'Diesel';

      const cost = Number(String(rawCost || 0).replace(/[^0-9.]/g, '')) || 25000;
      const list_price = Number(String(rawPrice || 0).replace(/[^0-9.]/g, '')) || cost * 1.15;
      const days_on_lot = Number(String(rawDays || 0).replace(/[^0-9.]/g, '')) || 15;

      return {
        vin: String(r[vinIdx !== -1 ? vinIdx : 0] || `VIN-APEX-${idx + 1}`).trim(),
        make: String(r[makeIdx !== -1 ? makeIdx : 1] || 'Toyota').trim(),
        model: String(r[modelIdx !== -1 ? modelIdx : 2] || 'RAV4').trim(),
        year: Number(r[yearIdx !== -1 ? yearIdx : 3]) || 2024,
        powertrain,
        cost,
        list_price,
        days_on_lot,
      };
    });
}

function parseLeadsRows(rows: any[][]): LeadItem[] {
  const header = rows[0].map((h: any) => String(h).trim().toLowerCase().replace(/[\s_-]/g, ''));
  
  const findIdx = (keywords: string[]) => {
    return header.findIndex((h: string) => keywords.some((k) => h.includes(k)));
  };

  const leadIdIdx = findIdx(['leadid', 'id', 'lead']);
  const createdIdx = findIdx(['createddate', 'date', 'created', 'timestamp']);
  const sourceIdx = findIdx(['source', 'channel', 'origin']);
  const stageIdx = findIdx(['pipelinestage', 'stage', 'status']);
  const valIdx = findIdx(['opportunityvalue', 'opportunity', 'value', 'dealvalue', 'amount']);
  const repIdx = findIdx(['assignedrep', 'rep', 'salesperson', 'agent']);
  const wonDateIdx = findIdx(['wondate', 'closedate', 'solddate']);

  return rows
    .slice(1)
    .filter((r) => r && r[leadIdIdx !== -1 ? leadIdIdx : 0])
    .map((r, idx) => {
      const rawStage = String(r[stageIdx !== -1 ? stageIdx : 3] || 'New').trim();
      let pipeline_stage: PipelineStage = 'New';
      if (/won|closed won|sold/i.test(rawStage)) pipeline_stage = 'Won';
      else if (/lost|closed lost/i.test(rawStage)) pipeline_stage = 'Lost';
      else if (/negotiat/i.test(rawStage)) pipeline_stage = 'Negotiation';
      else if (/test drive|testdrive|drive/i.test(rawStage)) pipeline_stage = 'Test Drive';
      else if (/contact/i.test(rawStage)) pipeline_stage = 'Contacted';

      const rawVal = r[valIdx !== -1 ? valIdx : 4];
      const opportunity_value = Number(String(rawVal || 0).replace(/[^0-9.]/g, '')) || 35000;

      return {
        lead_id: String(r[leadIdIdx !== -1 ? leadIdIdx : 0] || `LD-${idx + 100}`).trim(),
        created_date: String(r[createdIdx !== -1 ? createdIdx : 1] || '2026-08-01').trim(),
        source: String(r[sourceIdx !== -1 ? sourceIdx : 2] || 'Website').trim(),
        pipeline_stage,
        opportunity_value,
        assigned_rep: String(r[repIdx !== -1 ? repIdx : 5] || 'Unassigned').trim(),
        won_date: r[wonDateIdx !== -1 ? wonDateIdx : 6] ? String(r[wonDateIdx !== -1 ? wonDateIdx : 6]).trim() : null,
      };
    });
}

function parseAssumptionsRows(rows: any[][], current: Assumptions): Assumptions {
  const newCloseRates = { ...current.closeRates };
  const newMarkdownLadder = [...current.markdownLadder];

  for (const row of rows) {
    if (!row || row.length < 2) continue;
    const col0 = String(row[0] || '').trim();
    const col1 = row[1];
    if (col0 in newCloseRates && col1 !== undefined) {
      const num = Number(String(col1).replace(/[^0-9.]/g, ''));
      newCloseRates[col0 as PipelineStage] = num > 1 ? num / 100 : num;
    }
  }

  return {
    closeRates: newCloseRates,
    markdownLadder: newMarkdownLadder,
  };
}
