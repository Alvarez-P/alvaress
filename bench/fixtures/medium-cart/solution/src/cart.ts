import { assertValidCoupon, discountFor } from './discounts.ts';
import type { Coupon } from './discounts.ts';

export interface CartItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}

export class Cart {
  private readonly items: CartItem[] = [];
  private coupon: Coupon | undefined;

  add(item: CartItem): void {
    const existing = this.items.find((entry) => entry.sku === item.sku);
    if (existing !== undefined) {
      existing.quantity += item.quantity;
      return;
    }
    this.items.push({ ...item });
  }

  applyCoupon(coupon: Coupon): void {
    assertValidCoupon(coupon, this.subtotal());
    this.coupon = coupon;
  }

  subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  total(): number {
    const subtotal = this.subtotal();
    return this.coupon === undefined ? subtotal : subtotal - discountFor(this.coupon, subtotal);
  }
}
