# Digital Store Demo (Mock Data)

Standalone storefront experience designed for product demos and stakeholder reviews. The demo reuses none of the production database or API surface – everything runs on top of in-memory mock data and can ship to static hosting providers such as Cloudflare Pages.

## Quick start

```bash
cd demo-app
npm install
npm run dev
```

The app boots on [http://localhost:4173](http://localhost:4173) by default.

## What you get

- Interactive product catalog with search, category, and tag filters.
- Rich product detail modal populated by static fixtures.
- Mock checkout panel that simulates quantity changes and a success state – no payment integrations required.
- Pure client-side React (Vite + TypeScript) build that compiles to static assets.

## Deploying to Cloudflare Pages

1. Push the repository (with the new `demo-app` directory) to a branch Cloudflare can access.
2. In the Cloudflare dashboard choose **Pages → Create a project → Connect to Git**.
3. Point to your repository and set the build command/output folder:
   - **Build command:** `npm run build`
   - **Build directory:** `dist`
   - **Root directory:** `demo-app`
4. Cloudflare will run install/build inside `demo-app` and publish the static bundle.
5. For manual deploys, you can also run `npm run build` locally and push the `dist/` folder with `wrangler pages deploy dist`.

_No environment variables or database files are required – everything ships in the bundle._
