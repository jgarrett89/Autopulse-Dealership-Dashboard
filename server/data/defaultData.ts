import { Assumptions, InventoryItem, LeadItem } from '../../src/types/dealership.js';

export const defaultAssumptions: Assumptions = {
  closeRates: {
    New: 0.10,
    Contacted: 0.25,
    'Test Drive': 0.50,
    Negotiation: 0.75,
    Won: 1.00,
    Lost: 0.00,
  },
  markdownLadder: [
    { min_days_on_lot: 0, markdown_pct: 0.00 },
    { min_days_on_lot: 45, markdown_pct: 0.04 },
    { min_days_on_lot: 60, markdown_pct: 0.08 },
    { min_days_on_lot: 90, markdown_pct: 0.15 },
    { min_days_on_lot: 120, markdown_pct: 0.22 },
  ],
};

export const defaultInventory: InventoryItem[] = [
  // 90+ days (Aged)
  { vin: '1FTFW1ED5NFA98124', make: 'Ford', model: 'F-150 Lightning Lariat', year: 2023, powertrain: 'EV', cost: 68500, list_price: 76900, days_on_lot: 128 },
  { vin: '3C6UR5DL7MG129481', make: 'Ram', model: '1500 Limited 4x4', year: 2023, powertrain: 'Gas', cost: 58000, list_price: 64995, days_on_lot: 114 },
  { vin: 'WA1VAAFY9P2019482', make: 'Audi', model: 'e-tron Chronos', year: 2023, powertrain: 'EV', cost: 72000, list_price: 79900, days_on_lot: 102 },
  { vin: '1GKS2CKL9PR847192', make: 'GMC', model: 'Yukon Denali Ultimate', year: 2023, powertrain: 'Gas', cost: 84000, list_price: 94500, days_on_lot: 96 },
  { vin: '5YJSA1E28NF918234', make: 'Tesla', model: 'Model S Plaid', year: 2023, powertrain: 'EV', cost: 81000, list_price: 89900, days_on_lot: 92 },

  // 60-89 days (At risk)
  { vin: '5UXTY5C08N9B12384', make: 'BMW', model: 'X5 xDrive45e', year: 2024, powertrain: 'PHEV', cost: 63500, list_price: 71200, days_on_lot: 86 },
  { vin: '1C4RJFBG8RC782103', make: 'Jeep', model: 'Grand Cherokee 4xe', year: 2024, powertrain: 'PHEV', cost: 54000, list_price: 61500, days_on_lot: 81 },
  { vin: '2C3CDXHG7RH651290', make: 'Dodge', model: 'Charger Scat Pack', year: 2023, powertrain: 'Gas', cost: 47500, list_price: 53900, days_on_lot: 77 },
  { vin: 'SALWR2V42PA876123', make: 'Land Rover', model: 'Defender 110 SE', year: 2024, powertrain: 'Gas', cost: 69000, list_price: 78500, days_on_lot: 74 },
  { vin: '1G1YB2D47P5109283', make: 'Chevrolet', model: 'Corvette Stingray 2LT', year: 2023, powertrain: 'Gas', cost: 71000, list_price: 81000, days_on_lot: 69 },
  { vin: 'WP0AB2A97RS192847', make: 'Porsche', model: 'Taycan 4S', year: 2023, powertrain: 'EV', cost: 96000, list_price: 108500, days_on_lot: 65 },
  { vin: 'JN1AZ4EH9PM384912', make: 'Infiniti', model: 'QX60 Autograph', year: 2024, powertrain: 'Gas', cost: 55000, list_price: 62800, days_on_lot: 62 },

  // 45-59 days (Watch)
  { vin: '4JGFB4KB4RB928374', make: 'Mercedes-Benz', model: 'GLE 450 4MATIC', year: 2024, powertrain: 'Hybrid', cost: 66000, list_price: 74900, days_on_lot: 58 },
  { vin: '5TDYZ3DC7PS837261', make: 'Toyota', model: 'Grand Highlander Hybrid', year: 2024, powertrain: 'Hybrid', cost: 48500, list_price: 54200, days_on_lot: 55 },
  { vin: 'KM8R54HE7RU928172', make: 'Hyundai', model: 'Palisade Calligraphy', year: 2024, powertrain: 'Gas', cost: 46000, list_price: 52400, days_on_lot: 52 },
  { vin: '1FA6P8CF4R5102938', make: 'Ford', model: 'Mustang Dark Horse', year: 2024, powertrain: 'Gas', cost: 56500, list_price: 64900, days_on_lot: 49 },
  { vin: '7FARW2H82RE019283', make: 'Honda', model: 'CR-V Hybrid Sport-L', year: 2024, powertrain: 'Hybrid', cost: 34800, list_price: 39500, days_on_lot: 47 },
  { vin: '3FA6P0SU9RR281938', make: 'Ford', model: 'Explorer ST', year: 2024, powertrain: 'Gas', cost: 51000, list_price: 58200, days_on_lot: 46 },

  // 0-44 days (OK / Fresh)
  { vin: '4T1C11AK8RU829102', make: 'Toyota', model: 'Camry XSE AWD', year: 2025, powertrain: 'Hybrid', cost: 32000, list_price: 36900, days_on_lot: 41 },
  { vin: '1GNSKBKC8RR829103', make: 'Chevrolet', model: 'Tahoe RST', year: 2024, powertrain: 'Diesel', cost: 64000, list_price: 72900, days_on_lot: 38 },
  { vin: '5YJ3E1EB6RF928173', make: 'Tesla', model: 'Model 3 Highland Long Range', year: 2024, powertrain: 'EV', cost: 43000, list_price: 48990, days_on_lot: 35 },
  { vin: 'WBA33AY07RFS91823', make: 'BMW', model: 'M340i xDrive', year: 2024, powertrain: 'Gas', cost: 56000, list_price: 63500, days_on_lot: 32 },
  { vin: '3N1CP5CU8RL918273', make: 'Nissan', model: 'Rogue Platinum AWD', year: 2024, powertrain: 'Gas', cost: 36500, list_price: 41800, days_on_lot: 29 },
  { vin: '1FMCU9N96RUA81920', make: 'Ford', model: 'Escape PHEV', year: 2024, powertrain: 'PHEV', cost: 36000, list_price: 41200, days_on_lot: 26 },
  { vin: '5TDKZ3DC6RS829102', make: 'Toyota', model: 'RAV4 Prime XSE', year: 2024, powertrain: 'PHEV', cost: 44000, list_price: 50400, days_on_lot: 24 },
  { vin: '1G1ZD5ST8RF829102', make: 'Chevrolet', model: 'Silverado 1500 ZR2', year: 2024, powertrain: 'Gas', cost: 65000, list_price: 73800, days_on_lot: 22 },
  { vin: '5N1DL0MN7RC829102', make: 'Infiniti', model: 'QX80 Sensory', year: 2025, powertrain: 'Gas', cost: 89000, list_price: 101200, days_on_lot: 19 },
  { vin: '7SAYGDEE8RF829102', make: 'Tesla', model: 'Model Y Performance', year: 2024, powertrain: 'EV', cost: 47000, list_price: 53490, days_on_lot: 17 },
  { vin: 'W1KZF4KB8RA829102', make: 'Mercedes-Benz', model: 'C 300 4MATIC', year: 2024, powertrain: 'Hybrid', cost: 44500, list_price: 50800, days_on_lot: 15 },
  { vin: '1FM5K8GC8RGA91823', make: 'Ford', model: 'Bronco Badlands Sasquatch', year: 2024, powertrain: 'Gas', cost: 53500, list_price: 61200, days_on_lot: 14 },
  { vin: '2T2HZMCA5RC829102', make: 'Lexus', model: 'RX 350 Premium+', year: 2024, powertrain: 'Gas', cost: 52000, list_price: 58900, days_on_lot: 12 },
  { vin: '2HKRW2H87RH829102', make: 'Honda', model: 'Pilot Elite AWD', year: 2025, powertrain: 'Gas', cost: 48000, list_price: 54100, days_on_lot: 10 },
  { vin: '5NMS5DAL8RH829102', make: 'Hyundai', model: 'Santa Fe Hybrid Calligraphy', year: 2025, powertrain: 'Hybrid', cost: 43000, list_price: 48800, days_on_lot: 8 },
  { vin: '3C6UR5FL8RG829102', make: 'Ram', model: '2500 Laramie Cummins', year: 2024, powertrain: 'Diesel', cost: 74000, list_price: 84500, days_on_lot: 7 },
  { vin: 'JTJAZ1BA8R2829102', make: 'Lexus', model: 'GX 550 Overtrail', year: 2025, powertrain: 'Gas', cost: 67000, list_price: 76900, days_on_lot: 5 },
  { vin: 'WP0AB2Y15RSA91823', make: 'Porsche', model: '911 Carrera GTS', year: 2025, powertrain: 'Hybrid', cost: 148000, list_price: 169500, days_on_lot: 4 },
  { vin: '1G4DN5SU9RF829102', make: 'Buick', model: 'Enclave Avenir', year: 2025, powertrain: 'Gas', cost: 53000, list_price: 59800, days_on_lot: 3 },
  { vin: 'WA1B2AFY1R8829102', make: 'Audi', model: 'Q7 55 Prestige', year: 2024, powertrain: 'Hybrid', cost: 68000, list_price: 77200, days_on_lot: 2 },
];

