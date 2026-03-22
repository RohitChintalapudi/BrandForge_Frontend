export function getCampaignIdFromRef(ref) {
  if (ref == null) return null;
  if (typeof ref === "object" && ref._id != null) return String(ref._id);
  return String(ref);
}

/** Merge API campaign id with /api/campaigns list so reward/title resolve when `campaign` is unpopulated. */
export function resolvedWinCampaign(w, campaigns) {
  const id = getCampaignIdFromRef(w.campaign ?? w.campaignId);
  const fromList =
    id != null
      ? (campaigns || []).find((c) => String(c._id) === id)
      : undefined;
  const embedded =
    w.campaign && typeof w.campaign === "object" ? w.campaign : null;
  return { ...(fromList || {}), ...(embedded || {}) };
}

export function prizeForWin(w, campaigns) {
  const r = resolvedWinCampaign(w, campaigns).reward;
  if (r == null) return null;
  const s = typeof r === "string" ? r.trim() : String(r).trim();
  return s || null;
}

export function titleForWin(w, campaigns) {
  const t = resolvedWinCampaign(w, campaigns).title;
  return t?.trim() || "Campaign";
}

function parsePrizeNumber(reward) {
  if (reward == null) return null;
  const s = String(reward).replace(/,/g, "");
  const m = s.match(/[\d.]+/);
  if (!m) return null;
  const n = parseFloat(m[0]);
  return Number.isFinite(n) ? n : null;
}

function currencyPrefix(sample) {
  if (!sample) return "₹";
  const lead = String(sample).match(/^[^\d]*/);
  const p = (lead?.[0] || "").replace(/\s/g, "").trim();
  return p || "₹";
}

/** Display string for sum of prizes across wins, or joined literals if amounts are not all numeric. */
export function totalWonSummary(wins, campaigns) {
  if (!wins?.length) return null;
  const prizes = wins.map((w) => prizeForWin(w, campaigns)).filter(Boolean);
  if (prizes.length === 0) return null;
  const nums = prizes.map(parsePrizeNumber);
  const allNumeric = nums.every((n) => n != null);
  if (allNumeric) {
    const sum = nums.reduce((a, b) => a + b, 0);
    const prefix = currencyPrefix(prizes[0]);
    return `${prefix}${sum.toLocaleString("en-IN")}`;
  }
  return prizes.join(" + ");
}
