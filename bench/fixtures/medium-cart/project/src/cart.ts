export interface CartItem {
  sku: string;
  unitPrice: number;
  quantity: number;
}

export class Cart {
  private readonly items: CartItem[] = [];

  add(item: CartItem): void {
    const existing = this.items.find((entry) => entry.sku === item.sku);
    if (existing !== undefined) {
      existing.quantity += item.quantity;
      return;
    }
    this.items.push({ ...item });
  }

  subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  total(): number {
    return this.subtotal();
  }
}
