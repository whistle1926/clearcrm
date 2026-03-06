import { useState } from "react";

// ─── USERS ─────────────────────────────────────────────────────────────────────
// To change PINs, edit here. Admin PIN: 0000
const USERS = [
  { name: "Alex",   pin: "0000", role: "admin"  },
  { name: "Jamie",  pin: "1111", role: "agent"  },
  { name: "Sam",    pin: "2222", role: "agent"  },
  { name: "Jordan", pin: "3333", role: "agent"  },
];

// ─── SAMPLE DATA ───────────────────────────────────────────────────────────────
const SAMPLE_CONTACTS = [
  { id: 1, name: "Sarah Chen", phone: "+1 415 555 0192", email: "sarah.chen@techcorp.com", company: "TechCorp", source: "LinkedIn", notes: "Very interested in Q1 investment. Asked about minimum ticket size.", budget: "100k-500k", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 5, leadStatus: "Qualified", assignedTo: "Alex", score: 87, scoreBreakdown: { budget: 25, timeline: 20, responsiveness: 18, decisionMaker: 15, engagement: 9 }, callStatus: "booked", callDate: "2026-03-07", callTime: "10:00", timezone: "PST", meetingLink: "https://cal.com/alex/consultation", callNotes: "", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Sarah! Your call is confirmed for March 7 at 10:00 AM PST.", time: "2026-03-05 09:00", status: "read" }], category: "A" },
  { id: 2, name: "Marcus Williams", phone: "+1 212 555 0847", email: "m.williams@invest.io", company: "Invest.io", source: "Referral", notes: "Referred by David Kim. Has invested before, looking for alternatives.", budget: "500k+", timeline: "1 month", isDecisionMaker: true, interestLevel: 4, leadStatus: "Call Booked", assignedTo: "Jamie", score: 92, scoreBreakdown: { budget: 25, timeline: 25, responsiveness: 18, decisionMaker: 15, engagement: 9 }, callStatus: "booked", callDate: "2026-03-06", callTime: "14:00", timezone: "EST", meetingLink: "https://cal.com/jamie/call", callNotes: "", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Marcus! Reminder: your call is TODAY at 2:00 PM EST.", time: "2026-03-06 08:00", status: "delivered" }], category: "A" },
  { id: 3, name: "Priya Sharma", phone: "+44 20 7946 0958", email: "priya@globalfunds.co", company: "Global Funds", source: "Website", notes: "Downloaded whitepaper, opened emails 4 times. Not sure on timeline.", budget: "50k-100k", timeline: "3-6 months", isDecisionMaker: false, interestLevel: 3, leadStatus: "Scored", assignedTo: "Alex", score: 54, scoreBreakdown: { budget: 15, timeline: 12, responsiveness: 10, decisionMaker: 5, engagement: 12 }, callStatus: null, callDate: null, callTime: null, timezone: "GMT", meetingLink: "", callNotes: "", whatsappHistory: [], category: "B" },
  { id: 4, name: "Tom Bradley", phone: "+1 310 555 2341", email: "tom.b@ventures.com", company: "Bradley Ventures", source: "Cold Outreach", notes: "No reply to first two emails. LinkedIn profile shows active.", budget: "10k-50k", timeline: "6+ months", isDecisionMaker: false, interestLevel: 1, leadStatus: "New Lead", assignedTo: "Jamie", score: 22, scoreBreakdown: { budget: 8, timeline: 4, responsiveness: 2, decisionMaker: 5, engagement: 3 }, callStatus: null, callDate: null, callTime: null, timezone: "PST", meetingLink: "", callNotes: "", whatsappHistory: [], category: "D" },
  { id: 5, name: "Elena Vasquez", phone: "+34 91 555 0123", email: "elena@iberfund.es", company: "IberFund", source: "Conference", notes: "Met at FinTech Summit. Very warm, asked for a follow-up call next week.", budget: "100k-500k", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 4, leadStatus: "Qualified", assignedTo: "Sam", score: 76, scoreBreakdown: { budget: 25, timeline: 18, responsiveness: 12, decisionMaker: 15, engagement: 6 }, callStatus: "completed", callDate: "2026-03-04", callTime: "11:00", timezone: "CET", meetingLink: "", callNotes: "Great call. Send proposal by EOW.", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Elena! Thank you for the great conversation today.", time: "2026-03-04 12:00", status: "read" }], category: "A" },
  { id: 6, name: "James Okonkwo", phone: "+234 805 555 9876", email: "j.okonkwo@lagos.capital", company: "Lagos Capital", source: "LinkedIn", notes: "High-net-worth individual. Interested in real estate fund.", budget: "500k+", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 3, leadStatus: "Scored", assignedTo: "Sam", score: 68, scoreBreakdown: { budget: 25, timeline: 18, responsiveness: 10, decisionMaker: 15, engagement: 0 }, callStatus: null, callDate: null, callTime: null, timezone: "WAT", meetingLink: "", callNotes: "", whatsappHistory: [], category: "B" },
  { id: 7, name: "Lisa Park", phone: "+1 628 555 4401", email: "lpark@sfwealth.com", company: "SF Wealth Mgmt", source: "Referral", notes: "No-showed last call. Rescheduled twice.", budget: "100k-500k", timeline: "3-6 months", isDecisionMaker: true, interestLevel: 2, leadStatus: "No Show", assignedTo: "Alex", score: 41, scoreBreakdown: { budget: 25, timeline: 12, responsiveness: 2, decisionMaker: 15, engagement: -13 }, callStatus: "no-show", callDate: "2026-03-05", callTime: "15:00", timezone: "PST", meetingLink: "", callNotes: "No-showed again.", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Lisa, we missed you on our call today.", time: "2026-03-05 15:15", status: "delivered" }], category: "C" },
  { id: 8, name: "Ryan Patel", phone: "+1 647 555 3310", email: "ryan@nordicvc.com", company: "Nordic VC", source: "Conference", notes: "Met at DubaiFintech. Strong interest, needs board approval first.", budget: "500k+", timeline: "1-3 months", isDecisionMaker: false, interestLevel: 4, leadStatus: "Qualified", assignedTo: "Jordan", score: 71, scoreBreakdown: { budget: 25, timeline: 18, responsiveness: 10, decisionMaker: 5, engagement: 13 }, callStatus: null, callDate: null, callTime: null, timezone: "EST", meetingLink: "", callNotes: "", whatsappHistory: [], category: "B" },
];

const TEAM_MEMBERS = ["Alex", "Jamie", "Sam", "Jordan"];
const WORKFLOW_STAGES = ["New Lead", "Scored", "Qualified", "Call Booked", "Completed", "No Show", "Follow Up Later"];
const BUDGET_OPTIONS = ["Under 10k", "10k-50k", "50k-100k", "100k-500k", "500k+"];
const TIMELINE_OPTIONS = ["1 month", "1-3 months", "3-6 months", "6+ months", "Unknown"];
const SOURCES = ["LinkedIn", "Referral", "Website", "Conference", "Cold Outreach", "Other"];
const WA_TEMPLATES = {
  booking_confirmation: "Hi {{name}}! ✅ Your call is confirmed for {{date}} at {{time}} {{timezone}}.\n\nJoin here: {{link}}\n\nLooking forward to speaking with you!",
  reminder_24h: "Hi {{name}}! 👋 Just a reminder — your call is tomorrow at {{time}} {{timezone}}.\n\nLink: {{link}}\n\nSee you then!",
  reminder_1h: "Hi {{name}}! ⏰ Your call starts in 1 hour at {{time}} {{timezone}}.\n\nLink: {{link}}",
  reschedule: "Hi {{name}}! 🔄 Your call has been rescheduled to {{date}} at {{time}} {{timezone}}.\n\nUpdated link: {{link}}",
  cancellation: "Hi {{name}}, your call has been cancelled. We hope to connect soon — feel free to rebook at your convenience.",
  no_show: "Hi {{name}}, we missed you on today's call! 😊 Would you like to reschedule? Reply to this message or use this link: {{link}}",
};

function scoreColor(s) { return s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : s >= 40 ? "#f97316" : "#ef4444"; }
function categoryColor(c) { return { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#6b7280" }[c] || "#6b7280"; }
function statusColor(s) { return { "New Lead": "#6366f1", Scored: "#8b5cf6", Qualified: "#3b82f6", "Call Booked": "#10b981", Completed: "#059669", "No Show": "#f97316", "Follow Up Later": "#f59e0b" }[s] || "#6b7280"; }
function fillTemplate(tpl, c) { return tpl.replace(/{{name}}/g, c.name.split(" ")[0]).replace(/{{date}}/g, c.callDate || "TBD").replace(/{{time}}/g, c.callTime || "TBD").replace(/{{timezone}}/g, c.timezone || "").replace(/{{link}}/g, c.meetingLink || "#"); }

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #1a1d26; }
  ::-webkit-scrollbar-thumb { background: #2d3247; border-radius: 4px; }
  input, select, textarea { font-family: inherit; color: #e2e8f0; background: #1a1d26; border: 1px solid #2d3247; border-radius: 8px; padding: 10px 14px; font-size: 15px; outline: none; transition: border-color 0.15s; }
  input:focus, select:focus, textarea:focus { border-color: #6366f1; }
  button { cursor: pointer; font-family: inherit; }
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 99px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .btn { border: none; border-radius: 8px; padding: 10px 18px; font-size: 15px; font-weight: 500; transition: all 0.15s; }
  .btn-primary { background: #6366f1; color: #fff; } .btn-primary:hover { background: #5558e8; }
  .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #2d3247; } .btn-ghost:hover { background: #1a1d26; color: #e2e8f0; }
  .btn-green { background: #10b981; color: #fff; } .btn-green:hover { background: #059669; }
  .btn-red { background: #ef4444; color: #fff; } .btn-red:hover { background: #dc2626; }
  .card { background: #161921; border: 1px solid #1f2330; border-radius: 12px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 8px; font-size: 15px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: #1a1d26; color: #e2e8f0; }
  .nav-item.active { background: #1e2133; color: #e2e8f0; }
  .tab { padding: 7px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; border: none; background: transparent; color: #64748b; cursor: pointer; transition: all 0.15s; }
  .tab.active { background: #1e2133; color: #e2e8f0; }
  .score-bar-bg { background: #1f2330; border-radius: 99px; height: 7px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
  .wa-bubble-out { background: #1e3a2f; border-radius: 12px 2px 12px 12px; padding: 12px 16px; max-width: 85%; margin-left: auto; }
  .wa-bubble-in { background: #1e2133; border-radius: 2px 12px 12px 12px; padding: 12px 16px; max-width: 85%; }
  .fade-in { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal { background: #161921; border: 1px solid #2d3247; border-radius: 16px; padding: 28px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
  .stat-card { background: #161921; border: 1px solid #1f2330; border-radius: 12px; padding: 20px 22px; }
  tr:hover td { background: #1a1d26; }
  .sort-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 13px; margin-left: 4px; }
`;

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;
  return currentUser.role === "admin"
    ? <AdminApp user={currentUser} contacts={contacts} setContacts={setContacts} onLogout={() => setCurrentUser(null)} />
    : <AgentApp user={currentUser} contacts={contacts} setContacts={setContacts} onLogout={() => setCurrentUser(null)} />;
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin]; next[i] = val; setPin(next); setError("");
    if (val && i < 3) document.getElementById(`pin-${i+1}`)?.focus();
    const full = next.join("");
    if (full.length === 4) {
      const user = USERS.find(u => u.pin === full);
      if (user) { setTimeout(() => onLogin(user), 150); }
      else { setShake(true); setError("Incorrect PIN — try again."); setPin(["","","",""]); setTimeout(() => { setShake(false); document.getElementById("pin-0")?.focus(); }, 600); }
    }
  };
  const handleKeyDown = (i, e) => { if (e.key === "Backspace" && !pin[i] && i > 0) document.getElementById(`pin-${i-1}`)?.focus(); };

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#0d0f14", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0" }}>
      <style>{BASE_STYLES}</style>
      <div className="fade-in" style={{ width: 380, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>C</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>ClearCRM</div>
        </div>
        <div className="card" style={{ padding: 36, marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Enter your PIN</div>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>Your admin will give you your 4-digit PIN</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20, animation: shake ? "shake 0.5s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <input key={i} id={`pin-${i}`} type="password" inputMode="numeric" maxLength={1} value={pin[i]}
                onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} autoFocus={i === 0}
                style={{ width: 56, height: 64, textAlign: "center", fontSize: 28, fontFamily: "DM Mono,monospace", borderRadius: 10, border: `2px solid ${error ? "#ef4444" : "#2d3247"}`, background: "#111318", color: "#e2e8f0", padding: 0 }} />
            ))}
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 8 }}>{error}</div>}
          <div style={{ fontSize: 13, color: "#475569" }}>Each team member has a unique PIN</div>
        </div>
        {/* Demo hint card */}
        <div style={{ background: "#161921", border: "1px solid #1f2330", borderRadius: 12, padding: 16, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 10, letterSpacing: 1 }}>DEMO PINS</div>
          {USERS.map(u => (
            <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1d26" }}>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{u.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "DM Mono,monospace", fontSize: 14, color: "#6366f1", fontWeight: 600 }}>{u.pin}</span>
                <span className="pill" style={{ background: u.role === "admin" ? "#6366f122" : "#10b98122", color: u.role === "admin" ? "#818cf8" : "#10b981", fontSize: 11 }}>{u.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SHARED HOOKS ──────────────────────────────────────────────────────────────
function useNotify() {
  const [notification, setNotification] = useState(null);
  const notify = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };
  const NotificationEl = notification ? (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: notification.type === "success" ? "#10b981" : "#ef4444", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{notification.msg}</div>
  ) : null;
  return { notify, NotificationEl };
}

// ─── SHARED CONTACT DETAIL ─────────────────────────────────────────────────────
function ContactDetail({ c, contacts, updateContact, sendWhatsApp, onBack, isAdmin, waMessage, setWaMessage, showWAModal, setShowWAModal }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const { notify, NotificationEl } = useNotify();

  const handleCallStatusChange = (newStatus) => {
    const updates = { callStatus: newStatus };
    if (newStatus === "booked") { sendWhatsApp(c, fillTemplate(WA_TEMPLATES.booking_confirmation, c)); updates.leadStatus = "Call Booked"; }
    else if (newStatus === "no-show") { sendWhatsApp(c, fillTemplate(WA_TEMPLATES.no_show, c)); updates.leadStatus = "No Show"; }
    else if (newStatus === "completed") updates.leadStatus = "Completed";
    updateContact(c.id, updates);
  };

  const getAI = async (type) => {
    setAiLoading(true); setAiSuggestion("");
    try {
      const prompts = {
        score: `Lead scoring for investment firm. Score 0-100 with 2-3 sentence explanation. Name:${c.name}, Company:${c.company}, Budget:${c.budget}, Timeline:${c.timeline}, DM:${c.isDecisionMaker}, Interest:${c.interestLevel}/5, Notes:${c.notes}. Plain text only.`,
        action: `Sales assistant. Best next action in 1-2 sentences. Name:${c.name}, Status:${c.leadStatus}, Score:${c.score}, Notes:${c.notes}`,
        summary: `Summarize client notes in 2 sentences: "${c.notes}"`,
        whatsapp: `Draft WhatsApp under 100 words for ${c.name.split(" ")[0]} at ${c.company}, budget ${c.budget}. Context: ${c.notes}. Goal: nurture and suggest call. Plain text only.`,
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompts[type] }] }) });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("");
      setAiSuggestion(text);
      if (type === "whatsapp") setWaMessage(text);
    } catch { setAiSuggestion("Could not connect. Check your internet."); }
    setAiLoading(false);
  };

  // Tabs: agents get overview/booking/whatsapp; admins also get scoring + AI
  const tabs = isAdmin
    ? [["overview","Overview"],["scoring","Score"],["booking","Booking"],["whatsapp","WhatsApp"],["ai","✨ AI"]]
    : [["overview","Overview"],["booking","Booking"],["whatsapp","WhatsApp"]];

  return (
    <div style={{ padding: 28 }} className="fade-in">
      {NotificationEl}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
          <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>{c.name}</h1><div style={{ fontSize: 14, color: "#64748b" }}>{c.company} · {c.email} · {c.phone}</div></div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <span className="pill" style={{ background: categoryColor(c.category)+"22", color: categoryColor(c.category), fontSize: 13, padding: "4px 12px" }}>Cat {c.category}</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(c.score), fontFamily: "DM Mono,monospace" }}>{c.score}</span>
            <button className="btn btn-primary" onClick={() => { setShowWAModal(c); setWaMessage(""); }}>💬 Send WhatsApp</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#111318", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(([t,label]) => <button key={t} className={`tab ${activeTab===t?"active":""}`} onClick={() => setActiveTab(t)}>{label}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>CONTACT INFO</div>
            {[["Full Name",c.name],["Email",c.email],["Phone",c.phone],["Company",c.company],["Source",c.source]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}><span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#e2e8f0", fontWeight: 500 }}>{v||"—"}</span></div>
            ))}
            {isAdmin && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>ASSIGN TO AGENT</div>
                <select value={c.assignedTo} onChange={e => updateContact(c.id, { assignedTo: e.target.value })} style={{ width: "100%" }}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
              </div>
            )}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>LEAD DETAILS</div>
            {[["Budget",c.budget],["Timeline",c.timeline],["Decision Maker",c.isDecisionMaker?"✅ Yes":"❌ No"],["Interest","⭐".repeat(c.interestLevel)]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}><span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#e2e8f0", fontWeight: 500 }}>{v||"—"}</span></div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>UPDATE STATUS</div>
              <select value={c.leadStatus} onChange={e => updateContact(c.id, { leadStatus: e.target.value })} style={{ width: "100%" }}>{WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
          </div>
          <div className="card" style={{ padding: 20, gridColumn: "span 2" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>NOTES</div>
            <textarea value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} style={{ width: "100%", minHeight: 100, resize: "vertical", background: "#111318" }} placeholder="Add notes…" />
          </div>
        </div>
      )}

      {/* SCORING — admin only */}
      {activeTab === "scoring" && isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 64, fontWeight: 800, color: scoreColor(c.score), fontFamily: "DM Mono,monospace", lineHeight: 1 }}>{c.score}</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Lead Score / 100</div>
              <span className="pill" style={{ background: categoryColor(c.category)+"22", color: categoryColor(c.category), marginTop: 8, display: "inline-flex" }}>Category {c.category} — {c.category==="A"?"High Priority":c.category==="B"?"Warm":c.category==="C"?"Nurture":"Low Priority"}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 12 }}>SCORE BREAKDOWN</div>
            {Object.entries(c.scoreBreakdown).map(([k,v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}><span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g," $1")}</span><span style={{ color: v<0?"#ef4444":"#e2e8f0", fontWeight: 600 }}>{v>0?"+":""}{v}</span></div>
                <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${Math.max(0,(v/25)*100)}%`, background: v<0?"#ef4444":"#6366f1" }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>EDIT SCORING FACTORS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 14, color: "#94a3b8" }}>Interest Level (1–5)</label>
                <input type="range" min={1} max={5} value={c.interestLevel} onChange={e => updateContact(c.id, { interestLevel: +e.target.value })} style={{ width: "100%", marginTop: 6, background: "transparent" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}><span>Cold</span><span style={{ color: "#f59e0b" }}>{"⭐".repeat(c.interestLevel)}</span><span>Hot</span></div>
              </div>
              <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Budget</label><select value={c.budget} onChange={e => updateContact(c.id, { budget: e.target.value })} style={{ width: "100%" }}>{BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}</select></div>
              <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Timeline</label><select value={c.timeline} onChange={e => updateContact(c.id, { timeline: e.target.value })} style={{ width: "100%" }}>{TIMELINE_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 15 }}><input type="checkbox" checked={c.isDecisionMaker} onChange={e => updateContact(c.id, { isDecisionMaker: e.target.checked })} style={{ width: 16, height: 16 }} /><span style={{ color: "#94a3b8" }}>Is Decision Maker</span></label>
              <button className="btn btn-primary" onClick={() => {
                const bs={"Under 10k":5,"10k-50k":10,"50k-100k":15,"100k-500k":25,"500k+":25}[c.budget]||10;
                const ts={"1 month":25,"1-3 months":20,"3-6 months":12,"6+ months":4,"Unknown":2}[c.timeline]||5;
                const dm=c.isDecisionMaker?15:5; const eng=c.interestLevel*4; const resp=c.whatsappHistory.length>0?15:8;
                const ns=Math.min(100,bs+ts+dm+eng+resp); const nc=ns>=75?"A":ns>=55?"B":ns>=35?"C":"D";
                updateContact(c.id,{score:ns,category:nc,scoreBreakdown:{budget:bs,timeline:ts,responsiveness:resp,decisionMaker:dm,engagement:eng}});
                notify("Score recalculated!");
              }}>Recalculate Score</button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING */}
      {activeTab === "booking" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>CALL DETAILS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Call Date</label><input type="date" value={c.callDate||""} onChange={e => updateContact(c.id,{callDate:e.target.value})} style={{ width: "100%" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Time</label><input type="time" value={c.callTime||""} onChange={e => updateContact(c.id,{callTime:e.target.value})} style={{ width: "100%" }} /></div>
                <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Timezone</label><input value={c.timezone||""} onChange={e => updateContact(c.id,{timezone:e.target.value})} placeholder="EST" style={{ width: "100%" }} /></div>
              </div>
              <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Meeting Link</label><input value={c.meetingLink||""} onChange={e => updateContact(c.id,{meetingLink:e.target.value})} placeholder="https://cal.com/…" style={{ width: "100%" }} /></div>
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>CALL STATUS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["booked","✅ Booked","#10b981"],["rescheduled","🔄 Rescheduled","#f59e0b"],["canceled","❌ Canceled","#ef4444"],["completed","🎉 Completed","#6366f1"],["no-show","⚠️ No Show","#f97316"]].map(([val,label,color]) => (
                <button key={val} onClick={() => handleCallStatusChange(val)} style={{ border:`2px solid ${c.callStatus===val?color:"#2d3247"}`, background:c.callStatus===val?color+"22":"transparent", color:c.callStatus===val?color:"#64748b", borderRadius:8, padding:"11px 14px", textAlign:"left", fontSize:15, fontWeight:500, transition:"all 0.15s" }}>{label}{c.callStatus===val&&" ← current"}</button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Call Notes</label><textarea value={c.callNotes||""} onChange={e => updateContact(c.id,{callNotes:e.target.value})} style={{ width: "100%", minHeight: 80, resize: "none", background: "#111318" }} /></div>
          </div>
        </div>
      )}

      {/* WHATSAPP */}
      {activeTab === "whatsapp" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1f2330", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, background: "#25d366", borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: "#64748b" }}>{c.phone}</div></div>
            </div>
            <div style={{ padding: 16, minHeight: 300, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#0d1117" }}>
              {c.whatsappHistory.length===0 ? <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 60 }}>No messages yet.</div> : c.whatsappHistory.map(w => (
                <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: w.dir==="out"?"flex-end":"flex-start" }}>
                  <div className={w.dir==="out"?"wa-bubble-out":"wa-bubble-in"} style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{w.msg}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{w.time} · <span style={{ color: w.status==="read"?"#10b981":"#64748b" }}>{w.status}</span></div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #1f2330" }}>
              <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="Type a message…" style={{ width: "100%", minHeight: 70, resize: "none", marginBottom: 10, background: "#111318" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setWaMessage("")}>Clear</button>
                <button className="btn btn-green" style={{ fontSize: 12 }} onClick={() => { if (waMessage.trim()) { sendWhatsApp(c, waMessage); setWaMessage(""); } }}>Send ✓</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>TEMPLATES</div>
            {Object.entries(WA_TEMPLATES).map(([key,tpl]) => (
              <button key={key} onClick={() => setWaMessage(fillTemplate(tpl,c))} style={{ display: "block", width: "100%", textAlign: "left", background: "#111318", border: "1px solid #2d3247", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#94a3b8", marginBottom: 8, cursor: "pointer" }}>
                📋 {key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI — admin only */}
      {activeTab === "ai" && isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>✨ AI ASSISTANT</div>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>Get AI suggestions for scoring, next actions, and message drafts.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["score","🎯 Suggest Lead Score","Get an AI-suggested score"],["action","⚡ Best Next Action","What to do next"],["summary","📝 Summarise Notes","Clean summary of notes"],["whatsapp","💬 Draft WhatsApp","Draft a personalised message"]].map(([type,label,desc]) => (
                <button key={type} onClick={() => getAI(type)} style={{ background: "#111318", border: "1px solid #2d3247", borderRadius: 10, padding: "13px 16px", textAlign: "left", cursor: "pointer" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{label}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>SUGGESTION</div>
            {aiLoading
              ? <div style={{ textAlign: "center", padding: 40, color: "#6366f1" }}><div style={{ fontSize: 32 }}>✨</div><div style={{ fontSize: 15, marginTop: 12 }}>Thinking…</div></div>
              : aiSuggestion
                ? <div>
                    <div style={{ background: "#111318", border: "1px solid #2d3247", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap", marginBottom: 14 }}>{aiSuggestion}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard.writeText(aiSuggestion); notify("Copied!"); }}>Copy</button>
                      <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setWaMessage(aiSuggestion); setActiveTab("whatsapp"); }}>Use as WA</button>
                      <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => updateContact(c.id,{notes:(c.notes?c.notes+"\n\n":"")+"AI: "+aiSuggestion})}>Save to Notes</button>
                    </div>
                  </div>
                : <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 40 }}>Click a button on the left.</div>
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WA MODAL ─────────────────────────────────────────────────────────────────
function WAModal({ contact, waMessage, setWaMessage, onSend, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div><div style={{ fontSize: 17, fontWeight: 700 }}>Send WhatsApp</div><div style={{ fontSize: 14, color: "#64748b" }}>to {contact.name} · {contact.phone}</div></div>
          <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>Quick Templates</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(WA_TEMPLATES).map(([key]) => (
              <button key={key} className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => setWaMessage(fillTemplate(WA_TEMPLATES[key], contact))}>{key.replace(/_/g," ")}</button>
            ))}
          </div>
        </div>
        <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} style={{ width: "100%", minHeight: 120, resize: "vertical", marginBottom: 14, background: "#111318" }} placeholder="Type your message…" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={() => { if (waMessage.trim()) { onSend(); onClose(); } }}>Send Message ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN APP ─────────────────────────────────────────────────────────────────
function AdminApp({ user, contacts, setContacts, onLogout }) {
  const [view, setView] = useState("dashboard");
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showWAModal, setShowWAModal] = useState(null);
  const [waMessage, setWaMessage] = useState("");
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const { notify, NotificationEl } = useNotify();

  const updateContact = (id, updates) => setContacts(prev => prev.map(c => c.id===id ? {...c,...updates} : c));
  const sendWhatsApp = (contact, message) => {
    const msg = { id: Date.now(), dir: "out", msg: message, time: new Date().toISOString().replace("T"," ").slice(0,16), status: "sent" };
    updateContact(contact.id, { whatsappHistory: [...contact.whatsappHistory, msg] });
    notify(`WhatsApp sent to ${contact.name}`);
  };

  const filtered = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q))
      && (filterStatus==="All" || c.leadStatus===filterStatus)
      && (filterCategory==="All" || c.category===filterCategory)
      && (filterAssigned==="All" || c.assignedTo===filterAssigned);
  }).sort((a,b) => {
    let av=a[sortField], bv=b[sortField];
    if (typeof av==="string") { av=av.toLowerCase(); bv=bv.toLowerCase(); }
    return sortDir==="asc" ? (av>bv?1:-1) : (av<bv?1:-1);
  });

  const today = new Date().toISOString().split("T")[0];
  const todaysCalls = contacts.filter(c => c.callDate===today && c.callStatus==="booked");
  const topLeads = contacts.filter(c => c.category==="A" && c.leadStatus!=="Completed").slice(0,5);
  const noShows = contacts.filter(c => c.callStatus==="no-show");
  const recentWA = contacts.flatMap(c => c.whatsappHistory.map(w => ({...w, contactName:c.name, contactId:c.id}))).sort((a,b)=>b.time.localeCompare(a.time)).slice(0,5);

  const goToContact = (c) => { setSelectedContact(c); setView("contacts"); };

  if (view==="contacts" && selectedContact) {
    const c = contacts.find(x=>x.id===selectedContact.id) || selectedContact;
    return (
      <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#0d0f14", minHeight:"100vh", color:"#e2e8f0", fontSize:15 }}>
        <style>{BASE_STYLES}</style>
        <ContactDetail c={c} contacts={contacts} updateContact={updateContact} sendWhatsApp={sendWhatsApp}
          onBack={() => setSelectedContact(null)} isAdmin={true}
          waMessage={waMessage} setWaMessage={setWaMessage} showWAModal={showWAModal} setShowWAModal={setShowWAModal} />
        {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={() => sendWhatsApp(showWAModal, waMessage)} onClose={() => setShowWAModal(null)} />}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#0d0f14", minHeight:"100vh", color:"#e2e8f0", display:"flex", fontSize:15 }}>
      <style>{BASE_STYLES}</style>
      {NotificationEl}

      {/* SIDEBAR */}
      <div style={{ width:220, background:"#111318", borderRight:"1px solid #1f2330", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
        <div style={{ padding:"20px 16px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>C</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0" }}>ClearCRM</div>
              <div style={{ fontSize:11, color:"#6366f1", fontWeight:700, letterSpacing:0.5 }}>SUPER ADMIN</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {[["dashboard","📊","Dashboard"],["contacts","👥","All Contacts"],["pipeline","🔄","Pipeline"],["whatsapp","💬","WhatsApp"],["team","👤","Team & Agents"],["settings","⚙️","Settings"]].map(([v,icon,label]) => (
              <button key={v} className={`nav-item ${view===v?"active":""}`} onClick={() => setView(v)}><span style={{ fontSize:15 }}>{icon}</span>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:"auto", padding:16, borderTop:"1px solid #1f2330" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>Quick Stats</div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[["A","#10b981"],["B","#3b82f6"],["C","#f59e0b"]].map(([cat,color]) => (
              <div key={cat} style={{ flex:1, background:"#161921", borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700, color }}>{contacts.filter(c=>c.category===cat).length}</div>
                <div style={{ fontSize:12, color:"#64748b" }}>Cat {cat}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ width:"100%", fontSize:13 }} onClick={onLogout}>🚪 Log Out ({user.name})</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, overflow:"auto" }}>

        {/* DASHBOARD */}
        {view==="dashboard" && (
          <div style={{ padding:28 }} className="fade-in">
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:22, fontWeight:700 }}>Good morning, {user.name} 👋</h1>
              <p style={{ color:"#64748b", fontSize:14, marginTop:4 }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[{l:"Total Contacts",v:contacts.length,i:"👥",c:"#6366f1"},{l:"Today's Calls",v:todaysCalls.length,i:"📞",c:"#10b981"},{l:"Hot Leads (A)",v:contacts.filter(c=>c.category==="A").length,i:"🔥",c:"#f59e0b"},{l:"No Shows",v:noShows.length,i:"⚠️",c:"#f97316"}].map(s => (
                <div key={s.l} className="stat-card"><div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}><div><div style={{ fontSize:32, fontWeight:700, color:s.c }}>{s.v}</div><div style={{ fontSize:14, color:"#64748b", marginTop:2 }}>{s.l}</div></div><span style={{ fontSize:26 }}>{s.i}</span></div></div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#94a3b8" }}>📞 TODAY'S CALLS</div>
                {todaysCalls.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>No calls today.</div> : todaysCalls.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #1f2330", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <div style={{ width:40, height:40, background:"#1e2133", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.callTime} {c.timezone} · {c.company}</div></div>
                    <span className="pill" style={{ background:"#1e3a2f", color:"#10b981" }}>Booked</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#94a3b8" }}>🔥 TOP PRIORITY LEADS</div>
                {topLeads.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #1f2330", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <div style={{ width:36, height:36, background:"linear-gradient(135deg,#1e2133,#2d3247)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#6366f1" }}>{c.score}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.company} · {c.budget}</div></div>
                    <span className="pill" style={{ background:categoryColor(c.category)+"22", color:categoryColor(c.category) }}>Cat {c.category}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#94a3b8" }}>⚠️ NO-SHOW FOLLOW-UPS</div>
                {noShows.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>All clear!</div> : noShows.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #1f2330" }}>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.callDate} · {c.assignedTo}</div></div>
                    <button className="btn btn-ghost" style={{ fontSize:13, padding:"6px 12px" }} onClick={() => { setShowWAModal(c); setWaMessage(fillTemplate(WA_TEMPLATES.no_show,c)); }}>Send WA</button>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#94a3b8" }}>💬 RECENT WHATSAPP</div>
                {recentWA.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>No messages yet.</div> : recentWA.map(w => (
                  <div key={w.id+w.contactId} style={{ padding:"8px 0", borderBottom:"1px solid #1f2330" }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:14, fontWeight:600, color:"#94a3b8" }}>{w.contactName}</span><span className="pill" style={{ background:w.status==="read"?"#1e3a2f":"#1e2133", color:w.status==="read"?"#10b981":"#64748b" }}>{w.status}</span></div>
                    <div style={{ fontSize:13, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{w.msg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS */}
        {view==="contacts" && !selectedContact && (
          <div style={{ padding:28 }} className="fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div><h1 style={{ fontSize:22, fontWeight:700 }}>All Contacts</h1><p style={{ color:"#64748b", fontSize:14, marginTop:2 }}>{filtered.length} of {contacts.length} records</p></div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-ghost" onClick={() => setShowAddContact(true)}>⬆️ Import CSV</button>
                <button className="btn btn-primary" onClick={() => setShowAddContact(true)}>+ Add Contact</button>
              </div>
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
              <input placeholder="Search name, email, company…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ flex:1, minWidth:200, maxWidth:320 }} />
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="All">All Statuses</option>{WORKFLOW_STAGES.map(s=><option key={s}>{s}</option>)}</select>
              <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}><option value="All">All Categories</option>{["A","B","C","D"].map(c=><option key={c}>Cat {c}</option>)}</select>
              <select value={filterAssigned} onChange={e=>setFilterAssigned(e.target.value)}><option value="All">All Agents</option>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
            </div>
            <div className="card" style={{ overflow:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:15 }}>
                <thead><tr style={{ borderBottom:"1px solid #1f2330" }}>
                  {[["name","Name"],["company","Company"],["score","Score"],["category","Cat"],["leadStatus","Status"],["assignedTo","Agent"],["","Actions"]].map(([f,l]) => (
                    <th key={l} style={{ padding:"12px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#64748b", whiteSpace:"nowrap" }}>
                      {l}{f&&<button className="sort-btn" onClick={()=>{setSortField(f);setSortDir(d=>d==="asc"?"desc":"asc");}}>{sortField===f?(sortDir==="asc"?"▲":"▼"):"⇅"}</button>}
                    </th>
                  ))}
                </tr></thead>
                <tbody>{filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom:"1px solid #1a1d24", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <td style={{ padding:"12px 16px" }}><div style={{ fontWeight:600, color:"#f1f5f9" }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.email}</div></td>
                    <td style={{ padding:"12px 16px", color:"#94a3b8" }}>{c.company}</td>
                    <td style={{ padding:"12px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div className="score-bar-bg" style={{ width:52 }}><div className="score-bar-fill" style={{ width:`${c.score}%`, background:scoreColor(c.score) }} /></div><span style={{ color:scoreColor(c.score), fontWeight:700, fontFamily:"DM Mono,monospace", fontSize:14 }}>{c.score}</span></div></td>
                    <td style={{ padding:"12px 16px" }}><span className="pill" style={{ background:categoryColor(c.category)+"22", color:categoryColor(c.category) }}>{c.category}</span></td>
                    <td style={{ padding:"12px 16px" }}><span className="pill" style={{ background:statusColor(c.leadStatus)+"22", color:statusColor(c.leadStatus) }}>{c.leadStatus}</span></td>
                    <td style={{ padding:"12px 16px" }}>
                      <select value={c.assignedTo} onChange={e=>{e.stopPropagation();updateContact(c.id,{assignedTo:e.target.value});}} onClick={e=>e.stopPropagation()} style={{ fontSize:13, padding:"4px 8px" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
                    </td>
                    <td style={{ padding:"12px 16px" }} onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-ghost" style={{ padding:"6px 12px", fontSize:13 }} onClick={e=>{e.stopPropagation();setShowWAModal(c);setWaMessage("");}}>💬 WA</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {filtered.length===0 && <div style={{ padding:40, textAlign:"center", color:"#64748b" }}>No contacts match your filters.</div>}
            </div>
          </div>
        )}

        {/* PIPELINE */}
        {view==="pipeline" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Pipeline</h1>
            <div style={{ display:"flex", gap:14, overflowX:"auto", paddingBottom:16 }}>
              {WORKFLOW_STAGES.map(stage => {
                const sc = contacts.filter(c=>c.leadStatus===stage);
                return (
                  <div key={stage} style={{ minWidth:220, background:"#111318", border:"1px solid #1f2330", borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#64748b" }}>{stage.toUpperCase()}</div>
                      <span className="pill" style={{ background:statusColor(stage)+"22", color:statusColor(stage) }}>{sc.length}</span>
                    </div>
                    {sc.map(c => (
                      <div key={c.id} style={{ background:"#161921", border:"1px solid #1f2330", borderRadius:8, padding:12, cursor:"pointer", marginBottom:10 }} onClick={() => goToContact(c)}>
                        <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{c.name}</div>
                        <div style={{ fontSize:13, color:"#64748b", marginBottom:6 }}>{c.company}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span className="pill" style={{ background:categoryColor(c.category)+"22", color:categoryColor(c.category) }}>Cat {c.category}</span>
                          <span style={{ fontSize:12, color:"#64748b" }}>→ {c.assignedTo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WHATSAPP */}
        {view==="whatsapp" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>WhatsApp Activity</h1>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:14 }}>ALL CONVERSATIONS</div>
                {contacts.filter(c=>c.whatsappHistory.length>0).map(c => {
                  const last = c.whatsappHistory[c.whatsappHistory.length-1];
                  return (
                    <div key={c.id} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1f2330", cursor:"pointer" }} onClick={() => goToContact(c)}>
                      <div style={{ width:44, height:44, background:"#25d366", borderRadius:50, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💬</div>
                      <div style={{ flex:1, overflow:"hidden" }}>
                        <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:15, fontWeight:600 }}>{c.name}</span><span style={{ fontSize:12, color:"#64748b" }}>{last.time.split(" ")[0]}</span></div>
                        <div style={{ fontSize:13, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{last.msg}</div>
                        <span style={{ fontSize:11, color:"#64748b" }}>→ {c.assignedTo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:14 }}>MESSAGE TEMPLATES</div>
                {Object.entries(WA_TEMPLATES).map(([key,tpl]) => (
                  <div key={key} style={{ background:"#111318", border:"1px solid #1f2330", borderRadius:10, padding:14, marginBottom:12 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#6366f1", marginBottom:6 }}>{key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</div>
                    <div style={{ fontSize:14, color:"#94a3b8", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{tpl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEAM & AGENTS */}
        {view==="team" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Team & Agents</h1>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>Each agent only sees leads assigned to them when they log in.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20, marginBottom:24 }}>
              {USERS.map(u => {
                const leads = contacts.filter(c=>c.assignedTo===u.name);
                return (
                  <div key={u.name} className="card" style={{ padding:24 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                      <div style={{ width:48, height:48, background:u.role==="admin"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"linear-gradient(135deg,#1e2133,#2d3247)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:"#fff" }}>{u.name[0]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:17, fontWeight:700 }}>{u.name}</div>
                        <span className="pill" style={{ background:u.role==="admin"?"#6366f122":"#10b98122", color:u.role==="admin"?"#818cf8":"#10b981" }}>{u.role==="admin"?"Super Admin":"Agent"}</span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>PIN</div>
                        <div style={{ fontFamily:"DM Mono,monospace", fontSize:22, fontWeight:700, color:"#6366f1" }}>{u.pin}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                      {["A","B","C","D"].map(cat => (
                        <div key={cat} style={{ flex:1, background:"#111318", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:categoryColor(cat) }}>{leads.filter(c=>c.category===cat).length}</div>
                          <div style={{ fontSize:11, color:"#64748b" }}>Cat {cat}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:13, color:"#64748b" }}>{leads.length} leads · {leads.filter(c=>c.callStatus==="booked").length} calls booked · {leads.filter(c=>c.callStatus==="completed").length} completed</div>
                  </div>
                );
              })}
            </div>
            <div className="card" style={{ padding:24 }}>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Reassign Leads in Bulk</div>
              <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                <div style={{ fontSize:14, color:"#64748b" }}>Move all leads from</div>
                <select id="from-agent" style={{ width:140 }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
                <div style={{ fontSize:14, color:"#64748b" }}>to</div>
                <select id="to-agent" style={{ width:140 }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
                <button className="btn btn-primary" onClick={() => {
                  const from = document.getElementById("from-agent").value;
                  const to = document.getElementById("to-agent").value;
                  if (from===to) return;
                  setContacts(prev=>prev.map(c=>c.assignedTo===from?{...c,assignedTo:to}:c));
                  notify(`Moved all leads from ${from} to ${to}`);
                }}>Reassign</button>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {view==="settings" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Settings</h1>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>WhatsApp Business API</div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:6 }}>Phone Number ID</label><input placeholder="Enter WA Business phone ID" style={{ width:"100%" }} /></div>
                  <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:6 }}>Access Token</label><input type="password" placeholder="••••••••••••" style={{ width:"100%" }} /></div>
                  <button className="btn btn-primary" onClick={()=>notify("Settings saved!")}>Save API Settings</button>
                </div>
              </div>
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Scoring Rules</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[["Budget 500k+","+25"],["Decision Maker","+15"],["Timeline < 1mo","+25"],["High Interest (5★)","+20"],["WA Engagement","+15"],["Low Budget","+5"]].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", background:"#111318", border:"1px solid #1f2330", borderRadius:8, fontSize:14 }}>
                      <span style={{ color:"#94a3b8" }}>{k}</span><span style={{ color:"#6366f1", fontWeight:700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={() => sendWhatsApp(showWAModal, waMessage)} onClose={() => setShowWAModal(null)} />}
      {showAddContact && (
        <div className="overlay" onClick={()=>setShowAddContact(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700 }}>Add New Contact</div>
              <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={()=>setShowAddContact(false)}>✕</button>
            </div>
            <AddContactForm onSave={(data) => {
              setContacts(prev=>[...prev,{...data,id:Date.now(),score:40,category:"C",scoreBreakdown:{budget:10,timeline:10,responsiveness:8,decisionMaker:data.isDecisionMaker?15:5,engagement:7},callStatus:null,callDate:null,callTime:null,timezone:"",meetingLink:"",callNotes:"",whatsappHistory:[]}]);
              setShowAddContact(false); notify("Contact added!");
            }} onCancel={()=>setShowAddContact(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AGENT APP ─────────────────────────────────────────────────────────────────
function AgentApp({ user, contacts, setContacts, onLogout }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showWAModal, setShowWAModal] = useState(null);
  const [waMessage, setWaMessage] = useState("");
  const { notify, NotificationEl } = useNotify();

  const myLeads = contacts
    .filter(c => c.assignedTo === user.name)
    .filter(c => {
      const q = searchQuery.toLowerCase();
      return (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q))
        && (filterStatus==="All" || c.leadStatus===filterStatus);
    });

  const today = new Date().toISOString().split("T")[0];
  const todaysCalls = myLeads.filter(c => c.callDate===today && c.callStatus==="booked");
  const noShows = myLeads.filter(c => c.callStatus==="no-show");
  const hotLeads = myLeads.filter(c => c.category==="A");

  const updateContact = (id, updates) => setContacts(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));
  const sendWhatsApp = (contact, message) => {
    const msg = { id:Date.now(), dir:"out", msg:message, time:new Date().toISOString().replace("T"," ").slice(0,16), status:"sent" };
    updateContact(contact.id, { whatsappHistory:[...contact.whatsappHistory, msg] });
    notify(`WhatsApp sent to ${contact.name}`);
  };

  if (selectedContact) {
    const c = contacts.find(x=>x.id===selectedContact.id) || selectedContact;
    return (
      <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#0d0f14", minHeight:"100vh", color:"#e2e8f0", fontSize:15 }}>
        <style>{BASE_STYLES}</style>
        {NotificationEl}
        {/* Agent top bar */}
        <div style={{ background:"#111318", borderBottom:"1px solid #1f2330", padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:28, background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>{user.name[0]}</div>
          <span style={{ fontSize:14, fontWeight:600, color:"#10b981" }}>{user.name}</span>
          <span style={{ fontSize:13, color:"#475569" }}>Agent View</span>
        </div>
        <ContactDetail c={c} contacts={contacts} updateContact={updateContact} sendWhatsApp={sendWhatsApp}
          onBack={() => setSelectedContact(null)} isAdmin={false}
          waMessage={waMessage} setWaMessage={setWaMessage} showWAModal={showWAModal} setShowWAModal={setShowWAModal} />
        {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={()=>sendWhatsApp(showWAModal,waMessage)} onClose={()=>setShowWAModal(null)} />}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#0d0f14", minHeight:"100vh", color:"#e2e8f0", fontSize:15 }}>
      <style>{BASE_STYLES}</style>
      {NotificationEl}

      {/* Agent top bar */}
      <div style={{ background:"#111318", borderBottom:"1px solid #1f2330", padding:"14px 28px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:34, height:34, background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700 }}>{user.name[0]}</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700 }}>{user.name}</div>
          <div style={{ fontSize:12, color:"#10b981" }}>Agent · My Leads Only</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:24 }}>
          {[["My Leads",myLeads.length,"#6366f1"],["Today's Calls",todaysCalls.length,"#10b981"],["Hot (A)",hotLeads.length,"#f59e0b"],["No Shows",noShows.length,"#f97316"]].map(([l,v,c]) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>{l}</div>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={onLogout}>🚪 Log Out</button>
        </div>
      </div>

      <div style={{ padding:28 }}>
        {/* Alerts */}
        {todaysCalls.length > 0 && (
          <div style={{ background:"#1e3a2f", border:"1px solid #10b981", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>📞</span>
            <div><div style={{ fontSize:15, fontWeight:600, color:"#10b981" }}>You have {todaysCalls.length} call{todaysCalls.length>1?"s":""} today</div><div style={{ fontSize:13, color:"#64748b" }}>{todaysCalls.map(c=>`${c.name} at ${c.callTime} ${c.timezone}`).join(" · ")}</div></div>
          </div>
        )}
        {noShows.length > 0 && (
          <div style={{ background:"#2d1a0e", border:"1px solid #f97316", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>⚠️</span>
            <div><div style={{ fontSize:15, fontWeight:600, color:"#f97316" }}>{noShows.length} no-show{noShows.length>1?"s":""} need follow-up</div><div style={{ fontSize:13, color:"#64748b" }}>{noShows.map(c=>c.name).join(", ")}</div></div>
          </div>
        )}

        {/* Team leaderboard */}
        <div className="card" style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:14 }}>🏆 TEAM LEADERBOARD</div>
          <div style={{ display:"flex", gap:12 }}>
            {TEAM_MEMBERS.map((name, i) => {
              const leads = contacts.filter(c => c.assignedTo === name);
              const completed = leads.filter(c => c.leadStatus === "Completed").length;
              const hot = leads.filter(c => c.category === "A").length;
              const isMe = name === user.name;
              return (
                <div key={name} style={{ flex:1, background: isMe ? "#1e2133" : "#111318", border:`1px solid ${isMe?"#6366f1":"#1f2330"}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{["🥇","🥈","🥉","4️⃣"][i]}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: isMe ? "#818cf8" : "#e2e8f0" }}>{name}{isMe && " (you)"}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#10b981", margin:"6px 0" }}>{leads.length}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>leads</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>✅ {completed} closed · 🔥 {hot} hot</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          <input placeholder="Search your leads…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ flex:1, minWidth:200 }} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="All">All Statuses</option>{WORKFLOW_STAGES.map(s=><option key={s}>{s}</option>)}</select>
        </div>

        {/* Lead cards */}
        {myLeads.length === 0 && (
          <div style={{ textAlign:"center", padding:80, color:"#64748b" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>No leads assigned to you yet</div>
            <div style={{ fontSize:14 }}>Your admin will assign leads to you shortly.</div>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {myLeads.map(c => (
            <div key={c.id} className="card" style={{ padding:18, cursor:"pointer", transition:"border-color 0.15s" }}
              onClick={() => setSelectedContact(c)}
              onMouseOver={e=>e.currentTarget.style.borderColor="#3d4268"}
              onMouseOut={e=>e.currentTarget.style.borderColor="#1f2330"}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:46, height:46, background:"linear-gradient(135deg,#1e2133,#2d3247)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:scoreColor(c.score), fontFamily:"DM Mono" }}>{c.score}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:700 }}>{c.name}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>{c.company} · {c.phone}</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className="pill" style={{ background:categoryColor(c.category)+"22", color:categoryColor(c.category) }}>Cat {c.category}</span>
                  <span className="pill" style={{ background:statusColor(c.leadStatus)+"22", color:statusColor(c.leadStatus) }}>{c.leadStatus}</span>
                  <button className="btn btn-ghost" style={{ padding:"6px 12px", fontSize:13 }} onClick={e=>{e.stopPropagation();setShowWAModal(c);setWaMessage("");}}>💬</button>
                </div>
              </div>
              {c.callDate && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #1f2330", fontSize:13, color:"#64748b", display:"flex", gap:16 }}>
                  <span>📅 {c.callDate} at {c.callTime} {c.timezone}</span>
                  {c.callStatus && <span className="pill" style={{ background:"#1e3a2f", color:"#10b981" }}>{c.callStatus}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={()=>sendWhatsApp(showWAModal,waMessage)} onClose={()=>setShowWAModal(null)} />}
    </div>
  );
}

// ─── ADD CONTACT FORM ──────────────────────────────────────────────────────────
function AddContactForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:"", phone:"", email:"", company:"", source:"LinkedIn", notes:"", budget:"Unknown", timeline:"Unknown", isDecisionMaker:false, interestLevel:3, leadStatus:"New Lead", assignedTo:"Alex" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Full Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} style={{ width:"100%" }} placeholder="Jane Smith" /></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Company</label><input value={form.company} onChange={e=>set("company",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Source</label><select value={form.source} onChange={e=>set("source",e.target.value)} style={{ width:"100%" }}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Assign To</label><select value={form.assignedTo} onChange={e=>set("assignedTo",e.target.value)} style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Budget</label><select value={form.budget} onChange={e=>set("budget",e.target.value)} style={{ width:"100%" }}>{BUDGET_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Timeline</label><select value={form.timeline} onChange={e=>set("timeline",e.target.value)} style={{ width:"100%" }}>{TIMELINE_OPTIONS.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <label style={{ display:"flex", alignItems:"center", gap:10, fontSize:15, cursor:"pointer" }}><input type="checkbox" checked={form.isDecisionMaker} onChange={e=>set("isDecisionMaker",e.target.checked)} style={{ width:16, height:16 }} /><span style={{ color:"#94a3b8" }}>Decision Maker</span></label>
      <div><label style={{ fontSize:14, color:"#94a3b8", display:"block", marginBottom:4 }}>Notes</label><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{ width:"100%", minHeight:70, resize:"none", background:"#111318" }} /></div>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>{if(form.name.trim())onSave(form);}}>Save Contact</button>
      </div>
    </div>
  );
}
