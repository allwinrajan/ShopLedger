'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, sku, hsn, price, qty) {
  return { name, sku, hsn, price, qty };
}

function compare(order) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
  return { invoiceFigures, checkoutFigures };
}

test('invoice figures match checkout HSN tax and capped pre-tax coupon totals', function () {
  const orders = [
    {
      id: 1001,
      coupon: '',
      items: [
        item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2),
        item('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2)
      ]
    },
    {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1),
        item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2)
      ]
    },
    {
      id: 1004,
      coupon: 'SAVE10',
      items: [
        item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
      ]
    },
    {
      id: 1008,
      coupon: '',
      items: [
        item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1),
        item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2)
      ]
    }
  ];

  for (const order of orders) {
    const { invoiceFigures, checkoutFigures } = compare(order);
    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        lines: invoiceFigures.rows.map((row) => ({ gstPercent: row.gstPercent, lineTax: row.lineTax }))
      },
      {
        subtotal: checkoutFigures.subtotal,
        discount: checkoutFigures.discount,
        tax: checkoutFigures.tax,
        cgst: checkoutFigures.cgst,
        sgst: checkoutFigures.sgst,
        total: checkoutFigures.total,
        lines: checkoutFigures.lines.map((line) => ({ gstPercent: line.gstPercent, lineTax: line.tax }))
      },
      `invoice and checkout figures differ for order #${order.id}`
    );
  }
});

test('invoice #1001 reflects checkout GST slabs for tea and dal', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 2),
      item('Unpolished Toor Dal 1kg', 'GRN-002', '0713', 165, 2)
    ]
  };
  const { invoiceFigures, checkoutFigures } = compare(order);

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total, rates: invoiceFigures.rows.map((row) => row.gstPercent) },
    { subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, rates: [18, 5] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 610, discount: 0, tax: 66.9, total: 676.9 }
  );
});

test('invoice #1002 uses checkout SAVE10 discount and HSN GST', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', 'GRN-001', '1006', 640, 1),
      item('Cold-Pressed Sunflower Oil 1L', 'OIL-001', '1512', 190, 2)
    ]
  };
  const { invoiceFigures, checkoutFigures } = compare(order);

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total, rates: invoiceFigures.rows.map((row) => row.gstPercent) },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9, rates: [5, 5] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
  );
});

test('invoice #1004 applies the SAVE10 maximum discount before HSN GST', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      item('Cold-Pressed Groundnut Oil 5L', 'OIL-002', '1508', 1120, 2)
    ]
  };
  const { invoiceFigures, checkoutFigures } = compare(order);

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, total: invoiceFigures.total, rate: invoiceFigures.rows[0].gstPercent },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5, rate: 5 }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
  );
});

test('CURRENT BEHAVIOUR: #1008 invoice and checkout totals agree for 18% HSN items without a coupon', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', 'BEV-001', '0902', 140, 1),
      item('Kokum Sherbet Concentrate 750ml', 'BEV-003', '2106', 180, 2)
    ]
  };
  const { invoiceFigures, checkoutFigures } = compare(order);

  assert.deepEqual(
    { subtotal: invoiceFigures.subtotal, discount: invoiceFigures.discount, tax: invoiceFigures.tax, cgst: invoiceFigures.cgst, sgst: invoiceFigures.sgst, total: invoiceFigures.total, rates: invoiceFigures.rows.map((row) => row.gstPercent) },
    { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, rates: [18, 18] }
  );
  assert.deepEqual(
    { subtotal: checkoutFigures.subtotal, discount: checkoutFigures.discount, tax: checkoutFigures.tax, total: checkoutFigures.total },
    { subtotal: 500, discount: 0, tax: 90, total: 590 }
  );
});
