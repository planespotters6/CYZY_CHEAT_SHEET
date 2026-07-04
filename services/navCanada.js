const crypto = require("crypto");

const {
  parseAtisRunways
} = require("../utils/runwayParser");

const BASE_URL = "https://spaces.navcanada.ca";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/149.0.0.0 Safari/537.36",

  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9"
};


// ============================================================
// GET COOKIES FROM THE AEROVIEW PAGE
// ============================================================

async function getSessionCookie(icao) {
  const pageUrl =
    `${BASE_URL}/workspace/aeroview/${icao}`;

  const response = await fetch(pageUrl, {
    headers: BROWSER_HEADERS,
    redirect: "follow"
  });

  let setCookies = [];

  // Node 20+
  if (
    response.headers &&
    typeof response.headers.getSetCookie === "function"
  ) {
    setCookies = response.headers.getSetCookie();
  } else {
    const raw = response.headers.get("set-cookie");

    if (raw) {
      setCookies = [raw];
    }
  }

  return setCookies
    .map(cookie => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}


// ============================================================
// DECRYPT NAV CANADA RESPONSE
// ============================================================

function decryptNavCanadaPayload(encryptedText) {
  const keyText = process.env.NAVCANADA_AES_KEY;

  if (!keyText) {
    throw new Error(
      "Missing NAVCANADA_AES_KEY environment variable."
    );
  }

  let payload = String(encryptedText || "").trim();

  // Sometimes the API may return the Base64 string inside JSON.
  try {
    const parsed = JSON.parse(payload);

    if (typeof parsed === "string") {
      payload = parsed;
    } else if (
      parsed &&
      typeof parsed.data === "string"
    ) {
      payload = parsed.data;
    }
  } catch {
    // Plain Base64 response — continue normally.
  }

  const combined = Buffer.from(payload, "base64");

  if (combined.length <= 16) {
    throw new Error(
      "NAV CANADA encrypted response is too short."
    );
  }

  // First 16 bytes = IV.
  const iv = combined.subarray(0, 16);

  // Everything after the IV = encrypted JSON.
  const ciphertext = combined.subarray(16);

  const key = Buffer.from(keyText, "utf8");

  let algorithm;

  if (key.length === 16) {
    algorithm = "aes-128-cbc";
  } else if (key.length === 24) {
    algorithm = "aes-192-cbc";
  } else if (key.length === 32) {
    algorithm = "aes-256-cbc";
  } else {
    throw new Error(
      `Invalid AES key length: ${key.length} bytes. ` +
      "Expected 16, 24, or 32."
    );
  }

  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    iv
  );

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString("utf8");

  return JSON.parse(decrypted);
}


// ============================================================
// FIND THE ATIS TEXT INSIDE THE DECRYPTED JSON
// ============================================================

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach(item => {
      collectStrings(item, output);
    });

    return output;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach(item => {
      collectStrings(item, output);
    });
  }

  return output;
}


function scoreAtisCandidate(text, icao) {
  const upper = String(text || "").toUpperCase();

  let score = 0;

  if (upper.includes(icao)) score += 3;
  if (upper.includes("ATIS")) score += 5;
  if (upper.includes("APCH")) score += 4;
  if (upper.includes("LDG RWY")) score += 6;
  if (upper.includes("DEP RWY")) score += 6;
  if (upper.includes("ARRIVING RWY")) score += 5;
  if (upper.includes("DEPARTING RWY")) score += 5;
  if (upper.includes("PRI")) score += 2;
  if (upper.includes("SRY")) score += 2;
  if (upper.length > 80) score += 1;

  return score;
}


function findAtisText(data, icao) {
  const strings = collectStrings(data);

  const ranked = strings
    .map(text => ({
      text,
      score: scoreAtisCandidate(text, icao)
    }))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score < 5) {
    return "";
  }

  return ranked[0].text;
}


// ============================================================
// MAIN FUNCTION
// ============================================================

async function getRealConfig(icao) {
  if (!icao || icao.length !== 4) {
    throw new Error("Invalid ICAO code.");
  }

  const pageUrl =
    `${BASE_URL}/workspace/aeroview/${icao}`;

  const apiUrl =
    `${BASE_URL}/service/iwv/api/atis/v1` +
    `?siteId=${encodeURIComponent(icao)}`;

  // First visit the AeroView page to collect any session cookies.
  const cookie = await getSessionCookie(icao);

  const headers = {
    ...BROWSER_HEADERS,
    "Referer": pageUrl
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(apiUrl, {
    method: "GET",
    headers
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `NAV CANADA ATIS request failed: ` +
      `${response.status} ${body.slice(0, 200)}`
    );
  }

  const decryptedData =
    decryptNavCanadaPayload(body);

  const rawAtis =
    findAtisText(decryptedData, icao);

  if (!rawAtis) {
    return {
      icao,
      online: false,
      config: "UNKNOWN",
      arrivals: [],
      departures: [],
      display: "IRL CONFIG UNAVAILABLE",
      rawAtis: "",
      source: "NAV CANADA NC-AeroView"
    };
  }

  const parsed = parseAtisRunways(rawAtis);

  return {
    icao,
    online: true,
    config: parsed.config,
    arrivals: parsed.arrivals,
    departures: parsed.departures,
    display: parsed.display,
    rawAtis,
    source: "NAV CANADA NC-AeroView",
    updated: new Date().toISOString()
  };
}


module.exports = {
  getRealConfig
};