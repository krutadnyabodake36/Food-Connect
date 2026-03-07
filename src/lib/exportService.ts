// Google Sheets / CSV Export Service
// Exports donation data as a downloadable CSV that can be directly opened in Google Sheets

import { HotelDonation } from '../types';

interface ExportRow {
  'Donation ID': string;
  'Title': string;
  'Weight (kg)': number;
  'Tags': string;
  'Status': string;
  'Pickup Window': string;
  'Urgent': string;
  'Volunteer': string;
  'Pickup Code': string;
  'Date': string;
}

/**
 * Convert donation data to CSV format
 */
function donationsToCSV(donations: HotelDonation[]): string {
  const rows: ExportRow[] = donations.map(d => ({
    'Donation ID': d.id,
    'Title': d.title,
    'Weight (kg)': d.weight,
    'Tags': d.tags.join(', '),
    'Status': d.status,
    'Pickup Window': d.pickupWindow || '',
    'Urgent': d.isUrgent ? 'Yes' : 'No',
    'Volunteer': d.assignedVolunteer?.name || d.activeRequest?.name || '',
    'Pickup Code': d.pickupCode || '',
    'Date': d.timestamp || new Date().toLocaleDateString(),
  }));

  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]) as (keyof ExportRow)[];
  const csvLines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '');
        // Escape values with commas or quotes
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    )
  ];

  return csvLines.join('\n');
}

/**
 * Download a CSV file  
 */
export function downloadCSV(donations: HotelDonation[], filename?: string) {
  const csv = donationsToCSV(donations);
  if (!csv) {
    alert('No data to export.');
    return;
  }

  const fname = filename || `foodconnect_report_${new Date().toISOString().slice(0, 10)}.csv`;
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Open donation data directly in Google Sheets  
 * Creates a CSV and opens Google Sheets import URL
 */
export function openInGoogleSheets(donations: HotelDonation[]) {
  const csv = donationsToCSV(donations);
  if (!csv) {
    alert('No data to export.');
    return;
  }

  // Create a data URI and encode it for Google Sheets
  const blob = new Blob([csv], { type: 'text/csv' });
  
  // Download the CSV first, then redirect to Google Sheets
  const fname = `foodconnect_report_${new Date().toISOString().slice(0, 10)}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);

  // Open Google Sheets in a new tab  
  setTimeout(() => {
    window.open('https://sheets.google.com/create', '_blank');
  }, 500);
}

/**
 * Generate a summary report object
 */
export function generateSummary(donations: HotelDonation[]) {
  const total = donations.length;
  const completed = donations.filter(d => d.status === 'completed').length;
  const pending = donations.filter(d => d.status === 'pending').length;
  const assigned = donations.filter(d => d.status === 'assigned').length;
  const totalWeight = donations.reduce((sum, d) => sum + d.weight, 0);
  const avgWeight = total > 0 ? +(totalWeight / total).toFixed(1) : 0;
  const urgentCount = donations.filter(d => d.isUrgent).length;

  return {
    total,
    completed,
    pending,
    assigned,
    totalWeight: +totalWeight.toFixed(1),
    avgWeight,
    urgentCount,
    completionRate: total > 0 ? +((completed / total) * 100).toFixed(1) : 0,
  };
}
