const WEBHOOKS = {
  "2nd Village": process.env.WEBHOOK_2ND,
  "LUX TOKYO": process.env.WEBHOOK_LUX,
};
const PURPOSES = ["面接", "打ち合わせ", "配達・集荷", "その他"];

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method not allowed" });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); }
    catch (e) { res.status(400).json({ ok: false, error: "invalid json" }); return; }
  }

  const company = body.company;
  const purpose = body.purpose || "";

  if (!Object.prototype.hasOwnProperty.call(WEBHOOKS, company)) {
    res.status(400).json({ ok: false, error: "unknown company" });
    return;
  }
  if (purpose && !PURPOSES.includes(purpose)) {
    res.status(400).json({ ok: false, error: "unknown purpose" });
    return;
  }

  const url = WEBHOOKS[company];
  if (!url) {
    res.status(500).json({ ok: false, error: "webhook not configured" });
    return;
  }

  const ts = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
     const text = company === "LUX TOKYO"
    ? "🔔 *LUX TOKYO 来客通知*\n日時: " + ts
    : "🔔 *受付通知*\n受付先: " + company + "\n用件: " + purpose + "\n日時: " + ts;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ text: text }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("google chat error", r.status, t);
      res.status(502).json({ ok: false, status: r.status, error: t.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("fetch failed", e);
    res.status(502).json({ ok: false, error: String(e && e.message || e) });
  }
};
