function classifyConfig(parsed) {
  const arrivals = parsed.arrivals || [];
  const text = parsed.rawText || "";

  if (
    parsed.hasPrimarySecondary ||
    (
      (/\bPRI\b|\bPRIMARY\b/i.test(text)) &&
      (/\bSRY\b|\bSECONDARY\b/i.test(text))
    )
  ) {
    return "PRISEC";
  }

  if (arrivals.length >= 3) return "TRIPLES";
  if (arrivals.length === 2) return "DUALS";
  if (arrivals.length === 1) return "SINGLES";

  return "UNKNOWN";
}

function makeDisplay(config, arrivals, departures) {
  const arrText = arrivals.length
    ? arrivals.join(", ")
    : "UNKNOWN";

  const depText = departures.length
    ? departures.join(", ")
    : "UNKNOWN";

  const oneLine =
    `${config} — ARR ${arrText} — DEP ${depText}`;

  if (oneLine.length > 55) {
    return `${config} — ARR ${arrText}\nDEP ${depText}`;
  }

  return oneLine;
}

module.exports = {
  classifyConfig,
  makeDisplay
};