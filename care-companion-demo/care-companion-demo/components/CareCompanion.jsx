"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Home, NotebookPen, Activity, MessageCircleHeart, FileText,
  Send, Trash2, Copy, Printer, ChevronRight, Check, X, Loader2, Pill, Plus, Clock, LogOut
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { loadKey, saveKey } from "../lib/storage";
import { demoReply } from "../lib/demoData";

const CATEGORIES = [
  "Memory & Confusion", "Mood & Behavior", "Sleep", "Mobility & Falls",
  "Eating & Appetite", "Communication", "Wandering", "Medication Reaction", "Other"
];

const SEVERITY = [
  { level: 1, label: "Mild", color: "#7C9070" },
  { level: 2, label: "Noticeable", color: "#A6A15D" },
  { level: 3, label: "Concerning", color: "#C08A4E" },
  { level: 4, label: "Serious", color: "#B4623F" },
  { level: 5, label: "Urgent", color: "#973B33" }
];

const MOODS = ["Overwhelmed", "Sad", "Angry", "Exhausted", "Numb", "Okay", "Hopeful"];

const TIME_BUCKETS = [
  { id: "morning", label: "Morning", range: "5am–12pm" },
  { id: "afternoon", label: "Afternoon", range: "12–5pm" },
  { id: "evening", label: "Evening", range: "5–9pm" },
  { id: "night", label: "Night", range: "9pm–5am" }
];

function timeBucket(hhmm) {
  if (!hhmm) return "morning";
  const h = parseInt(hhmm.split(":")[0], 10);
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}
function fmtTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const AFFIRMATIONS = [
  "You are doing your best, and that is enough.",
  "It's okay to not be okay some days. Just take one moment at a time.",
  "Caring for others doesn't mean carrying everything alone.",
  "Rest isn't giving up. It's part of how you keep going.",
  "However today goes, you showed up. That counts.",
  "Take a breath. You don't have to have this all figured out right now.",
  "This is hard, and that doesn't mean you're doing it wrong."
];

function todaysAffirmation() {
  const dayIndex = Math.floor(Date.now() / 86400000); // whole days since Jan 1, 1970
  return AFFIRMATIONS[dayIndex % AFFIRMATIONS.length];
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function CareCompanion() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("today");
  const [profile, setProfile] = useState(null);
  const [ventEntries, setVentEntries] = useState([]);
  const [symptomEntries, setSymptomEntries] = useState([]);
  const [adviceMessages, setAdviceMessages] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medLog, setMedLog] = useState([]);
  const [reminder] = useState(todaysAffirmation);

  useEffect(() => {
    (async () => {
      const [p, v, s, a, m, ml] = await Promise.all([
        loadKey("profile", null),
        loadKey("vent-entries", []),
        loadKey("symptom-entries", []),
        loadKey("advice-messages", []),
        loadKey("medications", []),
        loadKey("med-log", [])
      ]);
      setProfile(p);
      setVentEntries(v);
      setSymptomEntries(s);
      setAdviceMessages(a);
      setMedications(m);
      setMedLog(ml);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 400, fontFamily: "Inter, sans-serif", color: "#7A756A" }}>
        <Loader2 size={22} style={{ marginRight: 10, animation: "spin 1s linear infinite" }} />
        Getting things ready&hellip;
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onDone={async (p) => { await saveKey("profile", p); setProfile(p); }} />;
  }

  return (
    <Shell
      tab={tab} setTab={setTab} profile={profile}
      ventEntries={ventEntries} setVentEntries={setVentEntries}
      symptomEntries={symptomEntries} setSymptomEntries={setSymptomEntries}
      adviceMessages={adviceMessages} setAdviceMessages={setAdviceMessages}
      medications={medications} setMedications={setMedications}
      medLog={medLog} setMedLog={setMedLog}
      reminder={reminder}
    />
  );
}

