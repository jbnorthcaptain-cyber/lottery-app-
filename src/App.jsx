 import { useState, useEffect } from "react";

const SUPABASE_URL = "https://suixlwkjzipmanyoerwo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1aXhsd2tqemlwbWFueW9lcndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NTMzMTksImV4cCI6MjA5NjQyOTMxOX0.PNuqaaiODvZtyPJ6pxvGOX5-LgUEInmp-4bIUxfOQXY";
const ADMIN_CODE = "Kay";

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
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
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
  "🇱🇦": "ลาว", "🇯": "ญี่ปุ่น", "🇻🇳": "เวียดนาม", "🇨": "จีน",
  "🇭🇰": "ฮ่องกง", "🇹🇼": "ไต้หวัน", "🇰🇷": "เกาหลี", "🇹🇭": "ไทย",
  "🇸🇬": "สิงคโปร์", "🇺🇸": "อเมริกา", "🇬🇧": "อังกฤษ", "🇩🇪": "เยอรมัน",
  "🇷🇺": "รัสเซีย", "🇮🇳": "อินเดีย",
};
const COLOR_MAP = {
"ลาว": "#ff7675", "ญี่ปุ่น": "#ff7675", "เวียดนาม": "#ff7675",
"จีน": "#ff7675", "ฮ่องกง": "#ff7675", "ไต้หวัน": "#ff7675",
"เกาหลี": "#ff7675", "ไทย": "#ff7675", "สิงคโปร์": "#ff7675",
"อเมริกา": "#ff7675", "อังกฤษ": "#ff7675", "เยอรมัน": "#ff7675",
"รัสเซีย": "#ff7675", "อินเดีย": "#ff7675"

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

function buildBreakdown(nums) {
  const total = nums.length;
  if (total === 0) return null;
  const inRange = (lo, hi) => nums.filter(n => n >= lo && n <= hi).length;
  const pct = c => Number(((c / total) * 100).toFixed(2));
  const evenCount = nums.filter(n => (n % 10) % 2 === 0).length;
  return {
    total,
    half: [pct(inRange(0, 49)), pct(inRange(50, 99))],
    thirds: [pct(inRange(0, 33)), pct(inRange(34, 66)), pct(inRange(67, 99))],
    quarters: [pct(inRange(0, 24)), pct(inRange(25, 49)), pct(inRange(50, 74)), pct(inRange(75, 99))],
    evenOdd: [pct(evenCount), pct(total - evenCount)],
  };
}

function Divider({ color }) {
  return <div style={{ height: 1, background: color, margin: "14px 0" }} />;
}

function ThemeToggle({ mode, onToggle }) {
  const isDark = mode === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label="สลับโหมดสว่าง/มืด"
      style={{
        width: 56,
        height: 30,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        position: "relative",
        padding: 0,
        flexShrink: 0,
        background: isDark
          ? "linear-gradient(135deg, #2b2b45, #14101f)"
          : "linear-gradient(135deg, #ffd76a, #ffa94d)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
        transition: "background 0.35s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: isDark ? 29 : 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: isDark ? "#0f0f1f" : "#ffffff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          lineHeight: 1,
          transition: "left 0.35s cubic-bezier(.4,0,.2,1), background 0.35s ease",
        }}
      >
        {isDark ? "🌝" : "🌞"}
      </div>
    </button>
  );
}

