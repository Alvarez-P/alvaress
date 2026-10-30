import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cart } from '../src/cart.ts';
import { InvalidCouponError } from '../src/discounts.ts';

function cart(): Cart {
  const value = new Cart();
  value.add({ sku: 'a', unitPrice: 30, quantity: 2 });
  value.add({ sku: 'b', unitPrice: 40, quantity: 1 });
  return value;
}

test('suma cantidades del mismo sku', () => {
  const value = new Cart();
  value.add({ sku: 'a', unitPrice: 10, quantity: 1 });
  value.add({ sku: 'a', unitPrice: 10, quantity: 2 });
  assert.equal(value.total(), 30);
});

test('aplica un cupón porcentual sobre el subtotal', () => {
  const value = cart();
  value.applyCoupon({ code: 'DIEZ', kind: 'percent', value: 10 });
  assert.equal(value.total(), 90);
});

test('aplica un cupón fijo sin bajar de cero', () => {
  const value = cart();
  value.applyCoupon({ code: 'GRANDE', kind: 'fixed', value: 500 });
  assert.equal(value.total(), 0);
});

test('rechaza un cupón si no se alcanza el mínimo', () => {
  const value = cart();
  assert.throws(
    () => value.applyCoupon({ code: 'MIN', kind: 'fixed', value: 5, minSubtotal: 200 }),
    InvalidCouponError
  );
  assert.equal(value.total(), 100);
});

test('rechaza porcentajes fuera de 0-100', () => {
  assert.throws(
    () => cart().applyCoupon({ code: 'MAL', kind: 'percent', value: 120 }),
    InvalidCouponError
  );
});

test('un cupón nuevo reemplaza al anterior', () => {
  const value = cart();
  value.applyCoupon({ code: 'DIEZ', kind: 'percent', value: 10 });
  value.applyCoupon({ code: 'CINCO', kind: 'fixed', value: 5 });
  assert.equal(value.total(), 95);
});
