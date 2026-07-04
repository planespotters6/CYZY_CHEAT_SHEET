async function getMetar(icao) {
  if (!icao || icao.length !== 4) {
    throw new Error("Invalid ICAO code.");
  }

  const url =
    `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}` +
    `&format=raw&taf=false`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CYYZ-Cheat-Sheet/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`METAR request failed with status ${response.status}`);
  }

  const metar = (await response.text()).trim();

  return {
    icao,
    metar: metar || "NO METAR FOUND",
    source: "AWC",
    updated: new Date().toISOString()
  };
}

module.exports = {
  getMetar
};