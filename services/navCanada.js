const { parseAtisRunways } = require("../utils/runwayParser");

async function getRealConfig(icao) {
  if (!icao || icao.length !== 4) {
    throw new Error("Invalid ICAO code.");
  }

  const url =
    `https://spaces.navcanada.ca/workspace/aeroview/${icao}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(
      `NAV CANADA request failed: ${response.status}`
    );
  }

  const html = await response.text();

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  const parsed = parseAtisRunways(text);

  if (
    !parsed.arrivals.length &&
    !parsed.departures.length
  ) {
    return {
      icao,
      online: false,
      config: "UNKNOWN",
      arrivals: [],
      departures: [],
      display: "IRL CONFIG UNAVAILABLE",
      rawAtis: "",
      source: "NAV CANADA"
    };
  }

  return {
    icao,
    online: true,
    config: parsed.config,
    arrivals: parsed.arrivals,
    departures: parsed.departures,
    display: parsed.display,
    rawAtis: text,
    source: "NAV CANADA"
  };
}

module.exports = {
  getRealConfig
};