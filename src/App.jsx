import { useState, useEffect, useCallback } from "react";

const FLAG_MAP = {
  "🇱🇦": "ลาว", "🇯🇵": "ญี่ปุ่น", "🇻🇳": "เวียดนาม",
  "🇨🇳": "จีน", "🇭🇰": "ฮ่องกง", "🇹🇼": "ไต้หวัน",
  "🇰🇷": "เกาหลี", "🇹🇭": "ไทย", "🇸": "สิงคโปร์",
};
const COLOR_MAP = {
  "ลาว": "#ce1126", "ญี่ปุ่น": "#bc002d", "เวียดนาม": "#da251d",
  "จีน": "#de2910", "ฮ่องกง": "#de2910", "ไต้หวัน": "#003087",
  "เกาหลี": "#003478", "ไทย": "#A51931", "สิงคโปร์": "#EF3340",
};

function parseResults(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  const results = [];
  for (const line of lines) {
    const m = line.match(/^([\u{1F1E0}-\u{1F1FF}]{2})\s+(.+?)\s+[\u{1F1E0}-\u{1F1FF}]{2}\s*:\s*(\d{3})\s*[-–]\s*(\d{2})$/u);
    if (m) {
      const flag = m[1];
      const country = Object.entries(FLAG_MAP).find(([f]) => f === flag)?.[1] || "อื่นๆ";
      results.push({ flag, country, name: m[2].trim(), top3: m[3], bot2: m[4] });
    }
  }
  return results;
}

const STORAGE_KEY = "lottery-daily-results";

