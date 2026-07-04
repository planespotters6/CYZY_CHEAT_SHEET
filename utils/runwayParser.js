const { classifyConfig, makeDisplay } = require("./configClassifier");

function normalizeText(text) {
  return String(text || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/RUNWAYS/g, "RWY")
    .replace(/RUNWAY/g, "RWY")
    .trim();
}

function cleanRunway(rwy) {
  return String(rwy || "")
    .toUpperCase()
    .replace(/^0([1-9])/, "$1")
    .replace(/[^0-9LCR]/g, "");
}

function uniqueRunways(items) {
  return [...new Set(items.map(cleanRunway).filter(Boolean))];
}

function extractRunways(text) {
  const matches = [];
  const regex = /\b(0?[1-9]|[12][0-9]|3[0-6])\s*([LCR])?\b/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push(`${match[1]}${match[2] || ""}`);
  }

  return uniqueRunways(matches);
}

function getSection(text, startWords, stopWords) {
  let start = -1;
  let matchedStart = "";

  for (const word of startWords) {
    const index = text.indexOf(word);

    if (index !== -1 && (start === -1 || index < start)) {
      start = index;
      matchedStart = word;
    }
  }

  if (start === -1) return "";

  let end = text.length;

  for (const stop of stopWords) {
    const stopIndex = text.indexOf(stop, start + matchedStart.length);

    if (stopIndex !== -1 && stopIndex < end) {
      end = stopIndex;
    }
  }

  return text.slice(start, end);
}

function parseAtisRunways(rawText) {
  const text = normalizeText(rawText);

  const arrivalSection = getSection(
    text,
    [
      "ARRIVING RWY",
      "ARR RWY",
      "LDG RWY",
      "LANDING RWY",
      "APCH PRI",
      "APCH"
    ],
    [
      "DEP RWY",
      "DEPARTING RWY",
      "DEPARTURE RWY",
      "WIND",
      "ALTIMETER",
      "ADVS"
    ]
  );

  const departureSection = getSection(
    text,
    [
      "DEPARTING RWY",
      "DEP RWY",
      "DEPARTURE RWY",
      "TAKEOFF RWY"
    ],
    [
      "ARRIVING RWY",
      "ARR RWY",
      "LDG RWY",
      "WIND",
      "ALTIMETER",
      "ADVS"
    ]
  );

  const arrivals = extractRunways(arrivalSection);
  const departures = extractRunways(departureSection);

  const parsed = {
    rawText: text,
    arrivals,
    departures,
    hasPrimarySecondary:
      (/\bPRI\b|\bPRIMARY\b/.test(text)) &&
      (/\bSRY\b|\bSECONDARY\b/.test(text))
  };

  const config = classifyConfig(parsed);

  return {
    config,
    arrivals,
    departures,
    display: makeDisplay(config, arrivals, departures),
    rawText: text
  };
}

module.exports = {
  parseAtisRunways
};