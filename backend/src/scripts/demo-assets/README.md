# Demo product photos

Drop product images here, named by SKU. `seedDemoAccount.js` picks them up
automatically and uploads them with each product.

## Naming

The filename must match the product SKU exactly, with any of these
extensions: `.jpg`, `.jpeg`, `.png`, `.webp`

| File to add | Product |
|---|---|
| `DEMO-YARN-40S.jpg` | Cotton Yarn — 40s Combed |
| `DEMO-DENIM-12OZ.jpg` | Denim Fabric — 12oz Selvedge |
| `DEMO-KRAFT-120.jpg` | Kraft Paper Roll — 120 GSM |
| `DEMO-BOX-3PLY.jpg` | Corrugated Box — 3 Ply |
| `DEMO-NAHCO3-FG.jpg` | Sodium Bicarbonate — Food Grade |
| `DEMO-CU-15SQMM.jpg` | Copper Wire — 1.5 sq mm |
| `DEMO-BRG-6205.jpg` | Deep Groove Ball Bearing 6205-2RS |
| `DEMO-RICE-1121.jpg` | Basmati Rice — 1121 Steam |

You don't need all eight. Any SKU without an image is still created — it
just shows the "No image" placeholder.

## You do not need to produce base64

The product image API takes base64 in its `content` field, but the script
reads your ordinary image file and encodes it for you. Same thing the
mobile app does when you pick a photo from the library. Just put normal
`.jpg` files here.

## Sizing

Aim for roughly **1200 × 900** and **under 2 MB** each. The backend caps
image uploads at 5 MB.

## Where to get images

Anything you have the right to use. Free commercial-use sources include
Unsplash, Pexels, and Pixabay — search the material name (e.g. "cotton
yarn cone", "kraft paper roll", "copper wire"). Photos of your client's
actual stock are better still.

## Not committed

This folder is gitignored apart from this README, so demo photos stay
local and don't bloat the repo.