export default function App() {
  const [allData, setAllData] = useState({});
  const [activeDate, setActiveDate] = useState(null);
  const [inputText, setInputText] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [tab, setTab] = useState("view");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [drillName, setDrillName] = useState(null);
  const [drillFlag, setDrillFlag] = useState("");
  const [drillCountry, setDrillCountry] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAllData(parsed);
        const dates = Object.keys(parsed).sort();
        if (dates.length > 0) setActiveDate(dates[dates.length - 1]);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  const saveData = useCallback((data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveStatus("✓ บันทึกแล้ว");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("⚠ บันทึกไม่ได้");
    }
  }, []);

  const handleAdd = () => {
    if (!inputDate.trim() || !inputText.trim()) return;
    const parsed = parseResults(inputText);
    if (parsed.length === 0) { setSaveStatus("⚠ ไม่พบข้อมูลที่ถูกรูปแบบ"); return; }
    const newData = { ...allData, [inputDate.trim()]: parsed };
    setAllData(newData);
    setActiveDate(inputDate.trim());
    saveData(newData);
    setInputText("");
    setInputDate("");
    setTab("view");
  };

  const handleDelete = (date) => {
    const newData = { ...allData };
    delete newData[date];
    setAllData(newData);
    const dates = Object.keys(newData).sort();
    setActiveDate(dates.length > 0 ? dates[dates.length - 1] : null);
    saveData(newData);
  };

  const buildHistory = (name) => {
    return Object.keys(allData).sort()
      .map(d => {
        const row = allData[d]?.find(r => r.name === name);
        return row ? { date: d, top3: row.top3, bot2: row.bot2 } : null;
      })
      .filter(Boolean).reverse();
  };

  const dates = Object.keys(allData).sort();
  const current = activeDate ? allData[activeDate] || [] : [];
  const grouped = {};
  for (const r of current) {
    if (!grouped[r.country]) grouped[r.country] = [];
    grouped[r.country].push(r);
  }

  if (drillName) {
    const history = buildHistory(drillName);
    const latest = history[0];
    const accent = COLOR_MAP[drillCountry] || "#555";
    return (
      <div style={outerStyle}>
        <div style={{ ...headerStyle, flexDirection: "row", alignItems: "center", padding: "14px 16px" }}>
          <button onClick={() => setDrillName(null)} style={backBtnStyle}>‹ กลับ</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>{drillFlag} {drillName}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>ผลย้อนหลัง</div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {latest && (
            <div style={{ background: `linear-gradient(135deg, ${accent}cc, #1a1a2ecc)`, borderRadius: 16, padding: "22px 16px", marginBottom: 20, textAlign: "center", border: `1px solid ${accent}55`, boxShadow: `0 8px 30px ${accent}44` }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>งวดวันที</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{latest.date}</div>
              <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: 8, color: "#fff", marginBottom: 18 }}>{latest.top3}{latest.bot2}</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 50 }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>3 ตัวบน</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#ffd740" }}>{latest.top3}</div>
                </div>
                <div style={{ width: 1, background: "rgba(255,255,255,0.15)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>2 ตัวล่าง</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: "#80d8ff" }}>{latest.bot2}</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>สถิติยอนหลัง · {history.length} งวด</div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px", padding: "10px 16px", background: `linear-gradient(90deg, ${accent}cc, rgba(0,0,0,0.5))`, fontSize: 12, fontWeight: 700, color: "#fff" }}>
              <span>วันที่</span><span style={{ textAlign: "center" }}>3 ตัวบน</span><span style={{ textAlign: "center" }}>2 ตัวล่าง</span>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px", padding: "11px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", background: i === 0 ? "rgba(255,215,64,0.06)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: i === 0 ? "#ffd740" : "#ccc", display: "flex", alignItems: "center", gap: 6 }}>
                  {i === 0 && <span style={{ fontSize: 9, background: "#ffd740", color: "#000", borderRadius: 4, padding: "1px 5px", fontWeight: 800 }}>ล่าสุด</span>}
                  {h.date}
                </span>
                <span style={{ textAlign: "center", fontSize: 20, fontWeight: 900, color: "#ffd740", letterSpacing: 2 }}>{h.top3}</span>
                <span style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "#80d8ff", letterSpacing: 1 }}>{h.bot2}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={outerStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>🎯 สรุปผลหวยประจำวัน</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
          {loaded ? `${dates.length} วน · ${Object.values(allData).flat().length} รายการ` : "กำลังโหลด..."}
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "2px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
        {[["view","📋 ดูผล"],["add","➕ เพิ่มข้อมูล"]].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", color: tab === t ? "#ff8a80" : "rgba(255,255,255,0.45)", fontFamily: "inherit", fontSize: 14, fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? "3px solid #ff8a80" : "3px solid transparent", cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {tab === "add" && (
        <div style={{ padding: "20px 16px" }}>
          <div style={cardStyle}>
            <label style={labelStyle}>วันที่ (เช่น 03 มิ.ย. 69)</label>
            <input value={inputDate} onChange={e => setInputDate(e.target.value)} placeholder="03 มิ.ย. 69" style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: 14 }}>วางข้อมูลผลหวย</label>
            <textarea value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder={"🇱🇦 ลาวประตูชัย 🇱🇦 : 622 - 40\n🇻🇳 ฮานอยทีวี 🇻🇳 : 294 - 00\n..."}
              rows={10} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13 }} />
            <button onClick={handleAdd} style={btnStyle}>💾 บันทึกข้อมูล</button>
            {saveStatus && <div style={{ marginTop: 10, color: saveStatus.includes("✓") ? "#69f0ae" : "#ff8a80", fontSize: 13 }}>{saveStatus}</div>}
          </div>
        </div>
      )}
      {tab === "view" && (
        <div style={{ padding: "16px 16px 0" }}>
          {dates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 48 }}>📭</div>
              <div style={{ marginTop: 12, fontSize: 14 }}>ยังไม่มีขอมูล</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>กดแทบ "เพิ่มข้อมูล" เพื่อเริ่มต้น</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 14 }}>
                {dates.map(d => (
                  <button key={d} onClick={() => setActiveDate(d)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: activeDate === d ? "#ff8a80" : "rgba(255,255,255,0.1)", color: activeDate === d ? "#1a1a2e" : "#ccc", fontWeight: activeDate === d ? 700 : 400 }}>{d}</button>
                ))}
              </div>
              {activeDate && (
                <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", padding: "12px 16px", marginBottom: 14 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900, color: "#ff8a80" }}>{current.length}</div><div style={{ fontSize: 11, color: "#888" }}>รายการ</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 900, color: "#80d8ff" }}>{Object.keys(grouped).length}</div><div style={{ fontSize: 11, color: "#888" }}>ประเทศ</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#b9f6ca" }}>{activeDate}</div><div style={{ fontSize: 11, color: "#888" }}>วันที่</div></div>
                  <button onClick={() => handleDelete(activeDate)} style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff8a80", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                </div>
              )}
              {Object.entries(grouped).map(([country, rows]) => (
                <div key={country} style={{ marginBottom: 14 }}>
                  <div style={{ padding: "8px 14px", borderRadius: "10px 10px 0 0", background: `linear-gradient(90deg, ${COLOR_MAP[country] || "#555"}, rgba(0,0,0,0.3))`, fontSize: 13, fontWeight: 700 }}>
                    {rows[0]?.flag} {country}
                    <span style={{ float: "right", fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{rows.length} รายการ</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px", padding: "6px 14px", background: "rgba(0,0,0,0.3)", fontSize: 11, color: "#777" }}>
                      <span>ชื่อหวย</span><span style={{ textAlign: "center" }}>3 ตัวบน</span><span style={{ textAlign: "center" }}>2 ตัวล่าง</span>
                    </div>
                    {rows.map((r, i) => (
                      <div key={i}
                        onClick={() => { setDrillName(r.name); setDrillFlag(r.flag); setDrillCountry(r.country); }}
                        style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px", padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", alignItems: "center", cursor: "pointer" }}
                        onTouchStart={e => e.currentTarget.style.background = "rgba(255,138,128,0.1)"}
                        onTouchEnd={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"}
                      >
                        <span style={{ fontSize: 13, color: "#ddd" }}>{r.name} <span style={{ color: "#555" }}>›</span></span>
                        <span style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#ffd740", letterSpacing: 2 }}>{r.top3}</span>
                        <span style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: "#80d8ff", letterSpacing: 1 }}>{r.bot2}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const outerStyle = { minHeight: "100vh", background: "linear-gradient(160deg, #0f0c29, #302b63, #24243e)", fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", color: "#f0f0f0", paddingBottom: 40 };
const headerStyle = { background: "linear-gradient(90deg, #c62828, #b71c1c)", padding: "16px 20px 12px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" };
const backBtnStyle = { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 15, cursor: "pointer", fontFamily: "inherit" };
const cardStyle = { background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px", border: "1px solid rgba(255,255,255,0.08)" };
const labelStyle = { display: "block", fontSize: 12, color: "#aaa", marginBottom: 6, fontWeight: 600 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" };
const btnStyle = { marginTop: 14, width: "100%", padding: "12px", background: "linear-gradient(90deg, #c62828, #e53935)", border: "none", borderRadius: 10, color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer" };
