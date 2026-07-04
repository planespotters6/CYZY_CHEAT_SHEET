const routes = require("../data/cfsRoutes.json");


const JET_TYPES = new Set([
  "A318",
  "A319",
  "A320",
  "A321",
  "A20N",
  "A21N",
  "A332",
  "A333",
  "A339",
  "A342",
  "A343",
  "A345",
  "A346",
  "A359",
  "A35K",
  "A388",

  "B712",
  "B721",
  "B722",
  "B731",
  "B732",
  "B733",
  "B734",
  "B735",
  "B736",
  "B737",
  "B738",
  "B739",
  "B38M",
  "B39M",
  "B744",
  "B748",
  "B752",
  "B753",
  "B762",
  "B763",
  "B764",
  "B772",
  "B77L",
  "B77W",
  "B788",
  "B789",
  "B78X",

  "BCS1",
  "BCS3",

  "CRJ1",
  "CRJ2",
  "CRJ7",
  "CRJ9",
  "CRJX",

  "E135",
  "E145",
  "E170",
  "E175",
  "E190",
  "E195",
  "E290",
  "E295",

  "F100",

  "MD80",
  "MD81",
  "MD82",
  "MD83",
  "MD87",
  "MD88",
  "MD90"
]);


const DH8D_TYPES = new Set([
  "DH8D"
]);


const SINGLE_ENGINE_TYPES = new Set([
  "C150",
  "C152",
  "C172",
  "C175",
  "C177",
  "C180",
  "C182",
  "C185",
  "C206",
  "C208",
  "C210",

  "DA20",
  "DA40",

  "SR20",
  "SR22",

  "PA28",
  "PA32",

  "M20P",

  "PC12",

  "TBM7",
  "TBM8",
  "TBM9"
]);


const APPROX_SPEEDS = {
  DH8D: 360,
  DH8A: 270,
  DH8B: 285,
  DH8C: 300,

  AT43: 260,
  AT45: 270,
  AT72: 275,
  AT75: 275,
  AT76: 280,

  PC12: 285,

  BE20: 285,
  B350: 310,

  C208: 175,
  C172: 120,
  C182: 145,

  DA40: 145,
  SR22: 180
};


function clean(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}


function isJetType(type) {
  if (JET_TYPES.has(type)) {
    return true;
  }

  return (
    /^A3\d{2}$/.test(type) ||
    /^B7\d{2}$/.test(type) ||
    /^CRJ/.test(type) ||
    /^E1\d{2}$/.test(type) ||
    /^E2\d{2}$/.test(type) ||
    /^BCS/.test(type)
  );
}


function getAircraftInfo(acType) {
  const type = clean(acType);

  const knownJet = isJetType(type);
  const isDh8d = DH8D_TYPES.has(type);
  const isSingleEngine =
    SINGLE_ENGINE_TYPES.has(type);

  const hasKnownSpeed =
    Object.prototype.hasOwnProperty.call(
      APPROX_SPEEDS,
      type
    );

  const isKnown =
    knownJet ||
    isDh8d ||
    isSingleEngine ||
    hasKnownSpeed;

  const useJetFallback = !isKnown;

  let speed = APPROX_SPEEDS[type];

  if (!speed) {
    if (knownJet || useJetFallback) {
      speed = 450;
    } else if (isDh8d) {
      speed = 360;
    } else if (isSingleEngine) {
      speed = 160;
    } else {
      speed = 250;
    }
  }

  const isJet =
    knownJet || useJetFallback;

  return {
    type,
    isKnown,
    useJetFallback,
    isJet,
    isDh8d,
    isSingleEngine,
    speed,
    group: isJet ? "JET" : "NONJET"
  };
}


function groupMatches(
  routeGroup,
  aircraft
) {
  switch (routeGroup) {
    case "ALL":
      return true;

    case "JET":
      return aircraft.isJet;

    case "NONJET":
      return !aircraft.isJet;

    case "JET_OR_DH8D":
    case "DH8D_OR_FASTER":
      return (
        aircraft.isJet ||
        aircraft.isDh8d
      );

    case "SLOWER_THAN_DH8D":
      return (
        !aircraft.isJet &&
        !aircraft.isDh8d
      );

    case "SINGLE_ENGINE":
      return aircraft.isSingleEngine;

    default:
      return true;
  }
}


