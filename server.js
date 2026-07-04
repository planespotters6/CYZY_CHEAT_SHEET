const express = require("express");
const cors = require("cors");

const { getMetar } = require("./services/metar");
const { getVatsimConfig } = require("./services/vatsim");
const { getRealConfig } = require("./services/navCanada");
const { getNotams } = require("./services/notams");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function cleanIcao(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "CYYZ Cheat Sheet Server"
  });
});

app.get("/api/metar/:icao", async (req, res) => {
  try {
    const data = await getMetar(cleanIcao(req.params.icao));
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.get("/api/vatsim/:icao", async (req, res) => {
  try {
    const data = await getVatsimConfig(cleanIcao(req.params.icao));
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.get("/api/irl/:icao", async (req, res) => {
  try {
    const data = await getRealConfig(cleanIcao(req.params.icao));
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.get("/api/notams/:icao", async (req, res) => {
  try {
    const data = await getNotams(cleanIcao(req.params.icao));
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});