import test from 'node:test';
import assert from 'node:assert/strict';

// ── 1. Phone & Validation Logic ──────────────────────────────────────────
function validateAlgerianPhone(phone) {
  const clean = phone.replace(/[\s\-\.]/g, '');
  const patterns = [
    /^(0)(5|6|7)[0-9]{8}$/,
    /^(\+213|00213)(5|6|7)[0-9]{8}$/,
    /^(213)(5|6|7)[0-9]{8}$/,
  ];
  return patterns.some((p) => p.test(clean));
}

function validateRequired(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function formatPrice(amount) {
  return `${amount.toLocaleString('fr-DZ')} DA`;
}

test('Scenario 1 & 2: Algerian Phone Number Validation', () => {
  // Valid Mobilis, Djezzy, Ooredoo numbers
  assert.equal(validateAlgerianPhone('0557919224'), true, 'Local 05 format');
  assert.equal(validateAlgerianPhone('0661123456'), true, 'Local 06 format');
  assert.equal(validateAlgerianPhone('0770123456'), true, 'Local 07 format');
  assert.equal(validateAlgerianPhone('+213557919224'), true, '+213 format');
  assert.equal(validateAlgerianPhone('00213661123456'), true, '00213 format');
  assert.equal(validateAlgerianPhone('05 57 91 92 24'), true, 'Spaced format');
  assert.equal(validateAlgerianPhone('05-57-91-92-24'), true, 'Dashed format');

  // Invalid numbers
  assert.equal(validateAlgerianPhone('021123456'), false, 'Landline without mobile prefix');
  assert.equal(validateAlgerianPhone('123456'), false, 'Too short');
  assert.equal(validateAlgerianPhone('055555555555'), false, 'Too long');
  assert.equal(validateAlgerianPhone('+33612345678'), false, 'French phone number');
  assert.equal(validateAlgerianPhone('abcdefghij'), false, 'Alphabetic input');
  assert.equal(validateAlgerianPhone(''), false, 'Empty string');
});

test('Scenario 3: Required Field Validation', () => {
  assert.equal(validateRequired('Boutabout Ali'), true);
  assert.equal(validateRequired(''), false);
  assert.equal(validateRequired('   '), false);
  assert.equal(validateRequired(null), false);
  assert.equal(validateRequired(undefined), false);
});

// ── 2. Pricing and Cart Math ──────────────────────────────────────────────
test('Scenario 4 & 12: Trusted Pricing and Cart Subtotal Calculations', () => {
  const items = [
    { base_price: 3500, price_adjustment: 0, quantity: 2 },
    { base_price: 1800, price_adjustment: 200, quantity: 1 },
  ];

  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.base_price + item.price_adjustment;
    return acc + unitPrice * item.quantity;
  }, 0);

  const deliveryFee = 500;
  const total = subtotal + deliveryFee;

  assert.equal(subtotal, 9000, '3500*2 + 2000*1 = 9000');
  assert.equal(total, 9500, '9000 + 500 delivery = 9500');
  assert.match(formatPrice(total), /9[\s\u202f]?500 DA/);
});

// ── 3. Order Submission Payload Validation ─────────────────────────────────
function validateOrderPayload(customer, items) {
  if (!customer || !items) throw new Error('بيانات غير مكتملة');
  if (!items || items.length === 0) throw new Error('سلة التسوق فارغة');

  const fullName = customer.full_name?.trim() || '';
  const phone = customer.phone?.trim() || '';
  const wilaya = customer.wilaya?.trim() || '';
  const commune = customer.commune?.trim() || '';
  const address = customer.address?.trim() || '';

  if (fullName.length < 2) throw new Error('الاسم واللقب مطلوب');
  if (!validateAlgerianPhone(phone)) throw new Error('رقم الهاتف غير صالح');
  if (wilaya.length < 2) throw new Error('الولاية مطلوبة');
  if (commune.length < 2) throw new Error('البلدية مطلوبة');
  if (address.length < 4) throw new Error('العنوان بالتفصيل مطلوب');

  for (const item of items) {
    if (!item.variant_id) throw new Error('معرف المنتج غير صالح');
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('الكمية يجب أن تكون عدداً صحيحاً أكبر من الصفر');
    }
  }

  return true;
}

