const routes = require("../data/cfsRoutes.json");


// ben this is where a320 somehow becomes "jet"
const JET_TYPES = new Set([
  "A318",
  "A319",
  "A320",
  "A321",
  "A20N",
  "A21N",
  "A330",
  "A332",
  "A333",
  "A339",
  "A340",
  "A350",
  "A359",
  "A35K",
  "A380",

  "B712",
  "B722",
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

  "CRJ2",
  "CRJ7",
  "CRJ9",
  "CRJX",

  "E170",
  "E175",
  "E190",
  "E195",
  "E290",
  "E295"
]);


function clean(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}


function getAircraftGroup(acType) {
  const type = clean(acType);

  if (JET_TYPES.has(type)) {
    return "JET";
  }

  return "NONJET";
}


function getRecommendedAltitude(route, aircraftGroup) {
  if (route.level === "H") {
    return aircraftGroup === "JET"
      ? "FL350"
      : "FL250";
  }

  if (route.level === "L") {
    return aircraftGroup === "JET"
      ? "FL190"
      : "FL170";
  }

  // H&L for now
  return aircraftGroup === "JET"
    ? "FL330"
    : "FL190";
}


async function getCfsRoute(dep, arr, acType) {
  dep = clean(dep);
  arr = clean(arr);
  acType = clean(acType);

  if (dep.length !== 4) {
    throw new Error("Invalid departure airport.");
  }

  if (arr.length !== 4) {
    throw new Error("Invalid arrival airport.");
  }

  if (!acType) {
    throw new Error("Missing aircraft type.");
  }

  const aircraftGroup = getAircraftGroup(acType);

  const match = routes.find(route => {
    return (
      route.dep === dep &&
      route.arr === arr &&
      route.aircraftGroup === aircraftGroup
    );
  });

  if (!match) {
    return {
      found: false,
      dep,
      arr,
      acType,
      aircraftGroup,
      route: "",
      altitude: "",
      display: "NO CFS ROUTE FOUND"
    };
  }

  return {
    found: true,
    dep,
    arr,
    acType,
    aircraftGroup,
    level: match.level,
    route: match.route,
    altitude: getRecommendedAltitude(
      match,
      aircraftGroup
    )
  };
}


module.exports = {
  getCfsRoute
};