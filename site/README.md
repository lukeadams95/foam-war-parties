# Foam War Parties website

Static Astro build of the Claude Design handoff in `../project/Foam Battle Parties Home.dc.html`.
The page markup was ported from the prototype as-is, and renders pixel-identical to it at 390, 767, 768, 1099, 1100, 1440 and 1920px wide.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/, deploy to any static host
```

## Layout

- `src/layouts/Base.astro`: `<head>` (title, description, favicons, fonts), header/footer, and the client script.
- `src/components/`: `Header` (two-row desktop header, mobile bar and full-screen menu), `Footer`, plus `LandingHeader`/`LandingFooter` for `/birthday-parties/`.
- `src/pages/`: one file per page. Styles stay inline, as in the design.
- `src/scripts/site.ts`: mobile menu, How It Works tabs, FAQ accordions and form handling.
- `src/styles/global.css`: the breakpoints (`--padx` is 20px below 768px; the mobile header is below 1100px) and hover states.

## Before launch

- **Forms:** set `PUBLIC_FORM_ENDPOINT` (a Formspree URL, for example) at build time. Until it's set, forms check required fields and then tell visitors to call or text.
- **Domain:** `site` in `astro.config.mjs` is `https://foambattleparties.com`, the domain in the original brief. Change it if the site launches under a Foam War Parties domain.
- **Google review link:** on `/reviews/`, replace the `href="#"` placeholder that is marked `data-todo`.
- **Build Your Party:** `/build-your-party/` is a price calculator (pricing rules in `src/lib/pricing.ts`). **Continue to Booking** opens `/contact/` with the party type, participants and the estimate prefilled. There is no booking calendar or online payment yet.
- **Address to miles:** on Build Your Party, visitors type their party or delivery address and the driving distance from Forsyth is calculated automatically, with the delivery or travel fee added to the total. There is no mileage box to fill in. The lookup is in `src/lib/distance.ts` and uses the free OpenStreetMap Nominatim and OSRM services, with no API key. Distance is measured from Forsyth's town centre; put the business address coordinates in `ORIGIN` for exact numbers. Continue to Booking waits until the address is entered. If the lookup service is down, visitors can still continue and the fee is marked "to be confirmed" in their request. For heavy traffic, switch to a paid service such as the Google Maps Distance Matrix API.
- **Copy and photos:** the open items from the design chats still apply. They are the cancellation policy, photo rights, and the attorney review of the Terms.
