/**
 * Utility untuk konversi angka ke kalimat terbilang Bahasa Indonesia
 * dan formatting ribuan standar Rupiah.
 */

const SATUAN = [
  '',
  'Satu',
  'Dua',
  'Tiga',
  'Empat',
  'Lima',
  'Enam',
  'Tujuh',
  'Delapan',
  'Sembilan',
  'Sepuluh',
  'Sebelas'
];

function angkaKeKata(num: number): string {
  const n = Math.floor(Math.abs(num));

  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return `${angkaKeKata(n - 10)} Belas`;
  } else if (n < 100) {
    return `${angkaKeKata(Math.floor(n / 10))} Puluh ${angkaKeKata(n % 10)}`.trim();
  } else if (n < 200) {
    return `Seratus ${angkaKeKata(n - 100)}`.trim();
  } else if (n < 1000) {
    return `${angkaKeKata(Math.floor(n / 100))} Ratus ${angkaKeKata(n % 100)}`.trim();
  } else if (n < 2000) {
    return `Seribu ${angkaKeKata(n - 1000)}`.trim();
  } else if (n < 1000000) {
    return `${angkaKeKata(Math.floor(n / 1000))} Ribu ${angkaKeKata(n % 1000)}`.trim();
  } else if (n < 1000000000) {
    return `${angkaKeKata(Math.floor(n / 1000000))} Juta ${angkaKeKata(n % 1000000)}`.trim();
  } else if (n < 1000000000000) {
    return `${angkaKeKata(Math.floor(n / 1000000000))} Miliar ${angkaKeKata(n % 1000000000)}`.trim();
  } else if (n < 1000000000000000) {
    return `${angkaKeKata(Math.floor(n / 1000000000000))} Triliun ${angkaKeKata(n % 1000000000000)}`.trim();
  }
  return '';
}

/**
 * Menghasilkan teks terbilang lengkap dengan akhiran 'Rupiah'
 * Contoh: 150000 -> "Seratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
  if (!nominal || isNaN(nominal) || nominal <= 0) {
    return 'Nol Rupiah';
  }
  const hasil = angkaKeKata(nominal);
  return hasil ? `${hasil} Rupiah` : 'Nol Rupiah';
}

/**
 * Format string/angka menjadi format ribuan dengan titik (contoh: 150000 -> "150.000")
 */
export function formatThousand(value: number | string): string {
  if (value === '' || value === null || value === undefined) return '';
  const cleanStr = String(value).replace(/\D/g, '');
  if (!cleanStr) return '';
  return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Bersihkan string berformat titik menjadi angka murni (number)
 * Contoh: "150.000" -> 150000
 */
export function cleanNumeric(formatted: string): number {
  if (!formatted) return 0;
  const cleanStr = String(formatted).replace(/\D/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}
