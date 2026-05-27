// ZEM snapshot loader + shaping helpers.
//
// The pure shapers (flattenZones, continentGroups, zemForZone) take the parsed
// snapshot so they are importable by node:test; loadZems is the only
// browser-facing piece (it fetches data/zems.json). The snapshot's values are
// community estimates — see its `disclaimer` field, surfaced in the UI.

/**
 * @typedef {Object} ZemSnapshot
 * @property {string} sourceUrl
 * @property {string} lastVerified
 * @property {number} baseline
 * @property {string} disclaimer
 * @property {Object<string, Object<string, number>>} continents
 */

/**
 * Flatten the snapshot into one row per zone, tagged with its continent.
 * @param {ZemSnapshot} zems
 * @returns {Array<{continent: string, zone: string, zem: number}>}
 */
export function flattenZones(zems) {
  return Object.entries(zems.continents).flatMap(([continent, zones]) =>
    Object.entries(zones).map(([zone, zem]) => ({ continent, zone, zem })),
  );
}

/**
 * Group zones by continent (in snapshot order) for an <optgroup>-per-continent
 * dropdown.
 * @param {ZemSnapshot} zems
 * @returns {Array<{continent: string, zones: Array<{zone: string, zem: number}>}>}
 */
export function continentGroups(zems) {
  return Object.entries(zems.continents).map(([continent, zones]) => ({
    continent,
    zones: Object.entries(zones).map(([zone, zem]) => ({ zone, zem })),
  }));
}

/**
 * Resolve a zone name to its ZEM, searching across continents.
 * @param {ZemSnapshot} zems
 * @param {string} zone
 * @returns {number|undefined} the ZEM, or undefined if the zone is unknown
 */
export function zemForZone(zems, zone) {
  for (const zones of Object.values(zems.continents)) {
    if (Object.prototype.hasOwnProperty.call(zones, zone)) return zones[zone];
  }
  return undefined;
}

/**
 * Fetch and parse the ZEM snapshot. The fetch implementation is injectable so
 * the loader is testable without a browser.
 * @param {typeof fetch} [fetchImpl] defaults to the global fetch
 * @param {string} [url] snapshot location, relative to the page
 * @returns {Promise<ZemSnapshot>}
 * @throws {Error} on a non-ok response
 */
export async function loadZems(fetchImpl = fetch, url = "./data/zems.json") {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Failed to load ZEMs: HTTP ${res.status}`);
  return res.json();
}
