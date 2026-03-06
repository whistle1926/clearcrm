import { useState, useEffect, useRef } from "react";

// ─── SAMPLE DATA ───────────────────────────────────────────────────────────────
const SAMPLE_CONTACTS = [
  { id: 1, name: "Sarah Chen", phone: "+1 415 555 0192", email: "sarah.chen@techcorp.com", company: "TechCorp", source: "LinkedIn", notes: "Very interested in Q1 investment. Asked about minimum ticket size.", budget: "100k-500k", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 5, leadStatus: "Qualified", assignedTo: "Alex", score: 87, scoreBreakdown: { budget: 25, timeline: 20, responsiveness: 18, decisionMaker: 15, engagement: 9 }, callStatus: "booked", callDate: "2026-03-07", callTime: "10:00", timezone: "PST", meetingLink: "https://cal.com/alex/consultation", callNotes: "", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Sarah! Your call is confirmed for March 7 at 10:00 AM PST. Here's your link: https://cal.com/alex/consultation", time: "2026-03-05 09:00", status: "read" }], category: "A" },
  { id: 2, name: "Marcus Williams", phone: "+1 212 555 0847", email: "m.williams@invest.io", company: "Invest.io", source: "Referral", notes: "Referred by David Kim. Has invested before, looking for alternatives.", budget: "500k+", timeline: "1 month", isDecisionMaker: true, interestLevel: 4, leadStatus: "Call Booked", assignedTo: "Jamie", score: 92, scoreBreakdown: { budget: 25, timeline: 25, responsiveness: 18, decisionMaker: 15, engagement: 9 }, callStatus: "booked", callDate: "2026-03-06", callTime: "14:00", timezone: "EST", meetingLink: "https://cal.com/jamie/call", callNotes: "", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Marcus! Reminder: your call is TODAY at 2:00 PM EST. Link: https://cal.com/jamie/call", time: "2026-03-06 08:00", status: "delivered" }], category: "A" },
  { id: 3, name: "Priya Sharma", phone: "+44 20 7946 0958", email: "priya@globalfunds.co", company: "Global Funds", source: "Website", notes: "Downloaded whitepaper, opened emails 4 times. Not sure on timeline.", budget: "50k-100k", timeline: "3-6 months", isDecisionMaker: false, interestLevel: 3, leadStatus: "Scored", assignedTo: "Alex", score: 54, scoreBreakdown: { budget: 15, timeline: 12, responsiveness: 10, decisionMaker: 5, engagement: 12 }, callStatus: null, callDate: null, callTime: null, timezone: "GMT", meetingLink: "", callNotes: "", whatsappHistory: [], category: "B" },
  { id: 4, name: "Tom Bradley", phone: "+1 310 555 2341", email: "tom.b@ventures.com", company: "Bradley Ventures", source: "Cold Outreach", notes: "No reply to first two emails. LinkedIn profile shows active.", budget: "10k-50k", timeline: "6+ months", isDecisionMaker: false, interestLevel: 1, leadStatus: "New Lead", assignedTo: "Jamie", score: 22, scoreBreakdown: { budget: 8, timeline: 4, responsiveness: 2, decisionMaker: 5, engagement: 3 }, callStatus: null, callDate: null, callTime: null, timezone: "PST", meetingLink: "", callNotes: "", whatsappHistory: [], category: "D" },
  { id: 5, name: "Elena Vasquez", phone: "+34 91 555 0123", email: "elena@iberfund.es", company: "IberFund", source: "Conference", notes: "Met at FinTech Summit. Very warm, asked for a follow-up call next week.", budget: "100k-500k", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 4, leadStatus: "Qualified", assignedTo: "Sam", score: 76, scoreBreakdown: { budget: 25, timeline: 18, responsiveness: 12, decisionMaker: 15, engagement: 6 }, callStatus: "completed", callDate: "2026-03-04", callTime: "11:00", timezone: "CET", meetingLink: "", callNotes: "Great call. Send proposal by EOW.", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Elena! Thank you for the great conversation today. I'll send the proposal by Friday.", time: "2026-03-04 12:00", status: "read" }], category: "A" },
  { id: 6, name: "James Okonkwo", phone: "+234 805 555 9876", email: "j.okonkwo@lagos.capital", company: "Lagos Capital", source: "LinkedIn", notes: "High-net-worth individual. Interested in real estate fund.", budget: "500k+", timeline: "1-3 months", isDecisionMaker: true, interestLevel: 3, leadStatus: "Scored", assignedTo: "Sam", score: 68, scoreBreakdown: { budget: 25, timeline: 18, responsiveness: 10, decisionMaker: 15, engagement: 0 }, callStatus: null, callDate: null, callTime: null, timezone: "WAT", meetingLink: "", callNotes: "", whatsappHistory: [], category: "B" },
  { id: 7, name: "Lisa Park", phone: "+1 628 555 4401", email: "lpark@sfwealth.com", company: "SF Wealth Mgmt", source: "Referral", notes: "No-showed last call. Rescheduled twice.", budget: "100k-500k", timeline: "3-6 months", isDecisionMaker: true, interestLevel: 2, leadStatus: "No Show", assignedTo: "Alex", score: 41, scoreBreakdown: { budget: 25, timeline: 12, responsiveness: 2, decisionMaker: 15, engagement: -13 }, callStatus: "no-show", callDate: "2026-03-05", callTime: "15:00", timezone: "PST", meetingLink: "", callNotes: "No-showed again. Send follow-up.", whatsappHistory: [{ id: 1, dir: "out", msg: "Hi Lisa, we missed you on our call today. Would you like to reschedule? Reply here or use the link.", time: "2026-03-05 15:15", status: "delivered" }], category: "C" },
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

function scoreColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}
function categoryColor(cat) {
  return { A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#6b7280" }[cat] || "#6b7280";
}
function statusColor(s) {
  const m = { "New Lead": "#6366f1", Scored: "#8b5cf6", Qualified: "#3b82f6", "Call Booked": "#10b981", Completed: "#059669", "No Show": "#f97316", "Follow Up Later": "#f59e0b" };
  return m[s] || "#6b7280";
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  const [view, setView] = useState("dashboard");
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showWAModal, setShowWAModal] = useState(null); // contact
  const [showImport, setShowImport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // in contact detail
  const [notification, setNotification] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [user] = useState({ name: "Alex", role: "admin" });

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered contacts
  const filtered = contacts
    .filter(c => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.phone.includes(q);
      const matchStatus = filterStatus === "All" || c.leadStatus === filterStatus;
      const matchCat = filterCategory === "All" || c.category === filterCategory;
      const matchAssigned = filterAssigned === "All" || c.assignedTo === filterAssigned;
      return matchSearch && matchStatus && matchCat && matchAssigned;
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === "string") av = av.toLowerCase(), bv = bv.toLowerCase();
      if (sortDir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

  // Dashboard stats
  const today = new Date().toISOString().split("T")[0];
  const todaysCalls = contacts.filter(c => c.callDate === today && c.callStatus === "booked");
  const topLeads = contacts.filter(c => c.category === "A" && c.leadStatus !== "Completed").slice(0, 5);
  const noShows = contacts.filter(c => c.callStatus === "no-show");
  const recentWA = contacts.flatMap(c => c.whatsappHistory.map(w => ({ ...w, contactName: c.name, contactId: c.id }))).sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);

  // Update contact
  const updateContact = (id, updates) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Send WA
  const sendWhatsApp = (contact, message, templateKey = "manual") => {
    const newMsg = { id: Date.now(), dir: "out", msg: message, time: new Date().toISOString().replace("T", " ").slice(0, 16), status: "sent" };
    updateContact(contact.id, { whatsappHistory: [...contact.whatsappHistory, newMsg] });
    notify(`WhatsApp sent to ${contact.name}`);
  };

  // Auto-trigger WA on status change
  const handleCallStatusChange = (contact, newStatus) => {
    const updates = { callStatus: newStatus };
    if (newStatus === "booked") {
      const msg = WA_TEMPLATES.booking_confirmation
        .replace("{{name}}", contact.name.split(" ")[0])
        .replace("{{date}}", contact.callDate || "TBD")
        .replace("{{time}}", contact.callTime || "TBD")
        .replace("{{timezone}}", contact.timezone || "")
        .replace("{{link}}", contact.meetingLink || "#");
      sendWhatsApp(contact, msg);
      updates.leadStatus = "Call Booked";
    } else if (newStatus === "no-show") {
      const msg = WA_TEMPLATES.no_show
        .replace("{{name}}", contact.name.split(" ")[0])
        .replace("{{link}}", contact.meetingLink || "#");
      sendWhatsApp(contact, msg);
      updates.leadStatus = "No Show";
    } else if (newStatus === "completed") {
      updates.leadStatus = "Completed";
    }
    updateContact(contact.id, updates);
  };

  // AI suggestion
  const getAISuggestion = async (contact, type) => {
    setAiLoading(true);
    setAiSuggestion("");
    try {
      const prompts = {
        score: `You are a lead scoring assistant for an investment firm. Analyze this lead and suggest a score 0-100 and explain why in 2-3 sentences. Contact: Name: ${contact.name}, Company: ${contact.company}, Budget: ${contact.budget}, Timeline: ${contact.timeline}, Decision Maker: ${contact.isDecisionMaker}, Interest Level: ${contact.interestLevel}/5, Notes: ${contact.notes}. Respond in plain text only.`,
        action: `You are a sales assistant for an investment firm. Suggest the single best next action for this lead in 1-2 sentences. Contact: ${contact.name}, Status: ${contact.leadStatus}, Score: ${contact.score}, Notes: ${contact.notes}, Last WA: ${contact.whatsappHistory.slice(-1)[0]?.msg || "none"}. Be specific and actionable.`,
        summary: `Summarize this client's notes into 2 clear sentences for a sales rep: "${contact.notes}". Focus on key investment signals.`,
        whatsapp: `Draft a short, friendly WhatsApp message (under 100 words) for ${contact.name.split(" ")[0]} who is a ${contact.category}-tier lead at ${contact.company} with ${contact.budget} budget. Context: ${contact.notes}. Goal: nurture the relationship and suggest a call. Do not use markdown. Just the message text.`,
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompts[type] }] }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("");
      setAiSuggestion(text);
      if (type === "whatsapp") setWaMessage(text);
    } catch (e) {
      setAiSuggestion("Could not get suggestion. Check your connection.");
    }
    setAiLoading(false);
  };

  // CSV Import
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, ""));
      const newContacts = lines.slice(1).map((line, i) => {
        const vals = line.split(",");
        const get = (key) => { const idx = headers.indexOf(key); return idx >= 0 ? (vals[idx] || "").trim() : ""; };
        const score = Math.floor(Math.random() * 60) + 20;
        return {
          id: Date.now() + i,
          name: get("name") || get("fullname") || "Unknown",
          phone: get("phone") || get("phonenumber") || "",
          email: get("email") || "",
          company: get("company") || "",
          source: get("source") || "Import",
          notes: get("notes") || "",
          budget: get("budget") || "Unknown",
          timeline: get("timeline") || "Unknown",
          isDecisionMaker: get("decisionmaker") === "true" || get("decisionmaker") === "yes",
          interestLevel: parseInt(get("interestlevel")) || 3,
          leadStatus: "New Lead",
          assignedTo: TEAM_MEMBERS[0],
          score,
          scoreBreakdown: { budget: 15, timeline: 12, responsiveness: 8, decisionMaker: 5, engagement: score - 40 },
          callStatus: null, callDate: null, callTime: null, timezone: "", meetingLink: "", callNotes: "",
          whatsappHistory: [],
          category: score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D",
        };
      });
      setContacts(prev => [...prev, ...newContacts]);
      notify(`Imported ${newContacts.length} contacts!`);
      setShowImport(false);
    };
    reader.readAsText(file);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0d0f14", minHeight: "100vh", color: "#e2e8f0", display: "flex", fontSize: 15 }}>
      <style>{`
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
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover { background: #5558e8; }
        .btn-ghost { background: transparent; color: #94a3b8; border: 1px solid #2d3247; }
        .btn-ghost:hover { background: #1a1d26; color: #e2e8f0; }
        .btn-green { background: #10b981; color: #fff; }
        .btn-green:hover { background: #059669; }
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
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal { background: #161921; border: 1px solid #2d3247; border-radius: 16px; padding: 28px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
        .stat-card { background: #161921; border: 1px solid #1f2330; border-radius: 12px; padding: 20px 22px; }
        tr:hover td { background: #1a1d26; }
        .sort-btn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 13px; margin-left: 4px; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 220, background: "#111318", borderRight: "1px solid #1f2330", display: "flex", flexDirection: "column", padding: "0", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>C</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>ClearCRM</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{user.name} · {user.role}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[["dashboard", "📊", "Dashboard"], ["contacts", "👥", "Contacts"], ["pipeline", "🔄", "Pipeline"], ["whatsapp", "💬", "WhatsApp"], ["settings", "⚙️", "Settings"]].map(([v, icon, label]) => (
              <button key={v} className={`nav-item ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                <span style={{ fontSize: 15 }}>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid #1f2330" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Quick Stats</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["A", contacts.filter(c => c.category === "A").length], ["B", contacts.filter(c => c.category === "B").length], ["C", contacts.filter(c => c.category === "C").length]].map(([cat, count]) => (
              <div key={cat} style={{ flex: 1, background: "#161921", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: categoryColor(cat) }}>{count}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Cat {cat}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Notification */}
        {notification && (
          <div style={{ position: "fixed", top: 20, right: 20, zIndex: 200, background: notification.type === "success" ? "#10b981" : "#ef4444", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
            {notification.msg}
          </div>
        )}

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div style={{ padding: 28 }} className="fade-in">
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Good morning, {user.name} 👋</h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Contacts", value: contacts.length, icon: "👥", color: "#6366f1" },
                { label: "Today's Calls", value: todaysCalls.length, icon: "📞", color: "#10b981" },
                { label: "Hot Leads (A)", value: contacts.filter(c => c.category === "A").length, icon: "🔥", color: "#f59e0b" },
                { label: "No Shows", value: noShows.length, icon: "⚠️", color: "#f97316" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>{s.label}</div>
                    </div>
                    <span style={{ fontSize: 26 }}>{s.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Today's Calls */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#94a3b8" }}>📞 TODAY'S CALLS</div>
                {todaysCalls.length === 0 ? <div style={{ color: "#64748b", fontSize: 14 }}>No calls scheduled today.</div> : todaysCalls.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1f2330" }} onClick={() => { setSelectedContact(c); setView("contacts"); }}>
                    <div style={{ width: 40, height: 40, background: "#1e2133", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}>
                      {c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, cursor: "pointer" }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{c.callTime} {c.timezone} · {c.company}</div>
                    </div>
                    <span className="pill" style={{ background: "#1e3a2f", color: "#10b981" }}>Booked</span>
                  </div>
                ))}
              </div>

              {/* Top Priority Leads */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#94a3b8" }}>🔥 TOP PRIORITY LEADS</div>
                {topLeads.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #1f2330", cursor: "pointer" }} onClick={() => { setSelectedContact(c); setActiveTab("overview"); setView("contacts"); }}>
                    <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #1e2133, #2d3247)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                      {c.score}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{c.company} · {c.budget}</div>
                    </div>
                    <span className="pill" style={{ background: categoryColor(c.category) + "22", color: categoryColor(c.category) }}>Cat {c.category}</span>
                  </div>
                ))}
              </div>

              {/* No Shows */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#94a3b8" }}>⚠️ NO-SHOW FOLLOW-UPS</div>
                {noShows.length === 0 ? <div style={{ color: "#64748b", fontSize: 14 }}>All clear!</div> : noShows.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #1f2330" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{c.callDate} · {c.company}</div>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => { setShowWAModal(c); setWaMessage(WA_TEMPLATES.no_show.replace("{{name}}", c.name.split(" ")[0]).replace("{{link}}", c.meetingLink || "#")); }}>
                      Send WA
                    </button>
                  </div>
                ))}
              </div>

              {/* Recent WA */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#94a3b8" }}>💬 RECENT WHATSAPP</div>
                {recentWA.length === 0 ? <div style={{ color: "#64748b", fontSize: 14 }}>No messages yet.</div> : recentWA.map(w => (
                  <div key={w.id + w.contactId} style={{ padding: "8px 0", borderBottom: "1px solid #1f2330" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>{w.contactName}</div>
                      <span className="pill" style={{ background: w.status === "read" ? "#1e3a2f" : "#1e2133", color: w.status === "read" ? "#10b981" : "#64748b" }}>{w.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.msg}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{w.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS VIEW */}
        {view === "contacts" && !selectedContact && (
          <div style={{ padding: 28 }} className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700 }}>Contacts</h1>
                <p style={{ color: "#64748b", fontSize: 14, marginTop: 2 }}>{filtered.length} of {contacts.length} records</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setShowImport(true)}>⬆️ Import CSV</button>
                <button className="btn btn-primary" onClick={() => setShowAddContact(true)}>+ Add Contact</button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <input placeholder="Search name, email, company…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: 200, maxWidth: 320 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {["A", "B", "C", "D"].map(c => <option key={c}>Cat {c}</option>)}
              </select>
              <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}>
                <option value="All">All Staff</option>
                {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1f2330" }}>
                    {[["name", "Name"], ["company", "Company"], ["score", "Score"], ["category", "Cat"], ["leadStatus", "Status"], ["budget", "Budget"], ["assignedTo", "Owner"], ["", "Actions"]].map(([field, label]) => (
                      <th key={label} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap" }}>
                        {label}
                        {field && <button className="sort-btn" onClick={() => { setSortField(field); setSortDir(d => d === "asc" ? "desc" : "asc"); }}>{sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}</button>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #1a1d24", cursor: "pointer" }} onClick={() => { setSelectedContact(c); setActiveTab("overview"); }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>{c.name}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{c.email}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 15 }}>{c.company}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="score-bar-bg" style={{ width: 52 }}>
                            <div className="score-bar-fill" style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
                          </div>
                          <span style={{ color: scoreColor(c.score), fontWeight: 700, fontFamily: "DM Mono, monospace", fontSize: 14 }}>{c.score}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="pill" style={{ background: categoryColor(c.category) + "22", color: categoryColor(c.category) }}>{c.category}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="pill" style={{ background: statusColor(c.leadStatus) + "22", color: statusColor(c.leadStatus) }}>{c.leadStatus}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 14 }}>{c.budget}</td>
                      <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 14 }}>{c.assignedTo}</td>
                      <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 13 }} onClick={(e) => { e.stopPropagation(); setShowWAModal(c); setWaMessage(""); }}>💬 WA</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 15 }}>No contacts match your filters.</div>}
            </div>
          </div>
        )}

        {/* CONTACT DETAIL */}
        {view === "contacts" && selectedContact && (() => {
          const c = contacts.find(x => x.id === selectedContact.id) || selectedContact;
          return (
            <div style={{ padding: 28 }} className="fade-in">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <button className="btn btn-ghost" onClick={() => setSelectedContact(null)}>← Back</button>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                    {c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>{c.name}</h1>
                    <div style={{ fontSize: 14, color: "#64748b" }}>{c.company} · {c.email} · {c.phone}</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="pill" style={{ background: categoryColor(c.category) + "22", color: categoryColor(c.category), fontSize: 13, padding: "4px 12px" }}>Category {c.category}</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor(c.score), fontFamily: "DM Mono, monospace" }}>{c.score}</span>
                    <button className="btn btn-primary" onClick={() => { setShowWAModal(c); setWaMessage(""); }}>💬 Send WhatsApp</button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#111318", padding: 4, borderRadius: 10, width: "fit-content" }}>
                {[["overview", "Overview"], ["scoring", "Score"], ["booking", "Booking"], ["whatsapp", "WhatsApp"], ["ai", "✨ AI"]].map(([t, label]) => (
                  <button key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{label}</button>
                ))}
              </div>

              {/* TAB: OVERVIEW */}
              {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>CONTACT INFO</div>
                    {[["Full Name", c.name], ["Email", c.email], ["Phone", c.phone], ["Company", c.company], ["Source", c.source], ["Assigned To", c.assignedTo]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}>
                        <span style={{ color: "#64748b" }}>{k}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>LEAD DETAILS</div>
                    {[["Budget", c.budget], ["Timeline", c.timeline], ["Decision Maker", c.isDecisionMaker ? "✅ Yes" : "❌ No"], ["Interest Level", "⭐".repeat(c.interestLevel)], ["Lead Status", c.leadStatus]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}>
                        <span style={{ color: "#64748b" }}>{k}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{v || "—"}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>UPDATE STATUS</div>
                      <select value={c.leadStatus} onChange={e => updateContact(c.id, { leadStatus: e.target.value })} style={{ width: "100%" }}>
                        {WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="card" style={{ padding: 20, gridColumn: "span 2" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>NOTES</div>
                    <textarea value={c.notes} onChange={e => updateContact(c.id, { notes: e.target.value })} style={{ width: "100%", minHeight: 100, resize: "vertical", background: "#111318" }} placeholder="Add notes about this contact..." />
                  </div>
                </div>
              )}

              {/* TAB: SCORING */}
              {activeTab === "scoring" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                      <div style={{ fontSize: 64, fontWeight: 800, color: scoreColor(c.score), fontFamily: "DM Mono, monospace", lineHeight: 1 }}>{c.score}</div>
                      <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Lead Score / 100</div>
                      <span className="pill" style={{ background: categoryColor(c.category) + "22", color: categoryColor(c.category), marginTop: 8, display: "inline-flex", fontSize: 13 }}>Category {c.category} — {c.category === "A" ? "High Priority" : c.category === "B" ? "Warm" : c.category === "C" ? "Nurture" : "Low Priority"}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>SCORE BREAKDOWN</div>
                    {Object.entries(c.scoreBreakdown).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                          <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</span>
                          <span style={{ color: v < 0 ? "#ef4444" : "#e2e8f0", fontWeight: 600 }}>{v > 0 ? "+" : ""}{v}</span>
                        </div>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${Math.max(0, (v / 25) * 100)}%`, background: v < 0 ? "#ef4444" : "#6366f1" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>EDIT SCORING FACTORS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 14, color: "#94a3b8" }}>Interest Level (1–5)</label>
                        <input type="range" min={1} max={5} value={c.interestLevel} onChange={e => updateContact(c.id, { interestLevel: +e.target.value })} style={{ width: "100%", marginTop: 6, background: "transparent" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                          <span>Cold</span><span style={{ color: "#f59e0b" }}>{"⭐".repeat(c.interestLevel)}</span><span>Hot</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Budget Range</label>
                        <select value={c.budget} onChange={e => updateContact(c.id, { budget: e.target.value })} style={{ width: "100%" }}>
                          {BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Timeline</label>
                        <select value={c.timeline} onChange={e => updateContact(c.id, { timeline: e.target.value })} style={{ width: "100%" }}>
                          {TIMELINE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 15 }}>
                        <input type="checkbox" checked={c.isDecisionMaker} onChange={e => updateContact(c.id, { isDecisionMaker: e.target.checked })} style={{ width: 16, height: 16 }} />
                        <span style={{ color: "#94a3b8" }}>Is Decision Maker</span>
                      </label>
                      <button className="btn btn-primary" onClick={() => {
                        const budgetScore = { "Under 10k": 5, "10k-50k": 10, "50k-100k": 15, "100k-500k": 25, "500k+": 25 }[c.budget] || 10;
                        const timelineScore = { "1 month": 25, "1-3 months": 20, "3-6 months": 12, "6+ months": 4, "Unknown": 2 }[c.timeline] || 5;
                        const dmScore = c.isDecisionMaker ? 15 : 5;
                        const engagementScore = c.interestLevel * 4;
                        const responsiveness = c.whatsappHistory.length > 0 ? 15 : 8;
                        const newScore = Math.min(100, budgetScore + timelineScore + dmScore + engagementScore + responsiveness);
                        const newCat = newScore >= 75 ? "A" : newScore >= 55 ? "B" : newScore >= 35 ? "C" : "D";
                        updateContact(c.id, { score: newScore, category: newCat, scoreBreakdown: { budget: budgetScore, timeline: timelineScore, responsiveness, decisionMaker: dmScore, engagement: engagementScore } });
                        notify("Score recalculated!");
                      }}>Recalculate Score</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BOOKING */}
              {activeTab === "booking" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>CALL DETAILS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Call Date</label>
                        <input type="date" value={c.callDate || ""} onChange={e => updateContact(c.id, { callDate: e.target.value })} style={{ width: "100%" }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Time</label>
                          <input type="time" value={c.callTime || ""} onChange={e => updateContact(c.id, { callTime: e.target.value })} style={{ width: "100%" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Timezone</label>
                          <input value={c.timezone || ""} onChange={e => updateContact(c.id, { timezone: e.target.value })} placeholder="EST" style={{ width: "100%" }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Meeting Link</label>
                        <input value={c.meetingLink || ""} onChange={e => updateContact(c.id, { meetingLink: e.target.value })} placeholder="https://cal.com/..." style={{ width: "100%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>CALL STATUS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[["booked", "✅ Booked", "#10b981"], ["rescheduled", "🔄 Rescheduled", "#f59e0b"], ["canceled", "❌ Canceled", "#ef4444"], ["completed", "🎉 Completed", "#6366f1"], ["no-show", "⚠️ No Show", "#f97316"]].map(([val, label, color]) => (
                        <button key={val} onClick={() => handleCallStatusChange(c, val)} style={{ border: `2px solid ${c.callStatus === val ? color : "#2d3247"}`, background: c.callStatus === val ? color + "22" : "transparent", color: c.callStatus === val ? color : "#64748b", borderRadius: 8, padding: "11px 14px", textAlign: "left", fontSize: 15, fontWeight: 500, transition: "all 0.15s" }}>
                          {label} {c.callStatus === val && "← current"}
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Call Notes</label>
                      <textarea value={c.callNotes || ""} onChange={e => updateContact(c.id, { callNotes: e.target.value })} style={{ width: "100%", minHeight: 80, resize: "none", background: "#111318" }} placeholder="Notes from the call..." />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: WHATSAPP */}
              {activeTab === "whatsapp" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid #1f2330", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, background: "#25d366", borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💬</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{c.phone}</div>
                      </div>
                    </div>
                    <div style={{ padding: 16, minHeight: 300, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "#0d1117" }}>
                      {c.whatsappHistory.length === 0 ? (
                        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 60 }}>No messages yet. Use the panel to send one.</div>
                      ) : c.whatsappHistory.map(w => (
                        <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: w.dir === "out" ? "flex-end" : "flex-start" }}>
                          <div className={w.dir === "out" ? "wa-bubble-out" : "wa-bubble-in"} style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{w.msg}</div>
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 4, display: "flex", gap: 6 }}>
                            <span>{w.time}</span>
                            <span className="pill" style={{ background: w.status === "read" ? "#1e3a2f" : "#1e2133", color: w.status === "read" ? "#10b981" : "#64748b", fontSize: 9 }}>{w.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: 16, borderTop: "1px solid #1f2330" }}>
                      <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="Type a message…" style={{ width: "100%", minHeight: 70, resize: "none", marginBottom: 10, background: "#111318" }} />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button className="btn btn-ghost" onClick={() => setWaMessage("")} style={{ fontSize: 12 }}>Clear</button>
                        <button className="btn btn-green" onClick={() => { if (waMessage.trim()) { sendWhatsApp(c, waMessage); setWaMessage(""); } }} style={{ fontSize: 12 }}>Send ✓</button>
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>TEMPLATES</div>
                    {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
                      <button key={key} onClick={() => setWaMessage(tpl.replace(/{{name}}/g, c.name.split(" ")[0]).replace(/{{date}}/g, c.callDate || "TBD").replace(/{{time}}/g, c.callTime || "TBD").replace(/{{timezone}}/g, c.timezone || "").replace(/{{link}}/g, c.meetingLink || "#"))} style={{ display: "block", width: "100%", textAlign: "left", background: "#111318", border: "1px solid #2d3247", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#94a3b8", marginBottom: 8, cursor: "pointer", transition: "border-color 0.15s" }} onMouseOver={e => e.target.style.borderColor = "#6366f1"} onMouseOut={e => e.target.style.borderColor = "#2d3247"}>
                        📋 {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: AI */}
              {activeTab === "ai" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>✨ AI ASSISTANT</div>
                    <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>Use AI to get suggestions for scoring, next actions, and message drafts. All suggestions are editable.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[["score", "🎯 Suggest Lead Score", "Get an AI-suggested score"], ["action", "⚡ Best Next Action", "What to do next with this lead"], ["summary", "📝 Summarize Notes", "Clean summary of all notes"], ["whatsapp", "💬 Draft WhatsApp", "Draft a personalized message"]].map(([type, label, desc]) => (
                        <button key={type} onClick={() => getAISuggestion(c, type)} style={{ background: "#111318", border: "1px solid #2d3247", borderRadius: 10, padding: "13px 16px", textAlign: "left", cursor: "pointer", transition: "border-color 0.15s" }} onMouseOver={e => e.currentTarget.style.borderColor = "#6366f1"} onMouseOut={e => e.currentTarget.style.borderColor = "#2d3247"}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{label}</div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 16 }}>SUGGESTION</div>
                    {aiLoading ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#6366f1" }}>
                        <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>✨</div>
                        <div style={{ fontSize: 15 }}>Thinking…</div>
                      </div>
                    ) : aiSuggestion ? (
                      <div>
                        <div style={{ background: "#111318", border: "1px solid #2d3247", borderRadius: 10, padding: 16, fontSize: 15, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap", marginBottom: 14 }}>{aiSuggestion}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => { navigator.clipboard.writeText(aiSuggestion); notify("Copied!"); }}>Copy</button>
                          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setWaMessage(aiSuggestion); setActiveTab("whatsapp"); }}>Use as WA Message</button>
                          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => updateContact(c.id, { notes: (c.notes ? c.notes + "\n\n" : "") + "AI Note: " + aiSuggestion })}>Save to Notes</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: 40 }}>Click a button on the left to get an AI suggestion.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* PIPELINE VIEW */}
        {view === "pipeline" && (
          <div style={{ padding: 28 }} className="fade-in">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Pipeline</h1>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16 }}>
              {WORKFLOW_STAGES.map(stage => {
                const stageContacts = contacts.filter(c => c.leadStatus === stage);
                return (
                  <div key={stage} style={{ minWidth: 220, background: "#111318", border: "1px solid #1f2330", borderRadius: 12, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>{stage.toUpperCase()}</div>
                      <span className="pill" style={{ background: statusColor(stage) + "22", color: statusColor(stage) }}>{stageContacts.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {stageContacts.map(c => (
                        <div key={c.id} style={{ background: "#161921", border: "1px solid #1f2330", borderRadius: 8, padding: 12, cursor: "pointer" }} onClick={() => { setSelectedContact(c); setActiveTab("overview"); setView("contacts"); }}>
                          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                          <div style={{ fontSize: 13, color: "#64748b" }}>{c.company}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                            <span className="pill" style={{ background: categoryColor(c.category) + "22", color: categoryColor(c.category) }}>Cat {c.category}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(c.score), fontFamily: "DM Mono, monospace" }}>{c.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WHATSAPP VIEW */}
        {view === "whatsapp" && (
          <div style={{ padding: 28 }} className="fade-in">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>WhatsApp Activity</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>ALL CONVERSATIONS</div>
                {contacts.filter(c => c.whatsappHistory.length > 0).map(c => {
                  const last = c.whatsappHistory[c.whatsappHistory.length - 1];
                  return (
                    <div key={c.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid #1f2330", cursor: "pointer" }} onClick={() => { setSelectedContact(c); setActiveTab("whatsapp"); setView("contacts"); }}>
                      <div style={{ width: 44, height: 44, background: "#25d366", borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>💬</div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{last.time.split(" ")[0]}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{last.msg}</div>
                        <span className="pill" style={{ background: last.status === "read" ? "#1e3a2f" : "#1e2133", color: last.status === "read" ? "#10b981" : "#64748b", marginTop: 4 }}>{last.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>MESSAGE TEMPLATES</div>
                {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
                  <div key={key} style={{ background: "#111318", border: "1px solid #1f2330", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#6366f1", marginBottom: 6 }}>{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{tpl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === "settings" && (
          <div style={{ padding: 28 }} className="fade-in">
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Settings</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Team Members</div>
                {TEAM_MEMBERS.map(m => (
                  <div key={m} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1f2330", fontSize: 15 }}>
                    <span>{m}</span>
                    <span className="pill" style={{ background: "#1e2133", color: "#6366f1" }}>Staff</span>
                  </div>
                ))}
                <button className="btn btn-ghost" style={{ marginTop: 14, fontSize: 12 }}>+ Add Team Member</button>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>WhatsApp Business API</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Phone Number ID</label>
                    <input placeholder="Enter your WA Business phone ID" style={{ width: "100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 6 }}>Access Token</label>
                    <input type="password" placeholder="••••••••••••" style={{ width: "100%" }} />
                  </div>
                  <button className="btn btn-primary" onClick={() => notify("Settings saved!")}>Save API Settings</button>
                </div>
              </div>
              <div className="card" style={{ padding: 24, gridColumn: "span 2" }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Scoring Rules</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontSize: 14, color: "#94a3b8" }}>
                  {[["Budget 500k+", "+25"], ["Decision Maker", "+15"], ["Timeline &lt; 1mo", "+25"], ["High Interest", "+20"], ["Responsiveness", "+15"], ["Low Budget", "+5"], ["No DM status", "+5"], ["Long Timeline", "+4"]].map(([k, v]) => (
                    <div key={k} style={{ background: "#111318", border: "1px solid #1f2330", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between" }}>
                      <span>{k}</span><span style={{ color: "#6366f1", fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WA QUICK MODAL */}
      {showWAModal && (
        <div className="overlay" onClick={() => setShowWAModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Send WhatsApp</div>
                <div style={{ fontSize: 14, color: "#64748b" }}>to {showWAModal.name} · {showWAModal.phone}</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setShowWAModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>Quick Templates</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(WA_TEMPLATES).map(([key]) => (
                  <button key={key} className="btn btn-ghost" style={{ fontSize: 13, padding: "6px 12px" }} onClick={() => setWaMessage(WA_TEMPLATES[key].replace(/{{name}}/g, showWAModal.name.split(" ")[0]).replace(/{{date}}/g, showWAModal.callDate || "TBD").replace(/{{time}}/g, showWAModal.callTime || "TBD").replace(/{{timezone}}/g, showWAModal.timezone || "").replace(/{{link}}/g, showWAModal.meetingLink || "#"))}>
                    {key.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} style={{ width: "100%", minHeight: 120, resize: "vertical", marginBottom: 14, background: "#111318" }} placeholder="Type your message…" />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setShowWAModal(null)}>Cancel</button>
              <button className="btn btn-green" onClick={() => { if (waMessage.trim()) { sendWhatsApp(showWAModal, waMessage); setShowWAModal(null); setWaMessage(""); } }}>Send Message ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div className="overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Add New Contact</div>
              <button className="btn btn-ghost" style={{ padding: "4px 10px" }} onClick={() => setShowAddContact(false)}>✕</button>
            </div>
            <AddContactForm onSave={(data) => {
              const score = 40;
              setContacts(prev => [...prev, { ...data, id: Date.now(), score, category: "C", scoreBreakdown: { budget: 10, timeline: 10, responsiveness: 8, decisionMaker: data.isDecisionMaker ? 15 : 5, engagement: 7 }, callStatus: null, callDate: null, callTime: null, timezone: "", meetingLink: "", callNotes: "", whatsappHistory: [] }]);
              setShowAddContact(false);
              notify("Contact added!");
            }} onCancel={() => setShowAddContact(false)} />
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <div className="overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Import CSV</div>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
              Upload a CSV file with your contacts. Supported columns: <code style={{ background: "#1a1d26", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>name, email, phone, company, source, notes, budget, timeline, decisionmaker, interestlevel</code>
            </p>
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ background: "#111318", width: "100%", marginBottom: 16 }} />
            <button className="btn btn-ghost" onClick={() => setShowImport(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddContactForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", company: "", source: "LinkedIn", notes: "", budget: "Unknown", timeline: "Unknown", isDecisionMaker: false, interestLevel: 3, leadStatus: "New Lead", assignedTo: "Alex" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Full Name *</label><input value={form.name} onChange={e => set("name", e.target.value)} style={{ width: "100%" }} placeholder="Jane Smith" /></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Phone</label><input value={form.phone} onChange={e => set("phone", e.target.value)} style={{ width: "100%" }} placeholder="+1 555 0000" /></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Email</label><input value={form.email} onChange={e => set("email", e.target.value)} style={{ width: "100%" }} /></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Company</label><input value={form.company} onChange={e => set("company", e.target.value)} style={{ width: "100%" }} /></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Source</label><select value={form.source} onChange={e => set("source", e.target.value)} style={{ width: "100%" }}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Assigned To</label><select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} style={{ width: "100%" }}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Budget</label><select value={form.budget} onChange={e => set("budget", e.target.value)} style={{ width: "100%" }}>{BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}</select></div>
        <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Timeline</label><select value={form.timeline} onChange={e => set("timeline", e.target.value)} style={{ width: "100%" }}>{TIMELINE_OPTIONS.map(t => <option key={t}>{t}</option>)}</select></div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" }}>
        <input type="checkbox" checked={form.isDecisionMaker} onChange={e => set("isDecisionMaker", e.target.checked)} style={{ width: 16, height: 16 }} />
        <span style={{ color: "#94a3b8" }}>Decision Maker</span>
      </label>
      <div><label style={{ fontSize: 14, color: "#94a3b8", display: "block", marginBottom: 4 }}>Notes</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} style={{ width: "100%", minHeight: 70, resize: "none", background: "#111318" }} /></div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { if (form.name.trim()) onSave(form); }}>Save Contact</button>
      </div>
    </div>
  );
}
