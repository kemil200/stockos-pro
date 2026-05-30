const WEST_AFRICA_CODES = ['+228', '+229', '+233', '+225', '+221', '+224'];

export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return cleaned;
}
