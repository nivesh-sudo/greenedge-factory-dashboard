const OWNER = "nivesh-sudo";
const REPO = "greenedge-factory-dashboard";
const BRANCH = "main";
const FILE_PATH = "data.json";
const SECTIONS = ["handles", "printing", "tufting", "trimming", "packaging", "attendance"];

function emptyReport() {
  return {
    prod: {
      handles: { vertical: [], horizontal: [] },
      printing: [],
      tufting: [],
      trimming: [],
      packaging: { sealing: [], pouch: [], loose: [] }
    },
    att: {
      moulding: { day12: {}, night12: {}, hr8: {} },
      tufting: { day12: {}, night12: {}, hr8: {} },
      checking: { hr12: 0, hr8: 0 },
      packaging: { day12: 0, hr8: 0, night12: 0 },
      overhead: { cleaning_8hr: 0, store_12hr: 0, qc_12hr: 0 }
    }
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pin, date, section, payload } = req.body || {};

  if (!process.env.SUPERVISOR_PIN || pin !== process.env.SUPERVISOR_PIN) {
    res.status(401).json({ error: "Incorrect PIN" });
    return;
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }
  if (!SECTIONS.includes(section)) {
    res.status(400).json({ error: "Invalid section" });
    return;
  }
  if (payload === undefined || payload === null) {
    res.status(400).json({ error: "Missing payload" });
    return;
  }

  const token = process.env.GH_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Server is missing GH_TOKEN. Add it in Vercel project settings." });
    return;
  }

  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "greenedge-factory-dashboard"
  };

  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const getRes = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers });
      if (!getRes.ok) throw new Error(`GitHub read failed: ${getRes.status} ${await getRes.text()}`);
      const getJson = await getRes.json();
      const sha = getJson.sha;
      const raw = Buffer.from(getJson.content, "base64").toString("utf8");

      let data;
      try {
        data = raw.trim() ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!data.reports) data.reports = {};
      if (!data.reports[date]) data.reports[date] = emptyReport();
      const day = data.reports[date];
      if (!day.prod) day.prod = emptyReport().prod;
      if (!day.att) day.att = emptyReport().att;

      if (section === "attendance") {
        day.att = payload;
      } else if (section === "handles" || section === "packaging") {
        day.prod[section] = payload;
      } else {
        day.prod[section] = payload;
      }

      const newContent = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `data: ${section} for ${date}`,
          content: newContent,
          sha,
          branch: BRANCH
        })
      });

      if (putRes.status === 409) {
        lastError = new Error("Conflict, retrying");
        continue;
      }
      if (!putRes.ok) {
        throw new Error(`GitHub write failed: ${putRes.status} ${await putRes.text()}`);
      }

      res.status(200).json({ ok: true });
      return;
    } catch (e) {
      lastError = e;
    }
  }

  res.status(500).json({ error: lastError ? lastError.message : "Unknown error" });
};
