// Published Foam War Parties pricing (see the Services page). Pure functions so they can be tested.

export const DIY = {
  baseBlasters: 12,
  basePrice: 54,
  extraBlaster: 4,
  tier1: 1,
  tier2: 2,
  barrier: 15,
  cone: 0.75,
  whistle: 1.5,
  deliveryBase: 50,
  deliveryIncludedMiles: 15,
  deliveryPerMile: 4,
  depositRate: 0.5,
};

export const FULL = {
  standard: { name: 'Standard Battle', price: 350, max: 12 },
  ultimate: { name: 'Ultimate Battle', price: 450, max: 24 },
  mega: { name: 'Mega Battle', price: 450, perExtra: 12 },
  barrierUpgrade: { count: 5, price: 75 },
  travelFreeMiles: 10,
  travelPer10Miles: 20,
};

const whole = (n: number, min = 0) => Math.max(min, Math.floor(Number.isFinite(n) ? n : 0));
/** Distances are charged per started mile, measured one way from Forsyth. */
const miles = (n: number) => Math.max(0, Math.ceil(Number.isFinite(n) ? n : 0));

export function blasterPrice(count: number) {
  const n = whole(count, DIY.baseBlasters);
  return DIY.basePrice + (n - DIY.baseBlasters) * DIY.extraBlaster;
}

export function diyDeliveryFee(distance: number) {
  const m = miles(distance);
  return DIY.deliveryBase + Math.max(0, m - DIY.deliveryIncludedMiles) * DIY.deliveryPerMile;
}

export function fullPackage(participants: number) {
  const n = whole(participants, 1);
  if (n <= FULL.standard.max) return { ...FULL.standard, price: FULL.standard.price, extra: 0 };
  if (n <= FULL.ultimate.max) return { ...FULL.ultimate, price: FULL.ultimate.price, extra: 0 };
  const extra = n - FULL.ultimate.max;
  return { ...FULL.mega, price: FULL.mega.price + extra * FULL.mega.perExtra, extra };
}

export function fullTravelFee(distance: number) {
  const m = miles(distance);
  if (m <= FULL.travelFreeMiles) return 0;
  return Math.ceil((m - FULL.travelFreeMiles) / 10) * FULL.travelPer10Miles;
}

export interface Line { label: string; amount: number }

export interface DiyInput { blasters: number; tier1: number; tier2: number; barriers: number; cones: number; whistles: number; delivery: boolean; miles: number }
export function diyQuote(i: DiyInput) {
  const blasters = whole(i.blasters, DIY.baseBlasters);
  const tier1 = Math.min(whole(i.tier1), blasters);
  const tier2 = Math.min(whole(i.tier2), blasters - tier1);
  const lines: Line[] = [{ label: `${blasters} blasters, goggles & ${blasters * 80} foam rounds`, amount: blasterPrice(blasters) }];
  if (tier1) lines.push({ label: `${tier1} × Specialty Tier 1 upgrade`, amount: tier1 * DIY.tier1 });
  if (tier2) lines.push({ label: `${tier2} × Specialty Tier 2 upgrade`, amount: tier2 * DIY.tier2 });
  const b = whole(i.barriers), c = whole(i.cones), w = whole(i.whistles);
  if (b) lines.push({ label: `${b} × Inflatable barrier`, amount: b * DIY.barrier });
  if (c) lines.push({ label: `${c} × Boundary cone`, amount: c * DIY.cone });
  if (w) lines.push({ label: `${w} × Whistle`, amount: w * DIY.whistle });
  lines.push(i.delivery
    ? { label: `Delivery (${miles(i.miles)} miles)`, amount: diyDeliveryFee(i.miles) }
    : { label: 'Pickup in Forsyth', amount: 0 });
  const total = round(lines.reduce((s, l) => s + l.amount, 0));
  const deposit = round(total * DIY.depositRate);
  return { lines, total, deposit, balance: round(total - deposit), tier1, tier2, blasters };
}

export interface FullInput { participants: number; extraBarriers: boolean; miles: number }
export function fullQuote(i: FullInput) {
  const participants = whole(i.participants, 1);
  const pkg = fullPackage(participants);
  const lines: Line[] = [{ label: `${pkg.name} (${participants} participant${participants === 1 ? '' : 's'})`, amount: pkg.price }];
  if (i.extraBarriers) lines.push({ label: `${FULL.barrierUpgrade.count} extra inflatable barriers`, amount: FULL.barrierUpgrade.price });
  const fee = fullTravelFee(i.miles);
  lines.push({ label: `Travel fee (${miles(i.miles)} miles)`, amount: fee });
  return { lines, total: round(lines.reduce((s, l) => s + l.amount, 0)), pkg, participants };
}

const round = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => (n === 0 ? 'Free' : '$' + (Number.isInteger(n) ? String(n) : n.toFixed(2)));
