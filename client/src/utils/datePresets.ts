export interface DatePreset {
  label: string;
  dateFrom?: string;
  dateTo?: string;
}

const QUARTERS = [
  { label: 'Q1', from: '01-01', to: '03-31' },
  { label: 'Q2', from: '04-01', to: '06-30' },
  { label: 'Q3', from: '07-01', to: '09-30' },
  { label: 'Q4', from: '10-01', to: '12-31' },
] as const;

/**
 * Presets built from the years the data actually covers, newest first: "All time", then each
 * year and its quarters. Generic "last 30 days" presets would be empty against historical data.
 */
export function buildDatePresets(range: { min: string; max: string } | null): DatePreset[] {
  const presets: DatePreset[] = [{ label: 'All time' }];
  if (!range) return presets;

  const firstYear = new Date(range.min).getUTCFullYear();
  const lastYear = new Date(range.max).getUTCFullYear();
  for (let year = lastYear; year >= firstYear; year--) {
    presets.push({ label: String(year), dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` });
    for (const quarter of QUARTERS) {
      presets.push({
        label: `${quarter.label} ${year}`,
        dateFrom: `${year}-${quarter.from}`,
        dateTo: `${year}-${quarter.to}`,
      });
    }
  }
  return presets;
}
