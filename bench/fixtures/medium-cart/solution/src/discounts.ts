export interface Coupon {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  minSubtotal?: number;
}

const MAX_PERCENT = 100;

export class InvalidCouponError extends Error {
  constructor(code: string, reason: string) {
    super(`Cupón ${code} inválido: ${reason}`);
    this.name = 'InvalidCouponError';
  }
}

export function assertValidCoupon(coupon: Coupon, subtotal: number): void {
  if (coupon.kind === 'percent' && (coupon.value < 0 || coupon.value > MAX_PERCENT)) {
    throw new InvalidCouponError(coupon.code, 'el porcentaje debe estar entre 0 y 100');
  }
  if (coupon.minSubtotal !== undefined && subtotal < coupon.minSubtotal) {
    throw new InvalidCouponError(coupon.code, `requiere un subtotal de ${coupon.minSubtotal}`);
  }
}

export function discountFor(coupon: Coupon, subtotal: number): number {
  const amount = coupon.kind === 'percent' ? (subtotal * coupon.value) / MAX_PERCENT : coupon.value;
  return Math.min(amount, subtotal);
}
