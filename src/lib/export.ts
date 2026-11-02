// Export utilities for Bills and Payments as CSV/Excel compatible formats
import { Bill, Payment } from './types';

export function exportBillsToCSV(bills: Bill[]): void {
  const headers = [
    'Bill ID',
    'Bill Name',
    'Category',
    'Amount (INR)',
    'Cycle Type',
    'Cycle Value',
    'Last Paid Date',
    'Next Due Date',
    'Reminder Days Before',
    'Status',
  ];

  const rows = bills.map((b) => [
    `"${b.bill_id}"`,
    `"${b.name.replace(/"/g, '""')}"`,
    `"${b.category}"`,
    b.amount.toFixed(2),
    `"${b.cycle_type}"`,
    b.cycle_value,
    `"${b.last_paid_date || ''}"`,
    `"${b.next_due_date || ''}"`,
    `"${b.remind_days}"`,
    `"${b.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadBlob(csvContent, `bill_reminders_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

export function exportPaymentsToCSV(payments: Payment[]): void {
  const headers = [
    'Payment ID',
    'Bill ID',
    'Bill Name',
    'Category',
    'Amount Paid (INR)',
    'Payment Date',
    'Transaction Reference',
    'Source Channel',
    'Input Type',
  ];

  const rows = payments.map((p) => [
    `"${p.payment_id}"`,
    `"${p.bill_id || ''}"`,
    `"${(p.bill_name || 'One-time Bill').replace(/"/g, '""')}"`,
    `"${p.bill_category || 'other'}"`,
    p.amount_paid.toFixed(2),
    `"${p.paid_date}"`,
    `"${(p.txn_ref || '').replace(/"/g, '""')}"`,
    `"${p.source}"`,
    `"${p.input_type}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  downloadBlob(csvContent, `payments_history_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
