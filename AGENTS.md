# Stack
- Node.js CommonJS application using Express 4 and body-parser.
- `server.js` serves `public/`, mounts API routers, and serves printable HTML invoices.
- `lib/store.js` reads and writes JSON data in `data/db.json`.

# Module map
## routes/
- `routes/customers.js` — customer listing and Khata settlement endpoints.
- `routes/orders.js` — order listing, lookup, creation, and cancellation endpoints.
- `routes/products.js` — product and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.

## lib/
- `lib/coupons.js` — coupon normalization, validation, discounts, and active coupon listing.
- `lib/dates.js` — Indian date formatting, date key normalization, and fiscal year calculation.
- `lib/inventory.js` — product lookup, sellable stock checks, stock updates, and inventory summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata debits, reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — order subtotal, coupon discount, GST totals, and line breakdowns.
- `lib/reports.js` — dashboard summary and stored-order versus invoice GST reconciliation.
- `lib/store.js` — JSON database reads/writes, default structure, and audit entries.
- `lib/tax.js` — GST rate resolution and CGST/SGST split.

# Commands
- Start the app: `npm start` (runs `node server.js`; default port is 3000).
- Run tests: `node --test`.

# Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
