export function validateAlgerianPhone(phone: string): boolean {
  // Algerian mobile: 05/06/07 + 8 digits (10 total), or +213 format
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  return /^(0[567]\d{8}|(\+213|00213)[567]\d{8})$/.test(cleaned);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('ar-DZ')} DA`;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TWO-${timestamp}-${random}`;
}