function speedMatches(
  limitations,
  speed
) {
  const text = String(
    limitations || ""
  ).toUpperCase();

  let match = text.match(
    /N(\d{4})\s*&\s*ABV/
  );

  if (
    match &&
    speed < Number(match[1])
  ) {
    return false;
  }


  match = text.match(
    /N(\d{4})\s*&\s*BLW/
  );

  if (
    match &&
    speed > Number(match[1])
  ) {
    return false;
  }


  match = text.match(
    /N(\d{4})\s*-\s*N(\d{4})/
  );

  if (match) {
    const min = Number(match[1]);
    const max = Number(match[2]);

    if (
      speed < min ||
      speed > max
    ) {
      return false;
    }
  }

  return true;
}


function preferredAltitudeFt(
  route,
  aircraft
) {
  if (aircraft.isJet) {
    if (route.level === "L") {
      return 19000;
    }

    if (route.level === "H") {
      return 35000;
    }

    return 33000;
  }


  if (aircraft.isDh8d) {
    if (route.level === "L") {
      return 17000;
    }

    if (route.level === "H") {
      return 25000;
    }

    return 23000;
  }


  if (aircraft.isSingleEngine) {
    if (route.level === "H") {
      return 15000;
    }

    if (route.level === "L") {
      return 9000;
    }

    return 11000;
  }


  if (route.level === "L") {
    return 15000;
  }

  if (route.level === "H") {
    return 23000;
  }

  return 19000;
}


function altitudeValue(
  raw,
  type
) {
  const number = Number(raw);

  if (type === "flightLevel") {
    return number * 100;
  }

  if (String(raw).length === 3) {
    return number * 100;
  }

  return number;
}


function parseAltitudeLimits(
  limitations
) {
  const text = String(
    limitations || ""
  ).toUpperCase();

  let min = null;
  let max = null;
  let exact = null;


  const patterns = [
    {
      regex: /FL(\d{3})\s*&\s*ABV/,
      kind: "min",
      type: "flightLevel"
    },
    {
      regex: /FL(\d{3})\s*&\s*BLW/,
      kind: "max",
      type: "flightLevel"
    },
    {
      regex: /F(\d{3})\s*&\s*ABV/,
      kind: "min",
      type: "flightLevel"
    },
    {
      regex: /F(\d{3})\s*&\s*BLW/,
      kind: "max",
      type: "flightLevel"
    },
    {
      regex: /MAX\s*F(\d{3})/,
      kind: "max",
      type: "flightLevel"
    },
    {
      regex: /A(\d{3,5})\s*&\s*ABV/,
      kind: "min",
      type: "altitude"
    },
    {
      regex: /A(\d{3,5})\s*&\s*BLW/,
      kind: "max",
      type: "altitude"
    }
  ];


  patterns.forEach(item => {
    const match = text.match(
      item.regex
    );

    if (!match) {
      return;
    }

    const value = altitudeValue(
      match[1],
      item.type
    );

    if (item.kind === "min") {
      min =
        min === null
          ? value
          : Math.max(min, value);
    }

    if (item.kind === "max") {
      max =
        max === null
          ? value
          : Math.min(max, value);
    }
  });


  if (
    min === null &&
    max === null
  ) {
    const exactMatch = text.match(
      /(?:^|[,\s])A(\d{3,5})(?:$|[,\s])/
    );

    if (exactMatch) {
      exact = altitudeValue(
        exactMatch[1],
        "altitude"
      );
    }
  }


  return {
    min,
    max,
    exact
  };
}


function altitudeMatches(
  route,
  aircraft
) {
  const preferred =
    preferredAltitudeFt(
      route,
      aircraft
    );

  const limits =
    parseAltitudeLimits(
      route.limitations
    );


  if (limits.exact !== null) {
    return (
      Math.abs(
        preferred - limits.exact
      ) <= 8000
    );
  }


  if (
    limits.min !== null &&
    preferred < limits.min
  ) {
    return false;
  }


  if (
    limits.max !== null &&
    preferred > limits.max
  ) {
    return false;
  }


  return true;
}