function Onboarding({ onDone }) {
  const [her, setHer] = useState("");
  const [him, setHim] = useState("");
  return (
    <div className="cc-root">
      <GlobalStyle />
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="cc-breathe" style={{ width: 56, height: 56, margin: "0 auto 20px" }} />
          <h1 className="cc-display" style={{ fontSize: 28, margin: 0 }}>Welcome</h1>
          <p style={{ color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
            A quiet place for the venting, the tracking, and everything in between.
            Just a couple of quick things to set up first.
          </p>
        </div>
        <label className="cc-label">Your name</label>
        <input className="cc-input" value={her} onChange={e => setHer(e.target.value)} placeholder="e.g. Margaret" />
        <label className="cc-label" style={{ marginTop: 16 }}>His name</label>
        <input className="cc-input" value={him} onChange={e => setHim(e.target.value)} placeholder="e.g. Robert" />
        <button
          className="cc-btn cc-btn-primary"
          style={{ width: "100%", marginTop: 28, justifyContent: "center" }}
          onClick={() => onDone({ her: her.trim() || "there", him: him.trim() || "him" })}
        >
          Get started <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      :root{
        --bg:#F6F2E9; --surface:#FFFDF9; --ink:#332F28; --muted:#7A756A; --line:#E6DFD1;
        --sage:#5B6F5B; --sage-dim:#EAEFE7;
        --brick:#9C5B45; --brick-dim:#F3E7E1;
        --plum:#655A87; --plum-dim:#EDEAF3;
        --gold:#A6822F; --gold-dim:#F5EEDD;
        --radius:14px;
      }
      .cc-root{ background:var(--bg); color:var(--ink); font-family:'Inter',sans-serif; min-height:100%; font-size:16px; }
      .cc-display{ font-family:'Fraunces',serif; font-weight:600; letter-spacing:-0.01em; }
      .cc-mono{ font-family:'IBM Plex Mono',monospace; }
      .cc-label{ display:block; font-size:13px; font-weight:600; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.04em; }
      .cc-input, .cc-textarea, select.cc-input{
        width:100%; box-sizing:border-box; border:1.5px solid var(--line); background:var(--surface);
        border-radius:10px; padding:12px 14px; font-family:'Inter',sans-serif; font-size:16px; color:var(--ink);
        outline:none; transition:border-color .15s;
      }
      .cc-input:focus, .cc-textarea:focus{ border-color:var(--sage); }
      .cc-textarea{ resize:vertical; min-height:110px; line-height:1.5; }
      .cc-btn{
        display:inline-flex; align-items:center; gap:8px; border:none; border-radius:10px;
        padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; font-family:'Inter',sans-serif;
        transition:transform .1s, opacity .15s;
      }
      .cc-btn:active{ transform:scale(0.97); }
      .cc-btn:disabled{ opacity:0.5; cursor:not-allowed; }
      .cc-btn-primary{ background:var(--sage); color:white; }
      .cc-btn-ghost{ background:transparent; color:var(--muted); padding:8px 10px; }
      .cc-btn-ghost:hover{ color:var(--ink); }
      .cc-card{ background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); padding:20px; }
      .cc-breathe{
        border-radius:50%; background:radial-gradient(circle at 35% 30%, #EFE9DA, var(--sage) 78%);
        animation:cc-pulse 4.5s ease-in-out infinite;
      }
      @keyframes cc-pulse{ 0%,100%{ transform:scale(0.9); opacity:0.85 } 50%{ transform:scale(1.06); opacity:1 } }
      .cc-pill{ display:inline-flex; align-items:center; padding:6px 13px; border-radius:999px; font-size:13.5px; font-weight:600; cursor:pointer; border:1.5px solid var(--line); background:var(--surface); color:var(--muted); }
      .cc-pill.active{ border-color:transparent; }
      @media print{ .no-print{ display:none !important; } .cc-root{ background:white !important; } }
    `}</style>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);
  return isMobile;
}

function DemoBanner() {
  return (
    <div className="no-print" style={{
      background: "var(--plum-dim)", color: "var(--plum)", borderRadius: 10,
      padding: "8px 12px", fontSize: 13, fontWeight: 600, marginBottom: 16, textAlign: "center"
    }}>
      Demo with sample data. Nothing is saved and nothing here is real.
    </div>
  );
}

function Shell(props) {
  const { tab, setTab, profile } = props;
  const isMobile = useIsMobile();
  const navItems = [
    { id: "today", label: "Today", icon: Home },
    { id: "vent", label: "Vent", icon: NotebookPen },
    { id: "symptoms", label: "Symptoms", icon: Activity },
    { id: "meds", label: "Meds", icon: Pill },
    { id: "advice", label: "Ask", icon: MessageCircleHeart },
    { id: "reports", label: "Reports", icon: FileText }
  ];

  const page = (
    <>
      {tab === "today" && <Today {...props} />}
      {tab === "vent" && <Vent {...props} />}
      {tab === "symptoms" && <Symptoms {...props} />}
      {tab === "meds" && <Meds {...props} />}
      {tab === "advice" && <Advice {...props} />}
      {tab === "reports" && <Reports {...props} />}
    </>
  );

  if (isMobile) {
    return (
      <div className="cc-root" style={{ minHeight: "100%" }}>
        <GlobalStyle />
        <main style={{ padding: "20px 16px 96px", width: "100%", boxSizing: "border-box" }}>
          <DemoBanner />
          {page}
        </main>
        <nav className="no-print" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, display: "flex",
          borderTop: "1px solid var(--line)", background: "var(--surface)",
          padding: "6px 2px", zIndex: 20, overflowX: "auto"
        }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                flex: "1 0 52px", minWidth: 52, padding: "6px 2px", borderRadius: 8,
                border: "none", background: "transparent",
                color: tab === n.id ? "var(--sage)" : "var(--muted)",
                fontWeight: 600, fontSize: 10.5, cursor: "pointer"
              }}>
              <n.icon size={19} />
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="cc-root" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <GlobalStyle />
      <div style={{ flex: 1, display: "flex" }}>
        <nav className="no-print" style={{
          display: "flex", flexDirection: "column", gap: 4, padding: "20px 12px",
          borderRight: "1px solid var(--line)", minWidth: 0, width: 180
        }}>
          <div style={{ padding: "0 10px 18px" }}>
            <div className="cc-display" style={{ fontSize: 19 }}>Care Companion</div>
          </div>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                border: "none", background: tab === n.id ? "var(--sage-dim)" : "transparent",
                color: tab === n.id ? "var(--sage)" : "var(--muted)", fontWeight: 600, fontSize: 14.5,
                cursor: "pointer", textAlign: "left", whiteSpace: "nowrap"
              }}>
              <n.icon size={18} />
              <span>{n.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45, padding: "10px 12px" }}>
            Demo with sample data. Nothing here is real.
          </div>
        </nav>
        <main style={{ flex: 1, padding: "28px 24px 90px", maxWidth: 780, margin: "0 auto", width: "100%" }}>
          <DemoBanner />
          {page}
        </main>
      </div>
    </div>
  );
}

function Today({ setTab, profile, ventEntries, symptomEntries, reminder }) {
  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return symptomEntries.filter(e => new Date(e.date).getTime() >= cutoff);
  }, [symptomEntries]);
  const lastSymptom = symptomEntries[symptomEntries.length - 1];
  return (
    <div>
      <h1 className="cc-display" style={{ fontSize: 26, marginBottom: 4 }}>Good to see you today.</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 24 }}>
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <div className="cc-card" style={{ background: "var(--gold-dim)", border: "none", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.04em", marginBottom: 6 }}>
          TODAY
        </div>
        <p style={{ margin: 0, lineHeight: 1.55 }}>{reminder}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div className="cc-card">
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>LOGGED THIS WEEK</div>
          <div className="cc-display" style={{ fontSize: 30, marginTop: 4 }}>{last7.length}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>symptom entries for {profile.him}</div>
        </div>
        <div className="cc-card">
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>MOST RECENT</div>
          <div className="cc-display" style={{ fontSize: 18, marginTop: 8 }}>
            {lastSymptom ? lastSymptom.category : "Nothing yet"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{lastSymptom ? fmtDate(lastSymptom.date) : "Log one when it happens"}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <QuickAction icon={NotebookPen} label="Get something off your chest" sub="Private, always." color="brick" onClick={() => setTab("vent")} />
        <QuickAction icon={Activity} label="Log a symptom" sub="Takes under a minute." color="sage" onClick={() => setTab("symptoms")} />
        <QuickAction icon={Pill} label="Check off today's medications" sub="See what's due and what's done." color="sage" onClick={() => setTab("meds")} />
        <QuickAction icon={MessageCircleHeart} label="Ask for a thought or two" sub="Not a substitute for his doctor, but a place to start." color="plum" onClick={() => setTab("advice")} />
        <QuickAction icon={FileText} label="Put together something to share" sub="For family, for his appointment." color="gold" onClick={() => setTab("reports")} />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, color, onClick }) {
  return (
    <button onClick={onClick} className="cc-card" style={{
      display: "flex", alignItems: "center", gap: 14, border: "1px solid var(--line)", cursor: "pointer",
      textAlign: "left", width: "100%", background: "var(--surface)"
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `var(--${color}-dim)`, color: `var(--${color})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={19} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{sub}</div>
      </div>
      <ChevronRight size={18} color="var(--muted)" />
    </button>
  );
}

function Vent({ ventEntries, setVentEntries, profile }) {
  const [mood, setMood] = useState(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    const entry = { id: uid(), date: new Date().toISOString(), mood, text: text.trim() };
    const next = [...ventEntries, entry];
    setVentEntries(next);
    await saveKey("vent-entries", next);
    setText(""); setMood(null); setSaving(false);
  }
  async function del(id) {
    if (!window.confirm("Delete this entry for good?")) return;
    const next = ventEntries.filter(e => e.id !== id);
    setVentEntries(next);
    await saveKey("vent-entries", next);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
        <div className="cc-breathe" style={{ width: 34, height: 34, flexShrink: 0 }} />
        <h1 className="cc-display" style={{ fontSize: 24, margin: 0 }}>Vent</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        Nobody sees this but you — not family, not doctors, not anyone. Take a breath first, if you want one.
      </p>
      <div className="cc-card" style={{ marginBottom: 20 }}>
        <div className="cc-label">How are you, really</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {MOODS.map(m => (
            <span key={m} className={`cc-pill ${mood === m ? "active" : ""}`}
              style={mood === m ? { background: "var(--brick)", color: "white" } : {}}
              onClick={() => setMood(mood === m ? null : m)}>{m}</span>
          ))}
        </div>
        <textarea className="cc-textarea" placeholder="Whatever it is, write it here." value={text} onChange={e => setText(e.target.value)} />
        <button className="cc-btn cc-btn-primary" style={{ marginTop: 12, background: "var(--brick)" }} disabled={!text.trim() || saving} onClick={save}>
          {saving ? "Saving…" : "Save privately"}
        </button>
      </div>
      <div>
        {[...ventEntries].reverse().map(e => (
          <div key={e.id} className="cc-card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                {e.mood && <span className="cc-pill" style={{ marginBottom: 8, background: "var(--brick-dim)", color: "var(--brick)", border: "none" }}>{e.mood}</span>}
                <div className="cc-mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {new Date(e.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
              <button className="cc-btn cc-btn-ghost" onClick={() => del(e.id)}><Trash2 size={16} /></button>
            </div>
            <p style={{ marginBottom: 0, marginTop: 10, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{e.text}</p>
          </div>
        ))}
        {ventEntries.length === 0 && <EmptyState text="Nothing here yet. When you need to let something out, this is the place." />}
      </div>
    </div>
  );
}

function Symptoms({ symptomEntries, setSymptomEntries, profile }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState(2);
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState("");
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTime());
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All");

  async function save() {
    setSaving(true);
    const entry = { id: uid(), date, time, category, severity, notes: notes.trim(), meds: meds.trim(), loggedAt: new Date().toISOString() };
    const next = [...symptomEntries, entry].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
    setSymptomEntries(next);
    await saveKey("symptom-entries", next);
    setNotes(""); setMeds(""); setSeverity(2); setTime(nowTime()); setSaving(false);
  }
  async function del(id) {
    if (!window.confirm("Delete this entry?")) return;
    const next = symptomEntries.filter(e => e.id !== id);
    setSymptomEntries(next);
    await saveKey("symptom-entries", next);
  }

  const filtered = filter === "All" ? symptomEntries : symptomEntries.filter(e => e.category === filter);
  const chartData = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(c => counts[c] = 0);
    symptomEntries.filter(e => Date.now() - new Date(e.date).getTime() < 30 * 86400000)
      .forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return CATEGORIES.map(c => ({ name: c.split(" ")[0], full: c, count: counts[c] })).filter(d => d.count > 0);
  }, [symptomEntries]);

  const heatmap = useMemo(() => {
    const recent = symptomEntries.filter(e => Date.now() - new Date(e.date).getTime() < 30 * 86400000);
    const cats = [...new Set(recent.map(e => e.category))];
    const grid = cats.map(cat => {
      const row = { category: cat };
      TIME_BUCKETS.forEach(b => { row[b.id] = recent.filter(e => e.category === cat && timeBucket(e.time) === b.id).length; });
      return row;
    });
    const max = Math.max(1, ...grid.flatMap(r => TIME_BUCKETS.map(b => r[b.id])));
    const bucketTotals = TIME_BUCKETS.map(b => ({ ...b, count: recent.filter(e => timeBucket(e.time) === b.id).length }));
    return { grid, max, bucketTotals, total: recent.length };
  }, [symptomEntries]);

  return (
    <div>
      <h1 className="cc-display" style={{ fontSize: 24, marginBottom: 4 }}>Symptoms</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        This is the part that becomes his report — for you to track the pattern, and for the doctors to see it too.
      </p>
      <div className="cc-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <div className="cc-label">Date</div>
            <input type="date" className="cc-input" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
          </div>
          <div>
            <div className="cc-label">Time</div>
            <input type="time" className="cc-input" value={time} onChange={e => setTime(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="cc-label">Category</div>
          <select className="cc-input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="cc-label">How serious was it</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {SEVERITY.map(s => (
            <span key={s.level} className={`cc-pill ${severity === s.level ? "active" : ""}`}
              style={severity === s.level ? { background: s.color, color: "white" } : {}}
              onClick={() => setSeverity(s.level)}>{s.level} · {s.label}</span>
          ))}
        </div>
        <div className="cc-label">What happened</div>
        <textarea className="cc-textarea" style={{ minHeight: 80, marginBottom: 14 }} placeholder="Describe it in your own words — what you saw, what came before it, anything that helped."
          value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="cc-label">Medication given (optional)</div>
        <input className="cc-input" style={{ marginBottom: 16 }} placeholder="e.g. Donepezil, 10pm" value={meds} onChange={e => setMeds(e.target.value)} />
        <button className="cc-btn cc-btn-primary" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Log this"}
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="cc-card" style={{ marginBottom: 20 }}>
          <div className="cc-label" style={{ marginBottom: 10 }}>Last 30 days, by category</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
              <Tooltip formatter={(v, n, p) => [v, p.payload.full]} contentStyle={{ borderRadius: 8, border: "1px solid var(--line)" }} />
              <Bar dataKey="count" fill="var(--sage)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {heatmap.total > 0 && (
        <div className="cc-card" style={{ marginBottom: 20 }}>
          <div className="cc-label" style={{ marginBottom: 2 }}>When it happens — last 30 days</div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0, marginBottom: 14 }}>
            Useful for spotting patterns like sundowning, where behaviors cluster in a particular part of the day.
          </p>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${TIME_BUCKETS.length}, 1fr)`, gap: 6, minWidth: 460 }}>
              <div />
              {TIME_BUCKETS.map(b => (
                <div key={b.id} style={{ fontSize: 12, fontWeight: 700, textAlign: "center", color: "var(--muted)" }}>
                  {b.label}<div style={{ fontWeight: 400, fontSize: 10.5 }}>{b.range}</div>
                </div>
              ))}
              {heatmap.grid.map(row => (
                <React.Fragment key={row.category}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" }}>{row.category}</div>
                  {TIME_BUCKETS.map(b => {
                    const v = row[b.id];
                    const intensity = v / heatmap.max;
                    return (
                      <div key={b.id} style={{
                        height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 13,
                        background: v === 0 ? "var(--bg)" : `rgba(91,111,91,${0.15 + intensity * 0.75})`,
                        color: v === 0 ? "var(--line)" : intensity > 0.5 ? "white" : "var(--sage)"
                      }}>{v || ""}</div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          {(() => {
            const sorted = [...heatmap.bucketTotals].sort((a, b) => b.count - a.count);
            const top = sorted[0];
            if (top.count >= 3 && top.count >= heatmap.total * 0.4) {
              return (
                <p style={{ marginTop: 16, marginBottom: 0, fontSize: 13.5, background: "var(--gold-dim)", padding: "10px 14px", borderRadius: 10, lineHeight: 1.5 }}>
                  Over the last month, entries have clustered in the <strong>{top.label.toLowerCase()}</strong> ({top.range}) more than any other time —
                  worth mentioning to his doctor if this keeps up.
                </p>
              );
            }
            return null;
          })()}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <span className={`cc-pill ${filter === "All" ? "active" : ""}`} style={filter === "All" ? { background: "var(--sage)", color: "white" } : {}} onClick={() => setFilter("All")}>All</span>
        {CATEGORIES.map(c => (
          <span key={c} className={`cc-pill ${filter === c ? "active" : ""}`} style={filter === c ? { background: "var(--sage)", color: "white" } : {}} onClick={() => setFilter(c)}>{c}</span>
        ))}
      </div>
      <div>
        {[...filtered].reverse().map(e => {
          const sev = SEVERITY.find(s => s.level === e.severity);
          return (
            <div key={e.id} className="cc-card" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{e.category}</div>
                  <div className="cc-mono" style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(e.date)}{e.time ? ` · ${fmtTime(e.time)}` : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sev.color }}>{sev.label}</span>
                  <button className="cc-btn cc-btn-ghost" onClick={() => del(e.id)}><Trash2 size={16} /></button>
                </div>
              </div>
              {e.notes && <p style={{ marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>{e.notes}</p>}
              {e.meds && <p style={{ marginTop: 6, marginBottom: 0, fontSize: 13, color: "var(--muted)" }}>Medication: {e.meds}</p>}
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState text="No entries yet in this category." />}
      </div>
    </div>
  );
}

function Advice({ adviceMessages, setAdviceMessages, symptomEntries, profile }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [adviceMessages, sending]);

  async function send() {
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...adviceMessages, userMsg];
    setAdviceMessages(next);
    setInput("");
    setSending(true);

    const recent = symptomEntries.slice(-10).map(e =>
      `${e.date} — ${e.category} (severity ${e.severity}/5): ${e.notes || "no notes"}${e.meds ? `; meds: ${e.meds}` : ""}`
    ).join("\n") || "No symptom entries logged yet.";

    const system = `You are a calm, knowledgeable companion for a family caregiver in her seventies, caring for her husband ${profile.him} who has early onset dementia that is gradually worsening. She may ask for practical suggestions, ways to respond to specific behaviors, or just want to think something through.

