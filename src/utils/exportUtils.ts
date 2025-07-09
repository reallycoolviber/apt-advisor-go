import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface EvaluationData {
  id: string;
  address: string | null;
  size: number | null;
  price: number | null;
  rooms: string | null;
  monthly_fee: number | null;
  created_at: string;
  is_draft: boolean | null;
  planlösning: number | null;
  kitchen: number | null;
  bathroom: number | null;
  bedrooms: number | null;
  surfaces: number | null;
  förvaring: number | null;
  ljusinsläpp: number | null;
  balcony: number | null;
  comments: string | null;
  debt_per_sqm: number | null;
  fee_per_sqm: number | null;
  cashflow_per_sqm: number | null;
  owns_land: boolean | null;
  underhållsplan: string | null;
}

export const exportToExcel = (evaluations: EvaluationData[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    evaluations.map(evaluation => ({
      'Adress': evaluation.address || '',
      'Storlek (kvm)': evaluation.size || '',
      'Pris (SEK)': evaluation.price || '',
      'Rum': evaluation.rooms || '',
      'Månadsavgift (SEK)': evaluation.monthly_fee || '',
      'Skapad datum': new Date(evaluation.created_at).toLocaleDateString('sv-SE'),
      'Status': evaluation.is_draft ? 'Utkast' : 'Slutförd',
      'Planlösning': evaluation.planlösning || '',
      'Kök': evaluation.kitchen || '',
      'Badrum': evaluation.bathroom || '',
      'Sovrum': evaluation.bedrooms || '',
      'Ytor': evaluation.surfaces || '',
      'Förvaring': evaluation.förvaring || '',
      'Ljusinsläpp': evaluation.ljusinsläpp || '',
      'Balkong': evaluation.balcony || '',
      'Skuld per kvm': evaluation.debt_per_sqm || '',
      'Avgift per kvm': evaluation.fee_per_sqm || '',
      'Kassaflöde per kvm': evaluation.cashflow_per_sqm || '',
      'Äger mark': evaluation.owns_land === true ? 'Ja' : evaluation.owns_land === false ? 'Nej' : '',
      'Underhållsplan': evaluation.underhållsplan || '',
      'Kommentarer': evaluation.comments || '',
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Utvärderingar');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(data, `lagenhetsutvarderingar_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (evaluations: EvaluationData[]) => {
  const csvContent = [
    // Header
    'Adress,Storlek (kvm),Pris (SEK),Rum,Månadsavgift (SEK),Skapad datum,Status,Planlösning,Kök,Badrum,Sovrum,Ytor,Förvaring,Ljusinsläpp,Balkong,Skuld per kvm,Avgift per kvm,Kassaflöde per kvm,Äger mark,Underhållsplan,Kommentarer',
    // Data rows
    ...evaluations.map(evaluation => [
      `"${evaluation.address || ''}"`,
      evaluation.size || '',
      evaluation.price || '',
      `"${evaluation.rooms || ''}"`,
      evaluation.monthly_fee || '',
      new Date(evaluation.created_at).toLocaleDateString('sv-SE'),
      evaluation.is_draft ? 'Utkast' : 'Slutförd',
      evaluation.planlösning || '',
      evaluation.kitchen || '',
      evaluation.bathroom || '',
      evaluation.bedrooms || '',
      evaluation.surfaces || '',
      evaluation.förvaring || '',
      evaluation.ljusinsläpp || '',
      evaluation.balcony || '',
      evaluation.debt_per_sqm || '',
      evaluation.fee_per_sqm || '',
      evaluation.cashflow_per_sqm || '',
      evaluation.owns_land === true ? 'Ja' : evaluation.owns_land === false ? 'Nej' : '',
      `"${evaluation.underhållsplan || ''}"`,
      `"${evaluation.comments || ''}"`,
    ].join(','))
  ].join('\n');

  const data = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(data, `lagenhetsutvarderingar_${new Date().toISOString().split('T')[0]}.csv`);
};