/**
 * Helper fungsi penanggalan zona lokal Indonesia untuk mencegah
 * pergeseran tanggal (off-by-one day) akibat konversi UTC.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatIndonesianDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);

  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function getPeriodRange(period: 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL' | 'CUSTOM', customStart?: string, customEnd?: string): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (period === 'TODAY') {
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: `Hari Ini (${formatIndonesianDate(todayStr)})`
    };
  }

  if (period === 'LAST_7_DAYS') {
    const past7 = new Date(now);
    past7.setDate(past7.getDate() - 6);
    const past7Str = getLocalDateString(past7);
    return {
      startDate: past7Str,
      endDate: todayStr,
      label: `7 Hari Terakhir (${formatIndonesianDate(past7Str)} - ${formatIndonesianDate(todayStr)})`
    };
  }

  if (period === 'THIS_MONTH') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startMonthStr = getLocalDateString(firstDay);
    const endMonthStr = getLocalDateString(lastDay);
    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return {
      startDate: startMonthStr,
      endDate: endMonthStr,
      label: `Bulan Ini (${monthName})`
    };
  }

  if (period === 'CUSTOM') {
    const start = customStart || todayStr;
    const end = customEnd || todayStr;
    return {
      startDate: start,
      endDate: end,
      label: `${formatIndonesianDate(start)} s/d ${formatIndonesianDate(end)}`
    };
  }

  // ALL
  return {
    startDate: '',
    endDate: '',
    label: 'Semua Waktu'
  };
}
