import { useState, useEffect, useRef } from "react";

// ─── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://ughqdhwvydmyyynypsna.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaHFkaHd2eWRteXl5bnlwc25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNjc2MjUsImV4cCI6MjA4ODY0MzYyNX0.AfTdZeEKtQCFFxpHldVynbBNUqzlhKLJltrHZgu-TQo";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer ?? "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Supabase ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// Convert DB row (snake_case) → CRM contact (camelCase)
function dbToContact(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.name, phone: r.phone||"", email: r.email||"",
    company: r.company||"", source: r.source||"", notes: r.notes||"",
    budget: r.budget||"", timeline: r.timeline||"",
    isDecisionMaker: r.is_decision_maker||false,
    interestLevel: r.interest_level||3,
    leadStatus: r.lead_status||"New Lead",
    assignedTo: r.assigned_to||"",
    score: r.score||0, scoreBreakdown: r.score_breakdown||{},
    callStatus: r.call_status||null, callDate: r.call_date||null,
    callTime: r.call_time||null, timezone: r.timezone||"",
    meetingLink: r.meeting_link||"", callNotes: r.call_notes||"",
    category: r.category||"C", whatsappHistory: r.whatsapp_history||[],
    kycStatus: r.kyc_status||"not_started",
    kycApplicantId: r.kyc_applicant_id||null,
    lastCallDuration: r.last_call_duration||null,
    lastCallOutcome: r.last_call_outcome||null,
    totalCalls: r.total_calls||0,
  };
}

// Convert CRM contact (camelCase) → DB row (snake_case)
function contactToDb(c) {
  const r = {};
  if (c.name           !== undefined) r.name               = c.name;
  if (c.phone          !== undefined) r.phone              = c.phone;
  if (c.email          !== undefined) r.email              = c.email;
  if (c.company        !== undefined) r.company            = c.company;
  if (c.source         !== undefined) r.source             = c.source;
  if (c.notes          !== undefined) r.notes              = c.notes;
  if (c.budget         !== undefined) r.budget             = c.budget;
  if (c.timeline       !== undefined) r.timeline           = c.timeline;
  if (c.isDecisionMaker!== undefined) r.is_decision_maker  = c.isDecisionMaker;
  if (c.interestLevel  !== undefined) r.interest_level     = c.interestLevel;
  if (c.leadStatus     !== undefined) r.lead_status        = c.leadStatus;
  if (c.assignedTo     !== undefined) r.assigned_to        = c.assignedTo;
  if (c.score          !== undefined) r.score              = c.score;
  if (c.scoreBreakdown !== undefined) r.score_breakdown    = c.scoreBreakdown;
  if (c.callStatus     !== undefined) r.call_status        = c.callStatus;
  if (c.callDate       !== undefined) r.call_date          = c.callDate;
  if (c.callTime       !== undefined) r.call_time          = c.callTime;
  if (c.timezone       !== undefined) r.timezone           = c.timezone;
  if (c.meetingLink    !== undefined) r.meeting_link       = c.meetingLink;
  if (c.callNotes      !== undefined) r.call_notes         = c.callNotes;
  if (c.category       !== undefined) r.category           = c.category;
  if (c.whatsappHistory!== undefined) r.whatsapp_history   = c.whatsappHistory;
  if (c.kycStatus      !== undefined) r.kyc_status         = c.kycStatus;
  return r;
}

// Realtime subscription — calls onChange on INSERT/UPDATE/DELETE
function sbSubscribe(table, onChange) {
  const wsUrl = `${SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${SUPABASE_ANON}&vsn=1.0.0`;
  let ws;
  try {
    ws = new WebSocket(wsUrl);
    let ref = 0;
    ws.onopen = () => ws.send(JSON.stringify({ topic:`realtime:public:${table}`, event:"phx_join", payload:{}, ref:String(++ref) }));
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (["INSERT","UPDATE","DELETE"].includes(msg.event)) onChange(msg.event, msg.payload?.record);
      } catch {}
    };
  } catch {}
  return () => { try { ws?.close(); } catch {} };
}

// ─── ROLE DEFINITIONS (defaults — overridden by localStorage) ─────────────────
const DEFAULT_ROLES = {
  admin: {
    label: "Super Admin", color: "#6366f1", icon: "👑", isSystem: true,
    tabs: ["dashboard","contacts","pipeline","whatsapp","team","settings"],
    canViewAllLeads: true, canReassign: true, canDeleteContacts: true,
    canExport: true, canManageUsers: true, canViewAnalytics: true,
  },
  manager: {
    label: "Team Manager", color: "#3b82f6", icon: "🏆", isSystem: false,
    tabs: ["dashboard","contacts","pipeline","whatsapp","team"],
    canViewAllLeads: true, canReassign: true, canDeleteContacts: false,
    canExport: true, canManageUsers: false, canViewAnalytics: true,
  },
  agent: {
    label: "Sales Agent", color: "#10b981", icon: "💼", isSystem: false,
    tabs: ["dashboard","contacts","pipeline","whatsapp"],
    canViewAllLeads: false, canReassign: false, canDeleteContacts: false,
    canExport: false, canManageUsers: false, canViewAnalytics: false,
  },
  kyc: {
    label: "KYC Officer", color: "#f59e0b", icon: "🔍", isSystem: false,
    tabs: ["contacts"],
    canViewAllLeads: true, canReassign: false, canDeleteContacts: false,
    canExport: true, canManageUsers: false, canViewAnalytics: false,
  },
  onboarding: {
    label: "Onboarding", color: "#8b5cf6", icon: "🎓", isSystem: false,
    tabs: ["dashboard","contacts","whatsapp"],
    canViewAllLeads: true, canReassign: false, canDeleteContacts: false,
    canExport: false, canManageUsers: false, canViewAnalytics: false,
  },
  readonly: {
    label: "Read Only", color: "#94a3b8", icon: "👁️", isSystem: false,
    tabs: ["dashboard","contacts","pipeline"],
    canViewAllLeads: true, canReassign: false, canDeleteContacts: false,
    canExport: false, canManageUsers: false, canViewAnalytics: true,
  },
};

// Used only as a fallback before App mounts — real roles come from state
let ROLE_PRESETS = DEFAULT_ROLES;

const ALL_TABS = [
  { id:"dashboard", label:"Dashboard",    icon:"📊" },
  { id:"contacts",  label:"Contacts",     icon:"👥" },
  { id:"pipeline",  label:"Pipeline",     icon:"🔄" },
  { id:"whatsapp",  label:"WhatsApp",     icon:"💬" },
  { id:"team",      label:"Team & Agents",icon:"👤" },
  { id:"settings",  label:"Settings",     icon:"⚙️" },
];

const PERM_LABELS = {
  canViewAllLeads:   { label:"View All Leads",    desc:"See every contact, not just own" },
  canReassign:       { label:"Reassign Leads",    desc:"Move leads between agents" },
  canDeleteContacts: { label:"Delete Contacts",   desc:"Permanently remove contacts" },
  canExport:         { label:"Export Data",        desc:"Download CSV exports" },
  canManageUsers:    { label:"Manage Users",       desc:"Add/edit team members" },
  canViewAnalytics:  { label:"View Analytics",    desc:"Access Team & Agents page" },
};

const ICON_OPTIONS = ["👑","🏆","💼","🔍","🎓","👁️","⚡","🎯","📋","🔐","💰","📞","🤝","🛡️","🌟","🔑","📊","🏢","✅","🚀"];
const COLOR_OPTIONS = ["#6366f1","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#f97316","#ec4899","#14b8a6","#64748b","#0ea5e9","#84cc16"];

const DEFAULT_USERS = [
  { id:1, name:"Alex",   pin:"0000", role:"admin",  department:"Management", jobTitle:"Director",     email:"alex@company.com",   avatar:"", active:true, customTabs:null, customPerms:null },
  { id:2, name:"Jamie",  pin:"1111", role:"agent",  department:"Sales",      jobTitle:"Senior Agent", email:"jamie@company.com",  avatar:"", active:true, customTabs:null, customPerms:null },
  { id:3, name:"Sam",    pin:"2222", role:"agent",  department:"Sales",      jobTitle:"Sales Agent",  email:"sam@company.com",    avatar:"", active:true, customTabs:null, customPerms:null },
  { id:4, name:"Jordan", pin:"3333", role:"agent",  department:"Sales",      jobTitle:"Sales Agent",  email:"jordan@company.com", avatar:"", active:true, customTabs:null, customPerms:null },
];

function getUserPerms(user, roles) {
  const roleMap = roles || ROLE_PRESETS;
  const preset = roleMap[user.role] || roleMap.agent || Object.values(roleMap)[0];
  return {
    ...preset,
    tabs:  user.customTabs  ?? preset.tabs,
    ...(user.customPerms ?? {}),
  };
}

