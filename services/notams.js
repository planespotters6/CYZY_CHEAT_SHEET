async function getNotams(icao) {
  if (!icao || icao.length !== 4) {
    throw new Error("Invalid ICAO code.");
  }

  // Temporary placeholder until we connect the live NAV CANADA NOTAM source.
  return {
    icao,
    source: "NAV CANADA",
    updated: new Date().toISOString(),
    notams: [],
    display: "NOTAM SOURCE NOT CONNECTED YET"
  };
}

module.exports = {
  getNotams
};