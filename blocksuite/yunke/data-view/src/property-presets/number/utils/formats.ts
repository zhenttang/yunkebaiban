import type { NumberFormat } from './formatter.js';

export type NumberCellFormat = {
  type: NumberFormat;
  label: string;
  symbol: string; // New property for symbol
};

export const numberFormats: NumberCellFormat[] = [
  { type: 'number', label: '数字', symbol: '#' },
  { type: 'numberWithCommas', label: '千分位数字', symbol: '#' },
  { type: 'percent', label: '百分比', symbol: '%' },
  { type: 'currencyYen', label: '日元', symbol: '¥' },
  { type: 'currencyCNY', label: '人民币', symbol: '¥' },
  { type: 'currencyINR', label: '印度卢比', symbol: '₹' },
  { type: 'currencyUSD', label: '美元', symbol: '$' },
  { type: 'currencyEUR', label: '欧元', symbol: '€' },
  { type: 'currencyGBP', label: '英镑', symbol: '£' },
];
