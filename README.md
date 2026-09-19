# UPI Splitter

A simple web app to **collect large UPI payments** by splitting them into multiple scan-ready QR codes.

Many UPI apps work best with amounts up to **₹1,999 per QR**. UPI Splitter breaks a bigger total into smaller QRs so the full amount can still be collected from GPay, PhonePe, Paytm, and other UPI apps.

**Example:** ₹2,500 becomes two QRs — ₹1,999 + ₹501.

The app is in **English**. Tap the **i** icon in the navbar for a short how-to.

## Features

- Enter a UPI ID and the total amount to collect
- Auto-split anything above **₹1,999** into multiple QRs
- Show a **single QR** when the amount is already under the cap
- Live split preview before you generate
- Quick UPI handles: `@okaxis`, `@oksbi`, `@paytm`, `@ybl`
- Scan and pay from GPay, PhonePe, Paytm, and other UPI apps
- Mark each part as **paid** and track how much is left
- View QRs **one by one** or **all at once**
- Share, save, or copy each UPI payment link
- Install as a phone app from the mobile toast (Add to Home Screen)
- Open a shared link with `upi` and `amount` to generate QRs instantly
- Maximum total: **₹1,00,000** (NPCI UPI limit)

## How to use

1. Enter the receiver UPI ID (for example `gauravsoni8414@oksbi`).
2. Enter the total amount to collect.
3. Tap **Generate**. Amounts above ₹1,999 are split automatically.
4. Ask the payer to scan each QR and pay that exact amount.
5. Tap **Mark paid** after each part until the full amount is collected.

For larger transfers, use NEFT/RTGS.

## Run locally

```bash
npm install
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run preview
```

## Shared payment links

Open the app with query parameters so QRs generate automatically:

```
/?upi=name@oksbi&amount=2500
```

## Repo

[github.com/gauravsoni97/upisplitqr](https://github.com/gauravsoni97/upisplitqr)
