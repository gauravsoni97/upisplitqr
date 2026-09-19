# UPI Split QR

Generate UPI payment QR codes and automatically **split large payments** into smaller parts.

Many UPI apps and merchants work best with amounts up to **₹1,999 per QR**. If someone needs to pay more than that, this app breaks the total into multiple scan-and-pay QRs so the full amount can still be collected.

**Example:** ₹2,500 becomes two QRs — ₹1,999 + ₹501.

## What you can do

- Enter a UPI ID and a total amount
- Auto-split the amount into QRs of **₹1,999 or less**
- Show a **single QR** when the amount is already under the cap
- Preview the split before generating (how many QRs, and each amount)
- Scan and pay from **GPay, PhonePe, Paytm**, and other UPI apps
- Mark each part as **paid** and track progress until the full amount is collected
- View QRs **one by one** or **all at once**
- Share, download, or copy each UPI payment link
- Open a shared link with `upi` and `amount` in the URL to generate QRs instantly

## How payment split works

1. Enter the receiver UPI ID (for example `name@oksbi` or `9876543210@paytm`).
2. Enter the total amount to collect.
3. The app splits anything above ₹1,999 into multiple QRs.
4. The payer scans each QR and pays that exact amount.
5. Mark each QR as paid until the full payment is received.

Maximum supported total is **₹1,00,000** (NPCI UPI limit). Larger transfers should use NEFT/RTGS.

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

You can open the app with query parameters so QRs generate automatically:

```
/?upi=name@oksbi&amount=2500
```
