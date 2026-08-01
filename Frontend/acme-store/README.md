# Acme Store - Customer Storefront & Support Widget

A mockup client storefront application integrating our support widget, allowing customers to communicate with AI support bots and live support agents.

## Key Features

- **Embedded Live Chat Widget**: Renders chat bubbles, dynamic typing animations, message statuses, and dynamic link embeddings.
- **Customer Identity Selector**: Testing dashboard component to easily switch customer profiles during local validation.

## Key Assumptions

1. **API Endpoints**: The application is configured to connect to the deployed backend on `https://ticvic-intercom-backend.onrender.com` by default (can be updated to `http://localhost:8000` for local runs).
2. **Preseeded Firebase Documents**: Assumes that customer profile IDs (`customer_01`, `customer_02`, etc.) correspond to preseeded customer records in Firebase RTDB to maintain message tracking.
3. **Custom Domain Linking**: Custom domain resolutions assume that when a workspace successfully verifies a custom domain (e.g. `help.acme.com`), article URLs resolve to `http://{custom_domain}/articles/{slug}` instead of localhost fallbacks.
4. **DNS Verification Stubs**: DNS checks and SSL certificate setups (via Cloudflare / Let's Encrypt) are stubbed in the backend endpoints to allow development without editing active registrars.

## Execution

```bash
npm install
npm run dev
```