export const defaultLeads: LeadItem[] = [
  // WON in Current Month (August 2026) - Realized deals
  { lead_id: 'LD-1092', created_date: '2026-08-01', source: 'Website', pipeline_stage: 'Won', opportunity_value: 76900, assigned_rep: 'Elena Vance', won_date: '2026-08-05' },
  { lead_id: 'LD-1095', created_date: '2026-08-02', source: 'Autotrader', pipeline_stage: 'Won', opportunity_value: 54100, assigned_rep: 'Robert Robertson', won_date: '2026-08-08' },
  { lead_id: 'LD-1099', created_date: '2026-08-03', source: 'Walk-in', pipeline_stage: 'Won', opportunity_value: 63500, assigned_rep: 'Marcus Brody', won_date: '2026-08-10' },
  { lead_id: 'LD-1104', created_date: '2026-08-04', source: 'CarGurus', pipeline_stage: 'Won', opportunity_value: 48990, assigned_rep: 'Sarah Chen', won_date: '2026-08-11' },
  { lead_id: 'LD-1108', created_date: '2026-08-06', source: 'Referral', pipeline_stage: 'Won', opportunity_value: 74900, assigned_rep: 'David Miller', won_date: '2026-08-12' },
  { lead_id: 'LD-1112', created_date: '2026-08-07', source: 'Direct Phone', pipeline_stage: 'Won', opportunity_value: 58900, assigned_rep: 'Elena Vance', won_date: '2026-08-14' },
  { lead_id: 'LD-1115', created_date: '2026-08-09', source: 'Website', pipeline_stage: 'Won', opportunity_value: 53490, assigned_rep: 'Robert Robertson', won_date: '2026-08-15' },

  // WON in Prior Month (July 2026) - For month-over-month delta calculations
  { lead_id: 'LD-1040', created_date: '2026-07-02', source: 'Website', pipeline_stage: 'Won', opportunity_value: 68000, assigned_rep: 'Elena Vance', won_date: '2026-07-08' },
  { lead_id: 'LD-1044', created_date: '2026-07-05', source: 'CarGurus', pipeline_stage: 'Won', opportunity_value: 52000, assigned_rep: 'Robert Robertson', won_date: '2026-07-12' },
  { lead_id: 'LD-1048', created_date: '2026-07-08', source: 'Autotrader', pipeline_stage: 'Won', opportunity_value: 46000, assigned_rep: 'Marcus Brody', won_date: '2026-07-16' },
  { lead_id: 'LD-1052', created_date: '2026-07-12', source: 'Walk-in', pipeline_stage: 'Won', opportunity_value: 71000, assigned_rep: 'Sarah Chen', won_date: '2026-07-20' },
  { lead_id: 'LD-1056', created_date: '2026-07-15', source: 'Referral', pipeline_stage: 'Won', opportunity_value: 64000, assigned_rep: 'David Miller', won_date: '2026-07-24' },
  { lead_id: 'LD-1060', created_date: '2026-07-20', source: 'Direct Phone', pipeline_stage: 'Won', opportunity_value: 41000, assigned_rep: 'Elena Vance', won_date: '2026-07-29' },

  // WON in June 2026
  { lead_id: 'LD-1010', created_date: '2026-06-03', source: 'Website', pipeline_stage: 'Won', opportunity_value: 62000, assigned_rep: 'Robert Robertson', won_date: '2026-06-11' },
  { lead_id: 'LD-1015', created_date: '2026-06-10', source: 'Walk-in', pipeline_stage: 'Won', opportunity_value: 55000, assigned_rep: 'Elena Vance', won_date: '2026-06-18' },
  { lead_id: 'LD-1020', created_date: '2026-06-14', source: 'Autotrader', pipeline_stage: 'Won', opportunity_value: 48000, assigned_rep: 'Sarah Chen', won_date: '2026-06-22' },
  { lead_id: 'LD-1025', created_date: '2026-06-20', source: 'CarGurus', pipeline_stage: 'Won', opportunity_value: 73000, assigned_rep: 'Marcus Brody', won_date: '2026-06-27' },
  { lead_id: 'LD-1030', created_date: '2026-06-25', source: 'Referral', pipeline_stage: 'Won', opportunity_value: 59000, assigned_rep: 'David Miller', won_date: '2026-06-30' },

  // WON in May 2026
  { lead_id: 'LD-0980', created_date: '2026-05-04', source: 'Website', pipeline_stage: 'Won', opportunity_value: 51000, assigned_rep: 'Elena Vance', won_date: '2026-05-12' },
  { lead_id: 'LD-0985', created_date: '2026-05-11', source: 'Direct Phone', pipeline_stage: 'Won', opportunity_value: 66000, assigned_rep: 'Robert Robertson', won_date: '2026-05-19' },
  { lead_id: 'LD-0990', created_date: '2026-05-18', source: 'Autotrader', pipeline_stage: 'Won', opportunity_value: 43000, assigned_rep: 'Sarah Chen', won_date: '2026-05-25' },
  { lead_id: 'LD-0995', created_date: '2026-05-22', source: 'Walk-in', pipeline_stage: 'Won', opportunity_value: 78000, assigned_rep: 'Marcus Brody', won_date: '2026-05-29' },

  // ACTIVE OPEN PIPELINE DEALS (Negotiation, Test Drive, Contacted, New)
  // Stage: Negotiation (75% close rate)
  { lead_id: 'LD-1120', created_date: '2026-08-08', source: 'Website', pipeline_stage: 'Negotiation', opportunity_value: 94500, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1121', created_date: '2026-08-09', source: 'Walk-in', pipeline_stage: 'Negotiation', opportunity_value: 71200, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1122', created_date: '2026-08-10', source: 'CarGurus', pipeline_stage: 'Negotiation', opportunity_value: 61500, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1123', created_date: '2026-08-11', source: 'Referral', pipeline_stage: 'Negotiation', opportunity_value: 81000, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1124', created_date: '2026-08-12', source: 'Autotrader', pipeline_stage: 'Negotiation', opportunity_value: 58200, assigned_rep: 'David Miller' },

  // Stage: Test Drive (50% close rate)
  { lead_id: 'LD-1130', created_date: '2026-08-05', source: 'Website', pipeline_stage: 'Test Drive', opportunity_value: 89900, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1131', created_date: '2026-08-07', source: 'Autotrader', pipeline_stage: 'Test Drive', opportunity_value: 78500, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1132', created_date: '2026-08-08', source: 'Direct Phone', pipeline_stage: 'Test Drive', opportunity_value: 54200, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1133', created_date: '2026-08-10', source: 'Walk-in', pipeline_stage: 'Test Drive', opportunity_value: 64900, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1134', created_date: '2026-08-11', source: 'CarGurus', pipeline_stage: 'Test Drive', opportunity_value: 50400, assigned_rep: 'David Miller' },
  { lead_id: 'LD-1135', created_date: '2026-08-12', source: 'Website', pipeline_stage: 'Test Drive', opportunity_value: 73800, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1136', created_date: '2026-08-13', source: 'Referral', pipeline_stage: 'Test Drive', opportunity_value: 76900, assigned_rep: 'Robert Robertson' },

  // Stage: Contacted (25% close rate)
  { lead_id: 'LD-1140', created_date: '2026-08-09', source: 'CarGurus', pipeline_stage: 'Contacted', opportunity_value: 64995, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1141', created_date: '2026-08-10', source: 'Website', pipeline_stage: 'Contacted', opportunity_value: 108500, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1142', created_date: '2026-08-11', source: 'Autotrader', pipeline_stage: 'Contacted', opportunity_value: 52400, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1143', created_date: '2026-08-12', source: 'Direct Phone', pipeline_stage: 'Contacted', opportunity_value: 39500, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1144', created_date: '2026-08-13', source: 'Walk-in', pipeline_stage: 'Contacted', opportunity_value: 41800, assigned_rep: 'David Miller' },
  { lead_id: 'LD-1145', created_date: '2026-08-14', source: 'Social', pipeline_stage: 'Contacted', opportunity_value: 101200, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1146', created_date: '2026-08-14', source: 'Website', pipeline_stage: 'Contacted', opportunity_value: 61200, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1147', created_date: '2026-08-15', source: 'Referral', pipeline_stage: 'Contacted', opportunity_value: 169500, assigned_rep: 'Robert Robertson' },

  // Stage: New (10% close rate)
  { lead_id: 'LD-1150', created_date: '2026-08-13', source: 'Website', pipeline_stage: 'New', opportunity_value: 79900, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1151', created_date: '2026-08-13', source: 'CarGurus', pipeline_stage: 'New', opportunity_value: 53900, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1152', created_date: '2026-08-14', source: 'Autotrader', pipeline_stage: 'New', opportunity_value: 62800, assigned_rep: 'David Miller' },
  { lead_id: 'LD-1153', created_date: '2026-08-14', source: 'Website', pipeline_stage: 'New', opportunity_value: 36900, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1154', created_date: '2026-08-15', source: 'Direct Phone', pipeline_stage: 'New', opportunity_value: 72900, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1155', created_date: '2026-08-15', source: 'Social', pipeline_stage: 'New', opportunity_value: 41200, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1156', created_date: '2026-08-15', source: 'Walk-in', pipeline_stage: 'New', opportunity_value: 59800, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1157', created_date: '2026-08-15', source: 'Website', pipeline_stage: 'New', opportunity_value: 77200, assigned_rep: 'Sarah Chen' },

  // LOST deals (for realistic conversion rate and funnel analysis)
  { lead_id: 'LD-1070', created_date: '2026-07-10', source: 'Autotrader', pipeline_stage: 'Lost', opportunity_value: 45000, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1071', created_date: '2026-07-14', source: 'CarGurus', pipeline_stage: 'Lost', opportunity_value: 53000, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1072', created_date: '2026-07-22', source: 'Website', pipeline_stage: 'Lost', opportunity_value: 61000, assigned_rep: 'Marcus Brody' },
  { lead_id: 'LD-1073', created_date: '2026-07-28', source: 'Direct Phone', pipeline_stage: 'Lost', opportunity_value: 39000, assigned_rep: 'David Miller' },
  { lead_id: 'LD-1074', created_date: '2026-08-02', source: 'Social', pipeline_stage: 'Lost', opportunity_value: 48000, assigned_rep: 'Elena Vance' },
  { lead_id: 'LD-1075', created_date: '2026-08-06', source: 'Website', pipeline_stage: 'Lost', opportunity_value: 56000, assigned_rep: 'Robert Robertson' },
  { lead_id: 'LD-1076', created_date: '2026-08-08', source: 'CarGurus', pipeline_stage: 'Lost', opportunity_value: 72000, assigned_rep: 'Sarah Chen' },
  { lead_id: 'LD-1077', created_date: '2026-08-11', source: 'Walk-in', pipeline_stage: 'Lost', opportunity_value: 64000, assigned_rep: 'Marcus Brody' },
];