test('Scenario 3 & 4: Cart and Variant Validation', () => {
  const validCustomer = {
    full_name: 'علي بوطابوط',
    phone: '0557919224',
    wilaya: '22 - سيدي بلعباس',
    commune: 'تلموني',
    address: 'حي الشهداء، عمارة 4',
  };

  // Rejects empty cart
  assert.throws(() => validateOrderPayload(validCustomer, []), /سلة التسوق فارغة/);

  // Rejects zero or negative quantity
  assert.throws(
    () => validateOrderPayload(validCustomer, [{ variant_id: 'v-1', quantity: 0 }]),
    /الكمية يجب أن تكون/
  );
  assert.throws(
    () => validateOrderPayload(validCustomer, [{ variant_id: 'v-1', quantity: -2 }]),
    /الكمية يجب أن تكون/
  );

  // Rejects invalid phone
  assert.throws(
    () => validateOrderPayload({ ...validCustomer, phone: '01234' }, [{ variant_id: 'v-1', quantity: 1 }]),
    /رقم الهاتف غير صالح/
  );

  // Accepts valid payload
  const result = validateOrderPayload(validCustomer, [
    { variant_id: 'a1000000-0000-0000-0000-000000000001', quantity: 2 },
  ]);
  assert.equal(result, true);
});

// ── 4. Admin Role Verification Logic ──────────────────────────────────────
function isAuthorizedAdmin(profile) {
  if (!profile) return false;
  return profile.role === 'admin';
}

test('Scenario 9 & 10: Role-Based Admin Access Control', () => {
  assert.equal(isAuthorizedAdmin({ id: '1', role: 'admin' }), true, 'Admin profile allowed');
  assert.equal(isAuthorizedAdmin({ id: '2', role: 'user' }), false, 'Regular user rejected');
  assert.equal(isAuthorizedAdmin({ id: '3', role: 'customer' }), false, 'Customer role rejected');
  assert.equal(isAuthorizedAdmin(null), false, 'Null session rejected');
  assert.equal(isAuthorizedAdmin(undefined), false, 'Undefined session rejected');
  assert.equal(isAuthorizedAdmin({ id: '4' }), false, 'Missing role rejected');
});

// ── 5. Stock Restoration on Cancellation Logic ─────────────────────────────
test('Scenario 8: Stock Restoration State Machine', () => {
  let stock = 10;
  const quantity = 3;

  function simulateStatusChange(oldStatus, newStatus) {
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      stock += quantity;
    } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
      stock = Math.max(0, stock - quantity);
    }
  }

  // Deduct upon order placement: stock becomes 7
  stock -= quantity;
  assert.equal(stock, 7, 'Stock deducted to 7 after order placement');

  // Transition: pending -> confirmed (stock unchanged)
  simulateStatusChange('pending', 'confirmed');
  assert.equal(stock, 7, 'Pending -> Confirmed does not change stock');

  // Transition: confirmed -> shipped (stock unchanged)
  simulateStatusChange('confirmed', 'shipped');
  assert.equal(stock, 7, 'Confirmed -> Shipped does not change stock');

  // Transition: shipped -> cancelled (stock restored exactly once)
  simulateStatusChange('shipped', 'cancelled');
  assert.equal(stock, 10, 'Cancelled restores stock back to 10');

  // Transition: repeated update to cancelled (e.g. admin saves note)
  simulateStatusChange('cancelled', 'cancelled');
  assert.equal(stock, 10, 'Repeated cancelled update does NOT restore stock again');

  // Transition: un-cancelling back to confirmed
  simulateStatusChange('cancelled', 'confirmed');
  assert.equal(stock, 7, 'Un-cancelling safely re-deducts stock to 7');
});
