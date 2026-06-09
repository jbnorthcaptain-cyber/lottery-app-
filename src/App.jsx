import { useState, useEffect } from "react";

const SUPABASE_URL = "https://suixlwkjzipmanyoerwo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1aXhsd2tqemlwbWFueW9lcndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTMzMTksImV4cCI6MjA5NjQyOTMxOX0.PNuqaaiODvZtyPJ6pxvGOX5-LgUEInmp-4bIUxfOQXY";

const api = {
  async getAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lottery_results?select=*&order=date.asc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    return res.json();
  },
  async upsert(date, results) {
    await fetch(`${SUPABASE_URL}/rest/v1/lottery_results`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ date, results })
    });
  },
  async patch(date, results) {
    await fetch(`${SUPABASE_URL}/rest/v1/lottery_results?date=eq.${encodeURIComponent(date)}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ results })
    });
  },
  async remove(date) {
    await fetch(`${SUPABASE_URL}/rest/v1/lottery_results?date=eq.${encodeURIComponent(date)}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const FLAG_MAP = {
  "🇱🇦": "ลาว", "🇯🇵": "ญี่ปุ่น", "🇻🇳": "เวียดนาม", "🇨🇳": "จีน",
  "🇭🇰": "ฮ่องกง", "🇹🇼": "ไต้หวัน", "🇰🇷": "เกาหลี", "🇹🇭": "ไทย",
  "🇸🇬": "สิงคโปร์", "🇺🇸": "อเมริกา", "🇬🇧": "อังกฤษ", "🇩🇪": "เยอรมัน",
  "🇷🇺": "รัสเซีย", "🇮🇳": "อินเดีย",
};
const COLOR_MAP = {
  "ลาว": "#ff6b6b", "ญี่ปุ่น": "#ff8fa3", "เวียดนาม": "#ff6b6b",
  "จีน": "#ffa94d", "ฮ่องกง": "#ffa94d", "ไต้หวัน": "#74c0fc",
  "เกาหลี": "#a9e34b", "ไทย": "#ff6b6b", "สิงคโปร์": "#ff8fa3",
  "อเมริกา": "#748ffc", "อังกฤษ": "#748ffc", "เยอรมัน": "#dee2e6",
  "รัสเซีย": "#74c0fc", "อินเดีย": "#ffa94d",
};

function parseResults(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  const results = [];
  for (const line of lines) {
    const m = line.match(/^([\u{1F1E0}-\u{1F1FF}]{2})\s+(.+?)\s+[\u{1F1E0}-\u{1F1FF}]{2}\s*:\s*(\d{3})\s*[-–]\s*(\d{2})$/u);
    if (m) {
      const flag = m[1];
      const country = Object.entries(FLAG_MAP).find(([f]) => f === flag)?.[1] || "อื่นๆ";
      results.push({ flag, country, name: m[2].trim(), top3: m[3], bot2: m[4], closed: [] });
    }
  }
  return results;
}

function parseClosed(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  const map = {};
  for (const line of lines) {
    const m = line.match(/[\u{1F1E0}-\u{1F1FF}]{2}\s+(.+?)\s+[∷:]{1,2}\s*(.+)$/u);
    if (m) {
      const name = m[1].trim();
      const nums = m[2].match(/\b\d{2}\b/g) || [];
      if (nums.length > 0) map[name] = nums;
    }
  }
  return map;
}

const glass = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 20,
};
const glassStrong = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(30px) saturate(200%)",
  WebkitBackdropFilter: "blur(30px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 24,
};

