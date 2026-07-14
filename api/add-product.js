const OWNER = "nivesh-sudo";
const REPO = "greenedge-factory-dashboard";
const BRANCH = "main";
const FILE_PATH = "master.json";
const ALLOWED_FIELDS = ["w", "h", "m", "pkg", "bps"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { pin, client, model, fields } = req.body || {};

  if (!process.env.SUPERVISOR_PIN || pin !== process.env.SUPERVISOR_PIN) {
    res.status(401).json({ error: "Incorrect PIN" });
    return;
  }
  if (!client || typeof client !== "string" || !model || typeof model !== "string") {
    res.status(400).json({ error: "Client and model are required" });
    return;
  }

  const clean = {};
  if (fields && typeof fields === "object") {
    for (const key of ALLOWED_FIELDS) {
      if (fields[key] === undefined || fields[key] === null || fields[key] === "") continue;
      clean[key] = fields[key];
    }
  }
  if (clean.m !== undefined && clean.m !== "two" && clean.m !== "single") {
    res.status(400).json({ error: "Invalid m value" });
    return;
  }
  if (clean.pkg !== undefined && !["hanger", "dispenser", "pouch", "loose"].includes(clean.pkg)) {
    res.status(400).json({ error: "Invalid pkg value" });
    return;
  }
  for (const key of ["w", "h", "bps"]) {
    if (clean[key] === undefined) continue;
    const n = parseFloat(clean[key]);
    if (isNaN(n) || n < 0) {
      res.status(400).json({ error: `Invalid ${key} value` });
      return;
    }
    clean[key] = n;
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
  const key = `${client}|${model}`;
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
      if (!data.products) data.products = {};

      const existing = data.products[key];
      let product;
      if (existing) {
        for (const k of Object.keys(clean)) {
          if (existing[k] === undefined || existing[k] === null) existing[k] = clean[k];
        }
        product = existing;
      } else {
        data.products[key] = clean;
        product = clean;
      }

      const newContent = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `master: add/update ${key}`,
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

      res.status(200).json({ ok: true, product });
      return;
    } catch (e) {
      lastError = e;
    }
  }

  res.status(500).json({ error: lastError ? lastError.message : "Unknown error" });
};
