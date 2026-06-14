# HD Background Remover Website

This is a local web app that removes image backgrounds in the browser and exports the result in multiple formats.

## Features

- Upload gate accepts image files up to 10 GB.
- Background removal runs in the browser with `@imgly/background-removal`.
- HD output keeps the model result at full pixel size when the browser can handle the image.
- Download options: transparent PNG, transparent WebP, JPG with a chosen background color, transparent AVIF when supported by the browser, and an SVG wrapper.
- Privacy-first flow: the selected image is processed on the user's device.
- A same-origin `/imgly-data/` proxy is included so the browser can load model assets without CORS errors.

## Important Limit

The app allows files up to 10 GB, but browsers still have RAM, GPU, and canvas limits. Very large image files or extremely high pixel dimensions may fail on low-memory devices. For the best results with large images, use a modern desktop browser and close other heavy apps before processing.

## Run Locally

```bash
npm run dev
```

No dependency install is needed. Open `http://localhost:4173/` after the server starts.

You can also run the server directly:

```bash
node server.mjs
```

## Deployment Note

The AI model runs faster when the site is cross-origin isolated. This project includes local server headers and a `vercel.json` header setup for deployment.

For deployment on a different host, keep `/imgly-data/` proxied to `https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/`, or self-host those model files and update `publicPath` in `src/main.js`.

The first removal may take longer because the browser downloads and caches the model, WASM files, and the versioned background-removal module from CDN.
