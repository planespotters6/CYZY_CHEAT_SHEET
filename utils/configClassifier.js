function classifyConfig(parsed) {
  const arrivals = parsed.arrivals || [];
  const departures = parsed.departures || [];
  const text = parsed.rawText || "";

  // PRISEC always wins first
  if (
    parsed.hasPrimarySecondary ||
    (
      (/\bPRI\b|\bPRIMARY\b/i.test(text)) &&
      (/\bSRY\b|\bSECONDARY\b/i.test(text))
    )
  ) {
    return "PRISEC";
  }

  // count every unique runway actually being used
  const activeRunways = [
    ...new Set([
      ...arrivals,
      ...departures
    ])
  ];

  if (activeRunways.length >= 3) {
    return "TRIPLES";
  }

  if (activeRunways.length === 2) {
    return "DUALS";
  }

  if (activeRunways.length === 1) {
    return "SINGLES";
  }

  return "UNKNOWN";
}


function makeDisplay(
  config,
  arrivals,
  departures
) {
  const arrText = arrivals.length
    ? arrivals.join(", ")
    : "UNKNOWN";

  const depText = departures.length
    ? departures.join(", ")
    : "UNKNOWN";

  const oneLine =
    `${config} — ARR ${arrText} — DEP ${depText}`;

  if (oneLine.length > 55) {
    return (
      `${config} — ARR ${arrText}\n` +
      `DEP ${depText}`
    );
  }

  return oneLine;
}


module.exports = {
  classifyConfig,
  makeDisplay
};