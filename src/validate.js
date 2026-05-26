// Pure validation helpers — no DOM, importable by the browser and node:test.
//
// Shared RangeError guards so every module validates inputs the same way. Each
// helper takes a `name` that is embedded in the thrown message for context
// (e.g. "member 1 level must be an integer 1-60, got ...").

/**
 * Assert an integer in [min, max]. Omit max for an open upper bound (>= min).
 * @param {string} name field name for the error message
 * @param {*} value value to check
 * @param {number} min inclusive lower bound
 * @param {number} [max=Infinity] inclusive upper bound
 */
export function assertIntInRange(name, value, min, max = Infinity) {
  if (!Number.isInteger(value) || value < min || value > max) {
    const range = max === Infinity ? `>= ${min}` : `${min}-${max}`;
    throw new RangeError(
      `${name} must be an integer ${range}, got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Assert a finite number strictly greater than 0.
 */
export function assertPositiveFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `${name} must be a finite number > 0, got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Assert a finite number greater than or equal to 0.
 */
export function assertNonNegativeFinite(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${name} must be a finite number >= 0, got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Assert a boolean.
 */
export function assertBoolean(name, value) {
  if (typeof value !== "boolean") {
    throw new RangeError(
      `${name} must be a boolean, got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Assert an array whose length is in [min, max].
 */
export function assertArrayLength(name, value, min, max) {
  if (!Array.isArray(value)) {
    throw new RangeError(
      `${name} must be an array, got ${JSON.stringify(value)}`,
    );
  }
  if (value.length < min || value.length > max) {
    throw new RangeError(
      `${name} must have ${min}-${max} items, got ${value.length}`,
    );
  }
}
