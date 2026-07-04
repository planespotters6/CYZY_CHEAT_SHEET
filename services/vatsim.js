const { parseAtisRunways } = require("../utils/runwayParser");

async function getVatsimConfig(icao) {
  if (!icao || icao.length !== 4) {
    throw new Error("Invalid ICAO code.");
  }

  const url = "https://data.vatsim.net/v3/afv-atis-data.json";

  const response = await fetch(url, {
    headers: {
      "User-Agent": "cyyz-cheat-sheet/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`VATSIM request failed: ${response.status}`);
  }

  const atisList = await response.json();

  const matchingStations = atisList.filter((station) => {
    const callsign = String(station.callsign || "").toUpperCase();

    return (
      callsign === `${icao}_ATIS` ||
      callsign.startsWith(`${icao}_`)
    );
  });

  if (!matchingStations.length) {
    return {
      icao,
      online: false,
      config: "OFFLINE",
      arrivals: [],
      departures: [],
      display: "NO VATSIM ATIS",
      rawAtis: ""
    };
  }

  const rawAtis = matchingStations
    .map((station) => {
      const text = Array.isArray(station.text_atis)
        ? station.text_atis.join(" ")
        : String(station.text_atis || "");

      return text;
    })
    .join(" ");

  const parsed = parseAtisRunways(rawAtis);

  return {
    icao,
    online: true,
    config: parsed.config,
    arrivals: parsed.arrivals,
    departures: parsed.departures,
    display: parsed.display,
    rawAtis
  };
}

module.exports = {
  getVatsimConfig
};