function StatRow({ label, value, accent, labelColor, trackColor }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: labelColor }}>{label}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: trackColor, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${v}%`, borderRadius: 999, background: `linear-gradient(90deg, ${accent}99, ${accent})`, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [statsName, setStatsName] = useState("");
  const [statsMode, setStatsMode] = useState("bot"); // 'top' = 2 ตัวบน, 'bot' = 2 ตัวล่าง
  const [statsCopied, setStatsCopied] = useState(false);
  const [drillCopied, setDrillCopied] = useState(false);
  const [drillOrder, setDrillOrder] = useState("asc"); // 'asc' = เก่า→ใหม่, 'desc' = ใหม่→เก่า
  const [themeMode, setThemeMode] = useState("light"); // 'light' | 'dark'
  const [multiSelected, setMultiSelected] = useState([]); // ชื่อหวยที่เลือกไว้สำหรับคัดลอกรวม (สูงสุด 10)
  const [multiOrder, setMultiOrder] = useState("asc"); // 'asc' = เก่า→ใหม่, 'desc' = ใหม่→เก่า
  const [multiCopied, setMultiCopied] = useState(false);
  const [multiLimitNotice, setMultiLimitNotice] = useState(false);

  const THEME_COLORS = {
    dark: {
      bg: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 40%, #0a1a2e 100%)",
      text: "#ffffff",
      teal: "#c3fae8",
      gold: "#ffd43b",
      blob1: "#748ffc14",
      blob2: "#ff6b6b0e",
    },
    light: {
      bg: "linear-gradient(135deg, #f6f5fb 0%, #ffffff 45%, #f3f6fb 100%)",
      text: "#000000",
      teal: "#0f9488",
      gold: "#b8860b",
      blob1: "#748ffc0c",
      blob2: "#ff6b6b08",
    },
  };
  const t = THEME_COLORS[themeMode];
  const ink = (opacity) => themeMode === "light" ? `rgba(0,0,0,${opacity})` : `rgba(255,255,255,${opacity})`;
  // ใช้กับสีตัวอักษรโดยเฉพาะ — โหมดสว่าง = ดำสนิท #000000 เสมอ (ไม่มีไล่ความจาง), โหมดมืด = เหมือนเดิมทุกประการ
  const inkText = (opacity) => themeMode === "light" ? "#000000" : ink(opacity);

  const glass = {
    background: ink(0.08),
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: `1px solid ${ink(0.15)}`,
    borderRadius: 20,
  };
  const glassStrong = {
    background: ink(0.12),
    backdropFilter: "blur(30px) saturate(200%)",
    WebkitBackdropFilter: "blur(30px) saturate(200%)",
    border: `1px solid ${ink(0.22)}`,
    borderRadius: 24,
  };

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

  const requireAdmin = (action) => {
    if (isAdmin) { action(); return; }
    setPendingAction(() => action);
    setAdminInput("");
    setAdminError(false);
    setShowAdminPrompt(true);
  };

  const confirmAdmin = () => {
    if (adminInput === ADMIN_CODE) {
      setIsAdmin(true);
      setShowAdminPrompt(false);
      if (pendingAction) { pendingAction(); setPendingAction(null); }
    } else {
      setAdminError(true);
      setAdminInput("");
    }
  };

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
    if (!window.confirm(`ยืนยันลบข้อมูลวันที่ ${date} ?`)) return;
    await api.remove(date);
    const newData = { ...allData };
    delete newData[date];
    setAllData(newData);
    const dates = Object.keys(newData).sort();
    setActiveDate(dates.length > 0 ? dates[dates.length - 1] : null);
    setMenuOpen(false);
  };

  const buildHistory = (name) => {
    return Object.keys(allData).sort()
      .map(d => {
        const row = allData[d]?.find(r => r.name === name);
        return row ? { date: d, top3: row.top3, bot2: row.bot2, closed: row.closed || [] } : null;
      }).filter(Boolean).reverse();
  };

  // --- คัดลอกผลย้อนหลังหลายหวยรวมเป็นคลิปบอร์ดเดียว (สูงสุด 10 หวย) ---
  const toggleMultiSelect = (name) => {
    setMultiSelected(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name);
      if (prev.length >= 10) {
        setMultiLimitNotice(true);
        setTimeout(() => setMultiLimitNotice(false), 1800);
        return prev;
      }
      return [...prev, name];
    });
  };

  const buildMultiHistoryText = () => {
    if (multiSelected.length === 0) return "";
    const divider = "➖➖➖➖➖➖➖➖";
    const blocks = multiSelected.map(name => {
      const info = lotteryList.find(l => l.name === name);
      const flag = info?.flag || "";
      const history = buildHistory(name);
      const ordered = multiOrder === "asc" ? [...history].reverse() : history;
      const lines = ordered.map(h => `${flag} ${h.date} | ${h.top3}-${h.bot2}`);
      return `${flag} สถิติย้อนหลัง ${name} ${flag}\n${divider}\n${lines.join("\n")}\n${divider}`;
    });
    return `แนวทางNORTN\n${blocks.join("\n\n")}`;
  };

  const copyMultiHistory = () => {
    const text = buildMultiHistoryText();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setMultiCopied(true);
      setTimeout(() => setMultiCopied(false), 1500);
    });
  };

  // --- สถิติโอกาสออกเลข ---
  const getLotteryList = () => {
    const map = {};
    for (const date of Object.keys(allData)) {
      for (const r of allData[date]) {
        if (!map[r.name]) map[r.name] = { flag: r.flag, country: r.country };
      }
    }
    return Object.entries(map).map(([name, v]) => ({ name, flag: v.flag, country: v.country }));
  };

  const computeStatsNumbers = (name) => {
    const top2List = [];
    const bot2List = [];
    for (const date of Object.keys(allData)) {
      for (const r of allData[date]) {
        if (r.name !== name) continue;
        if (r.top3 && /^\d{3}$/.test(r.top3)) top2List.push(parseInt(r.top3.slice(-2), 10));
        if (r.bot2 && /^\d{2}$/.test(r.bot2)) bot2List.push(parseInt(r.bot2, 10));
      }
    }
    return { top2List, bot2List };
  };

  const lotteryList = getLotteryList();
  const activeStatsName = statsName || (lotteryList[0]?.name || "");
  const statsInfo = lotteryList.find(l => l.name === activeStatsName);
  const statsAccent = COLOR_MAP[statsInfo?.country] || "#74c0fc";
  const { top2List, bot2List } = computeStatsNumbers(activeStatsName);
  const statsNums = statsMode === "top" ? top2List : bot2List;
  const statsBreakdown = buildBreakdown(statsNums);

  const copyStatsText = () => {
    if (!statsBreakdown) return;
    const modeLabel = statsMode === "top" ? "2 ตัวบน" : "2 ตัวล่าง";
    const flag = statsInfo?.flag || "";
    const text = `${flag} คำนวณ${activeStatsName} (${modeLabel}) ${flag}
