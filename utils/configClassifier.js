function sameRunways(actual, expected) {
  if (actual.length !== expected.length) {
    return false;
  }

  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();

  return actualSorted.every(
    (runway, index) =>
      runway === expectedSorted[index]
  );
}


function isTripleMax(
  arrivals,
  departures
) {
  // east config
  const eastTripleMax =
    sameRunways(
      arrivals,
      ["5", "6R"]
    ) &&
    sameRunways(
      departures,
      ["6L"]
    );


  // west config
  const westTripleMax =
    sameRunways(
      arrivals,
      ["23", "24L"]
    ) &&
    sameRunways(
      departures,
      ["24R"]
    );


  return (
    eastTripleMax ||
    westTripleMax
  );
}


function classifyConfig(parsed) {
  const arrivals =
    parsed.arrivals || [];

  const departures =
    parsed.departures || [];

  const text =
    parsed.rawText || "";


  // PRISEC first
  if (
    parsed.hasPrimarySecondary ||
    (
      (
        /\bPRI\b|\bPRIMARY\b/i
      ).test(text) &&
      (
        /\bSRY\b|\bSECONDARY\b/i
      ).test(text)
    )
  ) {
    return "PRISEC";
  }


  // triple max is a specific 3-runway config
  if (
    isTripleMax(
      arrivals,
      departures
    )
  ) {
    return "TRIPLE MAX";
  }


  // count every unique active runway
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
  const arrText =
    arrivals.length
      ? arrivals.join(", ")
      : "UNKNOWN";

  const depText =
    departures.length
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