function scoreCandidate(
  route,
  aircraft
) {
  if (
    !groupMatches(
      route.aircraftGroup,
      aircraft
    )
  ) {
    return -Infinity;
  }


  if (
    !speedMatches(
      route.limitations,
      aircraft.speed
    )
  ) {
    return -Infinity;
  }


  let score = 0;


  if (
    route.aircraftGroup ===
    aircraft.group
  ) {
    score += 100;
  } else if (
    route.aircraftGroup ===
    "ALL"
  ) {
    score += 50;
  } else {
    score += 80;
  }


  if (
    altitudeMatches(
      route,
      aircraft
    )
  ) {
    score += 20;
  }


  if (route.level === "H&L") {
    score += 5;
  }


  if (route.procedure === "RNAV") {
    score += 2;
  }


  return score;
}


function clampAltitudeToLimits(
  altitude,
  limitations
) {
  const limits =
    parseAltitudeLimits(
      limitations
    );


  if (limits.exact !== null) {
    return limits.exact;
  }


  if (
    limits.min !== null &&
    altitude < limits.min
  ) {
    altitude = limits.min;
  }


  if (
    limits.max !== null &&
    altitude > limits.max
  ) {
    altitude = limits.max;
  }


  return altitude;
}


function formatAltitude(
  altitudeFt
) {
  if (altitudeFt >= 18000) {
    return (
      "FL" +
      String(
        Math.round(
          altitudeFt / 100
        )
      ).padStart(3, "0")
    );
  }

  return (
    Math.round(
      altitudeFt / 1000
    ) * 1000
  ) + " FT";
}


function getRecommendedAltitude(
  route,
  aircraft
) {
  let altitude =
    preferredAltitudeFt(
      route,
      aircraft
    );

  altitude =
    clampAltitudeToLimits(
      altitude,
      route.limitations
    );

  return formatAltitude(
    altitude
  );
}


async function getCfsRoute(
  dep,
  arr,
  acType
) {
  dep = clean(dep);
  arr = clean(arr);
  acType = clean(acType);


  if (dep.length !== 4) {
    throw new Error(
      "Invalid departure airport."
    );
  }


  if (arr.length !== 4) {
    throw new Error(
      "Invalid arrival airport."
    );
  }


  if (!acType) {
    throw new Error(
      "Missing aircraft type."
    );
  }


  const aircraft =
    getAircraftInfo(acType);


  const candidates = routes.filter(
    route => (
      route.dep === dep &&
      route.arr === arr
    )
  );


  if (!candidates.length) {
    return {
      found: false,
      dep,
      arr,
      acType,
      aircraftGroup:
        aircraft.group,
      warning:
        aircraft.useJetFallback
          ? "A/C TYPE NOT FOUND — USING JET ROUTE"
          : "",
      route: "",
      altitude: "",
      display:
        "NO CFS ROUTE FOUND"
    };
  }


  const ranked = candidates
    .map(route => ({
      route,
      score: scoreCandidate(
        route,
        aircraft
      )
    }))
    .filter(item =>
      Number.isFinite(
        item.score
      )
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );


  if (!ranked.length) {
    return {
      found: false,
      dep,
      arr,
      acType,
      aircraftGroup:
        aircraft.group,
      warning:
        aircraft.useJetFallback
          ? "A/C TYPE NOT FOUND — USING JET ROUTE"
          : "",
      route: "",
      altitude: "",
      display:
        "NO CFS ROUTE FOR THIS AIRCRAFT"
    };
  }


  const match =
    ranked[0].route;


  const altitude =
    getRecommendedAltitude(
      match,
      aircraft
    );


  return {
    found: true,

    dep,
    arr,
    acType,

    aircraftGroup:
      aircraft.group,

    warning:
      aircraft.useJetFallback
        ? "A/C TYPE NOT FOUND — USING JET ROUTE"
        : "",

    level:
      match.level,

    limitations:
      match.limitations || "",

    procedure:
      match.procedure || "",

    route:
      match.route,

    altitude,

    source:
      "NAV CANADA CFS",

    sourcePage:
      match.sourcePage,

    planningPage:
      match.planningPage
  };
}


module.exports = {
  getCfsRoute
};