export default function App() {
  const [allData, setAllData] = useState({});
  const [activeDate, setActiveDate] = useState(null);
  const [inputText, setInputText] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [closedText, setClosedText] = useState("");
  const [tab, setTab] = useState("view");
  const [addTab, setAddTab] = useState("result");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [drillName, setDrillName] = useState(null);
  const [drillFlag, setDrillFlag] = useState("");
  const [drillCountry, setDrillCountry] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rows = await api.getAll();
        const data = {};
        for (const row of rows) data[row.date] = row.results;
        setAllData(data);
        const dates = Object.keys(data).sort();
        if (dates.length > 0) setActiveDate(dates[dates.length - 1]);
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  const handleAddResult = async () => {
    if (!inputDate.trim() || !inputText.trim()) return;
    const parsed = parseResults(inputText);
    if (parsed.length === 0) { setSaveStatus("⚠️ ไม่พบข้อมูลที่ถูกรูปแบบ"); return; }
    const existing = allData[inputDate.trim()] || [];
    const merged = parsed.map(r => {
      const old = existing.find(e => e.name === r.name);
      return { ...r, closed: old?.closed || [] };
    });
    setSaveStatus("⏳ กำลังบันทึก...");
    try {
      await api.upsert(inputDate.trim(), merged);
      setAllData(prev => ({ ...prev, [inputDate.trim()]: merged }));
      setActiveDate(inputDate.trim());
      setSaveStatus("✓ บันทึกแล้ว");
      setTimeout(() => setSaveStatus(""), 2000);
      setInputText(""); setInputDate(""); setTab("view");
    } catch (e) { setSaveStatus("⚠️ บันทึกไม่ได้"); }
  };

  const handleAddClosed = async () => {
    if (!inputDate.trim() || !closedText.trim()) return;
    const closedMap = parseClosed(closedText);
    if (Object.keys(closedMap).length === 0) { setSaveStatus("⚠️ ไม่พบข้อมูลเลขปิด"); return; }
    const existing = allData[inputDate.trim()];
    if (!existing) { setSaveStatus("⚠️ ยังไม่มีผลหวยวันนี้"); return; }
    const updated = existing.map(r => {
      const key = Object.keys(closedMap).find(k => k.trim() === r.name.trim());
      return { ...r, closed: key !== undefined ? closedMap[key] : (r.closed || []) };
    });
    setSaveStatus("⏳ กำลังบันทึก...");
    try {
      await api.patch(inputDate.trim(), updated);
      setAllData(prev => ({ ...prev, [inputDate.trim()]: updated }));
      setSaveStatus("✓ บันทึกเลขปิดแล้ว");
      setTimeout(() => setSaveStatus(""), 2000);
      setClosedText(""); setTab("view");
    } catch (e) { setSaveStatus("⚠️ บันทึกไม่ได้"); }
  };

  const handleDelete = async (date) => {
    await api.remove(date);
    const newData = { ...allData };
    delete newData[date];
    setAllData(newData);
    const dates = Object.keys(newData).sort();
    setActiveDate(dates.length > 0 ? dates[dates.length - 1] : null);
  };

  const buildHistory = (name) => {
    return Object.keys(allData).sort()
      .map(d => {
        const row = allData[d]?.find(r => r.name === name);
        return row ? { date: d, top3: row.top3, bot2: row.bot2, closed: row.closed || [] } : null;
      }).filter(Boolean).reverse();
  };

  const dates = Object.keys(allData).sort();
  const current = activeDate ? allData[activeDate] || [] : [];
  const grouped = {};
  for (const r of current) {
    if (!grouped[r.country]) grouped[r.country] = [];
    grouped[r.country].push(r);
  }
  const hasClosed = current.some(r => r.closed?.length > 0);

  // ── DRILL VIEW ──────────────────────────────────
  if (drillName) {
    const history = buildHistory(drillName);
    const latest = history[0];
    const accent = COLOR_MAP[drillCountry] || "#74c0fc";
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a2e 100%)", fontFamily: "'SF Pro Display', 'Sarabun', sans-serif", color: "#fff", paddingBottom: 50 }}>
        <style>{`* { box-sizing: border-box; } input, textarea { outline: none; } button { transition: opacity 0.15s; } button:active { opacity: 0.7; }`}</style>
        
        {/* Ambient blobs */}
        <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${accent}22, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, #748ffc22, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Header */}
        <div style={{ ...glassStrong, borderRadius: "0 0 28px 28px", padding: "54px 20px 16px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDrillName(null)} style={{ ...glass, border: "none", color: accent, fontSize: 16, fontWeight: 600, padding: "8px 16px", cursor: "pointer", background: `${accent}22` }}>
            ‹ กลับ
          </button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{drillFlag} {drillName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>ผลย้อนหลัง</div>
          </div>
          <div style={{ width: 70 }} />
        </div>

        <div style={{ padding: "20px 16px", position: "relative", zIndex: 1 }}>
          {latest && (
            <div style={{ ...glassStrong, padding: "28px 20px", marginBottom: 20, textAlign: "center", background: `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.06))`, borderColor: `${accent}44` }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>งวดวันที่</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 20 }}>{latest.date}</div>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: 10, color: "#fff", marginBottom: 20, textShadow: `0 0 40px ${accent}88` }}>
                {latest.top3}{latest.bot2}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 0 }}>
                <div style={{ flex: 1, borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 6 }}>3 ตัวบน</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>{latest.top3}</div>
                </div>
                <div style={{ flex: 1, borderRight: latest.closed?.length > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 6 }}>2 ตัวล่าง</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#c3fae8" }}>{latest.bot2}</div>
                </div>
                {latest.closed?.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 1, marginBottom: 6 }}>เลขปิด</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#ffd43b" }}>{latest.closed.join(" ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, paddingLeft: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
            สถิติย้อนหลัง · {history.length} งวด
          </div>

          <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>
              <span>วันที่</span><span style={{ textAlign: "center" }}>3 ตัวบน</span><span style={{ textAlign: "center" }}>2 ตัวล่าง</span><span style={{ textAlign: "center" }}>เลขปิด</span>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "13px 16px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", background: i === 0 ? `${accent}0f` : "transparent", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: i === 0 ? accent : "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                  {i === 0 && <span style={{ fontSize: 9, background: accent, color: "#000", borderRadius: 6, padding: "1px 6px", fontWeight: 800, letterSpacing: 0.5 }}>ล่าสุด</span>}
                  {h.date}
                </span>
                <span style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: accent, letterSpacing: 2 }}>{h.top3}</span>
                <span style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "#c3fae8", letterSpacing: 1 }}>{h.bot2}</span>
                <span style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "#ffd43b" }}>{h.closed?.join(" ") || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ──────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a2e 100%)", fontFamily: "'SF Pro Display', 'Sarabun', sans-serif", color: "#fff", paddingBottom: 50 }}>
      <style>{`
        * { box-sizing: border-box; }
        input, textarea { outline: none; }
        button { transition: all 0.15s; }
        button:active { transform: scale(0.97); opacity: 0.85; }
        ::-webkit-scrollbar { display: none; }
        ::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Ambient background blobs */}
      <div style={{ position: "fixed", top: -150, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #748ffc18, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #ff6b6b12, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #a9e34b0a, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{ ...glassStrong, borderRadius: "0 0 32px 32px", padding: "54px 20px 20px", position: "sticky", top: 0, zIndex: 100, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>สรุปผล</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>🎯 หวยประจำวัน</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
          {loaded ? `${dates.length} วัน · ${Object.values(allData).flat().length} รายการ` : "⏳ กำลังโหลด..."}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ position: "sticky", top: 120, zIndex: 99, padding: "12px 16px 0" }}>
        <div style={{ ...glass, display: "flex", padding: 4, gap: 4 }}>
          {[["view","📋 ดูผล"],["add","➕ เพิ่มข้อมูล"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13, fontWeight: tab === t ? 700 : 400,
              background: tab === t ? "rgba(255,255,255,0.15)" : "transparent",
              color: tab === t ? "#fff" : "rgba(255,255,255,0.45)",
              backdropFilter: tab === t ? "blur(10px)" : "none",
              boxShadow: tab === t ? "0 2px 12px rgba(0,0,0,0.2)" : "none",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ADD TAB */}
      {tab === "add" && (
        <div style={{ padding: "16px", position: "relative", zIndex: 1 }}>
          <div style={{ ...glass, display: "flex", padding: 4, gap: 4, marginBottom: 16 }}>
            {[["result","🎰 ผลหวย"],["closed","🔒 เลขปิด"]].map(([t, label]) => (
              <button key={t} onClick={() => setAddTab(t)} style={{
                flex: 1, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 13, fontWeight: addTab === t ? 700 : 400,
                background: addTab === t ? "rgba(255,255,255,0.15)" : "transparent",
                color: addTab === t ? "#fff" : "rgba(255,255,255,0.4)",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ ...glassStrong, padding: 20 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>วันที่</div>
            <input value={inputDate} onChange={e => setInputDate(e.target.value)} placeholder="03 มิ.ย. 69"
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px", color: "#fff", fontSize: 15, fontFamily: "inherit", marginBottom: 16 }} />

            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              {addTab === "result" ? "วางข้อมูลผลหวย" : "วางข้อมูลเลขปิด"}
            </div>
            <textarea
              value={addTab === "result" ? inputText : closedText}
              onChange={e => addTab === "result" ? setInputText(e.target.value) : setClosedText(e.target.value)}
              placeholder={addTab === "result" ? "🇱🇦 ลาวประตูชัย 🇱🇦 : 622 - 40\n🇻🇳 ฮานอยทีวี 🇻🇳 : 294 - 00\n..." : "🇱🇦 ลาวประตูชัย  ::  16 60\n🇻🇳 ฮานอย HD  ∷  บ 44 97\n..."}
              rows={10}
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px", color: "#fff", fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 16 }}
            />

            <button
              onClick={addTab === "result" ? handleAddResult : handleAddClosed}
              style={{
                width: "100%", padding: "15px", borderRadius: 18, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#fff",
                background: addTab === "result"
                  ? "linear-gradient(135deg, rgba(116,143,252,0.8), rgba(169,227,75,0.6))"
                  : "linear-gradient(135deg, rgba(138,43,226,0.8), rgba(116,143,252,0.6))",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
              {addTab === "result" ? "💾 บันทึกผลหวย" : "🔒 บันทึกเลขปิด"}
            </button>

            {saveStatus && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: saveStatus.includes("✓") ? "#a9e34b" : saveStatus.includes("⏳") ? "#ffd43b" : "#ff8fa3" }}>
                {saveStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW TAB */}
      {tab === "view" && (
        <div style={{ padding: "16px", position: "relative", zIndex: 1 }}>
          {dates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 56 }}>{loaded ? "📭" : "⏳"}</div>
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>{loaded ? "ยังไม่มีข้อมูล" : "กำลังโหลด..."}</div>
              {loaded && <div style={{ marginTop: 8, fontSize: 13 }}>กดแท็บ "เพิ่มข้อมูล" เพื่อเริ่มต้น</div>}
            </div>
          ) : (
            <>
              {/* Date pills */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
                {dates.map(d => (
                  <button key={d} onClick={() => setActiveDate(d)} style={{
                    flexShrink: 0, padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 13, fontFamily: "inherit", fontWeight: activeDate === d ? 700 : 400,
                    background: activeDate === d ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                    color: activeDate === d ? "#fff" : "rgba(255,255,255,0.5)",
                    backdropFilter: "blur(10px)",
                    boxShadow: activeDate === d ? "0 2px 16px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
                    border: activeDate === d ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                  }}>{d}</button>
                ))}
              </div>

              {/* Stats card */}
              {activeDate && (
                <div style={{ ...glass, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", marginBottom: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#748ffc" }}>{current.length}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>รายการ</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#a9e34b" }}>{Object.keys(grouped).length}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>ประเทศ</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{activeDate}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase" }}>วันที่</div>
                  </div>
                  <button onClick={() => handleDelete(activeDate)} style={{
                    background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.25)",
                    color: "#ff8fa3", borderRadius: 12, padding: "8px 12px", fontSize: 16, cursor: "pointer",
                  }}>🗑</button>
                </div>
              )}

              {/* Grouped results */}
              {Object.entries(grouped).map(([country, rows]) => {
                const accent = COLOR_MAP[country] || "#74c0fc";
                return (
                  <div key={country} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                      <div style={{ width: 3, height: 16, borderRadius: 2, background: accent }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{rows[0]?.flag} {country}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{rows.length} รายการ</span>
                    </div>
                    <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: hasClosed ? "1fr 70px 60px 76px" : "1fr 80px 70px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>
                        <span>ชื่อหวย</span>
                        <span style={{ textAlign: "center" }}>3 ตัวบน</span>
                        <span style={{ textAlign: "center" }}>2 ตัวล่าง</span>
                        {hasClosed && <span style={{ textAlign: "center" }}>เลขปิด</span>}
                      </div>
                      {rows.map((r, i) => (
                        <div key={i}
                          onClick={() => { setDrillName(r.name); setDrillFlag(r.flag); setDrillCountry(r.country); }}
                          style={{ display: "grid", gridTemplateColumns: hasClosed ? "1fr 70px 60px 76px" : "1fr 80px 70px", padding: "13px 16px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
                          onTouchStart={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                          onTouchEnd={e => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                            {r.name} <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>›</span>
                          </span>
                          <span style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: accent, letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>{r.top3}</span>
                          <span style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: "#c3fae8", letterSpacing: 1, fontVariantNumeric: "tabular-nums" }}>{r.bot2}</span>
                          {hasClosed && <span style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: r.closed?.length ? "#ffd43b" : "rgba(255,255,255,0.2)" }}>{r.closed?.join(" ") || "—"}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
