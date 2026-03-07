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
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  input, select, textarea { font-family: inherit; color: #1e293b; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 15px; outline: none; transition: border-color 0.15s; }
  input:focus, select:focus, textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #6366f115; }
  button { cursor: pointer; font-family: inherit; }
  .pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 99px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
  .btn { border: none; border-radius: 8px; padding: 10px 18px; font-size: 15px; font-weight: 500; transition: all 0.15s; }
  .btn-primary { background: #6366f1; color: #fff; } .btn-primary:hover { background: #5558e8; }
  .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; } .btn-ghost:hover { background: #f8fafc; color: #1e293b; }
  .btn-green { background: #10b981; color: #fff; } .btn-green:hover { background: #059669; }
  .btn-red { background: #ef4444; color: #fff; } .btn-red:hover { background: #dc2626; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 8px; font-size: 15px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; }
  .nav-item:hover { background: #f1f5f9; color: #1e293b; }
  .nav-item.active { background: #ede9fe; color: #6366f1; }
  .tab { padding: 7px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; border: none; background: transparent; color: #64748b; cursor: pointer; transition: all 0.15s; }
  .tab.active { background: #fff; color: #6366f1; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .score-bar-bg { background: #e2e8f0; border-radius: 99px; height: 7px; overflow: hidden; }
  .score-bar-fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
  .wa-bubble-out { background: #dcfce7; border-radius: 12px 2px 12px 12px; padding: 12px 16px; max-width: 85%; margin-left: auto; }
  .wa-bubble-in { background: #f1f5f9; border-radius: 2px 12px 12px 12px; padding: 12px 16px; max-width: 85%; }
  .fade-in { animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  .overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
  .modal { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  tr:hover td { background: #f8fafc; }
  .sort-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; margin-left: 4px; }
`;

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  const [waConfig, setWaConfig] = useState({
    accessToken: "",
    agents: Object.fromEntries(TEAM_MEMBERS.map(m => [m, { phoneNumberId:"", number:"", displayName:m }]))
  });
  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;
  return currentUser.role === "admin"
    ? <AdminApp user={currentUser} contacts={contacts} setContacts={setContacts} onLogout={() => setCurrentUser(null)} waConfig={waConfig} setWaConfig={setWaConfig} />
    : <AgentApp user={currentUser} contacts={contacts} setContacts={setContacts} onLogout={() => setCurrentUser(null)} waConfig={waConfig} />;
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
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#1e293b" }}>
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
                style={{ width: 56, height: 64, textAlign: "center", fontSize: 28, fontFamily: "DM Mono,monospace", borderRadius: 10, border: `2px solid ${error ? "#ef4444" : "#e2e8f0"}`, background: "#f8fafc", color: "#1e293b", padding: 0 }} />
            ))}
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 8 }}>{error}</div>}
          <div style={{ fontSize: 13, color: "#475569" }}>Each team member has a unique PIN</div>
        </div>
        {/* Demo hint card */}
        <div style={{ background: "#fff", border: "1px solid #1f2330", borderRadius: 12, padding: 16, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 10, letterSpacing: 1 }}>DEMO PINS</div>
          {USERS.map(u => (
            <div key={u.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1d26" }}>
              <span style={{ fontSize: 14, color: "#64748b" }}>{u.name}</span>
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
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f8fafc", padding: 4, borderRadius: 10, width: "fit-content" }}>
        {tabs.map(([t,label]) => <button key={t} className={`tab ${activeTab===t?"active":""}`} onClick={() => setActiveTab(t)}>{label}</button>)}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>CONTACT INFO</div>
            {[["Full Name",c.name],["Email",c.email],["Phone",c.phone],["Company",c.company],["Source",c.source]].map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}><span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#1e293b", fontWeight: 500 }}>{v||"—"}</span></div>
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
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}><span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#1e293b", fontWeight: 500 }}>{v||"—"}</span></div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>UPDATE STATUS</div>
              <select value={c.leadStatus} onChange={e => updateContact(c.id, { leadStatus: e.target.value })} style={{ width: "100%" }}>{WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
          </div>
          <div className="card" style={{ padding: 20, gridColumn: "span 2" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>NOTES</div>
            <textarea value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} style={{ width: "100%", minHeight: 100, resize: "vertical", background: "#f8fafc" }} placeholder="Add notes…" />
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
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}><span style={{ color: "#64748b", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g," $1")}</span><span style={{ color: v<0?"#ef4444":"#1e293b", fontWeight: 600 }}>{v>0?"+":""}{v}</span></div>
                <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${Math.max(0,(v/25)*100)}%`, background: v<0?"#ef4444":"#6366f1" }} /></div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>EDIT SCORING FACTORS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 14, color: "#64748b" }}>Interest Level (1–5)</label>
                <input type="range" min={1} max={5} value={c.interestLevel} onChange={e => updateContact(c.id, { interestLevel: +e.target.value })} style={{ width: "100%", marginTop: 6, background: "transparent" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}><span>Cold</span><span style={{ color: "#f59e0b" }}>{"⭐".repeat(c.interestLevel)}</span><span>Hot</span></div>
              </div>
              <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Budget</label><select value={c.budget} onChange={e => updateContact(c.id, { budget: e.target.value })} style={{ width: "100%" }}>{BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}</select></div>
              <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Timeline</label><select value={c.timeline} onChange={e => updateContact(c.id, { timeline: e.target.value })} style={{ width: "100%" }}>{TIMELINE_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 15 }}><input type="checkbox" checked={c.isDecisionMaker} onChange={e => updateContact(c.id, { isDecisionMaker: e.target.checked })} style={{ width: 16, height: 16 }} /><span style={{ color: "#64748b" }}>Is Decision Maker</span></label>
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
              <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Call Date</label><input type="date" value={c.callDate||""} onChange={e => updateContact(c.id,{callDate:e.target.value})} style={{ width: "100%" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Time</label><input type="time" value={c.callTime||""} onChange={e => updateContact(c.id,{callTime:e.target.value})} style={{ width: "100%" }} /></div>
                <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Timezone</label><input value={c.timezone||""} onChange={e => updateContact(c.id,{timezone:e.target.value})} placeholder="EST" style={{ width: "100%" }} /></div>
              </div>
              <div><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Meeting Link</label><input value={c.meetingLink||""} onChange={e => updateContact(c.id,{meetingLink:e.target.value})} placeholder="https://cal.com/…" style={{ width: "100%" }} /></div>
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>CALL STATUS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[["booked","✅ Booked","#10b981"],["rescheduled","🔄 Rescheduled","#f59e0b"],["canceled","❌ Canceled","#ef4444"],["completed","🎉 Completed","#6366f1"],["no-show","⚠️ No Show","#f97316"]].map(([val,label,color]) => (
                <button key={val} onClick={() => handleCallStatusChange(val)} style={{ border:`2px solid ${c.callStatus===val?color:"#1e293b"}`, background:c.callStatus===val?color+"22":"transparent", color:c.callStatus===val?color:"#64748b", borderRadius:8, padding:"11px 14px", textAlign:"left", fontSize:15, fontWeight:500, transition:"all 0.15s" }}>{label}{c.callStatus===val&&" ← current"}</button>
              ))}
            </div>
            <div style={{ marginTop: 16 }}><label style={{ fontSize: 14, color: "#64748b", display: "block", marginBottom: 6 }}>Call Notes</label><textarea value={c.callNotes||""} onChange={e => updateContact(c.id,{callNotes:e.target.value})} style={{ width: "100%", minHeight: 80, resize: "none", background: "#f8fafc" }} /></div>
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
            <div style={{ padding: 16, minHeight: 300, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#f0fdf4" }}>
              {c.whatsappHistory.length===0 ? <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 60 }}>No messages yet.</div> : c.whatsappHistory.map(w => (
                <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: w.dir==="out"?"flex-end":"flex-start" }}>
                  <div className={w.dir==="out"?"wa-bubble-out":"wa-bubble-in"} style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{w.msg}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{w.time} · <span style={{ color: w.status==="read"?"#10b981":"#64748b" }}>{w.status}</span></div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid #1f2330" }}>
              <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="Type a message…" style={{ width: "100%", minHeight: 70, resize: "none", marginBottom: 10, background: "#f8fafc" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setWaMessage("")}>Clear</button>
                <button className="btn btn-green" style={{ fontSize: 12 }} onClick={() => { if (waMessage.trim()) { sendWhatsApp(c, waMessage); setWaMessage(""); } }}>Send ✓</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>TEMPLATES</div>
            {Object.entries(WA_TEMPLATES).map(([key,tpl]) => (
              <button key={key} onClick={() => setWaMessage(fillTemplate(tpl,c))} style={{ display: "block", width: "100%", textAlign: "left", background: "#f8fafc", border: "1px solid #2d3247", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#64748b", marginBottom: 8, cursor: "pointer" }}>
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
                <button key={type} onClick={() => getAI(type)} style={{ background: "#f8fafc", border: "1px solid #2d3247", borderRadius: 10, padding: "13px 16px", textAlign: "left", cursor: "pointer" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{label}</div>
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
                    <div style={{ background: "#f8fafc", border: "1px solid #2d3247", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.7, color: "#1e293b", whiteSpace: "pre-wrap", marginBottom: 14 }}>{aiSuggestion}</div>
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
        <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} style={{ width: "100%", minHeight: 120, resize: "vertical", marginBottom: 14, background: "#f8fafc" }} placeholder="Type your message…" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-green" onClick={() => { if (waMessage.trim()) { onSend(); onClose(); } }}>Send Message ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN APP ─────────────────────────────────────────────────────────────────
function AdminApp({ user, contacts, setContacts, onLogout, waConfig, setWaConfig }) {
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

  const sendWhatsApp = async (contact, message) => {
    const agentConf = waConfig.agents[contact.assignedTo] || {};
    const phoneNumberId = agentConf.phoneNumberId;
    const accessToken = waConfig.accessToken;
    const recipientPhone = contact.phone.replace(/\s+/g,"").replace(/^\+/,"");

    // Optimistically add message to history
    const msgId = Date.now();
    const msg = { id: msgId, dir:"out", msg:message, time:new Date().toISOString().replace("T"," ").slice(0,16), status:"sending" };
    updateContact(contact.id, { whatsappHistory: [...contact.whatsappHistory, msg] });

    if (!phoneNumberId || !accessToken) {
      // No credentials — save as sent locally, warn admin
      updateContact(contact.id, { whatsappHistory: [...contact.whatsappHistory, {...msg, status:"sent (demo)"}] });
      notify(`⚠️ Demo mode — configure WA API in Settings to send live messages`);
      return;
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: false, body: message }
        })
      });
      const data = await res.json();
      if (data.messages?.[0]?.id) {
        setContacts(prev => prev.map(c => c.id===contact.id ? {
          ...c,
          whatsappHistory: c.whatsappHistory.map(w => w.id===msgId ? {...w, status:"delivered", waId:data.messages[0].id} : w)
        } : c));
        notify(`✅ WhatsApp sent to ${contact.name} via ${contact.assignedTo}'s number`);
      } else {
        const errMsg = data.error?.message || "Unknown error";
        setContacts(prev => prev.map(c => c.id===contact.id ? {
          ...c,
          whatsappHistory: c.whatsappHistory.map(w => w.id===msgId ? {...w, status:"failed"} : w)
        } : c));
        notify(`❌ WA failed: ${errMsg}`);
      }
    } catch (err) {
      setContacts(prev => prev.map(c => c.id===contact.id ? {
        ...c,
        whatsappHistory: c.whatsappHistory.map(w => w.id===msgId ? {...w, status:"failed"} : w)
      } : c));
      notify(`❌ Network error sending WhatsApp`);
    }
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
      <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#1e293b", fontSize:15 }}>
        <style>{BASE_STYLES}</style>
        <ContactDetail c={c} contacts={contacts} updateContact={updateContact} sendWhatsApp={sendWhatsApp}
          onBack={() => setSelectedContact(null)} isAdmin={true}
          waMessage={waMessage} setWaMessage={setWaMessage} showWAModal={showWAModal} setShowWAModal={setShowWAModal} />
        {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={() => sendWhatsApp(showWAModal, waMessage)} onClose={() => setShowWAModal(null)} />}
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#1e293b", display:"flex", fontSize:15 }}>
      <style>{BASE_STYLES}</style>
      {NotificationEl}

      {/* SIDEBAR */}
      <div style={{ width:220, background:"#f8fafc", borderRight:"1px solid #1f2330", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
        <div style={{ padding:"20px 16px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>C</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>ClearCRM</div>
              <div style={{ fontSize:11, color:"#6366f1", fontWeight:700, letterSpacing:0.5 }}>SUPER ADMIN</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {[["dashboard","📊","Dashboard"],["contacts","👥","All Contacts"],["pipeline","🔄","Pipeline"],["whatsapp","💬","WhatsApp"],["team","👤","Team & Agents"],["settings","⚙️","Settings"]].map(([v,icon,label]) => (
              <button key={v} className={`nav-item ${view===v?"active":""}`} onClick={() => setView(v)}><span style={{ fontSize:15 }}>{icon}</span>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop:"auto", padding:16, borderTop:"1px solid #f1f5f9" }}>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:8 }}>Quick Stats</div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[["A","#10b981"],["B","#3b82f6"],["C","#f59e0b"]].map(([cat,color]) => (
              <div key={cat} style={{ flex:1, background:"#fff", borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
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
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#64748b" }}>📞 TODAY'S CALLS</div>
                {todaysCalls.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>No calls today.</div> : todaysCalls.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <div style={{ width:40, height:40, background:"#e0e7ff", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#6366f1", fontWeight:700 }}>{c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.callTime} {c.timezone} · {c.company}</div></div>
                    <span className="pill" style={{ background:"#dcfce7", color:"#10b981" }}>Booked</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#64748b" }}>🔥 TOP PRIORITY LEADS</div>
                {topLeads.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <div style={{ width:36, height:36, background:"linear-gradient(135deg,#ede9fe,#e0e7ff)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#6366f1" }}>{c.score}</div>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.company} · {c.budget}</div></div>
                    <span className="pill" style={{ background:categoryColor(c.category)+"22", color:categoryColor(c.category) }}>Cat {c.category}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#64748b" }}>⚠️ NO-SHOW FOLLOW-UPS</div>
                {noShows.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>All clear!</div> : noShows.map(c => (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ flex:1 }}><div style={{ fontSize:15, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.callDate} · {c.assignedTo}</div></div>
                    <button className="btn btn-ghost" style={{ fontSize:13, padding:"6px 12px" }} onClick={() => { setShowWAModal(c); setWaMessage(fillTemplate(WA_TEMPLATES.no_show,c)); }}>Send WA</button>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:20 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:14, color:"#64748b" }}>💬 RECENT WHATSAPP</div>
                {recentWA.length===0 ? <div style={{ color:"#64748b", fontSize:14 }}>No messages yet.</div> : recentWA.map(w => (
                  <div key={w.id+w.contactId} style={{ padding:"8px 0", borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:14, fontWeight:600, color:"#64748b" }}>{w.contactName}</span><span className="pill" style={{ background:w.status==="read"?"#dcfce7":w.status==="delivered"?"#dbeafe":"#f1f5f9", color:w.status==="read"?"#16a34a":w.status==="delivered"?"#2563eb":"#94a3b8" }}>{w.status}</span></div>
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
                <thead><tr style={{ borderBottom:"1px solid #f1f5f9" }}>
                  {[["name","Name"],["company","Company"],["score","Score"],["category","Cat"],["leadStatus","Status"],["assignedTo","Agent"],["","Actions"]].map(([f,l]) => (
                    <th key={l} style={{ padding:"12px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#64748b", whiteSpace:"nowrap" }}>
                      {l}{f&&<button className="sort-btn" onClick={()=>{setSortField(f);setSortDir(d=>d==="asc"?"desc":"asc");}}>{sortField===f?(sortDir==="asc"?"▲":"▼"):"⇅"}</button>}
                    </th>
                  ))}
                </tr></thead>
                <tbody>{filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onClick={() => goToContact(c)}>
                    <td style={{ padding:"12px 16px" }}><div style={{ fontWeight:600, color:"#0f172a" }}>{c.name}</div><div style={{ fontSize:13, color:"#64748b" }}>{c.email}</div></td>
                    <td style={{ padding:"12px 16px", color:"#64748b" }}>{c.company}</td>
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
                  <div key={stage} style={{ minWidth:220, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#64748b" }}>{stage.toUpperCase()}</div>
                      <span className="pill" style={{ background:statusColor(stage)+"22", color:statusColor(stage) }}>{sc.length}</span>
                    </div>
                    {sc.map(c => (
                      <div key={c.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, padding:12, cursor:"pointer", marginBottom:10 }} onClick={() => goToContact(c)}>
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
                    <div key={c.id} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer" }} onClick={() => goToContact(c)}>
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
                  <div key={key} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:14, marginBottom:12 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"#6366f1", marginBottom:6 }}>{key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</div>
                    <div style={{ fontSize:14, color:"#64748b", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{tpl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEAM & ANALYTICS */}
        {view==="team" && <TeamAnalytics contacts={contacts} setContacts={setContacts} notify={notify} />}

        {/* SETTINGS */}
        {view==="settings" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Settings</h1>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>Configure WhatsApp API credentials per agent. Each agent uses their own number when messaging leads.</p>

            {/* Shared Access Token */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:"#25d36622", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💬</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>WhatsApp Business API — Shared Token</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>One access token covers all agent numbers under your Meta Business Account</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"end" }}>
                <div>
                  <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:6 }}>Access Token <span style={{ color:"#94a3b8" }}>(shared across all agents)</span></label>
                  <input type="password" value={waConfig.accessToken} onChange={e=>setWaConfig(p=>({...p,accessToken:e.target.value}))} placeholder="EAAxxxxx… (from Meta Developer Console)" style={{ width:"100%", fontFamily:"DM Mono,monospace", fontSize:13 }} />
                </div>
                <button className="btn btn-primary" onClick={()=>notify("✅ Access token saved!")}>Save Token</button>
              </div>
              <div style={{ marginTop:12, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:13, color:"#166534" }}>
                💡 Get your token from <strong>developers.facebook.com</strong> → Your App → WhatsApp → API Setup
              </div>
            </div>

            {/* Per-agent phone numbers */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:36, height:36, background:"#6366f122", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👥</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>Agent WhatsApp Numbers</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>Each agent needs their own Phone Number ID registered in your Meta Business Account</div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {TEAM_MEMBERS.map(name => {
                  const agentConf = waConfig.agents[name] || { phoneNumberId:"", number:"", displayName:name };
                  const color = {Alex:"#6366f1",Jamie:"#10b981",Sam:"#f59e0b",Jordan:"#3b82f6"}[name]||"#6366f1";
                  const isConfigured = agentConf.phoneNumberId && agentConf.number;
                  return (
                    <div key={name} style={{ border:`1.5px solid ${isConfigured?"#bbf7d0":"#e2e8f0"}`, borderRadius:12, padding:18, background:isConfigured?"#f0fdf4":"#fff", transition:"all 0.2s" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                        <div style={{ width:40, height:40, background:`${color}22`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color }}>{name[0]}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>{name}</div>
                          <div style={{ fontSize:12, color:"#94a3b8" }}>{USERS.find(u=>u.name===name)?.role==="admin"?"Super Admin":"Agent"}</div>
                        </div>
                        <span className="pill" style={{ background:isConfigured?"#dcfce7":"#f1f5f9", color:isConfigured?"#16a34a":"#94a3b8", fontSize:12 }}>
                          {isConfigured?"✅ Configured":"⚙️ Not set up"}
                        </span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                        <div>
                          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Phone Number ID</label>
                          <input value={agentConf.phoneNumberId} onChange={e=>setWaConfig(p=>({...p,agents:{...p.agents,[name]:{...agentConf,phoneNumberId:e.target.value}}}))}
                            placeholder="1234567890…" style={{ width:"100%", fontSize:13, fontFamily:"DM Mono,monospace" }} />
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>From Meta → Phone Numbers</div>
                        </div>
                        <div>
                          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>WhatsApp Number</label>
                          <input value={agentConf.number} onChange={e=>setWaConfig(p=>({...p,agents:{...p.agents,[name]:{...agentConf,number:e.target.value}}}))}
                            placeholder="+447700123456" style={{ width:"100%", fontSize:13, fontFamily:"DM Mono,monospace" }} />
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>Full intl. format</div>
                        </div>
                        <div>
                          <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Display Name</label>
                          <input value={agentConf.displayName} onChange={e=>setWaConfig(p=>({...p,agents:{...p.agents,[name]:{...agentConf,displayName:e.target.value}}}))}
                            placeholder={name} style={{ width:"100%", fontSize:13 }} />
                          <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>Shown to leads</div>
                        </div>
                      </div>
                      {isConfigured && (
                        <div style={{ marginTop:12, display:"flex", gap:10, alignItems:"center" }}>
                          <div style={{ flex:1, padding:"8px 12px", background:"#fff", border:"1px solid #bbf7d0", borderRadius:8, fontSize:12, color:"#166534", display:"flex", gap:16 }}>
                            <span>📱 <strong>{agentConf.number}</strong></span>
                            <span>🔑 ID: <span style={{ fontFamily:"DM Mono,monospace" }}>{agentConf.phoneNumberId.slice(0,8)}…</span></span>
                            <span>💬 Sends as: <strong>{agentConf.displayName}</strong></span>
                          </div>
                          <button className="btn btn-ghost" style={{ fontSize:12, whiteSpace:"nowrap" }} onClick={async () => {
                            notify(`🧪 Sending test to ${agentConf.number}…`);
                            try {
                              const res = await fetch(`https://graph.facebook.com/v19.0/${agentConf.phoneNumberId}/messages`, {
                                method:"POST",
                                headers:{ "Authorization":`Bearer ${waConfig.accessToken}`, "Content-Type":"application/json" },
                                body: JSON.stringify({ messaging_product:"whatsapp", to:agentConf.number.replace(/\D/g,""), type:"text", text:{ body:`✅ ClearCRM test — ${name}'s WhatsApp is connected and working!` } })
                              });
                              const data = await res.json();
                              if (data.messages?.[0]?.id) notify(`✅ Test sent to ${name} (${agentConf.number})`);
                              else notify(`❌ Test failed: ${data.error?.message||"Check credentials"}`);
                            } catch { notify(`❌ Network error during test`); }
                          }}>🧪 Send Test</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 }}>
                <button className="btn btn-ghost" onClick={()=>notify("Changes discarded")}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>notify("✅ Agent WA numbers saved!")}>Save All Numbers</button>
              </div>
            </div>

            {/* Meta Setup Checklist */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                <div style={{ width:36, height:36, background:"#3b82f622", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📋</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>Meta API Setup Checklist</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>Follow these steps to go live — tick each off as you complete it</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { id:"fb", label:"Create a Meta (Facebook) Business Account", link:"https://business.facebook.com", linkLabel:"business.facebook.com", note:"Use your company email. Business name: your investment firm name." },
                  { id:"dev", label:"Create a Meta Developer App", link:"https://developers.facebook.com/apps", linkLabel:"developers.facebook.com/apps", note:"Click 'Create App' → select 'Business' type → add WhatsApp product." },
                  { id:"verify", label:"Verify your business", link:"https://business.facebook.com/settings/security", linkLabel:"Business Verification", note:"Upload your Nevis Certificate of Incorporation or utility bill. Takes 1–3 business days." },
                  { id:"numbers", label:"Add and verify each agent's phone number", link:"https://developers.facebook.com", linkLabel:"Meta Developer Console → WhatsApp → Phone Numbers", note:"Each number receives a verification SMS/call. Numbers can be any country." },
                  { id:"token", label:"Generate a Permanent Access Token", link:"https://developers.facebook.com", linkLabel:"App Dashboard → System Users", note:"Create a System User, assign it to your app, generate a token with whatsapp_business_messaging permission." },
                  { id:"test", label:"Send a test message from ClearCRM", link:null, linkLabel:null, note:"Enter your credentials above, open any contact, and send a WhatsApp. You should receive it within seconds." },
                  { id:"webhook", label:"(Optional) Set up webhook for delivery receipts", link:"https://developers.facebook.com", linkLabel:"WhatsApp → Configuration → Webhooks", note:"Lets ClearCRM update message status from 'sent' to 'delivered' to 'read' automatically." },
                ].map((item, i) => {
                  const [checked, setChecked] = useState(false);
                  return (
                    <div key={item.id} style={{ display:"flex", gap:14, padding:"14px 16px", background:checked?"#f0fdf4":"#f8fafc", border:`1px solid ${checked?"#bbf7d0":"#e2e8f0"}`, borderRadius:10, transition:"all 0.2s" }}>
                      <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{ width:18, height:18, marginTop:2, accentColor:"#10b981", flexShrink:0, cursor:"pointer" }} />
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:checked?"#166534":"#1e293b", textDecoration:checked?"line-through":"none" }}>
                            Step {i+1}: {item.label}
                          </span>
                          {item.link && <a href={item.link} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"#6366f1", textDecoration:"none", background:"#ede9fe", padding:"2px 8px", borderRadius:99 }}>↗ {item.linkLabel}</a>}
                        </div>
                        <div style={{ fontSize:12, color:checked?"#16a34a":"#64748b" }}>{item.note}</div>
                      </div>
                      {checked && <span style={{ fontSize:18, flexShrink:0 }}>✅</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📋 How Per-Agent WhatsApp Works</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  { step:"1", title:"Register numbers", desc:"Add each agent's mobile number to your WhatsApp Business API account in Meta. Each gets a unique Phone Number ID.", color:"#6366f1" },
                  { step:"2", title:"Enter details here", desc:"Paste each agent's Phone Number ID and number above. One shared Access Token covers all of them.", color:"#10b981" },
                  { step:"3", title:"Auto-routing", desc:"When an agent sends a WhatsApp message from ClearCRM, it routes through their registered number — leads see their agent's name.", color:"#f59e0b" },
                ].map(s => (
                  <div key={s.step} style={{ padding:16, background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                    <div style={{ width:28, height:28, background:`${s.color}22`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:s.color, marginBottom:10 }}>{s.step}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1e293b", marginBottom:6 }}>{s.title}</div>
                    <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, padding:"12px 16px", background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:8, fontSize:13, color:"#5b21b6" }}>
                💡 <strong>Cost:</strong> Meta charges ~$0.05–0.08 per conversation per agent number/month. For 4 agents sending ~200 messages/month each, expect roughly <strong>$40–65/month</strong> total on the WhatsApp Business API.
              </div>
            </div>

            {/* Scoring rules */}
            <div className="card" style={{ padding:24 }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Lead Scoring Rules</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["Budget 500k+","+25","#10b981"],["Decision Maker","+15","#6366f1"],["Timeline < 1mo","+25","#10b981"],["High Interest (5★)","+20","#6366f1"],["WA Engagement","+15","#3b82f6"],["No Response","-10","#ef4444"],["Low Budget (<10k)","+5","#94a3b8"],["No Show","-13","#f97316"]].map(([k,v,c]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14 }}>
                    <span style={{ color:"#475569" }}>{k}</span>
                    <span style={{ color:c, fontWeight:700, fontFamily:"DM Mono,monospace" }}>{v}</span>
                  </div>
                ))}
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
function AgentApp({ user, contacts, setContacts, onLogout, waConfig }) {
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
  const sendWhatsApp = async (contact, message) => {
    const agentConf = waConfig?.agents?.[user.name] || {};
    const phoneNumberId = agentConf.phoneNumberId;
    const accessToken = waConfig?.accessToken;
    const recipientPhone = contact.phone.replace(/\s+/g,"").replace(/^\+/,"");
    const msgId = Date.now();
    const msg = { id:msgId, dir:"out", msg:message, time:new Date().toISOString().replace("T"," ").slice(0,16), status:"sending" };
    updateContact(contact.id, { whatsappHistory:[...contact.whatsappHistory, msg] });
    if (!phoneNumberId || !accessToken) {
      updateContact(contact.id, { whatsappHistory:[...contact.whatsappHistory, {...msg, status:"sent (demo)"}] });
      notify(`⚠️ Demo mode — admin needs to configure your WA number in Settings`);
      return;
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method:"POST",
        headers:{ "Authorization":`Bearer ${accessToken}`, "Content-Type":"application/json" },
        body: JSON.stringify({ messaging_product:"whatsapp", recipient_type:"individual", to:recipientPhone, type:"text", text:{ preview_url:false, body:message } })
      });
      const data = await res.json();
      if (data.messages?.[0]?.id) {
        setContacts(prev=>prev.map(c=>c.id===contact.id?{...c,whatsappHistory:c.whatsappHistory.map(w=>w.id===msgId?{...w,status:"delivered",waId:data.messages[0].id}:w)}:c));
        notify(`✅ Sent to ${contact.name}`);
      } else {
        setContacts(prev=>prev.map(c=>c.id===contact.id?{...c,whatsappHistory:c.whatsappHistory.map(w=>w.id===msgId?{...w,status:"failed"}:w)}:c));
        notify(`❌ Failed: ${data.error?.message||"Unknown error"}`);
      }
    } catch {
      setContacts(prev=>prev.map(c=>c.id===contact.id?{...c,whatsappHistory:c.whatsappHistory.map(w=>w.id===msgId?{...w,status:"failed"}:w)}:c));
      notify(`❌ Network error`);
    }
  };

  if (selectedContact) {
    const c = contacts.find(x=>x.id===selectedContact.id) || selectedContact;
    return (
      <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#1e293b", fontSize:15 }}>
        <style>{BASE_STYLES}</style>
        {NotificationEl}
        {/* Agent top bar */}
        <div style={{ background:"#f8fafc", borderBottom:"1px solid #f1f5f9", padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
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
    <div style={{ fontFamily:"'DM Sans','Helvetica Neue',sans-serif", background:"#f8fafc", minHeight:"100vh", color:"#1e293b", fontSize:15 }}>
      <style>{BASE_STYLES}</style>
      {NotificationEl}

      {/* Agent top bar */}
      <div style={{ background:"#f8fafc", borderBottom:"1px solid #f1f5f9", padding:"14px 28px", display:"flex", alignItems:"center", gap:14 }}>
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
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>📞</span>
            <div><div style={{ fontSize:15, fontWeight:600, color:"#10b981" }}>You have {todaysCalls.length} call{todaysCalls.length>1?"s":""} today</div><div style={{ fontSize:13, color:"#64748b" }}>{todaysCalls.map(c=>`${c.name} at ${c.callTime} ${c.timezone}`).join(" · ")}</div></div>
          </div>
        )}
        {noShows.length > 0 && (
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
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
                <div key={name} style={{ flex:1, background: isMe ? "#ede9fe" : "#f8fafc", border:`1px solid ${isMe?"#6366f1":"#e2e8f0"}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{["🥇","🥈","🥉","4️⃣"][i]}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: isMe ? "#6366f1" : "#1e293b" }}>{name}{isMe && " (you)"}</div>
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
              onMouseOver={e=>e.currentTarget.style.borderColor="#c7d2fe"}
              onMouseOut={e=>e.currentTarget.style.borderColor="#1e293b"}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:46, height:46, background:"linear-gradient(135deg,#ede9fe,#e0e7ff)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:scoreColor(c.score), fontFamily:"DM Mono" }}>{c.score}</div>
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
                <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f1f5f9", fontSize:13, color:"#64748b", display:"flex", gap:16 }}>
                  <span>📅 {c.callDate} at {c.callTime} {c.timezone}</span>
                  {c.callStatus && <span className="pill" style={{ background:"#dcfce7", color:"#10b981" }}>{c.callStatus}</span>}
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

// ─── TEAM ANALYTICS ───────────────────────────────────────────────────────────
function TeamAnalytics({ contacts, setContacts, notify }) {
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [agentFilter, setAgentFilter] = useState("All");
  const [lbMetric, setLbMetric] = useState("pipeline"); // leaderboard sort metric
  const [projectionMonths, setProjectionMonths] = useState("3");
  const [aiAgent, setAiAgent] = useState(TEAM_MEMBERS[0]);
  const [aiMode, setAiMode] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [activeTab, setActiveTab] = useState("performance");

  const agentColors = { Alex:"#6366f1", Jamie:"#10b981", Sam:"#f59e0b", Jordan:"#3b82f6" };
  const fmt = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;

  // ── Date range ──────────────────────────────────────────────────────────────
  const now = new Date();
  const getDateBounds = () => {
    if (dateRange==="7d")  return { from: new Date(now - 7*864e5), to: now };
    if (dateRange==="30d") return { from: new Date(now - 30*864e5), to: now };
    if (dateRange==="90d") return { from: new Date(now - 90*864e5), to: now };
    if (dateRange==="custom" && customFrom && customTo) return { from: new Date(customFrom), to: new Date(customTo) };
    return { from: new Date("2000-01-01"), to: now };
  };
  const { from: dateFrom, to: dateTo } = getDateBounds();
  const inRange = (c) => { if (!c.callDate) return dateRange==="all"; const d=new Date(c.callDate); return d>=dateFrom&&d<=dateTo; };
  const rangedContacts = dateRange==="all" ? contacts : contacts.filter(inRange);

  // ── Per-agent stats (always full team) ─────────────────────────────────────
  const agentStats = TEAM_MEMBERS.map(name => {
    const all = contacts.filter(c=>c.assignedTo===name);
    const ranged = rangedContacts.filter(c=>c.assignedTo===name);
    const completed = ranged.filter(c=>c.leadStatus==="Completed"||c.callStatus==="completed");
    const booked = ranged.filter(c=>c.callStatus==="booked");
    const noShow = ranged.filter(c=>c.callStatus==="no-show");
    const avgScore = ranged.length ? Math.round(ranged.reduce((s,c)=>s+c.score,0)/ranged.length) : 0;
    const waSent = ranged.reduce((s,c)=>s+c.whatsappHistory.length,0);
    const convRate = ranged.length ? Math.round((completed.length/ranged.length)*100) : 0;
    const pipeline = ranged.reduce((s,c)=>s+({"Under 10k":5000,"10k-50k":30000,"50k-100k":75000,"100k-500k":300000,"500k+":750000}[c.budget]||0),0);
    const hotLeads = ranged.filter(c=>c.category==="A").length;
    return { name, total:all.length, rangedTotal:ranged.length, completed:completed.length, booked:booked.length, noShow:noShow.length, hotLeads, avgScore, waSent, convRate, pipeline, leads:ranged };
  });

  // ── Filtered view (for KPIs + charts + table) ───────────────────────────────
  const viewStats = agentFilter==="All" ? agentStats : agentStats.filter(a=>a.name===agentFilter);
  const focusA = agentFilter!=="All" ? agentStats.find(a=>a.name===agentFilter) : null;
  const totalLeads = viewStats.reduce((s,a)=>s+a.rangedTotal,0);
  const totalCompleted = viewStats.reduce((s,a)=>s+a.completed,0);
  const totalBooked = viewStats.reduce((s,a)=>s+a.booked,0);
  const totalPipeline = viewStats.reduce((s,a)=>s+a.pipeline,0);
  const overallConv = totalLeads ? Math.round((totalCompleted/totalLeads)*100) : 0;
  const topAgent = [...agentStats].sort((a,b)=>b.completed-a.completed)[0];

  // ── Projections ─────────────────────────────────────────────────────────────
  const months = parseInt(projectionMonths)||3;
  const periodDays = dateRange==="7d"?7:dateRange==="30d"?30:30;
  const dailyRate = periodDays>0 ? totalCompleted/periodDays : 0;
  const projClosings = Math.round(dailyRate*months*30);
  const projPipeline = Math.round((totalPipeline/Math.max(periodDays,1))*months*30);

  // ── AI ───────────────────────────────────────────────────────────────────────
  const runAI = async (mode, agentName) => {
    setAiLoading(true); setAiResult(""); setAiMode(mode);
    const agentName_ = agentName || aiAgent;
    const summary = agentStats.map(a=>`${a.name}: ${a.rangedTotal} leads, ${a.completed} closed, ${a.booked} booked, ${a.noShow} no-shows, ${a.convRate}% conv, avg score ${a.avgScore}, pipeline ${fmt(a.pipeline)}`).join("\n");
    const focusData = agentStats.find(a=>a.name===agentName_);
    const prompts = {
      overview: `You are a senior sales analytics consultant for an investment firm. Analyse this team's CRM performance and provide:
1. Executive summary (2-3 sentences)
2. Top 3 strengths
3. Top 3 areas needing improvement
4. 3 specific, actionable recommendations with expected impact

Team data (${dateRange==="all"?"all time":dateRange}):
${summary}
Total: ${totalLeads} leads, ${totalCompleted} closed, ${overallConv}% overall conversion, ${totalBooked} calls booked.
Plain text only, no markdown.`,

      agent: `You are a sales performance coach for an investment firm. Give a detailed personal coaching report for ${agentName_}.
Their data: ${focusData ? `${focusData.rangedTotal} leads, ${focusData.completed} closed, ${focusData.booked} booked, ${focusData.noShow} no-shows, ${focusData.convRate}% conversion, avg lead score ${focusData.avgScore}, ${focusData.waSent} WhatsApp messages sent, pipeline ${fmt(focusData.pipeline||0)}` : "no data yet"}
Team average conversion: ${overallConv}%
Other agents for benchmarking: ${summary}

Provide:
1. Personal performance summary (compare to team average)
2. What they are doing well (be specific)
3. 3 targeted coaching tips to improve conversion rate
4. Suggested daily action plan (morning/afternoon routine)
5. One key metric to focus on this week
Plain text, no markdown.`,

      projection: `You are a revenue forecasting analyst for an investment firm. Generate a ${months}-month forward projection.
Current data (${agentFilter==="All"?"full team":agentFilter}): ${totalLeads} leads, ${totalCompleted} closed, ${overallConv}% conversion, ${totalBooked} booked.
Linear projection: ${projClosings} closings, pipeline ${fmt(projPipeline)}.
Agent breakdown: ${summary}

Provide:
1. Realistic ${months}-month projection with reasoning
2. Best-case scenario (+30% uplift) and what drives it
3. Worst-case scenario (-30%) and key risks
4. Top 3 actions to beat the projection
5. Which agent has the most growth potential and why
Numbers, plain text only.`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1400,messages:[{role:"user",content:prompts[mode]}]})});
      const data = await res.json();
      setAiResult(data.content?.map(b=>b.text||"").join("")||"No response.");
    } catch { setAiResult("Could not connect. Check your internet."); }
    setAiLoading(false);
  };

  return (
    <div style={{ padding:28 }} className="fade-in">

      {/* ── TOP BAR: title + date filter ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>Team Performance & Analytics</h1>
          <p style={{ color:"#64748b", fontSize:14, marginTop:4 }}>Filter by agent or date · AI-powered coaching & projections</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ display:"flex", background:"#f1f5f9", borderRadius:10, padding:3, gap:2 }}>
            {[["all","All Time"],["7d","7 Days"],["30d","30 Days"],["90d","90 Days"],["custom","Custom"]].map(([v,l])=>(
              <button key={v} onClick={()=>setDateRange(v)} style={{ padding:"6px 12px", borderRadius:7, border:"none", fontSize:13, fontWeight:500, background:dateRange===v?"#fff":"transparent", color:dateRange===v?"#6366f1":"#64748b", boxShadow:dateRange===v?"0 1px 3px rgba(0,0,0,0.08)":"none", cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
            ))}
          </div>
          {dateRange==="custom"&&(
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{ fontSize:13, padding:"6px 10px" }}/>
              <span style={{ color:"#94a3b8" }}>→</span>
              <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{ fontSize:13, padding:"6px 10px" }}/>
            </div>
          )}
        </div>
      </div>

      {/* ── AGENT FILTER BAR ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, padding:"12px 16px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, boxShadow:"0 1px 3px rgba(0,0,0,0.04)", flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#94a3b8", marginRight:4, letterSpacing:0.5 }}>FILTER BY AGENT</span>
        {["All",...TEAM_MEMBERS].map(name => {
          const isActive = agentFilter===name;
          const color = name==="All"?"#6366f1":(agentColors[name]||"#6366f1");
          const a = name!=="All" ? agentStats.find(x=>x.name===name) : null;
          return (
            <button key={name} onClick={()=>{ setAgentFilter(name); setAiResult(""); if(name!=="All") setAiAgent(name); }}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:99, border:`2px solid ${isActive?color:"#e2e8f0"}`, background:isActive?color+"18":"#f8fafc", cursor:"pointer", transition:"all 0.15s" }}>
              {name==="All"
                ? <span style={{ fontSize:14 }}>🌐</span>
                : <div style={{ width:22, height:22, background:isActive?color:color+"33", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:isActive?"#fff":color }}>{name[0]}</div>
              }
              <span style={{ fontSize:13, fontWeight:600, color:isActive?color:"#475569" }}>{name==="All"?"All Agents":name}</span>
              {a && <span style={{ fontSize:11, color:isActive?color:"#94a3b8" }}>{a.rangedTotal} leads</span>}
              {a && isActive && (
                <span className="pill" style={{ background:a.convRate>=50?"#dcfce7":a.convRate>=25?"#fef9c3":"#fee2e2", color:a.convRate>=50?"#16a34a":a.convRate>=25?"#ca8a04":"#dc2626", fontSize:11, padding:"1px 7px" }}>{a.convRate}% conv</span>
              )}
            </button>
          );
        })}
        {agentFilter!=="All"&&(
          <button onClick={()=>{setAgentFilter("All");setAiResult("");}} style={{ marginLeft:"auto", fontSize:12, color:"#94a3b8", background:"none", border:"none", cursor:"pointer" }}>✕ Clear</button>
        )}
      </div>

      {/* ── AGENT SPOTLIGHT BANNER (shown when agent selected) ── */}
      {agentFilter!=="All" && focusA && (() => {
        const color = agentColors[agentFilter]||"#6366f1";
        const vsTeam = overallConv - (agentStats.filter(a=>a.name!==agentFilter).reduce((s,a)=>s+a.convRate,0)/Math.max(agentStats.filter(a=>a.name!==agentFilter).length,1));
        return (
          <div style={{ background:`linear-gradient(135deg,${color}10,${color}05)`, border:`1.5px solid ${color}30`, borderRadius:14, padding:"20px 24px", marginBottom:24, display:"grid", gridTemplateColumns:"auto 1fr auto", gap:20, alignItems:"center" }}>
            <div style={{ width:56, height:56, background:`${color}22`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:700, color }}>{agentFilter[0]}</div>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:"#1e293b", marginBottom:4 }}>{agentFilter} — Performance Spotlight</div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                {[["Leads",focusA.rangedTotal],["Closed",focusA.completed],["Booked",focusA.booked],["No-Shows",focusA.noShow],["Hot Leads",focusA.hotLeads],["Avg Score",focusA.avgScore],["WA Sent",focusA.waSent]].map(([l,v])=>(
                  <div key={l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:800, color }}>{v}</div>
                    <div style={{ fontSize:11, color:"#94a3b8" }}>{l}</div>
                  </div>
                ))}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:focusA.convRate>=50?"#10b981":focusA.convRate>=25?"#f59e0b":"#ef4444" }}>{focusA.convRate}%</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>Conversion</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:18, fontWeight:800, color:vsTeam>=0?"#10b981":"#ef4444" }}>{vsTeam>=0?"+":""}{Math.round(vsTeam)}%</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>vs Team Avg</div>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <button className="btn btn-primary" style={{ fontSize:13, whiteSpace:"nowrap" }} onClick={()=>{ setAiAgent(agentFilter); runAI("agent",agentFilter); setActiveTab("performance"); }}>✨ AI Coach {agentFilter}</button>
              <button className="btn btn-ghost" style={{ fontSize:13, whiteSpace:"nowrap" }} onClick={()=>{ setAiAgent(agentFilter); runAI("projection",agentFilter); setActiveTab("performance"); }}>📈 Project {agentFilter}</button>
            </div>
          </div>
        );
      })()}

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:4, marginBottom:24, background:"#f1f5f9", padding:4, borderRadius:10, width:"fit-content" }}>
        {[["performance","📊 Performance"],["agents","👤 Agent Cards"],["reassign","🔄 Reassign"]].map(([t,l])=>(
          <button key={t} className={`tab ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>{l}</button>
        ))}
      </div>

      {/* ══════════ PERFORMANCE TAB ══════════ */}
      {activeTab==="performance"&&(
        <div>
          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            {[
              {l:"Total Leads",v:totalLeads,sub:agentFilter==="All"?"across all agents":`assigned to ${agentFilter}`,c:"#6366f1",icon:"👥"},
              {l:"Deals Closed",v:totalCompleted,sub:`${overallConv}% conversion rate`,c:"#10b981",icon:"✅"},
              {l:"Calls Booked",v:totalBooked,sub:"scheduled calls",c:"#3b82f6",icon:"📞"},
              {l:"Est. Pipeline",v:fmt(totalPipeline),sub:"combined value",c:"#f59e0b",icon:"💰"},
            ].map(s=>(
              <div key={s.l} className="stat-card" style={{ borderTop:`3px solid ${s.c}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:28, fontWeight:800, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#1e293b", marginTop:2 }}>{s.l}</div>
                    <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{s.sub}</div>
                  </div>
                  <span style={{ fontSize:24 }}>{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:24 }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600 }}>{agentFilter==="All"?"🏆 Leaderboard":`${agentFilter} — Detailed Breakdown`}</div>
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Sorted by: <span style={{ color:"#6366f1", fontWeight:600 }}>{[["pipeline","Allocations (Invested)"],["completed","Deals Closed"],["convRate","Conversion Rate"],["rangedTotal","Total Leads"],["avgScore","Avg Score"],["booked","Calls Booked"],["waSent","WA Messages"]].find(([v])=>v===lbMetric)?.[1]}</span></div>
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["pipeline","💰 Allocations"],["completed","✅ Closed"],["convRate","📈 Conv. Rate"],["rangedTotal","👥 Leads"],["avgScore","⭐ Score"],["booked","📞 Booked"],["waSent","💬 WA"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setLbMetric(v)} style={{ padding:"5px 12px", borderRadius:99, border:`1.5px solid ${lbMetric===v?"#6366f1":"#e2e8f0"}`, background:lbMetric===v?"#6366f1":"transparent", color:lbMetric===v?"#fff":"#64748b", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
                ))}
              </div>
            </div>
            {/* Ranked rows */}
            {[...viewStats].sort((a,b)=>b[lbMetric]-a[lbMetric]).map((a,i)=>{
              const color = agentColors[a.name]||"#6366f1";
              const rankEmoji = ["🥇","🥈","🥉","4️⃣"][i]||`${i+1}.`;
              const metricVal = lbMetric==="pipeline"?fmt(a.pipeline):lbMetric==="convRate"?`${a.convRate}%`:lbMetric==="avgScore"?a.avgScore:a[lbMetric];
              const maxVal = Math.max(...viewStats.map(x=>x[lbMetric]),1);
              const barPct = maxVal>0?(a[lbMetric]/maxVal)*100:0;
              const isTop = i===0 && agentFilter==="All";
              return (
                <div key={a.name} style={{ padding:"16px 20px", borderBottom:"1px solid #f8fafc", background:isTop?`${color}06`:agentFilter===a.name?`${color}04`:"transparent", transition:"background 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    {/* Rank */}
                    <div style={{ width:32, textAlign:"center", fontSize:isTop?22:16, flexShrink:0 }}>{rankEmoji}</div>
                    {/* Avatar */}
                    <div style={{ width:40, height:40, background:`${color}22`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color, flexShrink:0 }}>{a.name[0]}</div>
                    {/* Name + role */}
                    <div style={{ width:90, flexShrink:0 }}>
                      <div style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>{a.name}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{USERS.find(u=>u.name===a.name)?.role==="admin"?"Admin":"Agent"}</div>
                    </div>
                    {/* Progress bar + metric value */}
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:13, color:"#64748b" }}>
                          {a.rangedTotal} leads · {a.completed} closed · {a.booked} booked · {a.noShow} no-shows · {a.convRate}% conv
                        </span>
                        <span style={{ fontSize:18, fontWeight:800, color, fontFamily:lbMetric==="avgScore"?"DM Mono,monospace":"inherit" }}>{metricVal}</span>
                      </div>
                      <div style={{ height:8, background:"#f1f5f9", borderRadius:99, overflow:"hidden" }}>
                        <div style={{ width:`${barPct}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.6s ease" }}/>
                      </div>
                    </div>
                    {/* Mini stat pills */}
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <span className="pill" style={{ background:"#f0fdf4", color:"#16a34a", fontSize:11 }}>{fmt(a.pipeline)}</span>
                      <span className="pill" style={{ background:a.convRate>=50?"#dcfce7":a.convRate>=25?"#fef9c3":"#fee2e2", color:a.convRate>=50?"#16a34a":a.convRate>=25?"#ca8a04":"#dc2626", fontSize:11 }}>{a.convRate}% conv</span>
                      {isTop && <span className="pill" style={{ background:"#fef9c3", color:"#ca8a04", fontSize:11 }}>🏆 Top</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar charts */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:24 }}>
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Pipeline Value {agentFilter!=="All"?`— ${agentFilter}`:"by Agent"}</div>
              {viewStats.map(a=>{
                const base = agentFilter==="All" ? (totalPipeline>0?(a.pipeline/totalPipeline)*100:0) : Math.min((a.pipeline/2250000)*100,100);
                return (
                  <div key={a.name} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                      <span style={{ fontWeight:600, color:"#1e293b" }}>{a.name}</span>
                      <span style={{ color:agentColors[a.name], fontWeight:600 }}>{fmt(a.pipeline)}</span>
                    </div>
                    <div style={{ height:8, background:"#f1f5f9", borderRadius:99 }}>
                      <div style={{ width:`${base}%`, height:"100%", background:agentColors[a.name], borderRadius:99, transition:"width 0.6s" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Conversion Rate {agentFilter!=="All"?`— ${agentFilter}`:"by Agent"}</div>
              {viewStats.map(a=>(
                <div key={a.name} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
                    <span style={{ fontWeight:600, color:"#1e293b" }}>{a.name}</span>
                    <span style={{ color:a.convRate>=50?"#10b981":a.convRate>=25?"#f59e0b":"#ef4444", fontWeight:600 }}>{a.convRate}%</span>
                  </div>
                  <div style={{ height:8, background:"#f1f5f9", borderRadius:99 }}>
                    <div style={{ width:`${a.convRate}%`, height:"100%", background:a.convRate>=50?"#10b981":a.convRate>=25?"#f59e0b":"#ef4444", borderRadius:99, transition:"width 0.6s" }}/>
                  </div>
                  {agentFilter!=="All"&&<div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>{a.convRate<25?"⚠️ Below target — AI coaching recommended":a.convRate<50?"📈 On track — room to grow":"🏆 Strong performance"}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Projections */}
          <div className="card" style={{ padding:24, marginBottom:24, border:"1px solid #e0e7ff", background:"#fafafe" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>📈 Forward Projections {agentFilter!=="All"?`— ${agentFilter}`:""}</div>
                <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>Based on current period performance rate</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:"#64748b" }}>Project for</span>
                <select value={projectionMonths} onChange={e=>setProjectionMonths(e.target.value)} style={{ fontSize:13, padding:"6px 10px", width:120 }}>
                  <option value="1">1 month</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                </select>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
              {[
                {l:"Projected Closings",v:projClosings,sub:`in ${projectionMonths} month${months>1?"s":""}`,c:"#10b981",icon:"🎯"},
                {l:"Projected Pipeline",v:fmt(projPipeline),sub:"estimated value",c:"#6366f1",icon:"💰"},
                {l:"Best Case (+30%)",v:Math.round(projClosings*1.3),sub:"optimistic scenario",c:"#3b82f6",icon:"🚀"},
              ].map(s=>(
                <div key={s.l} style={{ background:"#fff", border:"1px solid #e0e7ff", borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:11, color:"#94a3b8", fontWeight:600, marginBottom:8 }}>{s.icon} {s.l.toUpperCase()}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="card" style={{ padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700 }}>✨ AI Analysis & Coaching</div>
                <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>Claude analyses your data and gives personalised insights</div>
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={()=>runAI("overview")}>📊 Team Overview</button>
                <div style={{ display:"flex", gap:6, alignItems:"center", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, padding:"4px 8px" }}>
                  <select value={aiAgent} onChange={e=>setAiAgent(e.target.value)} style={{ fontSize:13, padding:"4px 6px", border:"none", background:"transparent", color:"#475569" }}>
                    {TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}
                  </select>
                  <button className="btn btn-ghost" style={{ fontSize:13, border:"none", padding:"6px 10px" }} onClick={()=>runAI("agent")}>👤 Coach</button>
                </div>
                <button className="btn btn-primary" style={{ fontSize:13 }} onClick={()=>runAI("projection")}>📈 Projection</button>
              </div>
            </div>

            {aiLoading&&(
              <div style={{ background:"#f8fafc", borderRadius:10, padding:32, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>✨</div>
                <div style={{ fontSize:15, color:"#6366f1", fontWeight:500 }}>
                  {aiMode==="overview"?"Analysing team performance…":aiMode==="agent"?`Coaching ${aiAgent}…`:"Generating projections…"}
                </div>
                <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>Usually takes 5–10 seconds</div>
              </div>
            )}
            {!aiLoading&&aiResult&&(
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span className="pill" style={{ background:"#ede9fe", color:"#6366f1" }}>
                    {aiMode==="overview"?"📊 Team Overview":aiMode==="agent"?`👤 ${aiAgent} Coaching`:"📈 Revenue Projection"}
                  </span>
                  <span style={{ fontSize:12, color:"#94a3b8" }}>Generated just now · {agentFilter!=="All"?`Filtered: ${agentFilter}`:"All agents"}</span>
                </div>
                <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:20, fontSize:14, lineHeight:1.85, color:"#1e293b", whiteSpace:"pre-wrap" }}>{aiResult}</div>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>navigator.clipboard.writeText(aiResult)}>📋 Copy</button>
                  <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>setAiResult("")}>✕ Clear</button>
                </div>
              </div>
            )}
            {!aiLoading&&!aiResult&&(
              <div style={{ background:"#f8fafc", borderRadius:10, padding:28, textAlign:"center", color:"#94a3b8" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                <div style={{ fontSize:14, fontWeight:500, color:"#64748b" }}>Click a button above to run AI analysis</div>
                <div style={{ fontSize:13, marginTop:4 }}>Team Overview · Personal Coaching · Revenue Projections</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ AGENT CARDS TAB ══════════ */}
      {activeTab==="agents"&&(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20 }}>
          {agentStats.map(a=>{
            const u = USERS.find(x=>x.name===a.name);
            const color = agentColors[a.name]||"#6366f1";
            return (
              <div key={a.name} className="card" style={{ padding:24, borderTop:`3px solid ${color}`, transition:"box-shadow 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                  <div style={{ width:48, height:48, background:`${color}22`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color }}>{a.name[0]}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:17, fontWeight:700, color:"#1e293b" }}>{a.name}</div>
                    <span className="pill" style={{ background:u?.role==="admin"?"#ede9fe":"#f0fdf4", color:u?.role==="admin"?"#6366f1":"#10b981" }}>{u?.role==="admin"?"Super Admin":"Agent"}</span>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"#94a3b8", marginBottom:2 }}>PIN</div>
                    <div style={{ fontFamily:"DM Mono,monospace", fontSize:22, fontWeight:700, color }}>{u?.pin}</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                  {[["Leads",a.rangedTotal,"#6366f1"],["Closed",a.completed,"#10b981"],["Booked",a.booked,"#3b82f6"],["No-Show",a.noShow,"#f97316"]].map(([l,v,c])=>(
                    <div key={l} style={{ background:"#f8fafc", borderRadius:8, padding:"10px 8px", textAlign:"center" }}>
                      <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:4 }}>
                    <span>Conversion Rate</span>
                    <span style={{ fontWeight:600, color:a.convRate>=50?"#10b981":a.convRate>=25?"#f59e0b":"#ef4444" }}>{a.convRate}%</span>
                  </div>
                  <div style={{ height:8, background:"#f1f5f9", borderRadius:99 }}>
                    <div style={{ width:`${a.convRate}%`, height:"100%", background:a.convRate>=50?"#10b981":a.convRate>=25?"#f59e0b":"#ef4444", borderRadius:99, transition:"width 0.6s" }}/>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#64748b", marginBottom:14 }}>
                  <span>Avg Score <span style={{ fontWeight:700, color:scoreColor(a.avgScore) }}>{a.avgScore}</span></span>
                  <span>WA <span style={{ fontWeight:600, color:"#25d366" }}>{a.waSent}</span></span>
                  <span>Pipeline <span style={{ fontWeight:600, color:"#6366f1" }}>{fmt(a.pipeline)}</span></span>
                  <span>Hot <span style={{ fontWeight:600, color:"#f59e0b" }}>{a.hotLeads}</span></span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:12 }} onClick={()=>{setAgentFilter(a.name);setActiveTab("performance");}}>🔍 Focus View</button>
                  <button className="btn btn-primary" style={{ flex:1, fontSize:12 }} onClick={()=>{ setAiAgent(a.name); runAI("agent",a.name); setActiveTab("performance"); }}>✨ AI Coach</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ REASSIGN TAB ══════════ */}
      {activeTab==="reassign"&&(
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Reassign Leads in Bulk</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:6 }}>From agent</label><select id="from-agent" style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
              <div><label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:6 }}>To agent</label><select id="to-agent" style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
              <button className="btn btn-primary" onClick={()=>{
                const from=document.getElementById("from-agent").value;
                const to=document.getElementById("to-agent").value;
                if(from===to)return;
                setContacts(prev=>prev.map(c=>c.assignedTo===from?{...c,assignedTo:to}:c));
                notify(`Moved all leads from ${from} to ${to}`);
              }}>Reassign All Leads</button>
            </div>
          </div>
          <div className="card" style={{ padding:24 }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:16 }}>Current Lead Distribution</div>
            {agentStats.map(a=>{
              const pct = contacts.length>0?Math.round((a.total/contacts.length)*100):0;
              return (
                <div key={a.name} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                    <span style={{ fontWeight:600, color:"#1e293b" }}>{a.name}</span>
                    <span style={{ color:"#64748b" }}>{a.total} leads ({pct}%)</span>
                  </div>
                  <div style={{ height:8, background:"#f1f5f9", borderRadius:99 }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:agentColors[a.name], borderRadius:99 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Full Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} style={{ width:"100%" }} placeholder="Jane Smith" /></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Phone</label><input value={form.phone} onChange={e=>set("phone",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Email</label><input value={form.email} onChange={e=>set("email",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Company</label><input value={form.company} onChange={e=>set("company",e.target.value)} style={{ width:"100%" }} /></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Source</label><select value={form.source} onChange={e=>set("source",e.target.value)} style={{ width:"100%" }}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Assign To</label><select value={form.assignedTo} onChange={e=>set("assignedTo",e.target.value)} style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Budget</label><select value={form.budget} onChange={e=>set("budget",e.target.value)} style={{ width:"100%" }}>{BUDGET_OPTIONS.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Timeline</label><select value={form.timeline} onChange={e=>set("timeline",e.target.value)} style={{ width:"100%" }}>{TIMELINE_OPTIONS.map(t=><option key={t}>{t}</option>)}</select></div>
      </div>
      <label style={{ display:"flex", alignItems:"center", gap:10, fontSize:15, cursor:"pointer" }}><input type="checkbox" checked={form.isDecisionMaker} onChange={e=>set("isDecisionMaker",e.target.checked)} style={{ width:16, height:16 }} /><span style={{ color:"#64748b" }}>Decision Maker</span></label>
      <div><label style={{ fontSize:14, color:"#64748b", display:"block", marginBottom:4 }}>Notes</label><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{ width:"100%", minHeight:70, resize:"none", background:"#f8fafc" }} /></div>
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={()=>{if(form.name.trim())onSave(form);}}>Save Contact</button>
      </div>
    </div>
  );
}
