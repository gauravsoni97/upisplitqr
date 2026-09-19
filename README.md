# UPI Splitter

A simple web app to **send and receive large UPI payments** by splitting them into multiple scan-ready QR codes.

Many UPI apps work best with amounts up to **₹1,999 per QR**. UPI Splitter breaks a bigger total into smaller QRs so the full amount can still be collected or paid from GPay, PhonePe, Paytm, and other UPI apps.

**Example:** ₹2,500 becomes two QRs — ₹1,999 + ₹501.

The app is in **English**. Tap the **i** icon in the navbar for a short how-to.

## Features

- **Receive** money: enter or scan your UPI ID and generate collect QRs
- **Send** money: scan someone’s UPI QR, then pay with split QRs
- Camera scan fills the UPI ID from a UPI QR
- Optional payment note and repeat from history
- Share a receive link on WhatsApp
- Enter a UPI ID and the total amount to collect or send
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

1. Choose **Receive** or **Send**.
2. Type a UPI ID or tap the camera to scan a UPI QR (for example `gauravsoni8414@oksbi`).
3. Enter the total amount.
4. Tap **Generate** / **Pay**. Amounts above ₹1,999 are split automatically.
5. For receive, ask the payer to scan each QR. For send, open each QR in your UPI app.
6. Tap **Mark paid** after each part until the full amount is done.

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

## Traffic (not shown in the app)

Visitor counts stay in your Google Analytics dashboard, not on the website.

1. Open [Google Analytics](https://analytics.google.com) and create a **GA4** property for this site.
2. Copy the Measurement ID (`G-XXXXXXXX`).
3. Create a `.env` file from `.env.example` and set:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXX
```

4. Rebuild and deploy. Then open **Reports → Acquisition / Engagement** in Analytics.

UPI IDs and payment amounts are **not** sent to Analytics.

## SEO

The site already has title, description, canonical URL, Open Graph tags, sitemap, robots.txt, and structured data.

To appear in Google Search:

1. Deploy the site on HTTPS (GitHub Pages is fine).
2. Open [Google Search Console](https://search.google.com/search-console).
3. Add `https://gauravsoni97.github.io/upisplitqr/`.
4. Verify ownership (HTML tag). Put the code in `.env` as `VITE_GOOGLE_SITE_VERIFICATION=...` and rebuild.
5. Submit `https://gauravsoni97.github.io/upisplitqr/sitemap.xml`.

## Repo

[github.com/gauravsoni97/upisplitqr](https://github.com/gauravsoni97/upisplitqr)