Recent logged symptoms for context:
${recent}

Guidelines:
- Be warm, direct, and practical. Short, clear paragraphs. No jargon.
- Offer concrete, specific suggestions she can actually try, grounded in general dementia caregiving best practice.
- You are not a doctor and cannot diagnose or recommend medication changes. For anything medical, urgent, or medication-related, clearly tell her to contact his doctor or care team — and say so plainly, not as a disclaimer tacked on the end.
- If something sounds urgent or safety-related (falls, wandering, aggression, swallowing, chest pain, etc.), say clearly that this warrants contacting his doctor or emergency services now.
- Never be clinical or cold. She is exhausted and doing her best.`;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const text = demoReply(userMsg.content);
      const finalMsgs = [...next, { role: "assistant", content: text }];
      setAdviceMessages(finalMsgs);
      await saveKey("advice-messages", finalMsgs);
    } catch (e) {
      const finalMsgs = [...next, { role: "assistant", content: "Something went wrong. Please try again in a moment." }];
      setAdviceMessages(finalMsgs);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 420 }}>
      <h1 className="cc-display" style={{ fontSize: 24, marginBottom: 4 }}>Ask</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 16 }}>
        General thoughts and ideas — not a doctor, and not a substitute for one. Anything urgent or medical should go to his care team.
      </p>
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 14, paddingRight: 4 }}>
        {adviceMessages.length === 0 && (
          <EmptyState text={`Ask about a behavior you're seeing, something you're not sure how to handle with ${profile.him}, or just think out loud.`} />
        )}
        {adviceMessages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "80%", padding: "11px 15px", borderRadius: 14, lineHeight: 1.5,
              background: m.role === "user" ? "var(--plum)" : "var(--surface)",
              color: m.role === "user" ? "white" : "var(--ink)",
              border: m.role === "user" ? "none" : "1px solid var(--line)",
              whiteSpace: "pre-wrap"
            }}>{m.content}</div>
          </div>
        ))}
        {sending && <div style={{ color: "var(--muted)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> thinking it through…</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="cc-input" placeholder="Type here…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }} />
        <button className="cc-btn cc-btn-primary" style={{ background: "var(--plum)" }} disabled={sending || !input.trim()} onClick={send}>
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}

function Reports({ symptomEntries, profile }) {
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(todayStr());
  const [copied, setCopied] = useState(false);

  const inRange = useMemo(() =>
    symptomEntries.filter(e => e.date >= start && e.date <= end).sort((a, b) => a.date.localeCompare(b.date)),
    [symptomEntries, start, end]
  );
  const byDate = useMemo(() => {
    const groups = {};
    inRange.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
    return Object.entries(groups);
  }, [inRange]);

  const severityCounts = SEVERITY.map(s => ({ ...s, count: inRange.filter(e => e.severity === s.level).length }));

  function reportText() {
    let out = `Symptom summary for ${profile.him}\n${fmtDate(start)} – ${fmtDate(end)}\nPrepared by ${profile.her}\n\n`;
    out += `Total entries: ${inRange.length}\n`;
    out += severityCounts.filter(s => s.count > 0).map(s => `  ${s.label} (${s.level}): ${s.count}`).join("\n") + "\n\n";
    byDate.forEach(([date, entries]) => {
      out += `${fmtDate(date)}\n`;
      entries.forEach(e => {
        out += `  • ${e.category} — severity ${e.severity}/5 (${SEVERITY.find(s => s.level === e.severity).label})\n`;
        if (e.notes) out += `    ${e.notes}\n`;
        if (e.meds) out += `    Medication: ${e.meds}\n`;
      });
    });
    return out;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(reportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* ignore */ }
  }

  return (
    <div>
      <h1 className="cc-display" style={{ fontSize: 24, marginBottom: 4 }}>Reports</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        Pulls only from symptom entries — vent entries are never included. Copy it, print it, or paste it into an email for family or his doctor.
      </p>
      <div className="cc-card no-print" style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div><div className="cc-label">From</div><input type="date" className="cc-input" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div><div className="cc-label">To</div><input type="date" className="cc-input" value={end} onChange={e => setEnd(e.target.value)} max={todayStr()} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="cc-btn cc-btn-primary" style={{ background: "var(--gold)" }} onClick={copy} disabled={inRange.length === 0}>
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy report text</>}
          </button>
          <button className="cc-btn" style={{ background: "var(--surface)", border: "1.5px solid var(--line)", color: "var(--ink)" }} onClick={() => window.print()} disabled={inRange.length === 0}>
            <Printer size={16} /> Print / save as PDF
          </button>
        </div>
      </div>

      <div className="cc-card">
        <h2 className="cc-display" style={{ fontSize: 20, marginTop: 0 }}>Symptom summary for {profile.him}</h2>
        <p className="cc-mono" style={{ fontSize: 13, color: "var(--muted)", marginTop: -8 }}>{fmtDate(start)} – {fmtDate(end)} · prepared by {profile.her}</p>
        {inRange.length === 0 ? (
          <EmptyState text="No symptom entries in this date range yet." />
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {severityCounts.filter(s => s.count > 0).map(s => (
                <span key={s.level} className="cc-pill" style={{ background: s.color, color: "white", border: "none" }}>{s.label}: {s.count}</span>
              ))}
            </div>
            {byDate.map(([date, entries]) => (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{fmtDate(date)}</div>
                {entries.map(e => (
                  <div key={e.id} style={{ paddingLeft: 14, borderLeft: `3px solid ${SEVERITY.find(s => s.level === e.severity).color}`, marginBottom: 10 }}>
                    <div style={{ fontSize: 14 }}><strong>{e.category}</strong> — severity {e.severity}/5{e.time ? ` · ${fmtTime(e.time)}` : ""}</div>
                    {e.notes && <div style={{ fontSize: 14, color: "var(--ink)", marginTop: 2 }}>{e.notes}</div>}
                    {e.meds && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Medication: {e.meds}</div>}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Meds({ medications, setMedications, medLog, setMedLog, profile }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState(["08:00"]);
  const [notes, setNotes] = useState("");

  const today = todayStr();
  const active = medications.filter(m => m.active !== false);

  async function addMed() {
    if (!name.trim()) return;
    const med = { id: uid(), name: name.trim(), dose: dose.trim(), times: times.filter(Boolean), notes: notes.trim(), active: true };
    const next = [...medications, med];
    setMedications(next);
    await saveKey("medications", next);
    setName(""); setDose(""); setTimes(["08:00"]); setNotes(""); setShowForm(false);
  }
  async function removeMed(id) {
    if (!window.confirm("Remove this medication from the schedule? Past history stays in your reports.")) return;
    const next = medications.map(m => m.id === id ? { ...m, active: false } : m);
    setMedications(next);
    await saveKey("medications", next);
  }

  function logEntry(medId, time) {
    return medLog.find(l => l.medId === medId && l.date === today && l.time === time);
  }
  async function toggleDose(medId, time) {
    const existing = logEntry(medId, time);
    let next;
    if (existing) {
      next = medLog.filter(l => l !== existing);
    } else {
      next = [...medLog, { id: uid(), medId, date: today, time, taken: true, takenAt: new Date().toISOString() }];
    }
    setMedLog(next);
    await saveKey("med-log", next);
  }

  const todaysDoses = [];
  active.forEach(m => m.times.forEach(t => todaysDoses.push({ med: m, time: t })));
  todaysDoses.sort((a, b) => a.time.localeCompare(b.time));

  const last7Adherence = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    const scheduled = active.reduce((sum, m) => sum + m.times.length, 0) * 7;
    const taken = medLog.filter(l => new Date(l.date).getTime() >= cutoff && l.taken).length;
    return { taken, scheduled };
  }, [medLog, active]);

  return (
    <div>
      <h1 className="cc-display" style={{ fontSize: 24, marginBottom: 4 }}>Medications</h1>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: 20 }}>
        A schedule you check off as the day goes — this app can't send alerts to your phone, so keep using whatever alarm you already trust for reminders.
      </p>

      <div className="cc-card" style={{ marginBottom: 20 }}>
        <div className="cc-label" style={{ marginBottom: 12 }}>Today, {fmtDate(today)}</div>
        {todaysDoses.length === 0 ? (
          <EmptyState text="No medications set up yet. Add one below to start tracking doses." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaysDoses.map(({ med, time }, i) => {
              const done = !!logEntry(med.id, time);
              return (
                <div key={med.id + time + i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--line)",
                  background: done ? "var(--sage-dim)" : "var(--surface)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Clock size={16} color="var(--muted)" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{med.name}{med.dose ? ` — ${med.dose}` : ""}</div>
                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{fmtTime(time)}</div>
                    </div>
                  </div>
                  <button className="cc-btn" style={{
                    background: done ? "var(--sage)" : "var(--surface)", color: done ? "white" : "var(--muted)",
                    border: done ? "none" : "1.5px solid var(--line)", padding: "8px 14px"
                  }} onClick={() => toggleDose(med.id, time)}>
                    {done ? <><Check size={15} /> Given</> : "Mark given"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {last7Adherence.scheduled > 0 && (
        <div className="cc-card" style={{ marginBottom: 20, background: "var(--sage-dim)", border: "none" }}>
          <span style={{ fontWeight: 700 }}>{last7Adherence.taken} of {last7Adherence.scheduled}</span> scheduled doses marked given over the last 7 days.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        {active.map(m => (
          <div key={m.id} className="cc-card" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.name}{m.dose ? ` — ${m.dose}` : ""}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{m.times.map(fmtTime).join(", ")}</div>
                {m.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{m.notes}</div>}
              </div>
              <button className="cc-btn cc-btn-ghost" onClick={() => removeMed(m.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="cc-card">
          <div className="cc-label">Medication name</div>
          <input className="cc-input" style={{ marginBottom: 14 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Donepezil" />
          <div className="cc-label">Dose (optional)</div>
          <input className="cc-input" style={{ marginBottom: 14 }} value={dose} onChange={e => setDose(e.target.value)} placeholder="e.g. 10mg" />
          <div className="cc-label">Times each day</div>
          {times.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="time" className="cc-input" value={t} onChange={e => {
                const next = [...times]; next[i] = e.target.value; setTimes(next);
              }} />
              {times.length > 1 && (
                <button className="cc-btn cc-btn-ghost" onClick={() => setTimes(times.filter((_, idx) => idx !== i))}><X size={16} /></button>
              )}
            </div>
          ))}
          <button className="cc-btn cc-btn-ghost" style={{ marginBottom: 14, padding: "6px 0" }} onClick={() => setTimes([...times, "08:00"])}>
            <Plus size={15} /> Add another time
          </button>
          <div className="cc-label">Notes (optional)</div>
          <input className="cc-input" style={{ marginBottom: 16 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. take with food" />
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cc-btn cc-btn-primary" disabled={!name.trim()} onClick={addMed}>Save medication</button>
            <button className="cc-btn cc-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="cc-btn cc-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add a medication
        </button>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--muted)", border: "1.5px dashed var(--line)", borderRadius: 14 }}>
      {text}
    </div>
  );
}
