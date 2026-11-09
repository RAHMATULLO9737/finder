export const RECIPIENTS = [
  ['any', 'Farqi yo‘q', '🎁'],
  ['mother', 'Ona', '👩'],
  ['father', 'Ota', '👨'],
  ['friend', 'Do‘st', '🧑‍🤝‍🧑'],
  ['partner', 'Sevgan inson', '💞'],
  ['child', 'Bola', '🧒'],
  ['colleague', 'Hamkasb', '💼'],
  ['sibling', 'Aka-uka / opa-singil', '👫'],
];

export const recipientLabel = (value) => RECIPIENTS.find((r) => r[0] === value)?.[1] || 'Har kimga';

export const SORTS = [
  ['', 'Yangilari avval'],
  ['price', 'Avval arzonlari'],
  ['-price', 'Avval qimmatlari'],
  ['-avg_rating', 'Reyting bo‘yicha'],
  ['name', 'Nomi bo‘yicha (A–Z)'],
];

export const money = (n) => new Intl.NumberFormat('uz-UZ').format(Number(n || 0)) + " so'm";

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });

// ----- Buyurtmalar -----
// [kod, nomi, badge rangi, emoji]
export const ORDER_STATUSES = [
  ['new', 'Yangi', 'info', '🆕'],
  ['confirmed', 'Tasdiqlandi', 'purple', '✅'],
  ['shipping', 'Yo‘lda', 'warn', '🚚'],
  ['delivered', 'Yetkazildi', 'ok', '🎉'],
  ['cancelled', 'Bekor qilindi', 'bad', '✖️'],
];
export const statusInfo = (code) => ORDER_STATUSES.find((s) => s[0] === code) || ORDER_STATUSES[0];

export const PAYMENTS = [
  ['cash', 'Naqd pul', 'Sovg‘ani qabul qilganda kuryerga to‘laysiz', '💵'],
  ['card', 'Karta orqali', 'Kuryerga karta (terminal) orqali to‘laysiz', '💳'],
];

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const orderNo = (o) => `#${o.number}`;