const USERS = DEFAULT_USERS;



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
  const [dbReady, setDbReady] = useState(false); // true once Supabase loaded

  const [roles, setRoles] = useState(() => {
    try { const s = localStorage.getItem("clearcrm_roles"); return s ? JSON.parse(s) : DEFAULT_ROLES; } catch { return DEFAULT_ROLES; }
  });

  useEffect(() => { ROLE_PRESETS = roles; }, [roles]);

  const [users, setUsers] = useState(() => {
    try { const s = localStorage.getItem("clearcrm_users"); return s ? JSON.parse(s) : DEFAULT_USERS; } catch { return DEFAULT_USERS; }
  });

  const [contacts, setContacts] = useState(() => {
    try { const s = localStorage.getItem("clearcrm_contacts"); return s ? JSON.parse(s) : SAMPLE_CONTACTS; } catch { return SAMPLE_CONTACTS; }
  });

  const [waConfig, setWaConfig] = useState(() => {
    try {
      const s = localStorage.getItem("clearcrm_waconfig");
      return s ? JSON.parse(s) : { accessToken:"", agents: Object.fromEntries(DEFAULT_USERS.map(u=>[u.name,{phoneNumberId:"",number:"",displayName:u.name}])) };
    } catch { return { accessToken:"", agents:{} }; }
  });

  const [claudeApiKey, setClaudeApiKey] = useState(() => {
    try { return localStorage.getItem("clearcrm_claudekey") || ""; } catch { return ""; }
  });

  // ── Load contacts from Supabase on mount ──────────────────────────────────
  useEffect(() => {
    sbFetch("/contacts?order=created_at.desc")
      .then(rows => {
        if (rows && rows.length > 0) {
          setContacts(rows.map(dbToContact));
          setDbReady(true);
        } else if (rows && rows.length === 0) {
          // DB is empty — migrate localStorage contacts up
          const local = (() => { try { const s=localStorage.getItem("clearcrm_contacts"); return s?JSON.parse(s):null; } catch{return null;} })();
          if (local && local.length > 0) {
            Promise.all(local.map(c => sbFetch("/contacts", { method:"POST", body: JSON.stringify(contactToDb(c)) }).catch(()=>null)))
              .then(() => setDbReady(true));
          } else {
            setDbReady(true);
          }
        }
      })
      .catch(() => {
        // Supabase unreachable — continue with localStorage
        setDbReady(false);
      });
  }, []);

  // ── Real-time sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dbReady) return;
    const unsub = sbSubscribe("contacts", (event, record) => {
      if (!record) return;
      const contact = dbToContact(record);
      setContacts(prev => {
        if (event === "INSERT") return prev.find(c=>c.id===contact.id) ? prev : [contact, ...prev];
        if (event === "UPDATE") return prev.map(c => c.id===contact.id ? contact : c);
        if (event === "DELETE") return prev.filter(c => c.id !== contact.id);
        return prev;
      });
    });
    return unsub;
  }, [dbReady]);

  // ── Persist to Supabase on contact changes (when DB ready) ───────────────
  const setContactsAndSync = (updater) => {
    setContacts(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  };

  // Wrap updateContact to also write to Supabase
  const syncContact = async (id, updates) => {
    setContacts(prev => prev.map(c => c.id===id ? {...c,...updates} : c));
    if (dbReady) {
      try { await sbFetch(`/contacts?id=eq.${id}`, { method:"PATCH", body: JSON.stringify(contactToDb(updates)) }); } catch {}
    }
  };

  // ── LocalStorage fallback persistence ────────────────────────────────────
  useEffect(() => { try { localStorage.setItem("clearcrm_roles",    JSON.stringify(roles));    } catch {} }, [roles]);
  useEffect(() => { try { localStorage.setItem("clearcrm_users",    JSON.stringify(users));    } catch {} }, [users]);
  useEffect(() => { try { localStorage.setItem("clearcrm_contacts", JSON.stringify(contacts)); } catch {} }, [contacts]);
  useEffect(() => { try { localStorage.setItem("clearcrm_waconfig", JSON.stringify(waConfig)); } catch {} }, [waConfig]);
  useEffect(() => { try { localStorage.setItem("clearcrm_claudekey",claudeApiKey);             } catch {} }, [claudeApiKey]);

  useEffect(() => {
    if (currentUser) {
      const updated = users.find(u => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  }, [users]);

  const handleLogin = (user) => setCurrentUser(users.find(u=>u.id===user.id)||user);

  if (!currentUser) return <LoginScreen users={users} roles={roles} onLogin={handleLogin} />;

  const perms  = getUserPerms(currentUser, roles);
  const isAdmin = currentUser.role === "admin";

  return isAdmin
    ? <AdminApp user={currentUser} roles={roles} setRoles={setRoles} users={users} setUsers={setUsers} contacts={contacts} setContacts={setContactsAndSync} syncContact={syncContact} dbReady={dbReady} onLogout={()=>setCurrentUser(null)} waConfig={waConfig} setWaConfig={setWaConfig} claudeApiKey={claudeApiKey} setClaudeApiKey={setClaudeApiKey} />
    : <AgentApp user={currentUser} perms={perms} users={users} roles={roles} contacts={contacts} setContacts={setContactsAndSync} syncContact={syncContact} onLogout={()=>setCurrentUser(null)} waConfig={waConfig} claudeApiKey={claudeApiKey} />;
}

// ─── USER MANAGEMENT PANEL ────────────────────────────────────────────────────
function UserManagementPanel({ users, setUsers, roles, notify, waConfig, setWaConfig }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name:"", pin:"", role:"agent", department:"Sales", jobTitle:"", email:"", active:true });
  const [expandedId, setExpandedId] = useState(null);

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ ...u, customTabs: u.customTabs ?? roles[u.role]?.tabs ?? [] });
    setExpandedId(u.id);
  };

  const saveEdit = () => {
    setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...editForm } : u));
    setEditingId(null);
    notify("✅ User updated");
  };

  const addUser = () => {
    if (!newUser.name.trim() || newUser.pin.length !== 4) return;
    if (users.find(u => u.pin === newUser.pin)) { notify("❌ PIN already in use"); return; }
    const id = Date.now();
    setUsers(prev => [...prev, { ...newUser, id, customTabs:null, customPerms:null }]);
    setWaConfig(prev => ({ ...prev, agents: { ...prev.agents, [newUser.name]: { phoneNumberId:"", number:"", displayName:newUser.name } } }));
    setNewUser({ name:"", pin:"", role:"agent", department:"Sales", jobTitle:"", email:"", active:true });
    setShowAdd(false);
    notify(`✅ ${newUser.name} added to team`);
  };

  const setF = (k, v) => setEditForm(f => ({ ...f, [k]: v }));
  const toggleTab = (tab) => {
    const curr = editForm.customTabs || [];
    setF("customTabs", curr.includes(tab) ? curr.filter(t=>t!==tab) : [...curr, tab]);
  };

  return (
    <div className="card" style={{ padding:24, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:"#6366f122", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👥</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>Team & Permissions</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Manage users, roles and what each person can see</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>+ Add Member</button>
      </div>

      {/* Role legend */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {Object.entries(roles).map(([key,r])=>(
          <span key={key} className="pill" style={{ background:`${r.color}18`, color:r.color, fontSize:12 }}>{r.icon} {r.label}</span>
        ))}
      </div>

      {/* User rows */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {users.map(u => {
          const preset = roles[u.role] || roles.agent || Object.values(roles)[0];
          const isEditing = editingId === u.id;
          const effectiveTabs = u.customTabs ?? preset.tabs;

          return (
            <div key={u.id} style={{ border:`2px solid ${isEditing?"#6366f1":"#e2e8f0"}`, borderRadius:12, overflow:"hidden", transition:"border-color 0.2s", opacity:u.active===false?0.55:1 }}>
              {/* Row header */}
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", background:isEditing?"#f8f7ff":"#fff" }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${preset.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{preset.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:15, fontWeight:700 }}>{u.name}</span>
                    <span className="pill" style={{ background:`${preset.color}18`, color:preset.color, fontSize:11 }}>{preset.label}</span>
                    {u.active===false && <span className="pill" style={{ background:"#fee2e2", color:"#dc2626", fontSize:11 }}>Inactive</span>}
                    {u.customTabs && <span className="pill" style={{ background:"#ede9fe", color:"#6366f1", fontSize:11 }}>⚡ custom tabs</span>}
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>
                    {[u.jobTitle, u.department, u.email].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{ fontSize:12, color:"#94a3b8", marginTop:3 }}>
                    Sees: {effectiveTabs.map(t=>{ const tab=ALL_TABS.find(x=>x.id===t); return tab?`${tab.icon} ${tab.label}`:""; }).join("  ")}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button className="btn btn-ghost" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>startEdit(u)}>✏️ Edit</button>
                  <button className="btn btn-ghost" style={{ fontSize:12, padding:"6px 12px", color:u.active===false?"#10b981":"#94a3b8" }}
                    onClick={()=>{ setUsers(p=>p.map(x=>x.id===u.id?{...x,active:!x.active}:x)); notify(u.active===false?`✅ ${u.name} reactivated`:`⏸️ ${u.name} deactivated`); }}>
                    {u.active===false ? "↩ Reactivate" : "Deactivate"}
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <div style={{ padding:"20px 18px", background:"#f8f7ff", borderTop:"1px solid #e2e8f0" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                    {[["name","Name","text","e.g. Chris Murphy"],["pin","PIN (4 digits)","text",""],["jobTitle","Job Title","text","e.g. KYC Officer"],["department","Department","text","Sales, KYC…"],["email","Email","email","name@company.com"]].map(([k,label,type,ph])=>(
                      <div key={k}>
                        <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:5 }}>{label}</label>
                        <input type={type} value={editForm[k]||""} onChange={e=>setF(k,e.target.value)} placeholder={ph} style={{ width:"100%", fontFamily:k==="pin"?"DM Mono,monospace":"inherit" }} maxLength={k==="pin"?4:undefined} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:5 }}>Role</label>
                      <select value={editForm.role||"agent"} onChange={e=>{ setF("role",e.target.value); setF("customTabs", roles[e.target.value]?.tabs ?? []); }} style={{ width:"100%" }}>
                        {Object.entries(roles).map(([k,r])=><option key={k} value={k}>{r.icon} {r.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tab toggle */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"#475569", marginBottom:8 }}>🗂️ Visible Tabs <span style={{ fontWeight:400, color:"#94a3b8", fontSize:12 }}>— tick what this person can see</span></div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {ALL_TABS.map(tab => {
                        const on = (editForm.customTabs||[]).includes(tab.id);
                        return (
                          <button key={tab.id} onClick={()=>toggleTab(tab.id)}
                            style={{ padding:"8px 14px", borderRadius:8, border:`2px solid ${on?"#6366f1":"#e2e8f0"}`, background:on?"#ede9fe":"#f8fafc", color:on?"#4338ca":"#64748b", fontSize:13, fontWeight:on?700:400, cursor:"pointer" }}>
                            {tab.icon} {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:6, fontSize:12, color:"#94a3b8" }}>Default for {roles[editForm.role]?.label}: {(roles[editForm.role]?.tabs||[]).map(t=>ALL_TABS.find(x=>x.id===t)?.label).join(", ")}</div>
                  </div>

                  <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                    <button className="btn btn-ghost" onClick={()=>setEditingId(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={saveEdit}>Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add member modal */}
      {showAdd && (
        <div className="overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:700 }}>Add Team Member</div>
              <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={()=>setShowAdd(false)}>✕</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              {[["name","Full Name *","text","Chris Murphy"],["pin","PIN (4 digits) *","text",""],["jobTitle","Job Title","text","e.g. KYC Officer"],["department","Department","text","Sales, KYC, Onboarding…"],["email","Email","email","name@company.com"]].map(([k,label,type,ph])=>(
                <div key={k}>
                  <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5 }}>{label}</label>
                  <input type={type} value={newUser[k]||""} onChange={e=>setNewUser(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={{ width:"100%", fontFamily:k==="pin"?"DM Mono,monospace":"inherit" }} maxLength={k==="pin"?4:undefined} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5 }}>Role *</label>
                <select value={newUser.role} onChange={e=>setNewUser(f=>({...f,role:e.target.value}))} style={{ width:"100%" }}>
                  {Object.entries(roles).map(([k,r])=><option key={k} value={k}>{r.icon} {r.label}</option>)}
                </select>
              </div>
            </div>
            {roles[newUser.role] && (
              <div style={{ padding:"12px 16px", background:"#ede9fe", borderRadius:8, fontSize:13, color:"#5b21b6", marginBottom:16 }}>
                {roles[newUser.role].icon} {roles[newUser.role].label} — will see: {(roles[newUser.role].tabs||[]).map(t=>ALL_TABS.find(x=>x.id===t)?.label).join(", ")}
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ opacity:newUser.name&&newUser.pin.length===4?1:0.5 }} onClick={addUser}>Add Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROLE BUILDER PANEL ───────────────────────────────────────────────────────
function RoleBuilderPanel({ roles, setRoles, users, notify }) {
  const blankRole = () => ({
    label:"", icon:"💼", color:"#6366f1", isSystem:false,
    tabs:["dashboard","contacts"],
    canViewAllLeads:false, canReassign:false, canDeleteContacts:false,
    canExport:false, canManageUsers:false, canViewAnalytics:false,
  });

  const [editingKey, setEditingKey] = useState(null); // null=closed, "NEW"=new, else key
  const [form, setForm] = useState(blankRole());
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleFormTab = (t) => setF("tabs", form.tabs.includes(t)?form.tabs.filter(x=>x!==t):[...form.tabs,t]);
  const togglePerm = (k) => setF(k, !form[k]);

  const openNew = () => { setForm(blankRole()); setEditingKey("NEW"); };
  const openEdit = (key) => { setForm({...roles[key]}); setEditingKey(key); };

  const save = () => {
    if (!form.label.trim()) { notify("❌ Role name is required"); return; }
    const key = editingKey === "NEW"
      ? "role_" + Date.now()
      : editingKey;
    setRoles(prev => ({ ...prev, [key]: { ...form } }));
    setEditingKey(null);
    notify(editingKey==="NEW" ? `✅ Role "${form.label}" created` : `✅ Role "${form.label}" updated`);
  };

  const deleteRole = (key) => {
    const inUse = users.filter(u=>u.role===key);
    if (inUse.length>0) { notify(`❌ Can't delete — ${inUse.map(u=>u.name).join(", ")} use this role`); setConfirmDelete(null); return; }
    setRoles(prev => { const next={...prev}; delete next[key]; return next; });
    setConfirmDelete(null);
    notify("🗑️ Role deleted");
  };

  return (
    <div className="card" style={{ padding:24, marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:36, height:36, background:"#f59e0b22", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎨</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700 }}>Role Builder</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Create and customise roles with their own name, icon, colour and permissions</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Create Role</button>
      </div>

      {/* Role cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
        {Object.entries(roles).map(([key, r]) => {
          const memberCount = users.filter(u=>u.role===key).length;
          const isEditing = editingKey === key;
          return (
            <div key={key} style={{ border:`2px solid ${isEditing?r.color:"#e2e8f0"}`, borderRadius:12, overflow:"hidden", transition:"border-color 0.2s" }}>
              {/* Card header */}
              <div style={{ padding:"16px 18px", background:`${r.color}08`, borderBottom:"1px solid #f1f5f9", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:`${r.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{r.icon}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:r.color }}>{r.label}</span>
                    {r.isSystem && <span className="pill" style={{ background:"#e0e7ff",color:"#4338ca",fontSize:10 }}>system</span>}
                  </div>
                  <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>{memberCount} member{memberCount!==1?"s":""}</div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>isEditing?setEditingKey(null):openEdit(key)}>
                    {isEditing?"✕":"✏️"}
                  </button>
                  {!r.isSystem && (
                    <button className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px", color:"#ef4444" }} onClick={()=>setConfirmDelete(key)}>🗑️</button>
                  )}
                </div>
              </div>

              {/* Card body — tabs + perms summary */}
              {!isEditing && (
                <div style={{ padding:"12px 18px" }}>
                  <div style={{ fontSize:12, color:"#64748b", marginBottom:6 }}>
                    <span style={{ fontWeight:600 }}>Tabs: </span>
                    {(r.tabs||[]).map(t=>ALL_TABS.find(x=>x.id===t)?.icon||"").join(" ")||"None"}
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {Object.entries(PERM_LABELS).filter(([k])=>r[k]).map(([k,p])=>(
                      <span key={k} className="pill" style={{ background:"#dcfce7",color:"#16a34a",fontSize:11 }}>✓ {p.label}</span>
                    ))}
                    {Object.entries(PERM_LABELS).filter(([k])=>!r[k]).map(([k,p])=>(
                      <span key={k} className="pill" style={{ background:"#f1f5f9",color:"#94a3b8",fontSize:11 }}>✗ {p.label}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline edit form */}
              {isEditing && (
                <div style={{ padding:"18px 18px", background:"#fafaf9" }}>
                  {/* Name + icon + colour row */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:10, marginBottom:14, alignItems:"end" }}>
                    <div>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Role Name *</label>
                      <input value={form.label} onChange={e=>setF("label",e.target.value)} placeholder="e.g. Investment Advisor" style={{ width:"100%" }} />
                    </div>
                    <div style={{ position:"relative" }}>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Icon</label>
                      <button onClick={()=>{setShowIconPicker(p=>!p);setShowColorPicker(false);}} style={{ width:48,height:38,borderRadius:8,border:"2px solid #e2e8f0",background:"#fff",fontSize:20,cursor:"pointer" }}>{form.icon}</button>
                      {showIconPicker && (
                        <div style={{ position:"absolute",top:46,left:0,zIndex:200,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:10,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:160 }}>
                          {ICON_OPTIONS.map(ic=>(
                            <button key={ic} onClick={()=>{setF("icon",ic);setShowIconPicker(false);}} style={{ width:28,height:28,border:"none",background:form.icon===ic?"#ede9fe":"transparent",borderRadius:6,fontSize:16,cursor:"pointer" }}>{ic}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ position:"relative" }}>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Colour</label>
                      <button onClick={()=>{setShowColorPicker(p=>!p);setShowIconPicker(false);}} style={{ width:48,height:38,borderRadius:8,border:"2px solid #e2e8f0",background:form.color,cursor:"pointer" }} />
                      {showColorPicker && (
                        <div style={{ position:"absolute",top:46,right:0,zIndex:200,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:10,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:160 }}>
                          {COLOR_OPTIONS.map(c=>(
                            <button key={c} onClick={()=>{setF("color",c);setShowColorPicker(false);}} style={{ width:28,height:28,borderRadius:6,background:c,border:form.color===c?"3px solid #1e293b":"2px solid transparent",cursor:"pointer" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:8 }}>🗂️ Pages this role can access</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {ALL_TABS.map(tab => {
                        const on = form.tabs.includes(tab.id);
                        return (
                          <button key={tab.id} onClick={()=>toggleFormTab(tab.id)}
                            style={{ padding:"6px 12px",borderRadius:8,border:`2px solid ${on?form.color:"#e2e8f0"}`,background:on?`${form.color}18`:"#f8fafc",color:on?form.color:"#64748b",fontSize:12,fontWeight:on?700:400,cursor:"pointer" }}>
                            {tab.icon} {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:8 }}>🔐 Permissions</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {Object.entries(PERM_LABELS).map(([k,p])=>{
                        const on = form[k];
                        return (
                          <button key={k} onClick={()=>togglePerm(k)}
                            style={{ padding:"8px 10px",borderRadius:8,border:`1px solid ${on?"#10b981":"#e2e8f0"}`,background:on?"#f0fdf4":"#f8fafc",color:on?"#16a34a":"#64748b",fontSize:12,fontWeight:on?600:400,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
                            <span style={{ fontSize:14 }}>{on?"✅":"⬜"}</span>
                            <div>
                              <div style={{ fontSize:12,fontWeight:600 }}>{p.label}</div>
                              <div style={{ fontSize:11,color:"#94a3b8" }}>{p.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{ padding:"10px 14px",background:`${form.color}12`,border:`1px solid ${form.color}44`,borderRadius:8,marginBottom:14,display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:20 }}>{form.icon}</span>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:form.color }}>{form.label||"Unnamed Role"}</div>
                      <div style={{ fontSize:12,color:"#64748b" }}>Sees: {form.tabs.map(t=>ALL_TABS.find(x=>x.id===t)?.label).join(", ")||"nothing"}</div>
                    </div>
                  </div>

                  <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                    <button className="btn btn-ghost" onClick={()=>setEditingKey(null)}>Cancel</button>
                    <button className="btn btn-primary" style={{ background:form.color,borderColor:form.color }} onClick={save}>Save Role</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* New role placeholder card */}
        {editingKey === "NEW" && (
          <div style={{ border:"2px solid #6366f1", borderRadius:12, overflow:"hidden" }}>
            <div style={{ padding:"16px 18px", background:"#f8f7ff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44,height:44,borderRadius:12,background:`${form.color}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{form.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontWeight:700,color:"#6366f1" }}>{form.label||"New Role"}</div>
                <div style={{ fontSize:12,color:"#94a3b8" }}>Draft</div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize:12,padding:"5px 10px" }} onClick={()=>setEditingKey(null)}>✕</button>
            </div>
            <div style={{ padding:"18px 18px", background:"#fafaf9" }}>
              {/* Reuse same form fields */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:10, marginBottom:14, alignItems:"end" }}>
                <div>
                  <label style={{ fontSize:12,color:"#64748b",display:"block",marginBottom:4 }}>Role Name *</label>
                  <input value={form.label} onChange={e=>setF("label",e.target.value)} placeholder="e.g. Investment Advisor" style={{ width:"100%" }} autoFocus />
                </div>
                <div style={{ position:"relative" }}>
                  <label style={{ fontSize:12,color:"#64748b",display:"block",marginBottom:4 }}>Icon</label>
                  <button onClick={()=>{setShowIconPicker(p=>!p);setShowColorPicker(false);}} style={{ width:48,height:38,borderRadius:8,border:"2px solid #e2e8f0",background:"#fff",fontSize:20,cursor:"pointer" }}>{form.icon}</button>
                  {showIconPicker && (
                    <div style={{ position:"absolute",top:46,left:0,zIndex:200,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:10,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:160 }}>
                      {ICON_OPTIONS.map(ic=>(
                        <button key={ic} onClick={()=>{setF("icon",ic);setShowIconPicker(false);}} style={{ width:28,height:28,border:"none",background:form.icon===ic?"#ede9fe":"transparent",borderRadius:6,fontSize:16,cursor:"pointer" }}>{ic}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position:"relative" }}>
                  <label style={{ fontSize:12,color:"#64748b",display:"block",marginBottom:4 }}>Colour</label>
                  <button onClick={()=>{setShowColorPicker(p=>!p);setShowIconPicker(false);}} style={{ width:48,height:38,borderRadius:8,border:"2px solid #e2e8f0",background:form.color,cursor:"pointer" }} />
                  {showColorPicker && (
                    <div style={{ position:"absolute",top:46,right:0,zIndex:200,background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:10,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:160 }}>
                      {COLOR_OPTIONS.map(c=>(
                        <button key={c} onClick={()=>{setF("color",c);setShowColorPicker(false);}} style={{ width:28,height:28,borderRadius:6,background:c,border:form.color===c?"3px solid #1e293b":"2px solid transparent",cursor:"pointer" }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12,fontWeight:600,color:"#475569",marginBottom:8 }}>🗂️ Pages this role can access</div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {ALL_TABS.map(tab=>{
                    const on=form.tabs.includes(tab.id);
                    return (
                      <button key={tab.id} onClick={()=>toggleFormTab(tab.id)}
                        style={{ padding:"6px 12px",borderRadius:8,border:`2px solid ${on?form.color:"#e2e8f0"}`,background:on?`${form.color}18`:"#f8fafc",color:on?form.color:"#64748b",fontSize:12,fontWeight:on?700:400,cursor:"pointer" }}>
                        {tab.icon} {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12,fontWeight:600,color:"#475569",marginBottom:8 }}>🔐 Permissions</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                  {Object.entries(PERM_LABELS).map(([k,p])=>{
                    const on=form[k];
                    return (
                      <button key={k} onClick={()=>togglePerm(k)}
                        style={{ padding:"8px 10px",borderRadius:8,border:`1px solid ${on?"#10b981":"#e2e8f0"}`,background:on?"#f0fdf4":"#f8fafc",color:on?"#16a34a":"#64748b",fontSize:12,fontWeight:on?600:400,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6 }}>
                        <span style={{ fontSize:14 }}>{on?"✅":"⬜"}</span>
                        <div><div style={{ fontSize:12,fontWeight:600 }}>{p.label}</div><div style={{ fontSize:11,color:"#94a3b8" }}>{p.desc}</div></div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding:"10px 14px",background:`${form.color}12`,border:`1px solid ${form.color}44`,borderRadius:8,marginBottom:14,display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:20 }}>{form.icon}</span>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:form.color }}>{form.label||"Unnamed Role"}</div>
                  <div style={{ fontSize:12,color:"#64748b" }}>Sees: {form.tabs.map(t=>ALL_TABS.find(x=>x.id===t)?.label).join(", ")||"nothing"}</div>
                </div>
              </div>

              <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                <button className="btn btn-ghost" onClick={()=>setEditingKey(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ background:form.color,borderColor:form.color }} onClick={save}>Create Role</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="overlay" onClick={()=>setConfirmDelete(null)}>
          <div className="modal" style={{ maxWidth:400 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:17,fontWeight:700,marginBottom:10 }}>Delete role "{roles[confirmDelete]?.label}"?</div>
            <p style={{ color:"#64748b",fontSize:14,marginBottom:20 }}>This can't be undone. Any members with this role will need to be reassigned.</p>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={()=>setConfirmDelete(null)}>Cancel</button>
              <button className="btn" style={{ background:"#ef4444",color:"#fff",border:"none" }} onClick={()=>deleteRole(confirmDelete)}>Delete Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ users, roles, onLogin }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const activeUsers = users.filter(u => u.active !== false);
  const roleMap = roles || DEFAULT_ROLES;

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...pin]; next[i] = val; setPin(next); setError("");
    if (val && i < 3) document.getElementById(`pin-${i+1}`)?.focus();
    const full = next.join("");
    if (full.length === 4) {
      const user = activeUsers.find(u => u.pin === full);
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
        <div style={{ background: "#fff", border: "1px solid #1f2330", borderRadius: 12, padding: 16, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 10, letterSpacing: 1 }}>TEAM PINS</div>
          {activeUsers.map(u => {
            const preset = roleMap[u.role] || roleMap.agent || Object.values(roleMap)[0] || { color:"#6366f1", icon:"👤", label:u.role };
            return (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1d26" }}>
                <div>
                  <span style={{ fontSize: 14, color: "#64748b" }}>{u.name}</span>
                  {u.jobTitle && <span style={{ fontSize:11, color:"#94a3b8", marginLeft:6 }}>{u.jobTitle}</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "DM Mono,monospace", fontSize: 14, color: "#6366f1", fontWeight: 600 }}>{u.pin}</span>
                  <span className="pill" style={{ background: `${preset.color}22`, color: preset.color, fontSize: 11 }}>{preset.icon} {preset.label}</span>
                </div>
              </div>
            );
          })}
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
function ContactDetail({ c, contacts, updateContact, sendWhatsApp, onBack, isAdmin, waMessage, setWaMessage, showWAModal, setShowWAModal, claudeApiKey }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name:c.name, phone:c.phone, email:c.email, company:c.company, source:c.source, budget:c.budget, timeline:c.timeline, isDecisionMaker:c.isDecisionMaker, interestLevel:c.interestLevel, assignedTo:c.assignedTo });
  const { notify, NotificationEl } = useNotify();

  const saveEdit = () => {
    updateContact(c.id, editForm);
    setEditMode(false);
    notify("✅ Contact updated!");
  };
  const setF = (k,v) => setEditForm(f=>({...f,[k]:v}));

  const handleCallStatusChange = (newStatus) => {
    const updates = { callStatus: newStatus };
    if (newStatus === "booked") { sendWhatsApp(c, fillTemplate(WA_TEMPLATES.booking_confirmation, c)); updates.leadStatus = "Call Booked"; }
    else if (newStatus === "no-show") { sendWhatsApp(c, fillTemplate(WA_TEMPLATES.no_show, c)); updates.leadStatus = "No Show"; }
    else if (newStatus === "completed") updates.leadStatus = "Completed";
    updateContact(c.id, updates);
  };

  const getAI = async (type) => {
    setAiLoading(true); setAiSuggestion("");
    if (!claudeApiKey) { setAiSuggestion("⚠️ No Claude API key set. Go to Settings → AI Configuration to add your key."); setAiLoading(false); return; }
    try {
      const prompts = {
        score: `Lead scoring for investment firm. Score 0-100 with 2-3 sentence explanation. Name:${c.name}, Company:${c.company}, Budget:${c.budget}, Timeline:${c.timeline}, DM:${c.isDecisionMaker}, Interest:${c.interestLevel}/5, Notes:${c.notes}. Plain text only.`,
        action: `Sales assistant. Best next action in 1-2 sentences. Name:${c.name}, Status:${c.leadStatus}, Score:${c.score}, Notes:${c.notes}`,
        summary: `Summarize client notes in 2 sentences: "${c.notes}"`,
        whatsapp: `Draft WhatsApp under 100 words for ${c.name.split(" ")[0]} at ${c.company}, budget ${c.budget}. Context: ${c.notes}. Goal: nurture and suggest call. Plain text only.`,
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": claudeApiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompts[type] }] }) });
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
            {!editMode && <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => { setEditMode(true); setEditForm({ name:c.name, phone:c.phone, email:c.email, company:c.company, source:c.source, budget:c.budget, timeline:c.timeline, isDecisionMaker:c.isDecisionMaker, interestLevel:c.interestLevel, assignedTo:c.assignedTo }); }}>✏️ Edit</button>}
            {editMode && <><button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setEditMode(false)}>Cancel</button><button className="btn btn-primary" style={{ fontSize:13 }} onClick={saveEdit}>💾 Save</button></>}
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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>CONTACT INFO</div>
              {editMode && <span className="pill" style={{ background:"#ede9fe", color:"#6366f1", fontSize:11 }}>✏️ Editing</span>}
            </div>
            {editMode ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Full Name","name","text"],["Phone *","phone","tel"],["Email","email","email"],["Company","company","text"]].map(([label,key,type])=>(
                  <div key={key}>
                    <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>{label}</label>
                    <input type={type} value={editForm[key]||""} onChange={e=>setF(key,e.target.value)}
                      style={{ width:"100%", borderColor: key==="phone"&&!editForm.phone?"#ef4444":"#e2e8f0" }}
                      placeholder={key==="phone"?"+1 555 000 0000 (required for WhatsApp)":""} />
                    {key==="phone"&&!editForm.phone&&<div style={{ fontSize:11, color:"#ef4444", marginTop:3 }}>⚠️ Phone number required to send WhatsApp</div>}
                  </div>
                ))}
                <div>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Source</label>
                  <select value={editForm.source} onChange={e=>setF("source",e.target.value)} style={{ width:"100%" }}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                {isAdmin && (
                  <div>
                    <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Assigned To</label>
                    <select value={editForm.assignedTo} onChange={e=>setF("assignedTo",e.target.value)} style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
                  </div>
                )}
              </div>
            ) : (
              <>
                {[["Full Name",c.name],["Phone",c.phone],["Email",c.email],["Company",c.company],["Source",c.source]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 15 }}>
                    <span style={{ color: "#64748b" }}>{k}</span>
                    <span style={{ color: k==="Phone"&&!v?"#ef4444":"#1e293b", fontWeight: 500 }}>
                      {k==="Phone"&&!v ? "⚠️ No phone — add to enable WhatsApp" : (v||"—")}
                    </span>
                  </div>
                ))}
                {isAdmin && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>ASSIGN TO AGENT</div>
                    <select value={c.assignedTo} onChange={e => updateContact(c.id, { assignedTo: e.target.value })} style={{ width: "100%" }}>{TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}</select>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 14 }}>LEAD DETAILS</div>
            {editMode ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Budget</label>
                  <select value={editForm.budget} onChange={e=>setF("budget",e.target.value)} style={{ width:"100%" }}>{BUDGET_OPTIONS.map(b=><option key={b}>{b}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Timeline</label>
                  <select value={editForm.timeline} onChange={e=>setF("timeline",e.target.value)} style={{ width:"100%" }}>{TIMELINE_OPTIONS.map(t=><option key={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Interest Level (1–5)</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setF("interestLevel",n)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:`2px solid ${editForm.interestLevel>=n?"#f59e0b":"#e2e8f0"}`, background:editForm.interestLevel>=n?"#fef9c3":"transparent", cursor:"pointer", fontSize:16 }}>⭐</button>
                    ))}
                  </div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, cursor:"pointer" }}>
                  <input type="checkbox" checked={editForm.isDecisionMaker} onChange={e=>setF("isDecisionMaker",e.target.checked)} style={{ width:16, height:16, accentColor:"#6366f1" }} />
                  <span style={{ color:"#475569" }}>Decision Maker</span>
                </label>
                <div style={{ marginTop:8 }}>
                  <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4, fontWeight:500 }}>Lead Status</label>
                  <select value={c.leadStatus} onChange={e => updateContact(c.id, { leadStatus: e.target.value })} style={{ width:"100%" }}>{WORKFLOW_STAGES.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <button className="btn btn-ghost" style={{ flex:1, fontSize:13 }} onClick={()=>setEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ flex:1, fontSize:13 }} onClick={saveEdit}>💾 Save Changes</button>
                </div>
              </div>
            ) : (
              <>
                {[["Budget",c.budget],["Timeline",c.timeline],["Decision Maker",c.isDecisionMaker?"✅ Yes":"❌ No"],["Interest","⭐".repeat(c.interestLevel)]].map(([k,v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 15 }}><span style={{ color: "#64748b" }}>{k}</span><span style={{ color: "#1e293b", fontWeight: 500 }}>{v||"—"}</span></div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>UPDATE STATUS</div>
                  <select value={c.leadStatus} onChange={e => updateContact(c.id, { leadStatus: e.target.value })} style={{ width: "100%" }}>{WORKFLOW_STAGES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
              </>
            )}
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
// ─── PHONE VALIDATOR ───────────────────────────────────────────────────────────
function validatePhone(phone) {
  if (!phone) return { valid: false, issue: "No phone number saved for this contact." };
  const cleaned = phone.replace(/\s+/g,"").replace(/-/g,"");
  if (!cleaned.startsWith("+")) return { valid: false, issue: "Number must start with + and country code (e.g. +353 for Ireland, +1 for US/Canada, +44 for UK)." };
  const digits = cleaned.replace(/\D/g,"");
  if (digits.length < 7) return { valid: false, issue: "Number is too short — check it's correct." };
  if (digits.length > 15) return { valid: false, issue: "Number is too long — check it's correct." };
  // Common country code checks
  const knownCodes = ["1","7","20","27","30","31","32","33","34","36","39","40","41","43","44","45","46","47","48","49","51","52","53","54","55","56","57","58","60","61","62","63","64","65","66","81","82","84","86","90","91","92","93","94","95","98","212","213","216","218","220","221","222","223","224","225","226","227","228","229","230","231","232","233","234","235","236","237","238","239","240","241","242","243","244","245","246","247","248","249","250","251","252","253","254","255","256","257","258","260","261","262","263","264","265","266","267","268","269","290","291","297","298","299","350","351","352","353","354","355","356","357","358","359","370","371","372","373","374","375","376","377","378","380","381","382","385","386","387","389","420","421","423","500","501","502","503","504","505","506","507","508","509","590","591","592","593","594","595","596","597","598","599","670","672","673","674","675","676","677","678","679","680","681","682","683","685","686","687","688","689","690","691","692","850","852","853","855","856","880","886","960","961","962","963","964","965","966","967","968","970","971","972","973","974","975","976","977","992","993","994","995","996","998"];
  const hasValidCode = knownCodes.some(code => digits.startsWith(code));
  if (!hasValidCode) return { valid: false, issue: "Country code not recognised. Make sure the number starts with your country's dialling code after the +." };
  return { valid: true, issue: null, cleaned };
}

function WAModal({ contact, waMessage, setWaMessage, onSend, onClose }) {
  const validation = validatePhone(contact.phone);
  const [mode, setMode] = useState("template");
  const isFirstContact = !contact.whatsappHistory || contact.whatsappHistory.length === 0;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>Send WhatsApp</div>
            <div style={{ fontSize:14, color:"#64748b" }}>to {contact.name}</div>
          </div>
          <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={onClose}>✕</button>
        </div>

        {!validation.valid ? (
          <>
            <div style={{ padding:"14px 16px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#dc2626", marginBottom:4 }}>❌ Cannot send — number issue</div>
              <div style={{ fontSize:13, color:"#7f1d1d", marginBottom:6 }}>{validation.issue}</div>
              <div style={{ fontSize:12, color:"#9ca3af" }}>Go to Overview → ✏️ Edit to fix the number first.</div>
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding:"8px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
              <span>✅</span>
              <span style={{ fontSize:13, color:"#16a34a", fontFamily:"DM Mono,monospace", fontWeight:600 }}>{contact.phone}</span>
              <span style={{ fontSize:11, color:"#64748b", marginLeft:"auto" }}>{isFirstContact ? "🆕 First contact" : "💬 Existing conversation"}</span>
            </div>

            {/* Mode switcher */}
            <div style={{ display:"flex", marginBottom:16, border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
              {[["template","📋 Template (first contact)"],["freeform","✏️ Free-form (existing)"]].map(([m,label])=>(
                <button key={m} onClick={()=>{ setMode(m); setWaMessage(""); }} style={{ flex:1, padding:"10px 0", fontSize:13, fontWeight:600, border:"none", borderLeft:m==="freeform"?"1px solid #e2e8f0":"none", cursor:"pointer", background:mode===m?"#6366f1":"#fff", color:mode===m?"#fff":"#64748b", transition:"all 0.15s" }}>{label}</button>
              ))}
            </div>

            {mode === "template" && (
              <div>
                <div style={{ padding:"10px 14px", background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:8, marginBottom:14, fontSize:13, color:"#5b21b6" }}>
                  <strong>Required for first contact & cold outreach.</strong> Meta only accepts pre-approved templates to open a conversation. Select one below and send — the contact will receive it on their WhatsApp immediately.
                </div>
                <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:10 }}>Available templates:</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                  {[{ name:"hello_world", lang:"en_US", label:"👋 Hello World", desc:'Sends: "Hello World" — Meta\'s built-in test template, always works on test numbers' }].map(t=>(
                    <div key={t.name} onClick={()=>setWaMessage(`__TEMPLATE__${t.name}__${t.lang}`)}
                      style={{ padding:"12px 14px", border:`2px solid ${waMessage===`__TEMPLATE__${t.name}__${t.lang}`?"#6366f1":"#e2e8f0"}`, borderRadius:10, cursor:"pointer", background:waMessage===`__TEMPLATE__${t.name}__${t.lang}`?"#ede9fe":"#f8fafc" }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{t.label}</div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{t.desc}</div>
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:4, fontFamily:"DM Mono,monospace" }}>name: {t.name} · language: {t.lang}</div>
                    </div>
                  ))}
                  <div style={{ padding:"10px 12px", background:"#f8fafc", border:"1px dashed #e2e8f0", borderRadius:8, fontSize:12, color:"#94a3b8" }}>
                    + Custom approved templates appear here once added in Meta Business Suite → WhatsApp Manager → Message Templates (~24hr approval)
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                  <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                  <button className="btn btn-primary" style={{ opacity:waMessage.startsWith("__TEMPLATE__")?1:0.4 }}
                    onClick={()=>{ if(waMessage.startsWith("__TEMPLATE__")){ onSend(); onClose(); } }}>Send Template ✓</button>
                </div>
              </div>
            )}

            {mode === "freeform" && (
              <div>
                <div style={{ padding:"10px 14px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, marginBottom:14, fontSize:13, color:"#92400e" }}>
                  ⚠️ Only works within <strong>24hrs</strong> of the contact last messaging you. Use Template mode for cold outreach.
                </div>
                <div style={{ fontSize:13, color:"#64748b", marginBottom:8 }}>Quick Templates</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
                  {Object.entries(WA_TEMPLATES).map(([key])=>(
                    <button key={key} className="btn btn-ghost" style={{ fontSize:12, padding:"5px 10px" }} onClick={()=>setWaMessage(fillTemplate(WA_TEMPLATES[key], contact))}>{key.replace(/_/g," ")}</button>
                  ))}
                </div>
                <textarea value={waMessage.startsWith("__TEMPLATE__")?"":waMessage} onChange={e=>setWaMessage(e.target.value)} style={{ width:"100%", minHeight:110, resize:"vertical", marginBottom:14, background:"#f8fafc" }} placeholder="Type your message…" />
                <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                  <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                  <button className="btn btn-green" style={{ opacity:(waMessage.trim()&&!waMessage.startsWith("__TEMPLATE__"))?1:0.4 }}
                    onClick={()=>{ if(waMessage.trim()&&!waMessage.startsWith("__TEMPLATE__")){ onSend(); onClose(); } }}>Send Message ✓</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN APP ─────────────────────────────────────────────────────────────────
function AdminApp({ user, roles, setRoles, users, setUsers, contacts, setContacts, syncContact, dbReady, onLogout, waConfig, setWaConfig, claudeApiKey, setClaudeApiKey }) {
  const [view, setView] = useState("dashboard");
  const [checklist, setChecklist] = useState({ fb:false, dev:false, verify:false, numbers:false, token:false, test:false, webhook:false });
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAssigned, setFilterAssigned] = useState("All");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showWAModal, setShowWAModal] = useState(null);
  const [waMessage, setWaMessage] = useState("");
  const [sortField, setSortField] = useState("score");
  const [sortDir, setSortDir] = useState("desc");
  const [waTemplates, setWaTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("clearcrm_watemplates");
      return saved ? JSON.parse(saved) : Object.entries(WA_TEMPLATES).map(([key, body]) => ({
        id: key, name: key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()), body, isDefault: true
      }));
    } catch {
      return Object.entries(WA_TEMPLATES).map(([key, body]) => ({
        id: key, name: key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()), body, isDefault: true
      }));
    }
  });

  useEffect(() => {
    try { localStorage.setItem("clearcrm_watemplates", JSON.stringify(waTemplates)); } catch {}
  }, [waTemplates]);
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
      const isTemplate = message.startsWith("__TEMPLATE__");
      let body;
      if (isTemplate) {
        const [,templateName, templateLang] = message.split("__").filter(Boolean);
        body = JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone,
          type: "template",
          template: { name: templateName, language: { code: templateLang } }
        });
      } else {
        body = JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { preview_url: false, body: message }
        });
      }
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body
      });
      const data = await res.json();
      if (data.messages?.[0]?.id) {
        setContacts(prev => prev.map(c => c.id===contact.id ? {
          ...c,
          whatsappHistory: c.whatsappHistory.map(w => w.id===msgId ? {...w, status:"delivered", waId:data.messages[0].id} : w)
        } : c));
        notify(`✅ WhatsApp sent to ${contact.name} via ${contact.assignedTo}'s number`);
      } else {
        const errCode = data.error?.code;
        const errMsg = data.error?.message || "Unknown error";
        let friendlyErr = errMsg;
        if (errCode === 131026) friendlyErr = `❌ ${contact.name}'s number is not on WhatsApp`;
        else if (errCode === 131047) friendlyErr = `❌ Message outside 24hr window — use a template`;
        else if (errCode === 100) friendlyErr = `❌ Invalid phone number format — edit the contact`;
        else if (errCode === 190) friendlyErr = `❌ Access token expired — refresh in Settings`;
        else if (errCode === 10) friendlyErr = `❌ Permission denied — check token has whatsapp_business_messaging`;
        setContacts(prev => prev.map(c => c.id===contact.id ? {
          ...c,
          whatsappHistory: c.whatsappHistory.map(w => w.id===msgId ? {...w, status:"failed"} : w)
        } : c));
        notify(friendlyErr);
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
          waMessage={waMessage} setWaMessage={setWaMessage} showWAModal={showWAModal} setShowWAModal={setShowWAModal}
          claudeApiKey={claudeApiKey} />
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
          <div style={{ marginTop:10, padding:"6px 10px", borderRadius:8, background:dbReady?"#f0fdf4":"#fff7ed", border:`1px solid ${dbReady?"#bbf7d0":"#fed7aa"}`, display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:dbReady?"#10b981":"#f59e0b",flexShrink:0,display:"inline-block" }}/>
            <span style={{ color:dbReady?"#16a34a":"#b45309" }}>{dbReady?"🗄️ Supabase live":"💾 Local only"}</span>
          </div>
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
                <button className="btn btn-ghost" onClick={() => setShowCSVImport(true)}>⬆️ Import CSV</button>
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
          <WAActivityView
            contacts={contacts}
            waTemplates={waTemplates}
            setWaTemplates={setWaTemplates}
            onGoToContact={goToContact}
            onSendQuick={(contact, message) => { sendWhatsApp(contact, message); }}
            notify={notify}
          />
        )}

        {/* TEAM & ANALYTICS */}
        {view==="team" && <TeamAnalytics contacts={contacts} setContacts={setContacts} notify={notify} claudeApiKey={claudeApiKey} />}

        {/* SETTINGS */}
        {view==="settings" && (
          <div style={{ padding:28 }} className="fade-in">
            <h1 style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Settings</h1>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:24 }}>Manage your team, roles, permissions and API credentials.</p>

            {/* ── USER MANAGEMENT ── */}
            <UserManagementPanel users={users} setUsers={setUsers} roles={roles} notify={notify} waConfig={waConfig} setWaConfig={setWaConfig} />
            <RoleBuilderPanel roles={roles} setRoles={setRoles} users={users} notify={notify} />

            {/* ── INTEGRATIONS ── */}
            <IntegrationsPanel notify={notify} contacts={contacts} setContacts={setContacts} users={users} />

            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:"#6366f122", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>✨</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>AI Configuration — Claude API Key</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>Powers AI scoring, coaching, projections and WhatsApp drafts</div>
                </div>
                {claudeApiKey && <span className="pill" style={{ marginLeft:"auto", background:"#dcfce7", color:"#16a34a", fontSize:12 }}>✅ Key saved</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"end" }}>
                <div>
                  <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:6 }}>Anthropic API Key</label>
                  <input type="password" value={claudeApiKey} onChange={e=>setClaudeApiKey(e.target.value)}
                    placeholder="sk-ant-api03-…" style={{ width:"100%", fontFamily:"DM Mono,monospace", fontSize:13 }} />
                </div>
                <button className="btn btn-primary" onClick={()=>notify("✅ Claude API key saved!")}>Save Key</button>
              </div>
              <div style={{ marginTop:12, padding:"10px 14px", background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:8, fontSize:13, color:"#5b21b6" }}>
                💡 Get your API key from <strong>console.anthropic.com</strong> → API Keys → Create Key. Your key is stored locally in your browser only.
              </div>
            </div>
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
                  const checked = checklist[item.id] || false;
                  return (
                    <div key={item.id} style={{ display:"flex", gap:14, padding:"14px 16px", background:checked?"#f0fdf4":"#f8fafc", border:`1px solid ${checked?"#bbf7d0":"#e2e8f0"}`, borderRadius:10, transition:"all 0.2s" }}>
                      <input type="checkbox" checked={checked} onChange={e=>setChecklist(p=>({...p,[item.id]:e.target.checked}))} style={{ width:18, height:18, marginTop:2, accentColor:"#10b981", flexShrink:0, cursor:"pointer" }} />
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

            {/* Data management */}
            <div className="card" style={{ padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:"#f1f5f9", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>💾</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700 }}>Data & Storage</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>All contacts and settings are automatically saved to your browser</div>
                </div>
                <div style={{ marginLeft:"auto", padding:"6px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:13, color:"#16a34a", fontWeight:600 }}>
                  ✅ Auto-save ON
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ padding:"14px 16px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:4 }}>📇 Contacts saved</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#6366f1" }}>{contacts.length}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Persists across page refreshes</div>
                </div>
                <div style={{ padding:"14px 16px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1e293b", marginBottom:4 }}>🔑 WA Config saved</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#10b981" }}>{Object.values(waConfig.agents||{}).filter(a=>a.phoneNumberId).length}/{TEAM_MEMBERS.length}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Agents configured</div>
                </div>
              </div>
              <div style={{ marginTop:16, padding:"12px 16px", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#92400e" }}>⚠️ Reset to sample data</div>
                  <div style={{ fontSize:12, color:"#b45309" }}>Clears all contacts and replaces with demo data. WA settings are kept.</div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize:12, color:"#ef4444", borderColor:"#fecaca", whiteSpace:"nowrap" }}
                  onClick={()=>{ if(window.confirm("Reset all contacts to sample data? This cannot be undone.")){ setContacts(SAMPLE_CONTACTS); notify("↩️ Reset to sample data"); } }}>
                  Reset Contacts
                </button>
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
      {showCSVImport && <CSVImportModal onImport={(newContacts) => { setContacts(prev => [...prev, ...newContacts]); setShowCSVImport(false); notify(`✅ Imported ${newContacts.length} contacts!`); }} onClose={() => setShowCSVImport(false)} />}
    </div>
  );
}
function AgentApp({ user, perms, users, contacts, setContacts, onLogout, waConfig }) {
  const defaultTab = perms?.tabs?.[0] || "contacts";
  const [agentView, setAgentView] = useState(defaultTab);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showWAModal, setShowWAModal] = useState(null);
  const [waMessage, setWaMessage] = useState("");
  const { notify, NotificationEl } = useNotify();

  // Respect canViewAllLeads permission
  const visibleLeads = perms?.canViewAllLeads
    ? contacts
    : contacts.filter(c => c.assignedTo === user.name);

  const myLeads = visibleLeads.filter(c => {
    const q = searchQuery.toLowerCase();
    return (!q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || (c.phone||"").includes(q))
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
      const isTemplate = message.startsWith("__TEMPLATE__");
      let reqBody;
      if (isTemplate) {
        const [,templateName, templateLang] = message.split("__").filter(Boolean);
        reqBody = JSON.stringify({ messaging_product:"whatsapp", to:recipientPhone, type:"template", template:{ name:templateName, language:{ code:templateLang } } });
      } else {
        reqBody = JSON.stringify({ messaging_product:"whatsapp", recipient_type:"individual", to:recipientPhone, type:"text", text:{ preview_url:false, body:message } });
      }
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method:"POST",
        headers:{ "Authorization":`Bearer ${accessToken}`, "Content-Type":"application/json" },
        body: reqBody
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

      {/* Top bar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 28px", display:"flex", alignItems:"center", gap:0 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 0", marginRight:24, borderRight:"1px solid #e2e8f0", paddingRight:24 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff" }}>C</div>
          <span style={{ fontSize:15, fontWeight:700 }}>ClearCRM</span>
        </div>

        {/* Tab nav — only permitted tabs */}
        <div style={{ display:"flex", flex:1, gap:0 }}>
          {(perms?.tabs || ["contacts"]).map(tabId => {
            const tab = ALL_TABS.find(t=>t.id===tabId);
            if (!tab) return null;
            return (
              <button key={tabId} onClick={()=>setAgentView(tabId)}
                style={{ padding:"16px 18px", border:"none", borderBottom:`3px solid ${agentView===tabId?"#6366f1":"transparent"}`, background:"transparent", color:agentView===tabId?"#6366f1":"#64748b", fontSize:14, fontWeight:agentView===tabId?700:400, cursor:"pointer", whiteSpace:"nowrap" }}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* User info + logout */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0" }}>
          {(() => { const preset = perms || {}; const color = preset.color||"#6366f1"; const icon = preset.icon||"👤"; return (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>{user.name}</div>
                <div style={{ fontSize:11, color }}>{user.jobTitle||preset.label||user.role}</div>
              </div>
            </div>
          );})()}
          <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={onLogout}>🚪 Log Out</button>
        </div>
      </div>

      <div style={{ padding:28 }}>
        {/* Alerts */}
        {agentView==="contacts" && todaysCalls.length > 0 && (
          <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>📞</span>
            <div><div style={{ fontSize:15, fontWeight:600, color:"#10b981" }}>You have {todaysCalls.length} call{todaysCalls.length>1?"s":""} today</div><div style={{ fontSize:13, color:"#64748b" }}>{todaysCalls.map(c=>`${c.name} at ${c.callTime} ${c.timezone}`).join(" · ")}</div></div>
          </div>
        )}
        {agentView==="contacts" && noShows.length > 0 && (
          <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>⚠️</span>
            <div><div style={{ fontSize:15, fontWeight:600, color:"#f97316" }}>{noShows.length} no-show{noShows.length>1?"s":""} need follow-up</div><div style={{ fontSize:13, color:"#64748b" }}>{noShows.map(c=>c.name).join(", ")}</div></div>
          </div>
        )}

        {/* CONTACTS VIEW */}
        {agentView==="contacts" && (<div>
        {/* Team leaderboard */}
        <div className="card" style={{ padding:20, marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:14 }}>🏆 TEAM LEADERBOARD</div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {users.filter(u=>u.active!==false).map((u, i) => {
              const leads = contacts.filter(c => c.assignedTo === u.name);
              const completed = leads.filter(c => c.leadStatus === "Completed").length;
              const hot = leads.filter(c => c.category === "A").length;
              const isMe = u.name === user.name;
              return (
                <div key={u.name} style={{ flex:1, minWidth:120, background: isMe ? "#ede9fe" : "#f8fafc", border:`1px solid ${isMe?"#6366f1":"#e2e8f0"}`, borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"][i]||"·"}</div>
                  <div style={{ fontSize:14, fontWeight:700, color: isMe ? "#6366f1" : "#1e293b" }}>{u.name}{isMe && " (you)"}</div>
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
          <input placeholder={perms?.canViewAllLeads ? "Search all leads…" : "Search your leads…"} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{ flex:1, minWidth:200 }} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="All">All Statuses</option>{WORKFLOW_STAGES.map(s=><option key={s}>{s}</option>)}</select>
        </div>

        {/* Lead cards */}
        {myLeads.length === 0 && (
          <div style={{ textAlign:"center", padding:80, color:"#64748b" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{perms?.canViewAllLeads ? "No leads found" : "No leads assigned to you yet"}</div>
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
        </div>)} {/* end contacts view */}

        {/* DASHBOARD VIEW */}
        {agentView==="dashboard" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>👋 Welcome back, {user.name}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:20 }}>
              {[
                ["My Leads", contacts.filter(c=>c.assignedTo===user.name).length, "#6366f1","👥"],
                ["Today's Calls", contacts.filter(c=>c.assignedTo===user.name&&c.callDate===new Date().toISOString().split("T")[0]&&c.callStatus==="booked").length, "#10b981","📞"],
                ["Hot Leads", contacts.filter(c=>c.assignedTo===user.name&&c.category==="A").length, "#f59e0b","🔥"],
              ].map(([l,v,color,icon])=>(
                <div key={l} className="stat-card" style={{ borderLeft:`4px solid ${color}` }}>
                  <div style={{ fontSize:28 }}>{icon}</div>
                  <div style={{ fontSize:28, fontWeight:800, color, margin:"8px 0" }}>{v}</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"#64748b", marginBottom:12 }}>TODAY'S SCHEDULE</div>
              {contacts.filter(c=>c.assignedTo===user.name&&c.callDate===new Date().toISOString().split("T")[0]).length === 0
                ? <div style={{ color:"#94a3b8", fontSize:14 }}>No calls scheduled for today</div>
                : contacts.filter(c=>c.assignedTo===user.name&&c.callDate===new Date().toISOString().split("T")[0]).map(c=>(
                    <div key={c.id} style={{ padding:"10px 0", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div><span style={{ fontWeight:600 }}>{c.name}</span><span style={{ color:"#64748b", marginLeft:8, fontSize:13 }}>{c.company}</span></div>
                      <span style={{ color:"#6366f1", fontWeight:600 }}>{c.callTime} {c.timezone}</span>
                    </div>
                  ))
              }
            </div>
          </div>
        )}

        {/* PIPELINE VIEW for non-admin */}
        {agentView==="pipeline" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>🔄 My Pipeline</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
              {WORKFLOW_STAGES.map(stage => {
                const stageLeads = contacts.filter(c=>c.assignedTo===user.name&&c.leadStatus===stage);
                return (
                  <div key={stage} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#64748b", marginBottom:12 }}>{stage} <span style={{ color:"#94a3b8" }}>({stageLeads.length})</span></div>
                    {stageLeads.map(c=>(
                      <div key={c.id} style={{ padding:"8px 10px", background:"#f8fafc", borderRadius:8, marginBottom:8, cursor:"pointer" }} onClick={()=>{ setSelectedContact(c); }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                        <div style={{ fontSize:12, color:"#94a3b8" }}>{c.company}</div>
                      </div>
                    ))}
                    {stageLeads.length===0&&<div style={{ fontSize:12, color:"#94a3b8" }}>No leads</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WHATSAPP VIEW for non-admin */}
        {agentView==="whatsapp" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>💬 My WhatsApp</div>
            <div className="card" style={{ padding:20 }}>
              {contacts.filter(c=>c.assignedTo===user.name&&c.whatsappHistory?.length>0).length===0
                ? <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>No conversations yet</div>
                : contacts.filter(c=>c.assignedTo===user.name&&c.whatsappHistory?.length>0).map(c=>{
                    const last=c.whatsappHistory[c.whatsappHistory.length-1];
                    return (
                      <div key={c.id} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer", alignItems:"center" }} onClick={()=>setSelectedContact(c)}>
                        <div style={{ width:44,height:44,background:"#25d366",borderRadius:50,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>💬</div>
                        <div style={{ flex:1,overflow:"hidden" }}>
                          <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:15,fontWeight:600 }}>{c.name}</span><span style={{ fontSize:12,color:"#64748b" }}>{last.time?.split(" ")[0]}</span></div>
                          <div style={{ fontSize:13,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{last.msg}</div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

      </div>

      {showWAModal && <WAModal contact={showWAModal} waMessage={waMessage} setWaMessage={setWaMessage} onSend={()=>sendWhatsApp(showWAModal,waMessage)} onClose={()=>setShowWAModal(null)} />}
    </div>
  );
}

// ─── TEAM ANALYTICS ───────────────────────────────────────────────────────────
function TeamAnalytics({ contacts, setContacts, notify, claudeApiKey }) {
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [agentFilter, setAgentFilter] = useState("All");
  const [lbMetric, setLbMetric] = useState("pipeline");
  const [projectionMonths, setProjectionMonths] = useState("3");
  const [aiAgent, setAiAgent] = useState(TEAM_MEMBERS[0]);
  const [aiMode, setAiMode] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [activeTab, setActiveTab] = useState("performance");

  // ── Focus coaching state ─────────────────────────────────────────────────────
  const [focusPlans, setFocusPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem("clearcrm_focusplans") || "{}"); } catch { return {}; }
  });
  const [focusLoading, setFocusLoading] = useState({});
  const [focusAgent, setFocusAgent] = useState(TEAM_MEMBERS[0]);
  const [checkInNote, setCheckInNote] = useState("");

  useEffect(() => {
    try { localStorage.setItem("clearcrm_focusplans", JSON.stringify(focusPlans)); } catch {}
  }, [focusPlans]);

  const generateFocusPlan = async (agentName) => {
    if (!claudeApiKey) { notify("⚠️ Add your Claude API key in Settings first"); return; }
    setFocusLoading(p => ({...p, [agentName]: true}));
    const agentLeads = contacts.filter(c => c.assignedTo === agentName);
    const stats = {
      total: agentLeads.length,
      hot: agentLeads.filter(c => c.category === "A").length,
      booked: agentLeads.filter(c => c.callStatus === "booked").length,
      noShow: agentLeads.filter(c => c.callStatus === "no-show").length,
      completed: agentLeads.filter(c => c.leadStatus === "Completed").length,
      avgScore: agentLeads.length ? Math.round(agentLeads.reduce((s,c)=>s+c.score,0)/agentLeads.length) : 0,
      waSent: agentLeads.reduce((s,c)=>s+(c.whatsappHistory?.filter(m=>m.dir==="out").length||0),0),
      pipeline: agentLeads.reduce((s,c)=>{
        const v = {"Under 10k":5000,"10k-50k":30000,"50k-100k":75000,"100k-500k":300000,"500k+":750000}[c.budget]||0;
        return s+v;
      },0),
      statuses: [...new Set(agentLeads.map(c=>c.leadStatus))].join(", "),
      recentNotes: agentLeads.slice(0,5).map(c=>`${c.name}(${c.leadStatus},score:${c.score}): ${c.notes?.slice(0,80)||"no notes"}`).join(" | ")
    };
    const teamAvgConv = Math.round((contacts.filter(c=>c.leadStatus==="Completed").length / Math.max(contacts.length,1))*100);
    const agentConv = stats.total ? Math.round((stats.completed/stats.total)*100) : 0;
    const prompt = `You are an expert investment sales coach. Analyse ${agentName}'s CRM data and create a focused 2-week action plan.

AGENT DATA:
- Total leads: ${stats.total} | Hot leads (Cat A): ${stats.hot}
- Conversion rate: ${agentConv}% (team avg: ${teamAvgConv}%)
- Calls booked: ${stats.booked} | No-shows: ${stats.noShow} | Completed: ${stats.completed}
- Avg lead score: ${stats.avgScore}/100 | WA messages sent: ${stats.waSent}
- Pipeline value: $${(stats.pipeline/1000).toFixed(0)}K
- Lead statuses: ${stats.statuses}
- Recent lead notes: ${stats.recentNotes}

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "headline": "One punchy sentence summarising their biggest opportunity",
  "diagnosis": "2-3 sentences: what the data reveals about their current performance pattern",
  "focusAction": "The ONE most impactful action to take for the next 2 weeks (be very specific)",
  "focusWhy": "Explain in 2 sentences exactly why this action will move the needle most",
  "weeklyTargets": [
    {"week": 1, "target": "Specific measurable goal for week 1", "metric": "e.g. 5 calls booked"},
    {"week": 2, "target": "Specific measurable goal for week 2", "metric": "e.g. 3 deals closed"}
  ],
  "dailyHabits": ["Habit 1 (specific, takes <15min)", "Habit 2", "Habit 3"],
  "watchOut": "One warning — the biggest thing that could derail them",
  "successLooks": "What success looks like in 2 weeks — concrete and measurable"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "x-api-key":claudeApiKey, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200, messages:[{ role:"user", content:prompt }] })
      });
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const plan = JSON.parse(clean);
      setFocusPlans(p => ({...p, [agentName]: { ...plan, generatedAt: new Date().toISOString(), agentName, progress: p[agentName]?.progress || {w1:false, w2:false, habits:[]}, checkIns: p[agentName]?.checkIns || [] }}));
      notify(`✅ Focus plan generated for ${agentName}`);
    } catch(e) {
      notify(`❌ Failed to generate plan — check API key`);
    }
    setFocusLoading(p => ({...p, [agentName]: false}));
  };

  const addCheckIn = (agentName, note) => {
    if (!note.trim()) return;
    setFocusPlans(p => ({...p, [agentName]: { ...p[agentName], checkIns: [...(p[agentName]?.checkIns||[]), { note, date: new Date().toLocaleDateString("en-GB"), ts: Date.now() }] }}));
  };

  const toggleProgress = (agentName, key) => {
    setFocusPlans(p => {
      const plan = p[agentName] || {};
      const progress = plan.progress || {};
      return {...p, [agentName]: {...plan, progress: {...progress, [key]: !progress[key]}}};
    });
  };

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
      if (!claudeApiKey) { setAiResult("⚠️ No Claude API key set. Go to Settings → AI Configuration to add your key."); setAiLoading(false); return; }
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":claudeApiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1400,messages:[{role:"user",content:prompts[mode]}]})});
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
        {[["performance","📊 Performance"],["focus","🎯 Focus Plans"],["agents","👤 Agent Cards"],["reassign","🔄 Reassign"]].map(([t,l])=>(
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

      {/* ══════════ FOCUS PLANS TAB ══════════ */}
      {activeTab==="focus"&&(
        <div>
          {/* Agent selector */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {TEAM_MEMBERS.map(name=>{
              const hasPlan = !!focusPlans[name];
              const color = {Alex:"#6366f1",Jamie:"#10b981",Sam:"#f59e0b",Jordan:"#3b82f6"}[name]||"#6366f1";
              return (
                <button key={name} onClick={()=>{ setFocusAgent(name); setCheckInNote(""); }}
                  style={{ padding:"10px 20px", borderRadius:10, border:`2px solid ${focusAgent===name?color:"#e2e8f0"}`, background:focusAgent===name?`${color}22`:"#fff", color:focusAgent===name?color:"#64748b", fontWeight:600, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                  {name}
                  {hasPlan && <span style={{ fontSize:10, background:color, color:"#fff", padding:"1px 6px", borderRadius:99 }}>plan active</span>}
                </button>
              );
            })}
          </div>

          {/* Generate / Refresh button */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700 }}>🎯 2-Week Focus Plan — {focusAgent}</div>
              {focusPlans[focusAgent]?.generatedAt && <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>Generated {new Date(focusPlans[focusAgent].generatedAt).toLocaleDateString("en-GB")}</div>}
            </div>
            <button className="btn btn-primary" style={{ opacity:focusLoading[focusAgent]?0.6:1 }}
              onClick={()=>generateFocusPlan(focusAgent)} disabled={focusLoading[focusAgent]}>
              {focusLoading[focusAgent] ? "⏳ Analysing…" : focusPlans[focusAgent] ? "🔄 Regenerate Plan" : "✨ Generate Focus Plan"}
            </button>
          </div>

          {!focusPlans[focusAgent] && !focusLoading[focusAgent] && (
            <div style={{ padding:"48px 24px", textAlign:"center", background:"#f8fafc", borderRadius:16, border:"2px dashed #e2e8f0" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
              <div style={{ fontSize:16, fontWeight:600, color:"#1e293b", marginBottom:8 }}>No focus plan yet for {focusAgent}</div>
              <div style={{ fontSize:14, color:"#64748b", marginBottom:20 }}>Claude will analyse {focusAgent}'s leads, conversion patterns, and activity to generate one clear 2-week action plan.</div>
              <button className="btn btn-primary" onClick={()=>generateFocusPlan(focusAgent)}>✨ Generate Focus Plan</button>
            </div>
          )}

          {focusLoading[focusAgent] && (
            <div style={{ padding:"48px 24px", textAlign:"center", background:"#f8fafc", borderRadius:16 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
              <div style={{ fontSize:15, fontWeight:600, color:"#6366f1" }}>Analysing {focusAgent}'s performance data…</div>
              <div style={{ fontSize:13, color:"#94a3b8", marginTop:8 }}>Reviewing leads, conversion patterns, activity and pipeline</div>
            </div>
          )}

          {focusPlans[focusAgent] && !focusLoading[focusAgent] && (()=>{
            const plan = focusPlans[focusAgent];
            const prog = plan.progress || {};
            const color = {Alex:"#6366f1",Jamie:"#10b981",Sam:"#f59e0b",Jordan:"#3b82f6"}[focusAgent]||"#6366f1";
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Headline card */}
                <div style={{ padding:24, background:`linear-gradient(135deg,${color}15,${color}08)`, border:`2px solid ${color}33`, borderRadius:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color, letterSpacing:1, marginBottom:8 }}>AI DIAGNOSIS</div>
                  <div style={{ fontSize:17, fontWeight:700, color:"#1e293b", marginBottom:10 }}>{plan.headline}</div>
                  <div style={{ fontSize:14, color:"#475569", lineHeight:1.7 }}>{plan.diagnosis}</div>
                </div>

                {/* THE ONE FOCUS ACTION */}
                <div style={{ padding:24, background:"#fff", border:"2px solid #6366f1", borderRadius:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#6366f1", letterSpacing:1, marginBottom:10 }}>🎯 THE ONE FOCUS ACTION</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"#1e293b", marginBottom:10 }}>{plan.focusAction}</div>
                  <div style={{ fontSize:14, color:"#64748b", lineHeight:1.7, marginBottom:16 }}>{plan.focusWhy}</div>
                  <div style={{ padding:"10px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#475569" }}>
                    ✅ <strong>Success looks like:</strong> {plan.successLooks}
                  </div>
                </div>

                {/* Weekly targets */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {(plan.weeklyTargets||[]).map(w=>(
                    <div key={w.week} style={{ padding:20, background:prog[`w${w.week}`]?"#f0fdf4":"#fff", border:`2px solid ${prog[`w${w.week}`]?"#86efac":"#e2e8f0"}`, borderRadius:14, cursor:"pointer", transition:"all 0.2s" }}
                      onClick={()=>toggleProgress(focusAgent,`w${w.week}`)}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", letterSpacing:1 }}>WEEK {w.week}</div>
                        <span style={{ fontSize:18 }}>{prog[`w${w.week}`]?"✅":"⬜"}</span>
                      </div>
                      <div style={{ fontSize:14, fontWeight:600, color:"#1e293b", marginBottom:6 }}>{w.target}</div>
                      <div style={{ fontSize:12, color:"#6366f1", fontWeight:600 }}>📊 {w.metric}</div>
                    </div>
                  ))}
                </div>

                {/* Daily habits */}
                <div style={{ padding:20, background:"#fff", border:"1px solid #e2e8f0", borderRadius:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#64748b", marginBottom:14, letterSpacing:1 }}>⚡ DAILY HABITS (tick when done today)</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {(plan.dailyHabits||[]).map((h,i)=>(
                      <div key={i} onClick={()=>toggleProgress(focusAgent,`h${i}`)}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:prog[`h${i}`]?"#f0fdf4":"#f8fafc", border:`1px solid ${prog[`h${i}`]?"#bbf7d0":"#e2e8f0"}`, borderRadius:10, cursor:"pointer", transition:"all 0.15s" }}>
                        <span style={{ fontSize:18, flexShrink:0 }}>{prog[`h${i}`]?"✅":"⬜"}</span>
                        <span style={{ fontSize:14, color:prog[`h${i}`]?"#16a34a":"#1e293b", fontWeight:prog[`h${i}`]?600:400 }}>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Watch out */}
                <div style={{ padding:16, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:12, display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:20 }}>⚠️</span>
                  <div><div style={{ fontSize:13, fontWeight:700, color:"#92400e", marginBottom:4 }}>WATCH OUT</div><div style={{ fontSize:14, color:"#78350f" }}>{plan.watchOut}</div></div>
                </div>

                {/* Check-ins log */}
                <div style={{ padding:20, background:"#fff", border:"1px solid #e2e8f0", borderRadius:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#64748b", marginBottom:14, letterSpacing:1 }}>💬 PROGRESS CHECK-INS</div>
                  {(plan.checkIns||[]).length === 0 && <div style={{ fontSize:13, color:"#94a3b8", marginBottom:12 }}>No check-ins yet. Add your first update below.</div>}
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                    {(plan.checkIns||[]).map((ci,i)=>(
                      <div key={i} style={{ padding:"10px 14px", background:"#f8fafc", borderRadius:10, border:"1px solid #e2e8f0" }}>
                        <div style={{ fontSize:12, color:"#94a3b8", marginBottom:4 }}>{ci.date}</div>
                        <div style={{ fontSize:14, color:"#1e293b" }}>{ci.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <input value={checkInNote} onChange={e=>setCheckInNote(e.target.value)}
                      placeholder="Add a progress note, win, or challenge…" style={{ flex:1 }}
                      onKeyDown={e=>{ if(e.key==="Enter"&&checkInNote.trim()){ addCheckIn(focusAgent,checkInNote); setCheckInNote(""); }}} />
                    <button className="btn btn-primary" style={{ whiteSpace:"nowrap" }} onClick={()=>{ if(checkInNote.trim()){ addCheckIn(focusAgent,checkInNote); setCheckInNote(""); }}}>Add Note</button>
                  </div>
                </div>

              </div>
            );
          })()}
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


// ─── WA ACTIVITY VIEW ──────────────────────────────────────────────────────────

// Timezone offset map (hours from UTC)
const TZ_OFFSETS = {
  "GMT":0,"UTC":0,"BST":1,"IST_IE":1,
  "EST":-5,"EDT":-4,"CST":-6,"CDT":-5,"MST":-7,"PST":-8,"PDT":-7,
  "IST":5.5,"GST":4,"AST":3,"EET":2,"CET":1,"CEST":2,
  "WAT":1,"EAT":3,"ICT":7,"SGT":8,"HKT":8,"JST":9,"AEST":10,"AEDT":11,"NZST":12
};
const TZ_LIST = Object.keys(TZ_OFFSETS);

function convertTime(timeStr, fromTZ, toTZ) {
  // timeStr: "10:00 AM" or "10:00"
  if (!timeStr || !fromTZ || !toTZ) return timeStr;
  try {
    const from = TZ_OFFSETS[fromTZ.split(" ")[0]] ?? 0;
    const to   = TZ_OFFSETS[toTZ.split(" ")[0]]   ?? 0;
    const [t, ampm] = timeStr.split(" ");
    let [h, m] = t.split(":").map(Number);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    let utcH = h - from;
    let localH = utcH + to;
    // wrap
    while (localH < 0) localH += 24;
    while (localH >= 24) localH -= 24;
    const suffix = localH < 12 ? "AM" : "PM";
    const display = localH % 12 === 0 ? 12 : localH % 12;
    return `${display}:${String(m).padStart(2,"0")} ${suffix}`;
  } catch { return timeStr; }
}

function formatSlotDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" });
}

function WAActivityView({ contacts, waTemplates, setWaTemplates, onGoToContact, onSendQuick, notify }) {
  const [activeTab, setActiveTab] = useState("conversations");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name:"", body:"" });
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name:"", body:"" });

  // Send modal state
  const [sendModal, setSendModal] = useState(null);
  const [sendStep, setSendStep] = useState("setup"); // "setup" | "preview"
  const [selectedContactId, setSelectedContactId] = useState("");
  const [agentTZ, setAgentTZ] = useState("GMT");
  const [meetingLink, setMeetingLink] = useState("");
  const [slots, setSlots] = useState([]); // [{date, time, id}]
  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [sendMode, setSendMode] = useState("slots"); // "slots" | "fixed"
  const [fixedDate, setFixedDate] = useState("");
  const [fixedTime, setFixedTime] = useState("");

  const QUICK_TIMES = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM"];
  const today = new Date().toISOString().split("T")[0];

  const selectedC = contacts.find(c => c.id === parseInt(selectedContactId));
  const contactTZ = selectedC?.timezone?.split(" ")[0] || "GMT";

  const addSlot = () => {
    if (!slotDate || !slotTime) return;
    if (slots.find(s => s.date === slotDate && s.time === slotTime)) return;
    setSlots(p => [...p, { id: Date.now(), date: slotDate, time: slotTime }]);
    setSlotTime("");
  };

  const removeSlot = (id) => setSlots(p => p.filter(s => s.id !== id));

  const buildSlotsMessage = () => {
    if (!selectedC) return "";
    const name = selectedC.name.split(" ")[0];
    const cTZ = contactTZ;
    const sorted = [...slots].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const slotLines = sorted.map((s,i) => {
      const converted = convertTime(s.time, agentTZ, cTZ);
      return `  ${i+1}. ${formatSlotDate(s.date)} at ${converted} ${cTZ !== agentTZ ? `(${s.time} ${agentTZ})` : agentTZ}`;
    }).join("\n");
    const link = meetingLink ? `\n\nJoin here: ${meetingLink}` : "";
    return `Hi ${name}! 👋 I'd love to schedule a call with you.\n\nHere are some times that work for me — please let me know which suits you best:\n\n${slotLines}\n\nJust reply with your preferred option and I'll send over a confirmation!${link}`;
  };

  const buildFixedMessage = () => {
    if (!selectedC) return "";
    const name = selectedC.name.split(" ")[0];
    const cTZ = contactTZ;
    const converted = convertTime(fixedTime, agentTZ, cTZ);
    const timeDisplay = cTZ !== agentTZ ? `${converted} ${cTZ} (${fixedTime} ${agentTZ})` : `${fixedTime} ${agentTZ}`;
    return sendModal?.body
      ? sendModal.body
          .replace(/{{name}}/g, name)
          .replace(/{{date}}/g, fixedDate ? formatSlotDate(fixedDate) : "TBD")
          .replace(/{{time}}/g, fixedTime ? timeDisplay : "TBD")
          .replace(/{{timezone}}/g, cTZ)
          .replace(/{{link}}/g, meetingLink || selectedC.meetingLink || "#")
      : "";
  };

  const finalMessage = sendMode === "slots" ? buildSlotsMessage() : buildFixedMessage();

  const conversations = contacts.filter(c=>c.whatsappHistory?.length>0)
    .sort((a,b)=>{ const la=a.whatsappHistory[a.whatsappHistory.length-1]?.time||""; const lb=b.whatsappHistory[b.whatsappHistory.length-1]?.time||""; return lb.localeCompare(la); });

  const openSendModal = (tpl) => {
    setSendModal(tpl);
    setSendStep("setup");
    setSelectedContactId("");
    setAgentTZ("GMT");
    setMeetingLink("");
    setSlots([]);
    setSlotDate("");
    setSlotTime("");
    setSendMode(tpl.body?.includes("{{time}}") ? "slots" : "fixed");
    setFixedDate("");
    setFixedTime("");
  };

  return (
    <div style={{ padding:28 }} className="fade-in">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:700 }}>WhatsApp</h1>
        <button className="btn btn-primary" onClick={()=>setShowAddTemplate(true)}>+ New Template</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f8fafc", padding:4, borderRadius:10, width:"fit-content" }}>
        {[["conversations","💬 Conversations"],["templates","📋 Templates"]].map(([t,l])=>(
          <button key={t} className={`tab ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>{l}</button>
        ))}
      </div>

      {/* CONVERSATIONS */}
      {activeTab==="conversations" && (
        <div className="card" style={{ padding:20 }}>
          {conversations.length===0 && <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>No WhatsApp conversations yet</div>}
          {conversations.map(c=>{
            const last = c.whatsappHistory[c.whatsappHistory.length-1];
            return (
              <div key={c.id} style={{ display:"flex", gap:14, padding:"14px 0", borderBottom:"1px solid #f1f5f9", cursor:"pointer", alignItems:"center" }} onClick={()=>onGoToContact(c)}>
                <div style={{ width:48, height:48, background:"linear-gradient(135deg,#25d366,#128c7e)", borderRadius:50, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💬</div>
                <div style={{ flex:1, overflow:"hidden" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:15, fontWeight:600 }}>{c.name}</span>
                    <span style={{ fontSize:12, color:"#94a3b8" }}>{last.time?.split(" ")[0]}</span>
                  </div>
                  <div style={{ fontSize:13, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>
                    {last.msg?.startsWith("__TEMPLATE__") ? "📋 Template message sent" : last.msg}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <span style={{ fontSize:11, color:"#94a3b8" }}>→ {c.assignedTo}</span>
                    <span className="pill" style={{ fontSize:10, background:last.status==="delivered"?"#dcfce7":last.status==="failed"?"#fee2e2":"#f1f5f9", color:last.status==="delivered"?"#16a34a":last.status==="failed"?"#dc2626":"#94a3b8", padding:"1px 6px" }}>{last.status||"sent"}</span>
                  </div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize:12, whiteSpace:"nowrap", flexShrink:0 }} onClick={e=>{ e.stopPropagation(); onGoToContact(c); }}>Open →</button>
              </div>
            );
          })}
        </div>
      )}

      {/* TEMPLATES */}
      {activeTab==="templates" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ padding:"10px 16px", background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:10, fontSize:13, color:"#5b21b6" }}>
            💡 Use <code style={{ background:"#ddd6fe", padding:"1px 5px", borderRadius:4 }}>{"{{name}}"}</code> <code style={{ background:"#ddd6fe", padding:"1px 5px", borderRadius:4 }}>{"{{date}}"}</code> <code style={{ background:"#ddd6fe", padding:"1px 5px", borderRadius:4 }}>{"{{time}}"}</code> <code style={{ background:"#ddd6fe", padding:"1px 5px", borderRadius:4 }}>{"{{timezone}}"}</code> <code style={{ background:"#ddd6fe", padding:"1px 5px", borderRadius:4 }}>{"{{link}}"}</code> — auto-filled when you send
          </div>
          {waTemplates.map(tpl=>(
            <div key={tpl.id} className="card" style={{ padding:20 }}>
              {editingId===tpl.id ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <input value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} style={{ fontWeight:700, fontSize:15 }} placeholder="Template name" />
                  <textarea value={editForm.body} onChange={e=>setEditForm(f=>({...f,body:e.target.value}))} style={{ minHeight:120, resize:"vertical", fontSize:14, lineHeight:1.7 }} />
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    <button className="btn btn-ghost" onClick={()=>setEditingId(null)}>Cancel</button>
                    <button className="btn btn-primary" onClick={()=>{ setWaTemplates(p=>p.map(t=>t.id===tpl.id?{...t,...editForm}:t)); setEditingId(null); notify("✅ Template saved"); }}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#1e293b", marginBottom:3 }}>{tpl.name}</div>
                      {tpl.isDefault && <span className="pill" style={{ fontSize:10, background:"#f1f5f9", color:"#94a3b8" }}>default</span>}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn btn-ghost" style={{ fontSize:12, padding:"6px 12px" }} onClick={()=>{ setEditingId(tpl.id); setEditForm({ name:tpl.name, body:tpl.body }); }}>✏️ Edit</button>
                      <button style={{ padding:"6px 14px", borderRadius:8, border:"none", background:"#25d366", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }} onClick={()=>openSendModal(tpl)}>💬 Send</button>
                      {!tpl.isDefault && <button className="btn btn-ghost" style={{ fontSize:12, padding:"6px 10px", color:"#ef4444" }} onClick={()=>{ if(window.confirm(`Delete "${tpl.name}"?`)) setWaTemplates(p=>p.filter(t=>t.id!==tpl.id)); }}>🗑️</button>}
                    </div>
                  </div>
                  <div style={{ fontSize:14, color:"#64748b", lineHeight:1.8, whiteSpace:"pre-wrap", background:"#f8fafc", borderRadius:8, padding:"12px 14px", border:"1px solid #f1f5f9" }}>{tpl.body}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD TEMPLATE MODAL */}
      {showAddTemplate && (
        <div className="overlay" onClick={()=>setShowAddTemplate(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ fontSize:17, fontWeight:700 }}>New Template</div>
              <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={()=>setShowAddTemplate(false)}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5 }}>Template Name</label>
                <input value={newTemplate.name} onChange={e=>setNewTemplate(f=>({...f,name:e.target.value}))} placeholder="e.g. Follow Up After Call" style={{ width:"100%" }} />
              </div>
              <div>
                <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5 }}>Message Body</label>
                <textarea value={newTemplate.body} onChange={e=>setNewTemplate(f=>({...f,body:e.target.value}))}
                  style={{ width:"100%", minHeight:140, resize:"vertical" }}
                  placeholder={"Hi {{name}}! Great speaking with you.\n\nI'd love to schedule a follow-up call.\n\n{{link}}"} />
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{"Use {{name}} {{date}} {{time}} {{timezone}} {{link}}"}</div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
                <button className="btn btn-ghost" onClick={()=>setShowAddTemplate(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={()=>{
                  if(!newTemplate.name.trim()||!newTemplate.body.trim()) return;
                  setWaTemplates(p=>[...p,{id:`custom_${Date.now()}`,name:newTemplate.name,body:newTemplate.body,isDefault:false}]);
                  setNewTemplate({name:"",body:""}); setShowAddTemplate(false); notify("✅ Template created");
                }}>Create Template</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ SEND MODAL ═══════════ */}
      {sendModal && (
        <div className="overlay" onClick={()=>setSendModal(null)}>
          <div className="modal" style={{ maxWidth:580, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700 }}>💬 {sendModal.name}</div>
                <div style={{ fontSize:13, color:"#64748b", marginTop:3 }}>Fill in details, then preview and send</div>
              </div>
              <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={()=>setSendModal(null)}>✕</button>
            </div>

            {/* Contact picker */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>📇 Contact *</label>
              <select value={selectedContactId} onChange={e=>setSelectedContactId(e.target.value)} style={{ width:"100%" }}>
                <option value="">— Choose a contact —</option>
                {contacts.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone||"no phone"} · {c.timezone||"?"} timezone ({c.assignedTo})</option>)}
              </select>
              {selectedC && (
                <div style={{ marginTop:8, padding:"8px 12px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, fontSize:13, color:"#166534" }}>
                  ✅ {selectedC.name} is in <strong>{contactTZ}</strong> timezone
                </div>
              )}
            </div>

            {/* Agent timezone */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>🌍 Your Timezone (agent)</label>
              <select value={agentTZ} onChange={e=>setAgentTZ(e.target.value)} style={{ width:"100%" }}>
                {TZ_LIST.map(tz=><option key={tz} value={tz}>{tz} (UTC{TZ_OFFSETS[tz]>=0?"+":""}{ TZ_OFFSETS[tz]})</option>)}
              </select>
              {selectedC && agentTZ !== contactTZ && (
                <div style={{ marginTop:6, fontSize:12, color:"#6366f1", padding:"6px 10px", background:"#ede9fe", borderRadius:6 }}>
                  ⚡ Times will be automatically converted from <strong>{agentTZ}</strong> → <strong>{contactTZ}</strong> for {selectedC.name.split(" ")[0]}
                </div>
              )}
            </div>

            {/* Mode toggle */}
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={()=>setSendMode("slots")} style={{ flex:1, padding:"10px", borderRadius:9, border:`2px solid ${sendMode==="slots"?"#6366f1":"#e2e8f0"}`, background:sendMode==="slots"?"#ede9fe":"#f8fafc", color:sendMode==="slots"?"#4338ca":"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                🗓️ Offer Time Slots<br/><span style={{ fontSize:11, fontWeight:400 }}>Let them pick what works</span>
              </button>
              <button onClick={()=>setSendMode("fixed")} style={{ flex:1, padding:"10px", borderRadius:9, border:`2px solid ${sendMode==="fixed"?"#6366f1":"#e2e8f0"}`, background:sendMode==="fixed"?"#ede9fe":"#f8fafc", color:sendMode==="fixed"?"#4338ca":"#64748b", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                📌 Fixed Time<br/><span style={{ fontSize:11, fontWeight:400 }}>One confirmed slot</span>
              </button>
            </div>

            {/* SLOT MODE */}
            {sendMode==="slots" && (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:8 }}>🗓️ Add your available slots <span style={{ fontWeight:400, color:"#94a3b8" }}>(your local time — auto-converts for contact)</span></label>

                {/* Slot adder */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginBottom:12, alignItems:"end" }}>
                  <div>
                    <label style={{ fontSize:12, color:"#94a3b8", display:"block", marginBottom:4 }}>Date</label>
                    <input type="date" value={slotDate} onChange={e=>setSlotDate(e.target.value)} min={today} style={{ width:"100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:"#94a3b8", display:"block", marginBottom:4 }}>Time ({agentTZ})</label>
                    <select value={slotTime} onChange={e=>setSlotTime(e.target.value)} style={{ width:"100%" }}>
                      <option value="">— Pick time —</option>
                      {QUICK_TIMES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" style={{ padding:"10px 16px", whiteSpace:"nowrap" }} onClick={addSlot} disabled={!slotDate||!slotTime}>+ Add</button>
                </div>

                {/* Slots list */}
                {slots.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {[...slots].sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).map((s,i)=>{
                      const converted = selectedC && agentTZ !== contactTZ ? convertTime(s.time, agentTZ, contactTZ) : null;
                      return (
                        <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:9 }}>
                          <div>
                            <span style={{ fontSize:14, fontWeight:600, color:"#1e293b" }}>Slot {i+1}: {formatSlotDate(s.date)} · {s.time} {agentTZ}</span>
                            {converted && <span style={{ fontSize:13, color:"#6366f1", marginLeft:10 }}>= {converted} {contactTZ} for {selectedC?.name?.split(" ")[0]}</span>}
                          </div>
                          <button onClick={()=>removeSlot(s.id)} style={{ background:"none", border:"none", color:"#ef4444", fontSize:16, cursor:"pointer" }}>✕</button>
                        </div>
                      );
                    })}
                    {slots.length < 2 && <div style={{ fontSize:12, color:"#f59e0b", padding:"6px 10px", background:"#fffbeb", borderRadius:6 }}>💡 Add at least 2-3 slots to give the prospect a real choice</div>}
                  </div>
                )}
                {slots.length === 0 && <div style={{ textAlign:"center", padding:"20px", color:"#94a3b8", fontSize:13, background:"#f8fafc", borderRadius:8 }}>Add slots above — they'll appear in the message</div>}
              </div>
            )}

            {/* FIXED MODE */}
            {sendMode==="fixed" && (
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:8 }}>📌 Confirmed time <span style={{ fontWeight:400, color:"#94a3b8" }}>(your local time)</span></label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:12, color:"#94a3b8", display:"block", marginBottom:4 }}>Date</label>
                    <input type="date" value={fixedDate} onChange={e=>setFixedDate(e.target.value)} min={today} style={{ width:"100%" }} />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:"#94a3b8", display:"block", marginBottom:4 }}>Time ({agentTZ})</label>
                    <select value={fixedTime} onChange={e=>setFixedTime(e.target.value)} style={{ width:"100%" }}>
                      <option value="">— Pick time —</option>
                      {QUICK_TIMES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                {selectedC && fixedTime && agentTZ !== contactTZ && (
                  <div style={{ marginTop:8, padding:"8px 12px", background:"#ede9fe", borderRadius:8, fontSize:13, color:"#5b21b6" }}>
                    ⚡ {selectedC.name.split(" ")[0]} will see this as <strong>{convertTime(fixedTime, agentTZ, contactTZ)} {contactTZ}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Meeting link */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:6 }}>🔗 Meeting Link <span style={{ fontWeight:400, color:"#94a3b8" }}>(optional)</span></label>
              <input value={meetingLink} onChange={e=>setMeetingLink(e.target.value)} placeholder="https://cal.com/yourname or https://zoom.us/j/…" style={{ width:"100%" }} />
            </div>

            {/* Message preview */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#475569", marginBottom:8 }}>👁️ Message Preview</div>
              <div style={{ padding:"14px 16px", background:"#dcfce7", borderRadius:14, borderBottomRightRadius:4, fontSize:14, lineHeight:1.9, color:"#166534", whiteSpace:"pre-wrap", border:"1px solid #bbf7d0", minHeight:80 }}>
                {finalMessage || <span style={{ color:"#94a3b8", fontStyle:"italic" }}>{selectedC ? (sendMode==="slots" ? "Add slots above to see preview…" : "Pick a date and time to see preview…") : "Select a contact to preview…"}</span>}
              </div>
            </div>

            {/* 24hr note for slot mode */}
            {sendMode==="slots" && selectedC && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, fontSize:13, color:"#92400e" }}>
                ⚠️ <strong>First contact?</strong> This is a free-form message — only works if {selectedC.name.split(" ")[0]} has messaged you in the last 24hrs. For cold outreach, use the <strong>Template tab</strong> on the contact's WA button instead.
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
              <button className="btn btn-ghost" onClick={()=>setSendModal(null)}>Cancel</button>
              <button style={{ padding:"11px 22px", borderRadius:9, border:"none", background: selectedC && finalMessage ? "#25d366" : "#94a3b8", color:"#fff", fontWeight:700, fontSize:15, cursor: selectedC && finalMessage ? "pointer" : "not-allowed", display:"flex", alignItems:"center", gap:8 }}
                disabled={!selectedC || !finalMessage}
                onClick={()=>{ if(!selectedC||!finalMessage) return; onSendQuick(selectedC, finalMessage); setSendModal(null); }}>
                💬 Send Message
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}


// ─── CSV IMPORT MODAL ──────────────────────────────────────────────────────────
const CSV_TEMPLATE_HEADERS = ["name","phone","email","company","source","budget","timeline","isDecisionMaker","interestLevel","leadStatus","assignedTo","notes"];
const CSV_TEMPLATE_SAMPLE = [
  ["Paddy Farren","+353861234567","paddy@example.com","Farren Capital","LinkedIn","500k+","1 month","true","5","New Lead","Alex","Referred by David. Very interested."],
  ["Sarah O'Brien","+447700900123","sarah@obrien.io","O'Brien Investments","Referral","100k-500k","3 months","false","3","Contacted","Jamie","Warm lead from event."],
  ["James Murphy","+1 555 010 0200","james@murphy.com","Murphy Fund","Cold Call","10k-50k","6 months","true","2","New Lead","Sam","Early stage, needs nurturing."],
];

function CSVImportModal({ onImport, onClose }) {
  const [step, setStep] = useState("choose"); // choose | preview | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef(null);

  const downloadTemplate = () => {
    const csv = [CSV_TEMPLATE_HEADERS, ...CSV_TEMPLATE_SAMPLE].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clearcrm_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return { rows:[], errors:["File appears empty — need at least a header row and one data row."] };
    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g,"").trim().toLowerCase());
    const errs = [];
    const parsed = [];
    lines.slice(1).forEach((line, i) => {
      const vals = [];
      let inQ = false, cur = "";
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      vals.push(cur.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = (vals[idx] || "").replace(/^"|"$/g,"").trim(); });
      if (!row.name) { errs.push(`Row ${i+2}: missing name — skipped`); return; }
      if (!row.phone) { errs.push(`Row ${i+2} (${row.name}): missing phone — skipped`); return; }
      parsed.push({
        id: Date.now() + i,
        name: row.name || "",
        phone: row.phone || "",
        email: row.email || "",
        company: row.company || "",
        source: SOURCES.includes(row.source) ? row.source : "Other",
        budget: BUDGET_OPTIONS.includes(row.budget) ? row.budget : "Unknown",
        timeline: TIMELINE_OPTIONS.includes(row.timeline) ? row.timeline : "Unknown",
        isDecisionMaker: row.isdecisionmaker === "true" || row.isdecisionmaker === "yes" || row.isdecisionmaker === "1",
        interestLevel: Math.min(5, Math.max(1, parseInt(row.interestlevel) || 3)),
        leadStatus: WORKFLOW_STAGES.includes(row.leadstatus) ? row.leadstatus : "New Lead",
        assignedTo: TEAM_MEMBERS.includes(row.assignedto) ? row.assignedto : TEAM_MEMBERS[0],
        notes: row.notes || "",
        score: 40, category: "C",
        scoreBreakdown: { budget:10, timeline:10, responsiveness:8, decisionMaker:10, engagement:7 },
        callStatus: null, callDate: null, callTime: null, timezone: "", meetingLink: "", callNotes: "",
        whatsappHistory: []
      });
    });
    return { rows: parsed, errors: errs };
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const { rows: parsed, errors: errs } = parseCSV(e.target.result);
      setRows(parsed); setErrors(errs);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:620, maxHeight:"85vh", overflow:"auto" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:700 }}>Import Contacts from CSV</div>
            <div style={{ fontSize:13, color:"#64748b" }}>Upload a spreadsheet to bulk-add contacts</div>
          </div>
          <button className="btn btn-ghost" style={{ padding:"4px 10px" }} onClick={onClose}>✕</button>
        </div>

        {step === "choose" && (
          <div>
            {/* Step 1 — download template */}
            <div style={{ padding:"16px 18px", background:"#ede9fe", border:"1px solid #c4b5fd", borderRadius:12, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#5b21b6", marginBottom:6 }}>Step 1 — Download the template</div>
              <div style={{ fontSize:13, color:"#6d28d9", marginBottom:12 }}>Use our CSV template to make sure your data imports correctly. Fill it in Excel, Google Sheets, or Numbers.</div>
              <button className="btn btn-primary" style={{ background:"#6366f1" }} onClick={downloadTemplate}>⬇️ Download CSV Template</button>
            </div>

            {/* Column guide */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#64748b", marginBottom:8 }}>Column reference:</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  ["name","Contact's full name","required"],
                  ["phone","International format e.g. +353…","required"],
                  ["email","Email address","optional"],
                  ["company","Company name","optional"],
                  ["source","LinkedIn / Referral / Cold Call / Event / Website / Other","optional"],
                  ["budget","Under 10k / 10k-50k / 50k-100k / 100k-500k / 500k+","optional"],
                  ["timeline","1 month / 3 months / 6 months / 12 months+ / Unknown","optional"],
                  ["isDecisionMaker","true or false","optional"],
                  ["interestLevel","1–5","optional"],
                  ["leadStatus","New Lead / Contacted / Call Booked / etc.","optional"],
                  ["assignedTo","Alex / Jamie / Sam / Jordan","optional"],
                  ["notes","Free text notes","optional"],
                ].map(([col, desc, req]) => (
                  <div key={col} style={{ display:"flex", gap:8, padding:"8px 10px", background:"#f8fafc", borderRadius:8, border:"1px solid #e2e8f0", fontSize:12 }}>
                    <span style={{ fontFamily:"DM Mono,monospace", color:"#6366f1", fontWeight:600, minWidth:100 }}>{col}</span>
                    <span style={{ color:"#64748b", flex:1 }}>{desc}</span>
                    <span style={{ color:req==="required"?"#ef4444":"#94a3b8", fontSize:11, fontWeight:600 }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — upload */}
            <div style={{ padding:"16px 18px", background:"#f0fdf4", border:"2px dashed #86efac", borderRadius:12, marginBottom:16, textAlign:"center", cursor:"pointer" }}
              onClick={()=>fileRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:14, fontWeight:600, color:"#166534", marginBottom:4 }}>Step 2 — Upload your CSV</div>
              <div style={{ fontSize:13, color:"#16a34a" }}>Click to browse or drag & drop your .csv file here</div>
              <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div>
            <div style={{ padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>📄</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#166534" }}>{fileName}</div>
                <div style={{ fontSize:12, color:"#16a34a" }}>{rows.length} contacts ready to import{errors.length > 0 ? `, ${errors.length} rows skipped` : ""}</div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>{ setStep("choose"); setRows([]); setErrors([]); }}>← Change file</button>
            </div>

            {errors.length > 0 && (
              <div style={{ padding:"10px 14px", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#92400e", marginBottom:6 }}>⚠️ {errors.length} row{errors.length>1?"s":""} skipped</div>
                {errors.map((e,i) => <div key={i} style={{ fontSize:12, color:"#b45309", marginBottom:2 }}>• {e}</div>)}
              </div>
            )}

            {rows.length === 0 ? (
              <div style={{ padding:"20px", textAlign:"center", color:"#ef4444", fontSize:14 }}>❌ No valid rows found. Check your file matches the template format.</div>
            ) : (
              <div style={{ border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden", marginBottom:16 }}>
                <div style={{ overflowX:"auto", maxHeight:320 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead style={{ background:"#f8fafc", position:"sticky", top:0 }}>
                      <tr>{["Name","Phone","Email","Company","Budget","Assigned To","Status"].map(h=>(
                        <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#64748b", borderBottom:"1px solid #e2e8f0", whiteSpace:"nowrap" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {rows.map((r,i) => (
                        <tr key={r.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"#fff":"#fafafa" }}>
                          <td style={{ padding:"9px 12px", fontWeight:500 }}>{r.name}</td>
                          <td style={{ padding:"9px 12px", fontFamily:"DM Mono,monospace", fontSize:12 }}>{r.phone}</td>
                          <td style={{ padding:"9px 12px", color:"#64748b" }}>{r.email||"—"}</td>
                          <td style={{ padding:"9px 12px", color:"#64748b" }}>{r.company||"—"}</td>
                          <td style={{ padding:"9px 12px" }}>{r.budget}</td>
                          <td style={{ padding:"9px 12px" }}><span style={{ padding:"2px 8px", background:"#ede9fe", color:"#6366f1", borderRadius:99, fontSize:12 }}>{r.assignedTo}</span></td>
                          <td style={{ padding:"9px 12px", color:"#64748b", fontSize:12 }}>{r.leadStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, color:"#64748b" }}>Importing <strong>{rows.length}</strong> contacts</div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" style={{ opacity:rows.length>0?1:0.4 }} onClick={()=>{ if(rows.length>0) onImport(rows); }}>
                  ✅ Import {rows.length} Contact{rows.length!==1?"s":""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADD CONTACT FORM ──────────────────────────────────────────────────────────
function AddContactForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ name:"", phone:"", email:"", company:"", source:"LinkedIn", notes:"", budget:"Unknown", timeline:"Unknown", isDecisionMaker:false, interestLevel:3, leadStatus:"New Lead", assignedTo:"Alex" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const canSave = form.name.trim() && form.phone.trim();
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Name + Phone — top priority */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Full Name *</label>
          <input value={form.name} onChange={e=>set("name",e.target.value)} style={{ width:"100%" }} placeholder="Jane Smith" />
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>
            Phone * <span style={{ color:"#25d366", fontSize:11, fontWeight:400 }}>← required for WhatsApp</span>
          </label>
          <input type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} style={{ width:"100%", borderColor: form.phone?"#e2e8f0":"#fca5a5" }} placeholder="+1 555 000 0000" />
          {!form.phone && <div style={{ fontSize:11, color:"#f97316", marginTop:3 }}>Enter in international format e.g. +44 7700 123456</div>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Email</label>
          <input value={form.email} onChange={e=>set("email",e.target.value)} style={{ width:"100%" }} placeholder="jane@company.com" />
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Company</label>
          <input value={form.company} onChange={e=>set("company",e.target.value)} style={{ width:"100%" }} placeholder="Acme Capital" />
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Source</label>
          <select value={form.source} onChange={e=>set("source",e.target.value)} style={{ width:"100%" }}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Assign To</label>
          <select value={form.assignedTo} onChange={e=>set("assignedTo",e.target.value)} style={{ width:"100%" }}>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select>
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Budget</label>
          <select value={form.budget} onChange={e=>set("budget",e.target.value)} style={{ width:"100%" }}>{BUDGET_OPTIONS.map(b=><option key={b}>{b}</option>)}</select>
        </div>
        <div>
          <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Timeline</label>
          <select value={form.timeline} onChange={e=>set("timeline",e.target.value)} style={{ width:"100%" }}>{TIMELINE_OPTIONS.map(t=><option key={t}>{t}</option>)}</select>
        </div>
      </div>
      <label style={{ display:"flex", alignItems:"center", gap:10, fontSize:14, cursor:"pointer" }}>
        <input type="checkbox" checked={form.isDecisionMaker} onChange={e=>set("isDecisionMaker",e.target.checked)} style={{ width:16, height:16, accentColor:"#6366f1" }} />
        <span style={{ color:"#475569" }}>Decision Maker</span>
      </label>
      <div>
        <label style={{ fontSize:13, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Notes</label>
        <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{ width:"100%", minHeight:70, resize:"none", background:"#f8fafc" }} placeholder="Initial notes about this lead…" />
      </div>
      {!canSave && <div style={{ fontSize:12, color:"#f97316", padding:"8px 12px", background:"#fff7ed", borderRadius:8, border:"1px solid #fed7aa" }}>⚠️ Name and phone number are required to save a contact</div>}
      <div style={{ display:"flex", justifyContent:"flex-end", gap:10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" style={{ opacity:canSave?1:0.5 }} onClick={()=>{ if(canSave) onSave(form); }}>Save Contact</button>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATIONS PANEL — drop this component into ClearCRM Settings page
//
// USAGE IN App.jsx:
//   1. Copy this entire component into App.jsx (before AdminApp)
//   2. In the Settings view, add:
//      <IntegrationsPanel notify={notify} contacts={contacts} setContacts={setContacts} users={users} />
// ═══════════════════════════════════════════════════════════════════════════

function IntegrationsPanel({ notify, contacts, setContacts, users }) {
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("clearcrm_integrations") || "{}"); } catch { return {}; }
  });
  const [activeTab, setActiveTab] = useState("supabase");
  const [testing, setTesting] = useState(null);
  const [testResult, setTestResult] = useState({});

  const save = (section, updates) => {
    const next = { ...config, [section]: { ...(config[section] || {}), ...updates } };
    setConfig(next);
    localStorage.setItem("clearcrm_integrations", JSON.stringify(next));
    notify("✅ Saved");
  };

  const TABS = [
    { id:"supabase",  label:"Supabase",  icon:"🗄️",  color:"#3ecf8e" },
    { id:"calendly",  label:"Calendly",  icon:"📅",  color:"#006bff" },
    { id:"sumsub",    label:"Sumsub KYC",icon:"🔍",  color:"#f59e0b" },
    { id:"cloudtalk", label:"Cloudtalk", icon:"📞",  color:"#6366f1" },
    { id:"status",    label:"Live Status",icon:"🟢", color:"#10b981" },
  ];

  return (
    <div className="card" style={{ padding:24, marginBottom:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <div style={{ width:36,height:36,background:"#10b98122",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🔌</div>
        <div>
          <div style={{ fontSize:15,fontWeight:700 }}>Integrations</div>
          <div style={{ fontSize:13,color:"#64748b" }}>Connect Supabase, Calendly, Sumsub KYC and Cloudtalk</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, borderBottom:"2px solid #e2e8f0", marginBottom:24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ padding:"10px 18px",border:"none",borderBottom:`3px solid ${activeTab===t.id?t.color:"transparent"}`,marginBottom:-2,background:"transparent",color:activeTab===t.id?t.color:"#64748b",fontSize:13,fontWeight:activeTab===t.id?700:400,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6 }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── SUPABASE ── */}
      {activeTab==="supabase" && (
        <SupabaseTab config={config.supabase||{}} save={v=>save("supabase",v)} notify={notify} testing={testing} setTesting={setTesting} testResult={testResult} setTestResult={setTestResult} />
      )}

      {/* ── CALENDLY ── */}
      {activeTab==="calendly" && (
        <CalendlyTab config={config.calendly||{}} save={v=>save("calendly",v)} notify={notify} users={users} />
      )}

      {/* ── SUMSUB ── */}
      {activeTab==="sumsub" && (
        <SumsubTab config={config.sumsub||{}} save={v=>save("sumsub",v)} notify={notify} contacts={contacts} setContacts={setContacts} />
      )}

      {/* ── CLOUDTALK ── */}
      {activeTab==="cloudtalk" && (
        <CloudtalkTab config={config.cloudtalk||{}} save={v=>save("cloudtalk",v)} notify={notify} />
      )}

      {/* ── LIVE STATUS ── */}
      {activeTab==="status" && (
        <StatusTab config={config} />
      )}
    </div>
  );
}

// ─── SUPABASE TAB ─────────────────────────────────────────────────────────────
function SupabaseTab({ config, save, notify, testing, setTesting, testResult, setTestResult }) {
  const [url, setUrl]   = useState(config.url   || SUPABASE_URL);
  const [anon, setAnon] = useState(config.anon  || SUPABASE_ANON);
  const [realtimeEnabled, setRealtimeEnabled] = useState(config.realtimeEnabled ?? true);

  const test = async () => {
    setTesting("supabase");
    try {
      const res = await fetch(`${url}/rest/v1/contacts?limit=1`, {
        headers: { "apikey": anon, "Authorization": `Bearer ${anon}` }
      });
      if (res.ok) {
        setTestResult(r => ({ ...r, supabase:"✅ Connected — database reachable" }));
        save({ url, anon, realtimeEnabled, connected: true });
      } else {
        const e = await res.json().catch(()=>({}));
        setTestResult(r => ({ ...r, supabase:`❌ ${e.message || "Check your URL and key"}` }));
      }
    } catch (e) {
      setTestResult(r => ({ ...r, supabase:`❌ ${e.message}` }));
    }
    setTesting(null);
  };

  return (
    <div>
      <InfoBox color="#3ecf8e" title="What Supabase does" items={[
        "Replaces localStorage — all agents share the same live data",
        "Real-time sync — updates appear instantly on every device",
        "Receives webhooks from Calendly, Sumsub and Cloudtalk",
        "Stores call logs, KYC events and WhatsApp history permanently",
      ]} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16, marginTop:20 }}>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Supabase Project URL</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://xxxx.supabase.co" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
        </div>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Anon / Public Key</label>
          <input type="password" value={anon} onChange={e=>setAnon(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <input type="checkbox" id="rt" checked={realtimeEnabled} onChange={e=>setRealtimeEnabled(e.target.checked)} />
        <label htmlFor="rt" style={{ fontSize:13,color:"#475569",cursor:"pointer" }}>Enable real-time sync (recommended — requires Realtime enabled in Supabase dashboard)</label>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <button className="btn btn-primary" onClick={()=>save({ url, anon, realtimeEnabled })}>Save</button>
        <button className="btn btn-ghost" onClick={test} style={{ opacity:(!url||!anon)?0.4:1 }} disabled={!url||!anon||testing==="supabase"}>
          {testing==="supabase" ? "Testing…" : "Test Connection"}
        </button>
      </div>

      {testResult.supabase && (
        <div style={{ padding:"10px 14px",borderRadius:8,background:testResult.supabase.startsWith("✅")?"#f0fdf4":"#fef2f2",fontSize:13,color:testResult.supabase.startsWith("✅")?"#16a34a":"#dc2626" }}>
          {testResult.supabase}
        </div>
      )}

      <SetupStep step="1" title="Run the SQL schema" description='Go to Supabase → SQL Editor → New Query, paste the contents of schema.sql and click Run. This creates all tables.' />
      <SetupStep step="2" title="Enable Realtime" description="Go to Supabase → Database → Replication → enable Realtime for: contacts, call_logs, kyc_events, calendly_events, whatsapp_messages" />
      <SetupStep step="3" title="Migrate your data" description="Once connected, click the Migrate button in the Live Status tab to move all contacts from localStorage to Supabase." />
    </div>
  );
}

// ─── CALENDLY TAB ─────────────────────────────────────────────────────────────
function CalendlyTab({ config, save, notify, users }) {
  const [apiKey, setApiKey]     = useState(config.apiKey || "");
  const [userUri, setUserUri]   = useState(config.userUri || "");
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || "");
  const [agentMap, setAgentMap] = useState(config.agentMap || {});

  const WEBHOOK_URL_PLACEHOLDER = "https://YOUR_PROJECT.supabase.co/functions/v1/calendly-webhook";

  return (
    <div>
      <InfoBox color="#006bff" title="What Calendly does" items={[
        "When a contact books a call → lead auto-moves to 'Call Booked'",
        "Call date, time and Zoom link auto-populated on contact card",
        "WhatsApp booking confirmation sent automatically",
        "New contacts created automatically if they don't exist yet",
        "Cancellations → lead moves to 'Follow Up Later'",
      ]} />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:20, marginBottom:16 }}>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Calendly API Key</label>
          <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
          <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>Calendly → Integrations → API & Webhooks → Personal Access Token</div>
        </div>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Your Calendly User URI</label>
          <input value={userUri} onChange={e=>setUserUri(e.target.value)} placeholder="https://api.calendly.com/users/xxx" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
          <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>Found at: api.calendly.com/users/me (use your API key to call it)</div>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Webhook URL (paste into Calendly)</label>
        <div style={{ display:"flex",gap:8 }}>
          <input value={webhookUrl||WEBHOOK_URL_PLACEHOLDER} onChange={e=>setWebhookUrl(e.target.value)} style={{ flex:1,fontFamily:"DM Mono,monospace",fontSize:12,color:"#475569" }} />
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>{ navigator.clipboard.writeText(webhookUrl||WEBHOOK_URL_PLACEHOLDER); notify("📋 Copied!"); }}>Copy</button>
        </div>
        <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>Replace YOUR_PROJECT with your Supabase project ID. Then paste into Calendly → Integrations → Webhooks → Create Webhook.</div>
      </div>

      {/* Agent → Calendly event type mapping */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:600,color:"#475569",marginBottom:10 }}>Agent Event Name Mapping</div>
        <div style={{ fontSize:13,color:"#64748b",marginBottom:10 }}>
          Enter each agent's Calendly event URL keyword so ClearCRM can auto-assign booked calls to the right agent.
          <br/>e.g. if the event URL is <code>calendly.com/jamie/sales-call</code> → enter <strong>jamie</strong>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
          {users.filter(u=>u.active!==false).map(u => (
            <div key={u.id}>
              <label style={{ fontSize:12,color:"#64748b",display:"block",marginBottom:4 }}>{u.name}</label>
              <input value={agentMap[u.name]||""} onChange={e=>setAgentMap(m=>({...m,[u.name]:e.target.value}))}
                placeholder={u.name.toLowerCase()} style={{ width:"100%",fontSize:13 }} />
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={()=>save({ apiKey, userUri, webhookUrl, agentMap })}>Save Calendly Settings</button>

      <SetupStep step="1" title="Deploy the Edge Function" description="In your terminal: supabase functions deploy calendly-webhook (uses the template in integrations.js → EDGE_FUNCTION_TEMPLATES.calendly)" />
      <SetupStep step="2" title="Add webhook in Calendly" description="Calendly → Integrations → Webhooks → Create Webhook. Paste the URL above. Select events: invitee.created and invitee.canceled" />
      <SetupStep step="3" title="Test it" description="Book a test call using your Calendly link. Within seconds the contact should appear in ClearCRM with status 'Call Booked'." />
    </div>
  );
}

// ─── SUMSUB TAB ───────────────────────────────────────────────────────────────
function SumsubTab({ config, save, notify, contacts, setContacts }) {
  const [appToken, setAppToken] = useState(config.appToken || "");
  const [secretKey, setSecretKey] = useState(config.secretKey || "");
  const [levelName, setLevelName] = useState(config.levelName || "basic-kyc-level");
  const [sending, setSending] = useState(null);

  const sendKycLink = async (contact) => {
    if (!appToken || !secretKey) { notify("❌ Add your Sumsub credentials first"); return; }
    setSending(contact.id);
    try {
      // In production this calls sumsubApi.createApplicantLink()
      // For now shows what would happen
      notify(`📨 KYC link would be sent to ${contact.name} via WhatsApp`);
    } catch (e) {
      notify(`❌ ${e.message}`);
    }
    setSending(null);
  };

  const kycContacts = contacts.filter(c => c.kycStatus && c.kycStatus !== "not_started");
  const pendingCount = contacts.filter(c => c.kycStatus === "pending").length;
  const approvedCount = contacts.filter(c => c.kycStatus === "approved").length;
  const rejectedCount = contacts.filter(c => c.kycStatus === "rejected").length;

  return (
    <div>
      <InfoBox color="#f59e0b" title="What Sumsub does" items={[
        "Send KYC verification link to any contact via WhatsApp or email",
        "KYC status badge appears on every contact card (Pending / Approved / Rejected)",
        "Webhook auto-updates status when Sumsub completes review",
        "All KYC events logged with timestamps for compliance",
        "Rejection reasons stored and visible to KYC Officers",
      ]} />

      {/* KYC Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,margin:"20px 0" }}>
        {[["⏳","Pending",pendingCount,"#f59e0b","#fffbeb"],["✅","Approved",approvedCount,"#10b981","#f0fdf4"],["❌","Rejected",rejectedCount,"#ef4444","#fef2f2"]].map(([icon,label,count,color,bg])=>(
          <div key={label} style={{ background:bg,border:`1px solid ${color}33`,borderRadius:10,padding:"12px 16px",textAlign:"center" }}>
            <div style={{ fontSize:20 }}>{icon}</div>
            <div style={{ fontSize:22,fontWeight:800,color }}>{count}</div>
            <div style={{ fontSize:12,color:"#64748b" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Sumsub App Token</label>
          <input type="password" value={appToken} onChange={e=>setAppToken(e.target.value)} placeholder="prd:xxxxx" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
          <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>Sumsub Dashboard → Developers → App Tokens</div>
        </div>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Secret Key</label>
          <input type="password" value={secretKey} onChange={e=>setSecretKey(e.target.value)} placeholder="xxxxxxxx" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
        </div>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>KYC Level Name</label>
          <input value={levelName} onChange={e=>setLevelName(e.target.value)} placeholder="basic-kyc-level" style={{ width:"100%",fontSize:13 }} />
          <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>The verification level configured in your Sumsub dashboard</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={()=>save({ appToken, secretKey, levelName })} style={{ marginBottom:20 }}>Save Sumsub Settings</button>

      {/* KYC contact list */}
      {kycContacts.length > 0 && (
        <div>
          <div style={{ fontSize:13,fontWeight:600,color:"#475569",marginBottom:10 }}>Contacts with active KYC</div>
          {kycContacts.map(c => {
            const STATUS = { pending:{label:"Pending",color:"#f59e0b",bg:"#fffbeb",icon:"⏳"}, approved:{label:"Approved",color:"#10b981",bg:"#f0fdf4",icon:"✅"}, rejected:{label:"Rejected",color:"#ef4444",bg:"#fef2f2",icon:"❌"} };
            const s = STATUS[c.kycStatus] || STATUS.pending;
            return (
              <div key={c.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#f8fafc",borderRadius:8,marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:600,fontSize:14 }}>{c.name}</span>
                  <span style={{ color:"#94a3b8",fontSize:13,marginLeft:8 }}>{c.company}</span>
                </div>
                <span style={{ padding:"4px 10px",borderRadius:6,background:s.bg,color:s.color,fontSize:12,fontWeight:600 }}>{s.icon} {s.label}</span>
                {c.kycStatus!=="approved" && (
                  <button className="btn btn-ghost" style={{ fontSize:12,padding:"5px 10px" }} onClick={()=>sendKycLink(c)} disabled={sending===c.id}>
                    {sending===c.id?"Sending…":"📨 Send Link"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SetupStep step="1" title="Deploy Sumsub Edge Function" description="supabase functions deploy sumsub-webhook — set env var SUMSUB_WEBHOOK_SECRET to a random string." />
      <SetupStep step="2" title="Add webhook in Sumsub" description="Sumsub → Developers → Webhooks. URL: https://YOUR_PROJECT.supabase.co/functions/v1/sumsub-webhook. Select: applicantCreated, applicantReviewed, applicantPending." />
      <SetupStep step="3" title="Send first KYC" description="On any contact card, click 'Send KYC' — a link is generated and sent via WhatsApp. Status updates automatically when they complete." />
    </div>
  );
}

// ─── CLOUDTALK TAB ────────────────────────────────────────────────────────────
function CloudtalkTab({ config, save, notify }) {
  const [apiKey, setApiKey]       = useState(config.apiKey || "");
  const [apiSecret, setApiSecret] = useState(config.apiSecret || "");
  const [webhookUrl]              = useState(config.webhookUrl || "https://YOUR_PROJECT.supabase.co/functions/v1/cloudtalk-webhook");

  return (
    <div>
      <InfoBox color="#6366f1" title="What Cloudtalk does" items={[
        "Every call automatically logged to the contact's record",
        "Call duration, outcome (answered/voicemail/no answer) stored",
        "If 'Call Booked' contact answers → auto-moves to 'Completed'",
        "If 'Call Booked' contact doesn't answer → auto-moves to 'No Show'",
        "Recording links saved and accessible from the contact card",
        "Agent name matched automatically from Cloudtalk agent list",
      ]} />

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20,marginBottom:16 }}>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Cloudtalk API Key</label>
          <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="ct_live_xxxx" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
          <div style={{ fontSize:12,color:"#94a3b8",marginTop:4 }}>Cloudtalk → Settings → API & Integrations</div>
        </div>
        <div>
          <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>API Secret</label>
          <input type="password" value={apiSecret} onChange={e=>setApiSecret(e.target.value)} placeholder="xxxxxxxx" style={{ width:"100%",fontFamily:"DM Mono,monospace",fontSize:13 }} />
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:13,color:"#64748b",display:"block",marginBottom:5 }}>Webhook URL (paste into Cloudtalk)</label>
        <div style={{ display:"flex",gap:8 }}>
          <input value={webhookUrl} readOnly style={{ flex:1,fontFamily:"DM Mono,monospace",fontSize:12,color:"#475569",background:"#f8fafc" }} />
          <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={()=>{ navigator.clipboard.writeText(webhookUrl); notify("📋 Copied!"); }}>Copy</button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={()=>save({ apiKey, apiSecret, webhookUrl })}>Save Cloudtalk Settings</button>

      <SetupStep step="1" title="Deploy Cloudtalk Edge Function" description="supabase functions deploy cloudtalk-webhook" />
      <SetupStep step="2" title="Add webhook in Cloudtalk" description="Cloudtalk → Settings → Webhooks → Add Webhook. URL: above. Event: call.ended" />
      <SetupStep step="3" title="Match agent names" description="Make sure agent names in Cloudtalk exactly match names in ClearCRM (Alex, Jamie, Sam, Jordan) so calls are attributed correctly." />
    </div>
  );
}

// ─── STATUS TAB ───────────────────────────────────────────────────────────────
function StatusTab({ config }) {
  const checks = [
    { key:"supabase",  label:"Supabase Database", icon:"🗄️",  connected: !!(config.supabase?.url && config.supabase?.anon && config.supabase?.connected) },
    { key:"calendly",  label:"Calendly",          icon:"📅",  connected: !!(config.calendly?.apiKey) },
    { key:"sumsub",    label:"Sumsub KYC",         icon:"🔍",  connected: !!(config.sumsub?.appToken && config.sumsub?.secretKey) },
    { key:"cloudtalk", label:"Cloudtalk Calls",   icon:"📞",  connected: !!(config.cloudtalk?.apiKey) },
  ];

  const allConnected = checks.every(c => c.connected);
  const connectedCount = checks.filter(c => c.connected).length;

  return (
    <div>
      <div style={{ padding:"16px 20px",background:allConnected?"#f0fdf4":"#fffbeb",border:`1px solid ${allConnected?"#bbf7d0":"#fde68a"}`,borderRadius:10,marginBottom:20,display:"flex",alignItems:"center",gap:12 }}>
        <span style={{ fontSize:24 }}>{allConnected?"🟢":"🟡"}</span>
        <div>
          <div style={{ fontSize:15,fontWeight:700,color:allConnected?"#16a34a":"#b45309" }}>
            {allConnected ? "All integrations connected" : `${connectedCount} of ${checks.length} integrations connected`}
          </div>
          <div style={{ fontSize:13,color:"#64748b" }}>
            {allConnected ? "ClearCRM is fully integrated — data flows automatically between all tools."
              : "Complete the setup tabs above to connect remaining integrations."}
          </div>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24 }}>
        {checks.map(c => (
          <div key={c.key} style={{ padding:"16px 18px",background:"#fff",border:`2px solid ${c.connected?"#bbf7d0":"#e2e8f0"}`,borderRadius:10,display:"flex",alignItems:"center",gap:12 }}>
            <span style={{ fontSize:24 }}>{c.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:600 }}>{c.label}</div>
              <div style={{ fontSize:13,color:c.connected?"#16a34a":"#94a3b8" }}>
                {c.connected ? "✅ Connected" : "⬜ Not configured"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data flow diagram */}
      <div style={{ background:"#f8fafc",borderRadius:10,padding:"18px 20px",border:"1px solid #e2e8f0" }}>
        <div style={{ fontSize:13,fontWeight:700,color:"#475569",marginBottom:14 }}>AUTOMATED DATA FLOW</div>
        {[
          ["📅","Contact books via Calendly","→","📋","Lead created/updated in ClearCRM","→","💬","WhatsApp confirmation sent"],
          ["📞","Cloudtalk call ends","→","📋","Call logged + status updated","→","🔄","Pipeline moves automatically"],
          ["🔍","Sumsub review complete","→","📋","KYC badge updated on contact","→","✅","Agent sees status instantly"],
          ["📋","Any data change in ClearCRM","→","🗄️","Saved to Supabase","→","👥","All agents see it live"],
        ].map(([i1,s1,arr,i2,s2,arr2,i3,s3],idx)=>(
          <div key={idx} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #e2e8f0",flexWrap:"wrap",fontSize:13 }}>
            <span style={{ fontSize:16 }}>{i1}</span>
            <span style={{ color:"#475569" }}>{s1}</span>
            <span style={{ color:"#94a3b8",fontWeight:700 }}>{arr}</span>
            <span style={{ fontSize:16 }}>{i2}</span>
            <span style={{ color:"#475569" }}>{s2}</span>
            <span style={{ color:"#94a3b8",fontWeight:700 }}>{arr2}</span>
            <span style={{ fontSize:16 }}>{i3}</span>
            <span style={{ color:"#10b981",fontWeight:600 }}>{s3}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
function InfoBox({ color, title, items }) {
  return (
    <div style={{ background:`${color}08`,border:`1px solid ${color}33`,borderRadius:10,padding:"14px 16px" }}>
      <div style={{ fontSize:13,fontWeight:700,color,marginBottom:8 }}>{title}</div>
      <ul style={{ margin:0,paddingLeft:16,display:"flex",flexDirection:"column",gap:4 }}>
        {items.map((item,i) => <li key={i} style={{ fontSize:13,color:"#475569" }}>{item}</li>)}
      </ul>
    </div>
  );
}

function SetupStep({ step, title, description }) {
  return (
    <div style={{ display:"flex",gap:12,padding:"12px 0",borderTop:"1px solid #f1f5f9",marginTop:12 }}>
      <div style={{ width:28,height:28,borderRadius:8,background:"#ede9fe",color:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>{step}</div>
      <div>
        <div style={{ fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:2 }}>{title}</div>
        <div style={{ fontSize:13,color:"#64748b" }}>{description}</div>
      </div>
    </div>
  );
}