➖➖➖➖➖➖➖➖➖➖
เลข 00 ถึง 49 โอกาสออก ${statsBreakdown.half[0]}%
เลข 50 ถึง 99 โอกาสออก ${statsBreakdown.half[1]}%

เลข 00 ถึง 33 โอกาสออก ${statsBreakdown.thirds[0]}%
เลข 34 ถึง 66 โอกาสออก ${statsBreakdown.thirds[1]}%
เลข 67 ถึง 99 โอกาสออก ${statsBreakdown.thirds[2]}%

เลข 00 ถึง 24 โอกาสออก ${statsBreakdown.quarters[0]}%
เลข 25 ถึง 49 โอกาสออก ${statsBreakdown.quarters[1]}%
เลข 50 ถึง 74 โอกาสออก ${statsBreakdown.quarters[2]}%
เลข 75 ถึง 99 โอกาสออก ${statsBreakdown.quarters[3]}%

เลขลงท้ายเลขคู่ โอกาสออก ${statsBreakdown.evenOdd[0]}%
เลขลงท้ายเลขคี่ โอกาสออก ${statsBreakdown.evenOdd[1]}%

(คำนวณจาก ${modeLabel} ทั้งหมด ${statsBreakdown.total} งวด)`;
    navigator.clipboard.writeText(text).then(() => {
      setStatsCopied(true);
      setTimeout(() => setStatsCopied(false), 1500);
    });
  };

  const dates = Object.keys(allData).sort();
  const [curDay, curMonth, curYear] = activeDate ? activeDate.split(" ") : ["", "", ""];
  const THAI_MONTH_ORDER = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const dayOptions = Array.from(new Set(dates.map(d => d.split(" ")[0]))).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const monthOptions = THAI_MONTH_ORDER.filter(m => dates.some(d => d.split(" ")[1] === m));
  const yearOptions = Array.from(new Set(dates.map(d => d.split(" ")[2]))).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const selectDateBy = (day, month, year) => {
    const candidate = `${day} ${month} ${year}`;
    if (allData[candidate]) setActiveDate(candidate);
  };
  const current = activeDate ? allData[activeDate] || [] : [];
  const grouped = {};
  for (const r of current) {
    if (!grouped[r.country]) grouped[r.country] = [];
    grouped[r.country].push(r);
  }
  const hasClosed = current.some(r => r.closed?.length > 0);

  const baseStyle = {
    minHeight: "100vh",
    background: t.bg,
    fontFamily: "'SF Pro Display', 'Sarabun', sans-serif",
    color: t.text, paddingBottom: 50,
  };

  const globalStyles = `*{box-sizing:border-box}input,textarea{outline:none}button{transition:all .15s}button:active{transform:scale(.97);opacity:.8}::-webkit-scrollbar{display:none}::placeholder{color:${inkText(.25)}}`;

  // Admin Prompt Modal
  const AdminPrompt = () => (
    <>
      <div onClick={() => { setShowAdminPrompt(false); setPendingAction(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 300 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 301, ...glassStrong, padding: "32px 28px", width: "85%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Admin เท่านั้น</div>
        <div style={{ fontSize: 12, color: inkText(0.4), marginBottom: 24 }}>ใส่รหัสเพื่อดำเนินการต่อ</div>
        <input
          type="password"
          value={adminInput}
          autoFocus
          onChange={e => { setAdminInput(e.target.value); setAdminError(false); }}
          onKeyDown={e => e.key === "Enter" && confirmAdmin()}
          placeholder="รหัสผ่าน"
          style={{ width: "100%", background: ink(0.07), border: `1px solid ${adminError ? "rgba(255,100,100,0.6)" : ink(0.12)}`, borderRadius: 14, padding: "13px 16px", color: t.text, fontSize: 18, fontFamily: "inherit", textAlign: "center", letterSpacing: 4, marginBottom: 10 }}
        />
        {adminError && <div style={{ fontSize: 12, color: "#ff8fa3", marginBottom: 10 }}>รหัสไม่ถูกต้อง ❌</div>}
        <button onClick={confirmAdmin} style={{ width: "100%", padding: "13px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, rgba(116,143,252,0.8), rgba(169,227,75,0.6))", marginBottom: 8 }}>
          ยืนยัน
        </button>
        <button onClick={() => { setShowAdminPrompt(false); setPendingAction(null); }} style={{ width: "100%", padding: "11px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, color: inkText(0.4), background: "transparent" }}>
          ยกเลิก
        </button>
      </div>
    </>
  );

  if (drillName) {
    const history = buildHistory(drillName);
    const latest = history[0];
    const accent = COLOR_MAP[drillCountry] || "#74c0fc";
    const copyHistory = () => {
      if (history.length === 0) return;
      const ordered = drillOrder === "asc" ? [...history].reverse() : history;
      const divider = "➖➖➖➖➖➖➖➖";
      const lines = ordered.map(h => `${drillFlag} ${h.date} | ${h.top3}-${h.bot2}`);
      const text = `แนวทางNORTN\n${drillFlag} สถิติย้อนหลัง ${drillName} ${drillFlag}\n${divider}\n${lines.join("\n")}\n${divider}`;
      navigator.clipboard.writeText(text).then(() => {
        setDrillCopied(true);
        setTimeout(() => setDrillCopied(false), 1500);
      });
    };
    return (
      <div style={baseStyle}>
        <style>{globalStyles}</style>
        {showAdminPrompt && <AdminPrompt />}
        <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${accent}18, transparent 70%)`, pointerEvents: "none", zIndex: 0 }} />
        <div style={{ ...glassStrong, borderRadius: "0 0 28px 28px", padding: "54px 20px 16px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDrillName(null)} style={{ ...glass, border: "none", color: accent, fontSize: 15, fontWeight: 600, padding: "8px 16px", cursor: "pointer", background: `${accent}20` }}>‹ กลับ</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{drillFlag} {drillName}</div>
            <div style={{ fontSize: 11, color: inkText(0.4), marginTop: 2 }}>ผลย้อนหลัง</div>
          </div>
          <button onClick={() => setDrillOrder(o => o === "asc" ? "desc" : "asc")} style={{ ...glass, border: "none", color: accent, fontSize: 11, fontWeight: 600, padding: "8px 10px", cursor: "pointer", background: `${accent}20`, whiteSpace: "nowrap" }}>
            {drillOrder === "asc" ? "เก่า→ใหม่" : "ใหม่→เก่า"}
          </button>
          <button onClick={copyHistory} style={{ ...glass, border: "none", color: accent, fontSize: 13, fontWeight: 600, padding: "8px 14px", cursor: "pointer", background: `${accent}20`, whiteSpace: "nowrap" }}>
            {drillCopied ? "✓ คัดลอก" : "📋 คัดลอก"}
          </button>
        </div>
        <div style={{ padding: "20px 16px", position: "relative", zIndex: 1 }}>
          {latest && (
            <div style={{ ...glassStrong, padding: "28px 20px", marginBottom: 20, textAlign: "center", background: `linear-gradient(135deg, ${accent}14, rgba(255,255,255,0.05))`, borderColor: `${accent}40` }}>
              <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>งวดวันที่</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>{latest.date}</div>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: 10, marginBottom: 20, textShadow: `0 0 40px ${accent}66` }}>{latest.top3}{latest.bot2}</div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ flex: 1, borderRight: `1px solid ${ink(0.08)}` }}>
                  <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1, marginBottom: 6 }}>3 ตัวบน</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>{latest.top3}</div>
                </div>
                <div style={{ flex: 1, borderRight: latest.closed?.length > 0 ? `1px solid ${ink(0.08)}` : "none" }}>
                  <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1, marginBottom: 6 }}>2 ตัวล่าง</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: t.teal }}>{latest.bot2}</div>
                </div>
                {latest.closed?.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1, marginBottom: 6 }}>เลขปิด</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: t.gold }}>{latest.closed.join(" ")}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div style={{ fontSize: 10, color: inkText(0.35), marginBottom: 10, paddingLeft: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>สถิติย้อนหลัง · {history.length} งวด</div>
          <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "12px 16px", borderBottom: `1px solid ${ink(0.07)}`, fontSize: 10, color: inkText(0.35), letterSpacing: 1.5, textTransform: "uppercase" }}>
              <span>วันที่</span><span style={{ textAlign: "center" }}>3 ตัวบน</span><span style={{ textAlign: "center" }}>2 ตวล่าง</span><span style={{ textAlign: "center" }}>เลขปิด</span>
            </div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 80px", padding: "13px 16px", borderTop: i > 0 ? `1px solid ${ink(0.05)}` : "none", background: i === 0 ? `${accent}0d` : "transparent", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: i === 0 ? accent : inkText(0.55), display: "flex", alignItems: "center", gap: 6 }}>
                  {i === 0 && <span style={{ fontSize: 9, background: accent, color: "#000", borderRadius: 6, padding: "1px 6px", fontWeight: 800 }}>ล่าสด</span>}
                  {h.date}
                </span>
                <span style={{ textAlign: "center", fontSize: 20, fontWeight: 800, color: accent, letterSpacing: 2 }}>{h.top3}</span>
                <span style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: t.teal }}>{h.bot2}</span>
                <span style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: t.gold }}>{h.closed?.join(" ") || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <style>{globalStyles}</style>

      {showAdminPrompt && <AdminPrompt />}

      <div style={{ position: "fixed", top: -150, right: -100, width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${t.blob1}, transparent 65%)`, pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${t.blob2}, transparent 65%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* Hamburger Menu */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 200 }} />
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, ...glassStrong, borderRadius: "28px 28px 0 0", padding: "12px 20px 44px" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: ink(0.25), margin: "0 auto 20px" }} />
            <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>เมนู</div>

            {/* ดูผล - ไม่ต้องใส่รหัส */}
            <button onClick={() => { setTab("view"); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === "view" ? "rgba(116,143,252,0.2)" : ink(0.06), color: tab === "view" ? "#748ffc" : t.text, fontFamily: "inherit", fontSize: 16, fontWeight: tab === "view" ? 700 : 500, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <span>ดูผลหวย</span>
              {tab === "view" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#748ffc" }}>● กำลังใช้</span>}
            </button>

            {/* คำนวณสถิติ - ไม่ต้องใส่รหัส */}
            <button onClick={() => { setTab("stats"); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === "stats" ? "rgba(255,212,59,0.2)" : ink(0.06), color: tab === "stats" ? "#ffd43b" : t.text, fontFamily: "inherit", fontSize: 16, fontWeight: tab === "stats" ? 700 : 500, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>📊</span>
              <span>คำนวณสถิติ</span>
              {tab === "stats" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#ffd43b" }}>● กำลังใช้</span>}
            </button>

            {/* คัดลอกหลายหวย - ไม่ต้องใส่รหัส */}
            <button onClick={() => { setTab("multiCopy"); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === "multiCopy" ? "rgba(116,143,252,0.2)" : ink(0.06), color: tab === "multiCopy" ? "#748ffc" : t.text, fontFamily: "inherit", fontSize: 16, fontWeight: tab === "multiCopy" ? 700 : 500, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>📑</span>
              <span>คัดลอกหลายหวย</span>
              {tab === "multiCopy" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#748ffc" }}>● กำลังใช้</span>}
            </button>

            {/* เพิ่มผลหวย - ต้องใส่รหัส */}
            <button onClick={() => requireAdmin(() => { setTab("add"); setAddTab("result"); setMenuOpen(false); })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === "add" && addTab === "result" ? "rgba(169,227,75,0.2)" : ink(0.06), color: tab === "add" && addTab === "result" ? "#a9e34b" : t.text, fontFamily: "inherit", fontSize: 16, fontWeight: 500, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>➕</span>
              <span>เพิ่มผลหวย</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: inkText(0.3) }}>🔐</span>
            </button>

            {/* เพิ่มเลขปิด - ต้องใส่รหัส */}
            <button onClick={() => requireAdmin(() => { setTab("add"); setAddTab("closed"); setMenuOpen(false); })} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, border: "none", cursor: "pointer", background: tab === "add" && addTab === "closed" ? "rgba(255,212,59,0.2)" : ink(0.06), color: tab === "add" && addTab === "closed" ? "#ffd43b" : t.text, fontFamily: "inherit", fontSize: 16, fontWeight: 500, marginBottom: 16, textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <span>เพิ่มเลขปิด</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: inkText(0.3) }}>🔐</span>
            </button>

            {activeDate && (
              <>
                <div style={{ height: 1, background: ink(0.1), marginBottom: 16 }} />
                <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12, paddingLeft: 4 }}>จัดการ · {activeDate}</div>
                {/* ลบ - ต้องใส่รหัส */}
                <button onClick={() => requireAdmin(() => handleDelete(activeDate))} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 18, border: "1px solid rgba(255,100,100,0.2)", cursor: "pointer", background: "rgba(255,100,100,0.08)", color: "rgba(255,143,163,0.8)", fontFamily: "inherit", fontSize: 14, fontWeight: 500, textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>🗑</span>
                  <span>ลบข้อมูลวันที่ {activeDate}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: inkText(0.3) }}>🔐</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ ...glassStrong, borderRadius: "0 0 32px 32px", padding: "54px 20px 18px", position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <ThemeToggle mode={themeMode} onToggle={() => setThemeMode(m => m === "light" ? "dark" : "light")} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>สรุปผล</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>🎯 หวยประจำวัน</div>
          <div style={{ fontSize: 11, color: inkText(0.4), marginTop: 3 }}>
            {loaded ? `${dates.length} วัน · ${Object.values(allData).flat().length} รายการ` : "⏳ กำลังโหลด..."}
          </div>
        </div>
        <button onClick={() => setMenuOpen(true)} style={{ width: 44, height: 44, borderRadius: 14, border: "none", cursor: "pointer", background: ink(0.1), backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, borderRadius: 1, background: t.text, opacity: i === 1 ? 0.6 : 1 }} />)}
        </button>
      </div>

      <div style={{ padding: "16px", position: "relative", zIndex: 1 }}>
        {tab === "add" && (
          <>
            <div style={{ ...glass, display: "flex", padding: 4, gap: 4, marginBottom: 16 }}>
              {[["result","🎰 ผลหวย"],["closed","🔒 เลขปิด"]].map(([tabKey, label]) => (
                <button key={tabKey} onClick={() => setAddTab(tabKey)} style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: addTab === tabKey ? 700 : 400, background: addTab === tabKey ? ink(0.15) : "transparent", color: addTab === tabKey ? t.text : inkText(0.4) }}>{label}</button>
              ))}
            </div>
            <div style={{ ...glassStrong, padding: 20 }}>
              <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>วันที่</div>
              <input value={inputDate} onChange={e => setInputDate(e.target.value)} placeholder="03 มิ.ย. 69"
                style={{ width: "100%", background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 14, padding: "12px 16px", color: t.text, fontSize: 15, fontFamily: "inherit", marginBottom: 16 }} />
              <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
                {addTab === "result" ? "วางข้อมูลผลหวย" : "วางข้อมูลเลขปิด"}
              </div>
              <textarea value={addTab === "result" ? inputText : closedText}
                onChange={e => addTab === "result" ? setInputText(e.target.value) : setClosedText(e.target.value)}
                placeholder={addTab === "result" ? "🇱 ลาวประตูชัย 🇱🇦 : 622 - 40\n..." : "🇱🇦 ลาวประตูชัย  ::  16 60\n..."}
                rows={10} style={{ width: "100%", background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 14, padding: "12px 16px", color: t.text, fontSize: 13, fontFamily: "monospace", resize: "vertical", marginBottom: 16 }} />
              <button onClick={addTab === "result" ? handleAddResult : handleAddClosed} style={{ width: "100%", padding: "15px", borderRadius: 18, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#fff", background: addTab === "result" ? "linear-gradient(135deg, rgba(116,143,252,0.8), rgba(169,227,75,0.6))" : "linear-gradient(135deg, rgba(138,43,226,0.8), rgba(116,143,252,0.6))", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                {addTab === "result" ? "💾 บันทึกผลหวย" : "🔒 บันทึกเลขปิด"}
              </button>
              {saveStatus && <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: saveStatus.includes("✓") ? "#a9e34b" : saveStatus.includes("⏳") ? "#ffd43b" : "#ff8fa3" }}>{saveStatus}</div>}
            </div>
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={{ ...glass, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>เลือกหวย</div>
              <select value={activeStatsName} onChange={e => setStatsName(e.target.value)}
                style={{ width: "100%", background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 14, padding: "12px 16px", color: t.text, fontSize: 15, fontFamily: "inherit", marginBottom: 16, appearance: "none" }}>
                {lotteryList.map(l => (
                  <option key={l.name} value={l.name} style={{ color: "#000" }}>{l.flag} {l.name}</option>
                ))}
              </select>
              <div style={{ display: "flex", padding: 4, gap: 4, background: ink(0.05), borderRadius: 14 }}>
                {[["top","2 ตัวบน"],["bot","2 ตัวล่าง"]].map(([m, label]) => (
                  <button key={m} onClick={() => setStatsMode(m)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: statsMode === m ? 700 : 400, background: statsMode === m ? ink(0.15) : "transparent", color: statsMode === m ? t.text : inkText(0.4) }}>{label}</button>
                ))}
              </div>
            </div>

            {!statsBreakdown ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: inkText(0.25) }}>
                <div style={{ fontSize: 48 }}>📭</div>
                <div style={{ marginTop: 12, fontSize: 14 }}>
                  ยังไม่มีข้อมูล{statsMode === "top" ? "3 ตัวบน" : "2 ตัวล่าง"}ของหวยนี้
                </div>
              </div>
            ) : (
              <div style={{ ...glassStrong, padding: "22px 20px", background: `linear-gradient(135deg, ${statsAccent}14, rgba(255,255,255,0.05))`, borderColor: `${statsAccent}40` }}>
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{statsInfo?.flag} {activeStatsName}</div>
                  <div style={{ fontSize: 11, color: inkText(0.4), marginTop: 4 }}>
                    {statsMode === "top" ? "2 ตัวบน" : "2 ตัวล่าง"} · จากข้อมูล {statsBreakdown.total} งวด
                  </div>
                </div>

                <StatRow label="เลข 00 ถึง 49" value={statsBreakdown.half[0]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 50 ถึง 99" value={statsBreakdown.half[1]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />

                <Divider color={ink(0.08)} />

                <StatRow label="เลข 00 ถึง 33" value={statsBreakdown.thirds[0]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 34 ถึง 66" value={statsBreakdown.thirds[1]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 67 ถึง 99" value={statsBreakdown.thirds[2]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />

                <Divider color={ink(0.08)} />

                <StatRow label="เลข 00 ถึง 24" value={statsBreakdown.quarters[0]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 25 ถึง 49" value={statsBreakdown.quarters[1]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 50 ถึง 74" value={statsBreakdown.quarters[2]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลข 75 ถึง 99" value={statsBreakdown.quarters[3]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />

                <Divider color={ink(0.08)} />

                <StatRow label="เลขลงท้ายเลขคู่" value={statsBreakdown.evenOdd[0]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />
                <StatRow label="เลขลงท้ายเลขคี่" value={statsBreakdown.evenOdd[1]} accent={statsAccent} labelColor={inkText(0.55)} trackColor={ink(0.07)} />

                <button onClick={copyStatsText} style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 14, fontWeight: 700, color: "#fff", background: `linear-gradient(135deg, ${statsAccent}cc, rgba(255,255,255,0.15))` }}>
                  {statsCopied ? "✓ คัดลอกแล้ว" : "📋 คัดลอกข้อความสรุป"}
                </button>
              </div>
            )}
          </>
        )}

        {tab === "multiCopy" && (
          <>
            <div style={{ ...glass, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: inkText(0.4), letterSpacing: 1.5, textTransform: "uppercase" }}>เลือกหวยที่จะคัดลอก (สูงสุด 10)</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: multiSelected.length >= 10 ? "#ff6b6b" : inkText(0.5) }}>{multiSelected.length}/10</div>
              </div>

              {lotteryList.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: inkText(0.3), fontSize: 13 }}>ยังไม่มีข้อมูลหวยให้เลือก</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                  {lotteryList.map(l => {
                    const checked = multiSelected.includes(l.name);
                    const disabled = !checked && multiSelected.length >= 10;
                    return (
                      <button
                        key={l.name}
                        onClick={() => toggleMultiSelect(l.name)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "12px 14px", borderRadius: 14, border: "none",
                          cursor: disabled ? "not-allowed" : "pointer",
                          background: checked ? "rgba(116,143,252,0.18)" : ink(0.05),
                          opacity: disabled ? 0.4 : 1,
                          fontFamily: "inherit", fontSize: 14, color: t.text, textAlign: "left",
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `2px solid ${checked ? "#748ffc" : ink(0.25)}`,
                          background: checked ? "#748ffc" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, color: "#fff", fontWeight: 800,
                        }}>{checked ? "✓" : ""}</span>
                        <span>{l.flag} {l.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {multiLimitNotice && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#ff6b6b", textAlign: "center" }}>เลือกได้สูงสุด 10 หวยครับ</div>
              )}
            </div>

            {multiSelected.length > 0 && (
              <div style={{ ...glassStrong, padding: 20 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <button onClick={() => setMultiOrder(o => o === "asc" ? "desc" : "asc")} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: ink(0.08), color: t.text }}>
                    {multiOrder === "asc" ? "เก่า→ใหม่" : "ใหม่→เก่า"}
                  </button>
                  <button onClick={() => setMultiSelected([])} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: "rgba(255,100,100,0.1)", color: "#ff8fa3" }}>
                    ล้างที่เลือก
                  </button>
                </div>
                <button onClick={copyMultiHistory} style={{ width: "100%", padding: "14px", borderRadius: 16, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, rgba(116,143,252,0.85), rgba(169,227,75,0.65))" }}>
                  {multiCopied ? `✓ คัดลอกแล้ว (${multiSelected.length} หวย)` : `📋 คัดลอกผลย้อนหลัง (${multiSelected.length} หวย)`}
                </button>
              </div>
            )}
          </>
        )}

        {tab === "view" && (
          <>
            {dates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px", color: inkText(0.25) }}>
                <div style={{ fontSize: 56 }}>{loaded ? "📭" : "⏳"}</div>
                <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>{loaded ? "ยังไม่มีข้อมูล" : "กำลังโหลด..."}</div>
                {loaded && <div style={{ marginTop: 8, fontSize: 13 }}>กดปุ่ม ☰ มุมขวาบนเพื่อเพิ่มข้อมูล</div>}
              </div>
            ) : (
              <>
                <div style={{ ...glass, padding: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select value={curDay} onChange={e => selectDateBy(e.target.value, curMonth, curYear)} style={{ flex: 1, background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 12, padding: "10px 4px", color: t.text, fontSize: 14, fontFamily: "inherit", appearance: "none", textAlign: "center" }}>
                      {dayOptions.map(d => <option key={d} value={d} style={{ color: "#000" }}>{d}</option>)}
                    </select>
                    <select value={curMonth} onChange={e => selectDateBy(curDay, e.target.value, curYear)} style={{ flex: 1, background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 12, padding: "10px 4px", color: t.text, fontSize: 14, fontFamily: "inherit", appearance: "none", textAlign: "center" }}>
                      {monthOptions.map(m => <option key={m} value={m} style={{ color: "#000" }}>{m}</option>)}
                    </select>
                    <select value={curYear} onChange={e => selectDateBy(curDay, curMonth, e.target.value)} style={{ flex: 1, background: ink(0.07), border: `1px solid ${ink(0.12)}`, borderRadius: 12, padding: "10px 4px", color: t.text, fontSize: 14, fontFamily: "inherit", appearance: "none", textAlign: "center" }}>
                      {yearOptions.map(y => <option key={y} value={y} style={{ color: "#000" }}>{y}</option>)}
                    </select>
                  </div>
                  <button onClick={() => dates.length > 0 && setActiveDate(dates[dates.length - 1])} style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, rgba(116,143,252,0.8), rgba(169,227,75,0.6))" }}>
                    📍 ไปงวดล่าสุด
                  </button>
                </div>

                {activeDate && (
                  <div style={{ ...glass, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "16px 20px", marginBottom: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#748ffc" }}>{current.length}</div>
                      <div style={{ fontSize: 10, color: inkText(0.35), letterSpacing: 1, textTransform: "uppercase" }}>รายการ</div>
                    </div>
                    <div style={{ width: 1, height: 32, background: ink(0.1) }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#a9e34b" }}>{Object.keys(grouped).length}</div>
                      <div style={{ fontSize: 10, color: inkText(0.35), letterSpacing: 1, textTransform: "uppercase" }}>ประเทศ</div>
                    </div>
                    <div style={{ width: 1, height: 32, background: ink(0.1) }} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{activeDate}</div>
                      <div style={{ fontSize: 10, color: inkText(0.35), letterSpacing: 1, textTransform: "uppercase" }}>วันที่</div>
                    </div>
                  </div>
                )}

                {Object.entries(grouped).map(([country, rows]) => {
                  const accent = COLOR_MAP[country] || "#74c0fc";
                  return (
                    <div key={country} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingLeft: 4 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: accent }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{rows[0]?.flag} {country}</span>
                        <span style={{ fontSize: 11, color: inkText(0.3), marginLeft: "auto" }}>{rows.length} รายการ</span>
                      </div>
                      <div style={{ ...glass, overflow: "hidden", padding: 0 }}>
                        <div style={{ display: "grid", gridTemplateColumns: hasClosed ? "1fr 70px 60px 76px" : "1fr 80px 70px", padding: "10px 16px", borderBottom: `1px solid ${ink(0.06)}`, fontSize: 10, color: inkText(0.3), letterSpacing: 1.5, textTransform: "uppercase" }}>
                          <span>ชื่อหวย</span>
                          <span style={{ textAlign: "center" }}>3 ตัวบน</span>
                          <span style={{ textAlign: "center" }}>2 ตัวล่าง</span>
                          {hasClosed && <span style={{ textAlign: "center" }}>เลขปิด</span>}
                        </div>
                        {rows.map((r, i) => (
                          <div key={i} onClick={() => { setDrillName(r.name); setDrillFlag(r.flag); setDrillCountry(r.country); }}
                            style={{ display: "grid", gridTemplateColumns: hasClosed ? "1fr 70px 60px 76px" : "1fr 80px 70px", padding: "13px 16px", borderTop: i > 0 ? `1px solid ${ink(0.05)}` : "none", alignItems: "center", cursor: "pointer" }}
                            onTouchStart={e => e.currentTarget.style.background = ink(0.05)}
                            onTouchEnd={e => e.currentTarget.style.background = "transparent"}
                          >
                            <span style={{ fontSize: 13, color: inkText(0.8), fontWeight: 500 }}>{r.name} <span style={{ color: inkText(0.2) }}>›</span></span>
                            <span style={{ textAlign: "center", fontSize: 18, fontWeight: 800, color: accent, letterSpacing: 2 }}>{r.top3}</span>
                            <span style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: t.teal }}>{r.bot2}</span>
                            {hasClosed && <span style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: r.closed?.length ? t.gold : inkText(0.15) }}>{r.closed?.join(" ") || "—"}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>

  );
}
