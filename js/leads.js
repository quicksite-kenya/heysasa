// ─────────────────────────────────────────────────────────────────────────────
// leads.js  —  HeySasa Dashboard · Leads Module  (v4)
// ─────────────────────────────────────────────────────────────────────────────
//
// MOCK DATA SWAP INSTRUCTIONS
// ─────────────────────────────────────────────────────────────────────────────
// All mock lead records live in LEADS_MOCK below.
// When leadsService.fetchLiveLeads() returns data it fully replaces leadsData.
// Shape every field returned from your leadsService to match the objects in
// LEADS_MOCK exactly — field names are the contract.
//
// NEW fields added in v4 (all swappable with live data):
//   read_receipt     'sent'|'delivered'|'read'|'replied'
//   last_seen_online  ISO timestamp (Evolution API "lastSeen")
//   sent_voice_note   boolean  — lead sent a voice note (high-intent signal)
//   sent_media        boolean  — lead sent an image / document
//   sent_reaction     boolean  — lead reacted to your message
//   intent_score      0–100   — composite score computed by worker
//   competitor_mentions string[]  — e.g. ['Jumia','Jiji']
//   objection_tags    string[]  — e.g. ['price','not_ready']
//   pre_purchase_questions string[]  — verbatim questions before buying
// ─────────────────────────────────────────────────────────────────────────────

// ─── Follow-up sequence template (11 steps) ──────────────────────────────────
const DEFAULT_SEQUENCE = [
  { step: 1,  name: 'First Impression',    type: 'product_reminder',    klt: 'Know',    delay_days: 1, desc: 'Reference exactly what they were interested in.' },
  { step: 2,  name: 'Social Proof',        type: 'social_proof',        klt: 'Know',    delay_days: 2, desc: 'Share a real customer story or testimonial.' },
  { step: 3,  name: 'Free Value',          type: 'value_tip',           klt: 'Like',    delay_days: 2, desc: 'Give one genuinely useful tip. No pitch.' },
  { step: 4,  name: 'Expert Insight',      type: 'expert_authority',    klt: 'Like',    delay_days: 3, desc: 'Position the business as the go-to expert.' },
  { step: 5,  name: 'Personalised Offer',  type: 'offer',               klt: 'Like',    delay_days: 3, desc: 'A specific offer tied to their interest.' },
  { step: 6,  name: 'New Angle',           type: 'new_angle',           klt: 'Trust',   delay_days: 3, desc: 'Approach their need from a different angle.' },
  { step: 7,  name: 'Deep Expertise',      type: 'proprietary_content', klt: 'Trust',   delay_days: 4, desc: 'Share business knowledge from the owner.' },
  { step: 8,  name: 'FOMO',               type: 'fomo',                klt: 'Trust',   delay_days: 4, desc: 'Social proof + availability signal.' },
  { step: 9,  name: 'Check In',            type: 'soft_checkin',        klt: 'Trust',   delay_days: 5, desc: 'A warm human check-in. No pitch.' },
  { step: 10, name: 'Final Offer',         type: 'final_offer',         klt: 'Convert', delay_days: 3, desc: 'Best offer. Last one.' },
  { step: 11, name: 'See You Around',      type: 'graceful_exit',       klt: 'Convert', delay_days: 4, desc: 'Warm goodbye. Door always open.' }
];

const KLT_CONFIG = {
  Know:    { color: '#64748B', bg: 'rgba(100,116,139,0.1)'  },
  Like:    { color: '#0F172A', bg: 'rgba(15,23,42,0.08)'    },
  Trust:   { color: '#374151', bg: 'rgba(55,65,81,0.1)'     },
  Convert: { color: '#166534', bg: 'rgba(22,101,52,0.1)'    }
};

const TOUCHPOINT_ICONS = {
  product_reminder:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" stroke-linecap="round"/></svg>`,
  social_proof:        `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11l-3.6 1.9.7-4L2.1 6.2l4-.6z" stroke-linejoin="round"/></svg>`,
  value_tip:           `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="7" r="4"/><path d="M8 11v2M6 14h4" stroke-linecap="round"/></svg>`,
  expert_authority:    `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="9" rx="1.5"/><path d="M5 14h6M8 11v3" stroke-linecap="round"/></svg>`,
  offer:               `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V3.5a3 3 0 016 0V5" stroke-linecap="round"/></svg>`,
  new_angle:           `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 3l-3 3M3 13l3-3M13 3H9M13 3v4M3 13h4M3 13V9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  proprietary_content: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="2" width="10" height="12" rx="1.5"/><path d="M5 6h6M5 9h4" stroke-linecap="round"/></svg>`,
  fomo:                `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v1M8 13v1M2 8h1M13 8h1M4.2 4.2l.7.7M11.1 11.1l.7.7M4.2 11.8l.7-.7M11.1 4.9l.7-.7"/><circle cx="8" cy="8" r="3"/></svg>`,
  soft_checkin:        `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2a4 4 0 100 5.5" stroke-linecap="round"/><path d="M2 14s0-4 6-4 6 4 6 4" stroke-linecap="round"/></svg>`,
  final_offer:         `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l3 3 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  graceful_exit:       `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h7M11 6l2 2-2 2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v10a1 1 0 001 1h5a1 1 0 001-1v-1" stroke-linecap="round"/></svg>`
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICON = {
  search:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="6"/><path d="M15 15l-3.5-3.5" stroke-linecap="round"/></svg>`,
  filter:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 5h14M6 10h8M9 15h2" stroke-linecap="round"/></svg>`,
  chat:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M7 11h10"/><path d="M7 15h6"/><path d="M7 7h8"/></svg>`,
  phone:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 8 6-6"/><path d="M22 8V2h-6"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg>`,
  wa:       `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="8"/><path d="M7 11.5c.7 1.4 2 2.3 3.5 2.3 2.2 0 4-1.8 4-4s-1.8-4-4-4a4 4 0 00-3.9 3.1L5 13l3.5-.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  person:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="6" r="3"/><path d="M3 17s0-5 7-5 7 5 7 5" stroke-linecap="round"/></svg>`,
  check:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10l4 4 8-8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  x:        `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 5l10 10M15 5L5 15" stroke-linecap="round"/></svg>`,
  chevron:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 7l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  send:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 3L3 9l5 2 2 5 7-14z" stroke-linejoin="round"/></svg>`,
  edit:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 3l4 4-10 10H3v-4L13 3z" stroke-linejoin="round"/></svg>`,
  refresh:  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12a6 6 0 1010.7-3.7" stroke-linecap="round"/><path d="M15 5v4h-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  inbox:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h14M3 8v7a2 2 0 002 2h10a2 2 0 002-2V8M3 8l2-5h10l2 5M8 12h4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  coin:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M10 7v6M8 9h2.5a1.5 1.5 0 010 3H8" stroke-linecap="round"/></svg>`,
  list:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h12M4 10h12M4 14h8" stroke-linecap="round"/></svg>`,
  ad:       `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M7 13V9l3 3 3-3v4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h12M10 4l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  plus:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 4v12M4 10h12" stroke-linecap="round"/></svg>`,
  eye:      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><ellipse cx="10" cy="10" rx="8" ry="5"/><circle cx="10" cy="10" r="2"/></svg>`,
  clock:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 2.5" stroke-linecap="round"/></svg>`,
  warn:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 3L2 17h16L10 3z" stroke-linejoin="round"/><path d="M10 9v4M10 15v.5" stroke-linecap="round"/></svg>`,
  tag:      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.5 2H5a1 1 0 00-1 1v5.5a1 1 0 00.3.7l7.5 7.5a2 2 0 002.8 0l3-3a2 2 0 000-2.8L10.5 2z" stroke-linejoin="round"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  cart:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2h2l1.5 8h9l1.5-5H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="17" r="1.2"/><circle cx="14" cy="17" r="1.2"/></svg>`,
  brain:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 10a3 3 0 013-3h4a3 3 0 013 3 3 3 0 01-3 3H8a3 3 0 01-3-3z"/><path d="M8 7V5.5a2.5 2.5 0 015 0V7M8 13v1.5a2.5 2.5 0 005 0V13M5 10H3.5a2 2 0 000 4H5M15 10h1.5a2 2 0 000 4H15M5 10H3.5a2 2 0 010-4H5M15 10h1.5a2 2 0 010-4H15" stroke-linecap="round"/></svg>`,
  spark:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2l2 6h6l-5 3.6 1.9 6L10 14l-4.9 3.6L7 11.6 2 8h6z" stroke-linejoin="round"/></svg>`,
  bag:      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7h12l-1.5 9H5.5L4 7z" stroke-linejoin="round"/><path d="M7 7V5a3 3 0 016 0v2" stroke-linecap="round"/></svg>`,
  mic:      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="2" width="6" height="9" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6" stroke-linecap="round"/></svg>`,
  image:    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="4" width="16" height="13" rx="2"/><circle cx="7" cy="9" r="1.5"/><path d="M2 14l4-4 3 3 3-2 4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  star:     `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2l2.3 5.4 5.7.8-4.1 4 1 5.7L10 15l-4.9 2.9 1-5.7-4.1-4 5.7-.8z" stroke-linejoin="round"/></svg>`,
  shield:   `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5l7-3z" stroke-linejoin="round"/></svg>`,
  zap:      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z" stroke-linejoin="round"/></svg>`,
};

// ─── State ────────────────────────────────────────────────────────────────────
let leadsData = [];
let leadsSearchQuery        = '';
let activeLeadStateFilter   = 'all';
let activeLeadTypeFilter    = 'all';
let activeLeadId            = null;
let sequenceExpanded        = {};
let editingFollowupId       = null;
let leadsFetchRequestId     = 0;
let leadsFetchRetryCount    = 0;

async function loadLiveLeads() {
  if (!window.leadsService || typeof window.leadsService.fetchLiveLeads !== 'function') {
    console.warn('[Leads] leadsService is not ready yet. Retrying shortly.');
    if (leadsFetchRetryCount < 5) {
      leadsFetchRetryCount += 1;
      setTimeout(loadLiveLeads, 120);
    }
    return null;
  }

  const requestId = ++leadsFetchRequestId;

  try {
    const liveData = await window.leadsService.fetchLiveLeads();

    if (requestId !== leadsFetchRequestId) {
      // A newer load request started while this one was pending.
      return null;
    }

    if (Array.isArray(liveData)) {
      leadsData = liveData;
    } else {
      console.warn('[Leads] fetchLiveLeads returned unexpected data:', liveData);
      leadsData = [];
    }

    if (typeof renderLeads === 'function') renderLeads();
    if (typeof initDashboard === 'function') initDashboard();
    return leadsData;
  } catch (error) {
    console.error('Error loading live leads:', error);
    return null;
  }
}

// Run the fetch immediately when the page loads
loadLiveLeads();

// ─── Computed stats ──────────────────────────────── ────────────────────────────
function getLeadStats() {
  const business = leadsData.filter(l => l.lead_type === 'business');
  const adLeads  = leadsData.filter(l => l.is_ad_lead);
  const unread   = leadsData.filter(l => l.unread_count > 0);
  const urgent   = leadsData.filter(l => ['stalled','ghosted'].includes(l.lead_state) && l.lead_type === 'business');
  const ready    = leadsData.filter(l => l.lead_quality === 'hot' && l.lead_state === 'engaged');
  const pending  = leadsData.filter(l => l.followup?.pending_approval);
  return { total: leadsData.length, business: business.length, adLeads: adLeads.length, unread: unread.length, urgent: urgent.length, ready: ready.length, pending: pending.length };
}

// ─── Filter + sort ────────────────────────────────────────────────────────────
const STATE_PRIORITY = { engaged: 0, new: 1, warm: 2, stalled: 3, ghosted: 4, won: 5, lost: 6, personal: 7 };

function getFilteredLeads() {
  return leadsData
    .filter(lead => {
      const q = leadsSearchQuery.toLowerCase();
      const matchesSearch = !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        (lead.customer_intent || '').toLowerCase().includes(q) ||
        (lead.ad_headline || '').toLowerCase().includes(q) ||
        (lead.product_interests || []).some(p => p.includes(q));
      const matchesState = activeLeadStateFilter === 'all' || lead.lead_state === activeLeadStateFilter;
      const matchesType  = activeLeadTypeFilter  === 'all' || lead.lead_type  === activeLeadTypeFilter ||
        (activeLeadTypeFilter === 'ad' && lead.is_ad_lead);
      return matchesSearch && matchesState && matchesType;
    })
    .sort((a, b) => {
      if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
      if (b.followup?.pending_approval !== a.followup?.pending_approval)
        return (b.followup?.pending_approval ? 1 : 0) - (a.followup?.pending_approval ? 1 : 0);
      const ap = STATE_PRIORITY[a.lead_state] ?? 9;
      const bp = STATE_PRIORITY[b.lead_state] ?? 9;
      if (ap !== bp) return ap - bp;
      return new Date(b.last_seen) - new Date(a.last_seen);
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function timeUntil(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'overdue';
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function stateConfig(state) {
  const map = {
    engaged:  { label: 'Engaged',  dot: '#22c55e', border: '#22c55e' },
    new:      { label: 'New',      dot: '#3b82f6', border: '#3b82f6' },
    warm:     { label: 'Warm',     dot: '#f59e0b', border: '#f59e0b' },
    stalled:  { label: 'Cold',     dot: '#f59e0b', border: '#f59e0b' },
    ghosted:  { label: 'Ghosted',  dot: '#94a3b8', border: '#94a3b8' },
    won:      { label: 'Won',      dot: '#22c55e', border: '#22c55e' },
    lost:     { label: 'Lost',     dot: '#ef4444', border: '#ef4444' },
    personal: { label: 'Personal', dot: '#cbd5e1', border: '#cbd5e1' },
  };
  return map[state] || { label: state, dot: '#cbd5e1', border: '#cbd5e1' };
}

function qualityLabel(q) {
  if (!q) return null;
  const map = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };
  return map[q.toLowerCase()] || null;
}

function formatInterest(tag) {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Read receipt helper ──────────────────────────────────────────────────────
function readReceiptIcon(status) {
  // Single tick = sent, double grey = delivered, double blue = read, green = replied
  const map = {
    sent:      { html: '✓',  color: '#94a3b8', title: 'Sent' },
    delivered: { html: '✓✓', color: '#94a3b8', title: 'Delivered' },
    read:      { html: '✓✓', color: '#3b82f6', title: 'Read' },
    replied:   { html: '↩',  color: '#22c55e', title: 'Replied' },
  };
  return map[status] || map.sent;
}

// ─── Intent score color ───────────────────────────────────────────────────────
function intentColor(score) {
  if (score === null || score === undefined) return '#cbd5e1';
  if (score >= 75) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
}

// ─── Follow-up helpers ────────────────────────────────────────────────────────
function getFollowupRowLabel(lead) {
  const fu = lead.followup;
  if (!fu || lead.lead_type === 'personal') return null;
  switch (fu.status) {
    case 'not_enrolled':
      if (lead.follow_up_count === 0 && lead.lead_state !== 'won')
        return { icon: 'chat', text: 'Enroll in sequence', color: '#94a3b8', urgent: false };
      return null;
    case 'consent_sent':
      return { icon: 'clock', text: 'Awaiting consent', color: '#94a3b8', urgent: false };
    case 'opted_out':
      return { icon: 'x', text: 'Opted out', color: '#94a3b8', urgent: false };
    case 'completed':
      return { icon: 'check', text: 'Sequence complete', color: '#22c55e', urgent: false };
    case 'opted_in':
      if (fu.pending_approval)
        return { icon: 'inbox', text: `Step ${fu.current_step} · needs review`, color: '#d97706', urgent: true };
      if (fu.next_due) {
        const overdue = new Date(fu.next_due) < new Date();
        return {
          icon: overdue ? 'warn' : 'clock',
          text: `Step ${fu.current_step} · ${overdue ? 'overdue' : 'due ' + timeUntil(fu.next_due)}`,
          color: overdue ? '#ef4444' : '#94a3b8',
          urgent: overdue
        };
      }
      return { icon: 'check', text: `Step ${fu.current_step} active`, color: '#22c55e', urgent: false };
    default:
      return null;
  }
}

function getCumulativeDays(stepIndex) {
  return DEFAULT_SEQUENCE.slice(0, stepIndex + 1).reduce((sum, s) => sum + s.delay_days, 0);
}

// ─── Render helper ────────────────────────────────────────────────────────────
function ic(iconKey, size = 16) {
  return `<span class="ic" style="width:${size}px;height:${size}px">${ICON[iconKey]}</span>`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function injectLeadsStyles() {
  if (document.getElementById('leads-styles-v4')) return;
  const style = document.createElement('style');
  style.id = 'leads-styles-v4';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --ink:       #0f172a;
      --ink-2:     #334155;
      --ink-3:     #64748b;
      --ink-4:     #94a3b8;
      --ink-5:     #cbd5e1;
      --line:      #e2e8f0;
      --bg:        #f5f6f8;
      --bg-card:   #ffffff;
      --bg-hover:  #f1f5f9;
      --green:     #16a34a;
      --green-bg:  #f0fdf4;
      --brand:     #3B6D11;
      --brand-dark:#27500A;
      --red:       #dc2626;
      --red-bg:    #fef2f2;
      --blue:      #2563eb;
      --blue-bg:   #eff6ff;
      --r-card:    14px;
      --r-btn:     9px;
      --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
      --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 16px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04);
      --shadow-lg: 0 20px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
      --glass-bg:  rgba(255,255,255,0.85);
      --glass-border: rgba(226,232,240,0.8);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Layout ──────────────────────────────────── */
    .lv4-wrap {
      display: flex;
      height: 100%;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
      background: var(--bg);
      color: var(--ink);
    }

    /* ── SVG icon util ─────────────────────────── */
    .ic { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ic svg { display: block; }

    /* ── Left panel ─────────────────────────────── */
    .lv4-list-panel {
      width: 340px;
      min-width: 280px;
      max-width: 340px;
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border-right: 1px solid var(--line);
      overflow: hidden;
      flex-shrink: 0;
    }

    .lv4-panel-top {
      padding: 18px 14px 0;
      flex-shrink: 0;
    }

    .lv4-panel-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .lv4-panel-title h2 {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--ink);
    }

    .lv4-top-actions {
      display: flex;
      gap: 6px;
    }

    /* ── Stat row ─────────────────────────────────── */
    .lv4-stats {
      display: flex;
      gap: 5px;
      margin-bottom: 12px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
    }
    .lv4-stats::-webkit-scrollbar { display: none; }

    .lv4-stat {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 7px 10px 6px;
      border-radius: 10px;
      border: 1px solid var(--line);
      background: var(--bg);
      cursor: pointer;
      transition: all 0.15s;
      min-width: 54px;
    }
    .lv4-stat:hover { background: var(--bg-hover); border-color: var(--ink-5); }
    .lv4-stat.warn  { border-color: #fcd34d; background: #fffbeb; }
    .lv4-stat.good  { border-color: #86efac; background: var(--green-bg); }
    .lv4-stat-num   { font-size: 17px; font-weight: 700; line-height: 1; color: var(--ink); }
    .lv4-stat-num.amber { color: #d97706; }
    .lv4-stat-num.green { color: var(--green); }
    .lv4-stat-lbl   { font-size: 8.5px; font-weight: 700; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; white-space: nowrap; }

    /* ── Search ─────────────────────────────────── */
    .lv4-search {
      position: relative;
      margin-bottom: 9px;
    }
    .lv4-search input {
      width: 100%;
      padding: 9px 12px 9px 34px;
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: var(--r-btn);
      font-size: 12.5px;
      font-family: inherit;
      color: var(--ink);
      outline: none;
      transition: all 0.15s;
    }
    .lv4-search input::placeholder { color: var(--ink-4); }
    .lv4-search input:focus { border-color: var(--ink-3); background: var(--bg-card); box-shadow: 0 0 0 3px rgba(15,23,42,0.06); }
    .lv4-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px;
      height: 15px;
      color: var(--ink-4);
      pointer-events: none;
    }

    /* ── Filter chips ───────────────────────────── */
    .lv4-filters {
      display: flex;
      gap: 4px;
      padding-bottom: 10px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .lv4-filters::-webkit-scrollbar { display: none; }
    .lv4-fc {
      flex-shrink: 0;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 10.5px;
      font-weight: 600;
      color: var(--ink-3);
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
      letter-spacing: 0.01em;
    }
    .lv4-fc:hover { background: var(--bg-hover); color: var(--ink); }
    .lv4-fc.active { background: var(--ink); color: #fff; border-color: var(--ink); }

    /* ── Lead list ──────────────────────────────── */
    .lv4-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 8px 24px;
    }
    .lv4-list::-webkit-scrollbar { width: 3px; }
    .lv4-list::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

    /* ── Lead card (list row) ───────────────────── */
    .lv4-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 11px 10px;
      border-radius: var(--r-card);
      cursor: pointer;
      transition: background 0.12s;
      margin-bottom: 2px;
      position: relative;
      border-left: 2.5px solid transparent;
    }
    .lv4-card:hover { background: var(--bg-hover); }
    .lv4-card.active {
      background: #f1f5f9;
      border-left-color: var(--brand);
    }

    .lv4-avatar {
      width: 37px;
      height: 37px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
      background: var(--bg-hover);
      color: var(--ink-2);
      border: 1px solid var(--line);
    }
    .lv4-avatar.personal { color: var(--ink-4); }

    .lv4-card-body { flex: 1; min-width: 0; }

    .lv4-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .lv4-card-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      letter-spacing: -0.01em;
    }
    .lv4-card-right {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
      margin-left: 6px;
    }
    .lv4-unread {
      min-width: 17px;
      height: 17px;
      border-radius: 9px;
      background: var(--brand);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .lv4-rr {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .lv4-summary {
      font-size: 11.5px;
      color: var(--ink-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 5px;
      line-height: 1.4;
    }
    .lv4-card-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }

    /* Intent bar (thin) */
    .lv4-intent-bar {
      height: 2px;
      border-radius: 1px;
      background: var(--line);
      margin-top: 5px;
      overflow: hidden;
    }
    .lv4-intent-fill {
      height: 100%;
      border-radius: 1px;
      transition: width 0.6s ease;
    }

    /* Signal icons on card */
    .lv4-signals {
      display: flex;
      gap: 3px;
      align-items: center;
      margin-left: auto;
    }
    .lv4-sig {
      font-size: 10px;
      opacity: 0.7;
    }

    /* ── Tiny pills ─────────────────────────────── */
    .tp {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .tp-state   { background: var(--bg-hover); color: var(--ink-3); border: 1px solid var(--line); }
    .tp-hot     { background: #fef2f2; color: #dc2626; }
    .tp-warm    { background: #fffbeb; color: #d97706; }
    .tp-ad      { background: var(--bg); color: var(--ink-3); border: 1px solid var(--line); }
    .tp-product { background: #f0fdf4; color: #15803d; }
    .tp-won     { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

    /* ── Empty state ─────────────────────────────── */
    .lv4-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--ink-4);
      text-align: center;
      gap: 8px;
    }
    .lv4-empty .ic { width: 36px; height: 36px; opacity: 0.2; }
    .lv4-empty p { font-size: 13px; font-weight: 500; }

    /* ── Right panel ────────────────────────────── */
    .lv4-detail-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg);
      min-width: 0;
    }

    .lv4-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 100%;
    }
    .lv4-placeholder-card {
      text-align: center;
      margin: auto;
      padding: 2rem;
    }
    .lv4-placeholder-card .ic { width: 56px; height: 56px; opacity: 0.14; color: var(--ink-3); }
    .lv4-placeholder-card p { font-size: 15px; font-weight: 500; color: var(--ink-3); letter-spacing: -0.01em; margin-top: 12px; }
    .lv4-placeholder-card .sub { font-size: 12.5px; color: var(--ink-4); font-weight: 400; margin-top: 4px; }

    /* ── Detail scroll ──────────────────────────── */
    .lv4-detail-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 22px 24px;
    }
    .lv4-detail-scroll::-webkit-scrollbar { width: 3px; }
    .lv4-detail-scroll::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

    /* ── Detail header card ─────────────────────── */
    .lv4-dh {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-sm);
    }
    .lv4-dh-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }
    .lv4-dh-left { display: flex; align-items: center; gap: 12px; }
    .lv4-dh-avatar {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      background: var(--bg-hover);
      color: var(--ink-2);
      border: 1px solid var(--line);
      flex-shrink: 0;
    }
    .lv4-dh-name {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--ink);
      margin-bottom: 3px;
    }
    .lv4-dh-sub {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }
    .lv4-dh-phone { font-size: 11.5px; color: var(--ink-3); font-family: 'DM Mono', monospace; }
    .lv4-dh-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }

    /* ── Bought button — prominent ──────────────── */
    .lv4-dh-bottom {
      display: flex;
      gap: 8px;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid var(--glass-border);
    }
    .btn-bought {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 16px;
      background: var(--brand);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
      letter-spacing: 0.01em;
    }
    .btn-bought:hover { background: var(--brand-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,109,17,0.25); }
    .btn-bought .ic { width: 15px; height: 15px; }
    .btn-bought.won {
      background: var(--green-bg);
      color: var(--green);
      border: 1px solid #bbf7d0;
    }
    .btn-bought.won:hover { background: #dcfce7; transform: none; box-shadow: none; }

    /* ── Engagement signals strip ───────────────── */
    .lv4-signals-strip {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
    }
    .lv4-sig-tile {
      flex: 1;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 9px 10px;
      text-align: center;
      box-shadow: var(--shadow-xs);
    }
    .lv4-sig-tile-icon { font-size: 14px; margin-bottom: 2px; }
    .lv4-sig-tile-num { font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1; }
    .lv4-sig-tile-lbl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-4); margin-top: 2px; }
    .lv4-sig-tile.active .lv4-sig-tile-num { color: var(--brand); }

    /* Receipt flow bar */
    .lv4-receipt-flow {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-xs);
    }
    .lv4-receipt-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ink-4);
      margin-bottom: 8px;
    }
    .lv4-receipt-steps {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lv4-receipt-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      flex: 1;
    }
    .lv4-receipt-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 700;
      border: 1.5px solid var(--line);
      background: var(--bg);
      color: var(--ink-4);
      transition: all 0.2s;
    }
    .lv4-receipt-dot.active {
      border-color: transparent;
    }
    .lv4-receipt-name { font-size: 9px; font-weight: 600; color: var(--ink-4); }
    .lv4-receipt-arrow { color: var(--line); font-size: 11px; flex-shrink: 0; padding-bottom: 13px; }

    /* ── Drawer open buttons ────────────────────── */
    .lv4-drawer-row {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .lv4-drawer-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 9px 12px;
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--ink-2);
      transition: all 0.15s;
      box-shadow: var(--shadow-xs);
      position: relative;
    }
    .lv4-drawer-btn:hover { background: var(--bg-hover); border-color: var(--ink-5); }
    .lv4-drawer-btn .ic { width: 14px; height: 14px; }
    .lv4-drawer-btn.alert { background: #fffbeb; border-color: #fcd34d; color: #d97706; }
    .lv4-drawer-btn .badge {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      background: #d97706;
      color: #fff;
      font-size: 8.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 2px solid var(--bg);
    }

    /* ── NLP tag pills ──────────────────────────── */
    .lv4-nlp-section {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-xs);
    }
    .lv4-nlp-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--ink-4);
      margin-bottom: 8px;
    }
    .lv4-tag-row { display: flex; flex-wrap: wrap; gap: 5px; }
    .lv4-tag {
      font-size: 10.5px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 5px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .lv4-tag-obj     { background: #fef2f2; color: #991b1b; }
    .lv4-tag-comp    { background: #eff6ff; color: #1d4ed8; }
    .lv4-tag-q       { background: #f8fafc; color: #475569; border: 1px solid var(--line); }

    /* ── Buttons ────────────────────────────────── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--r-btn);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
      white-space: nowrap;
      text-decoration: none;
    }
    .btn .ic { width: 14px; height: 14px; }
    .btn-sm { padding: 6px 10px; font-size: 11px; }
    .btn-sm .ic { width: 13px; height: 13px; }
    .btn-xs { padding: 4px 8px; font-size: 10px; }
    .btn-xs .ic { width: 11px; height: 11px; }
    .btn-primary { background: var(--ink); color: #fff; }
    .btn-primary:hover { background: #1e293b; transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .btn-ghost   { background: transparent; color: var(--ink-2); border: 1px solid var(--line); }
    .btn-ghost:hover { background: var(--bg-hover); }
    .btn-green   { background: var(--green); color: #fff; }
    .btn-green:hover { background: #15803d; transform: translateY(-1px); }
    .btn-red     { background: var(--red-bg); color: var(--red); }
    .btn-red:hover { background: #fee2e2; }
    .btn-icon {
      width: 32px; height: 32px; padding: 0;
      border-radius: var(--r-btn);
      background: transparent;
      border: 1px solid var(--line);
      color: var(--ink-2);
    }
    .btn-icon:hover { background: var(--bg-hover); }
    .btn-icon .ic { width: 15px; height: 15px; }

    /* ── Sections ───────────────────────────────── */
    .lv4-section { margin-bottom: 14px; }
    .lv4-sec-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: var(--ink-4);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .lv4-sec-label .ic { width: 12px; height: 12px; }

    /* ── Card ───────────────────────────────────── */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--r-card);
      box-shadow: var(--shadow-xs);
    }
    .card-pad { padding: 14px 16px; }

    /* ── Action card ─────────────────────────────── */
    .action-card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-left: 3px solid var(--brand);
      border-radius: var(--r-card);
      padding: 14px 16px;
      margin-bottom: 14px;
      box-shadow: var(--shadow-xs);
    }
    .action-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .action-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-3);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .action-label .ic { width: 12px; height: 12px; }
    .ai-badge {
      font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
      padding: 2px 6px; border-radius: 4px;
      background: var(--bg-hover); color: var(--ink-3); text-transform: uppercase;
    }
    .action-text {
      font-size: 12.5px;
      line-height: 1.55;
      color: var(--ink-2);
      margin-bottom: 10px;
    }
    .action-btns { display: flex; gap: 7px; flex-wrap: wrap; }

    /* ── Tags ───────────────────────────────────── */
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 9px;
      border-radius: 6px;
      border: 1px solid var(--line);
      background: var(--bg);
      color: var(--ink-2);
    }
    .tag.green { background: var(--green-bg); border-color: #bbf7d0; color: #15803d; }
    .tag.blue  { background: var(--blue-bg);  border-color: #bfdbfe; color: #1d4ed8; }

    /* ── Personal notice ─────────────────────────── */
    .personal-notice {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 11px 13px;
      background: var(--bg-hover);
      border-radius: var(--r-card);
      border: 1px solid var(--line);
      margin-bottom: 14px;
      font-size: 12px;
      color: var(--ink-3);
      line-height: 1.5;
    }
    .personal-notice .ic { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

    /* ── Follow-up card ──────────────────────────── */
    .fu-card {
      background: var(--bg-card);
      border: 1px solid var(--glass-border);
      border-radius: var(--r-card);
      overflow: hidden;
      box-shadow: var(--shadow-xs);
      margin-bottom: 14px;
    }
    .fu-card-head { padding: 14px 16px 12px; }
    .fu-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .fu-card-title span {
      font-size: 9.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--ink-4);
    }
    .fu-progress-wrap { margin-bottom: 10px; }
    .fu-progress-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .fu-progress-label { font-size: 11px; font-weight: 600; color: var(--ink-3); }
    .fu-progress-track {
      position: relative;
      height: 4px;
      background: var(--bg-hover);
      border-radius: 2px;
      overflow: visible;
    }
    .fu-progress-fill {
      position: absolute; top: 0; left: 0;
      height: 100%;
      background: var(--brand);
      border-radius: 2px;
      transition: width 0.3s;
    }
    .fu-progress-marker {
      position: absolute; top: -3px;
      width: 2px; height: 10px;
      background: #f59e0b; border-radius: 1px;
    }

    /* Draft block */
    .fu-draft {
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 13px;
      margin-bottom: 10px;
    }
    .fu-draft-label {
      font-size: 9.5px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #d97706;
      margin-bottom: 5px;
      display: flex; align-items: center; gap: 4px;
    }
    .fu-draft-label .ic { width: 11px; height: 11px; }
    .fu-draft-text {
      font-size: 12.5px;
      color: var(--ink-2);
      line-height: 1.6;
      font-style: italic;
    }
    .fu-btns { display: flex; gap: 6px; flex-wrap: wrap; }
    .fu-edit-area {
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .fu-edit-area textarea {
      width: 100%; border: none; background: transparent;
      font-size: 13px; font-family: inherit; color: var(--ink);
      resize: vertical; outline: none; min-height: 80px; line-height: 1.6;
    }
    .fu-rewrite-area {
      background: var(--blue-bg);
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .fu-rewrite-area input {
      width: 100%; border: none; background: transparent;
      font-size: 13px; font-family: inherit; color: var(--ink); outline: none;
    }
    .fu-rewrite-area input::placeholder { color: var(--ink-4); }

    /* Sequence toggle */
    .fu-seq-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-top: 1px solid var(--line);
      cursor: pointer;
      transition: background 0.15s;
      font-size: 11px; font-weight: 600; color: var(--ink-3);
    }
    .fu-seq-toggle:hover { background: var(--bg-hover); }
    .fu-seq-toggle .pref-link { font-size: 10px; color: var(--blue); font-weight: 600; }

    /* Sequence timeline */
    .fu-seq { padding: 14px 16px 6px; border-top: 1px solid var(--line); }
    .fu-step {
      display: flex; align-items: flex-start; gap: 10px;
      padding-bottom: 14px; position: relative;
    }
    .fu-step:not(:last-child)::before {
      content: ''; position: absolute;
      left: 10px; top: 22px; bottom: 0;
      width: 1px; background: var(--line);
    }
    .fu-step-dot {
      width: 20px; height: 20px; border-radius: 50%;
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 700; margin-top: 1px;
      position: relative; z-index: 1;
    }
    .dot-sent    { background: var(--brand); color: #fff; }
    .dot-pending { background: #d97706; color: #fff; box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
    .dot-next    { background: var(--bg-hover); color: var(--ink-2); border: 1.5px solid var(--ink-5); }
    .dot-future  { background: var(--bg); color: var(--ink-4); border: 1.5px solid var(--line); }
    .fu-step-body { flex: 1; }
    .fu-step-name {
      font-size: 12px; font-weight: 600; color: var(--ink);
      display: flex; align-items: center; gap: 6px; margin-bottom: 2px;
    }
    .fu-step-name.muted { color: var(--ink-4); font-weight: 500; }
    .fu-step-name .ic { width: 13px; height: 13px; flex-shrink: 0; }
    .fu-step-meta { font-size: 10px; color: var(--ink-4); font-weight: 500; }
    .fu-step-desc { font-size: 10px; color: var(--ink-3); margin-top: 1px; }
    .fu-klt {
      font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; padding: 1px 5px; border-radius: 3px;
    }

    /* Not enrolled */
    .fu-no-consent { padding: 20px 16px; text-align: center; }
    .fu-no-consent-icon { font-size: 26px; margin-bottom: 8px; }
    .fu-no-consent-text { font-size: 12px; color: var(--ink-3); margin-bottom: 14px; line-height: 1.5; }
    .fu-status-row {
      display: flex; align-items: center; gap: 10px; padding: 14px 16px;
    }
    .fu-status-row .ic { width: 18px; height: 18px; flex-shrink: 0; }
    .fu-status-title { font-size: 12px; font-weight: 600; color: var(--ink); }
    .fu-status-sub { font-size: 11px; color: var(--ink-4); margin-top: 2px; }

    /* ── Overlays / Drawers ──────────────────────── */
    .lv4-overlay-bg {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.3);
      z-index: 900; opacity: 0; pointer-events: none;
      transition: opacity 0.25s;
      backdrop-filter: blur(4px);
    }
    .lv4-overlay-bg.open { opacity: 1; pointer-events: auto; }

    .lv4-drawer {
      position: fixed; top: 0; right: -520px;
      width: 460px; max-width: 100vw;
      height: 100%;
      background: var(--bg-card);
      border-left: 1px solid var(--line);
      box-shadow: var(--shadow-lg);
      z-index: 910;
      display: flex; flex-direction: column;
      transition: right 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .lv4-drawer.open { right: 0; }

    .lv4-drawer-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--line);
      flex-shrink: 0;
    }
    .lv4-drawer-title { font-size: 14px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
    .lv4-drawer-body { flex: 1; overflow-y: auto; padding: 20px; }
    .lv4-drawer-body::-webkit-scrollbar { width: 3px; }
    .lv4-drawer-body::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

    /* ── Profile drawer ─────────────────────────── */
    .profile-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px; gap: 16px;
    }
    .profile-row:last-child { border-bottom: none; }
    .profile-key { color: var(--ink-3); font-weight: 500; flex-shrink: 0; }
    .profile-val { color: var(--ink); font-weight: 500; text-align: right; max-width: 60%; line-height: 1.4; }

    /* ── Approval drawer ────────────────────────── */
    .approval-item { padding: 16px 0; border-bottom: 1px solid var(--line); }
    .approval-item:last-child { border-bottom: none; }
    .approval-item-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .approval-item-name { font-size: 13px; font-weight: 700; color: var(--ink); }
    .approval-item-draft {
      background: var(--bg); border: 1px solid var(--line); border-radius: 8px;
      padding: 10px 12px; font-size: 12px; color: var(--ink-2);
      line-height: 1.55; font-style: italic; margin-bottom: 10px;
    }

    /* ── Chat drawer ─────────────────────────────── */
    .chat-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .chat-messages::-webkit-scrollbar { width: 3px; }
    .chat-messages::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
    .chat-bw { display: flex; flex-direction: column; }
    .chat-bw.out { align-items: flex-end; }
    .chat-bw.in  { align-items: flex-start; }
    .chat-sender { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-4); margin-bottom: 3px; padding: 0 3px; }
    .chat-bubble { max-width: 85%; padding: 9px 13px; border-radius: 12px; font-size: 12.5px; line-height: 1.5; }
    .bubble-lead { background: var(--bg-hover); color: var(--ink); border-bottom-left-radius: 3px; border: 1px solid var(--line); }
    .bubble-ai   { background: var(--brand); color: #fff; border-bottom-right-radius: 3px; }
    .bubble-user { background: #334155; color: #fff; border-bottom-right-radius: 3px; }
    .chat-time { font-size: 9px; color: var(--ink-4); font-weight: 500; margin-top: 3px; padding: 0 3px; }
    .chat-input-wrap { padding: 12px 16px 18px; border-top: 1px solid var(--line); flex-shrink: 0; background: var(--bg-card); }
    .chat-input-row { display: flex; gap: 7px; align-items: center; }
    .chat-input-row input {
      flex: 1; padding: 9px 14px;
      background: var(--bg); border: 1px solid var(--line);
      border-radius: 20px; font-size: 13px; font-family: inherit; color: var(--ink);
      outline: none; transition: all 0.15s;
    }
    .chat-input-row input:focus { border-color: var(--ink-3); background: var(--bg-card); }
    .chat-send {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--brand); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0; transition: all 0.15s;
    }
    .chat-send:hover { background: var(--brand-dark); transform: translateY(-1px); }
    .chat-send .ic { width: 15px; height: 15px; }
    .chat-reply-as {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .chat-reply-label { font-size: 10px; font-weight: 600; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.06em; }
    .chat-reply-modes { display: flex; gap: 4px; }
    .chat-reply-mode {
      font-size: 10px; padding: 3px 8px; border-radius: 5px;
      font-weight: 700; cursor: pointer; transition: all 0.12s;
      border: 1px solid transparent;
    }
    .chat-reply-mode.ai  { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
    .chat-reply-mode.you { background: var(--bg-hover); color: var(--ink-2); border-color: var(--line); }

    /* ── Bought modal ────────────────────────────── */
    .lv4-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.45);
      backdrop-filter: blur(8px);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      padding: 20px; opacity: 0; pointer-events: none; transition: opacity 0.2s;
    }
    .lv4-modal-overlay.open { opacity: 1; pointer-events: auto; }
    .lv4-modal {
      background: var(--bg-card);
      border-radius: 18px;
      padding: 0;
      width: 100%; max-width: 360px;
      box-shadow: var(--shadow-lg);
      transform: translateY(10px) scale(0.98);
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      overflow: hidden;
    }
    .lv4-modal-overlay.open .lv4-modal { transform: translateY(0) scale(1); }
    .lv4-modal-header {
      background: linear-gradient(135deg, var(--brand), var(--brand-dark));
      padding: 20px 22px 18px;
      text-align: center;
    }
    .lv4-modal-icon { font-size: 32px; margin-bottom: 6px; }
    .lv4-modal-title { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .lv4-modal-sub { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 3px; }
    .lv4-modal-body { padding: 20px 22px; }
    .lv4-modal-field { margin-bottom: 13px; }
    .lv4-modal-field label {
      display: block; font-size: 10px; font-weight: 700; color: var(--ink-3);
      text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 5px;
    }
    .lv4-modal-field input {
      width: 100%; padding: 10px 12px;
      border: 1px solid var(--line); border-radius: var(--r-btn);
      font-size: 14px; font-family: inherit; color: var(--ink);
      outline: none; transition: all 0.15s; background: var(--bg);
    }
    .lv4-modal-field input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(59,109,17,0.1); }
    .lv4-modal-actions { display: flex; gap: 8px; padding: 0 22px 20px; }
    .lv4-modal-confirm {
      flex: 1;
      padding: 12px;
      background: var(--brand);
      color: #fff;
      border: none;
      border-radius: var(--r-btn);
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 7px;
    }
    .lv4-modal-confirm:hover { background: var(--brand-dark); }
    .lv4-modal-confirm .ic { width: 15px; height: 15px; }
    .lv4-modal-cancel {
      padding: 12px 16px;
      background: transparent;
      color: var(--ink-3);
      border: 1px solid var(--line);
      border-radius: var(--r-btn);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
    }
    .lv4-modal-cancel:hover { background: var(--bg-hover); }

    /* Quick win strip */
    .lv4-quick-win {
      margin: 0 22px 14px;
      padding: 10px 12px;
      background: var(--green-bg);
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      display: flex; align-items: center; gap: 8px;
    }
    .lv4-quick-win-text { font-size: 11.5px; color: #15803d; font-weight: 600; flex: 1; }
    .lv4-quick-win-btn {
      padding: 5px 12px;
      background: var(--green);
      color: #fff;
      border: none; border-radius: 6px;
      font-size: 10.5px; font-weight: 700;
      font-family: inherit; cursor: pointer;
      transition: all 0.12s;
    }
    .lv4-quick-win-btn:hover { background: #15803d; }

    /* ── Mobile ──────────────────────────────────── */
    @media (max-width: 768px) {
      .lv4-wrap { position: relative; flex-direction: column; }
      .lv4-list-panel {
        width: 100%; max-width: 100%; min-width: 0; height: 100%;
        border-right: none;
        transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
      }
      .lv4-list-panel.slide-left {
        transform: translateX(-100%);
        position: absolute; top: 0; left: 0; height: 100%; z-index: 1;
      }
      .lv4-detail-panel {
        display: none;
        position: fixed; top: 0; left: 0;
        width: 100vw; height: 100vh; z-index: 9999;
        border-radius: 0; background: var(--glass-bg);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: none; overflow-y: auto;
      }
      .lv4-detail-panel.slide-in {
        display: flex; flex-direction: column; transform: none;
      }
      .lv4-detail-scroll { padding: 14px 12px; }
      .lv4-dh-top { flex-wrap: wrap; gap: 10px; }
      .lv4-dh-actions { width: 100%; }
      .lv4-drawer { width: 100%; max-width: 100%; right: -100%; }
      .lv4-drawer.open { right: 0; }
      .lv4-panel-top { padding: 14px 10px 0; }
      .mobile-back-btn { display: flex !important; }
    }

    .mobile-back-btn {
      display: none;
      align-items: center;
      gap: 6px;
      font-size: 13px; font-weight: 600; color: var(--ink-3);
      cursor: pointer;
      padding: 12px 14px;
      border-bottom: 1px solid var(--glass-border);
      background: transparent;
    }
    .mobile-back-btn .ic { width: 14px; height: 14px; transform: rotate(180deg); }
  `;
  document.head.appendChild(style);
}

// ─── Render helpers ───────────────────────────────────────────────────────────
function renderStatChips(stats) {
  return `
    <div class="lv4-stats">
      <div class="lv4-stat" onclick="setTypeFilter('business')">
        <div class="lv4-stat-num">${stats.business}</div>
        <div class="lv4-stat-lbl">Business</div>
      </div>
      <div class="lv4-stat" onclick="setTypeFilter('ad')">
        <div class="lv4-stat-num">${stats.adLeads}</div>
        <div class="lv4-stat-lbl">Ad leads</div>
      </div>
      <div class="lv4-stat ${stats.unread > 0 ? 'warn' : ''}" onclick="setStateFilter('engaged')">
        <div class="lv4-stat-num ${stats.unread > 0 ? 'amber' : ''}">${stats.unread}</div>
        <div class="lv4-stat-lbl">Unread</div>
      </div>
      <div class="lv4-stat ${stats.urgent > 0 ? 'warn' : ''}" onclick="setStateFilter('stalled')">
        <div class="lv4-stat-num ${stats.urgent > 0 ? 'amber' : ''}">${stats.urgent}</div>
        <div class="lv4-stat-lbl">Going cold</div>
      </div>
      <div class="lv4-stat ${stats.ready > 0 ? 'good' : ''}" onclick="setStateFilter('engaged')">
        <div class="lv4-stat-num ${stats.ready > 0 ? 'green' : ''}">${stats.ready}</div>
        <div class="lv4-stat-lbl">Ready</div>
      </div>
      <div class="lv4-stat ${stats.pending > 0 ? 'warn' : ''}" onclick="openApprovalDrawer()">
        <div class="lv4-stat-num ${stats.pending > 0 ? 'amber' : ''}">${stats.pending}</div>
        <div class="lv4-stat-lbl">Approvals</div>
      </div>
    </div>`;
}

function renderFilterTabs() {
  const states = [
    { id: 'all', label: 'All' },
    { id: 'engaged', label: 'Engaged' },
    { id: 'new', label: 'New' },
    { id: 'warm', label: 'Warm' },
    { id: 'stalled', label: 'Cold' },
    { id: 'ghosted', label: 'Ghosted' },
    { id: 'won', label: 'Won' },
  ];
  const types = [
    { id: 'business', label: 'Business' },
    { id: 'ad', label: 'Ads' },
    { id: 'personal', label: 'Personal' },
  ];
  return `
    <div class="lv4-filters">
      ${states.map(s => `<div class="lv4-fc ${activeLeadStateFilter === s.id ? 'active' : ''}" onclick="setStateFilter('${s.id}')">${s.label}</div>`).join('')}
      <div style="width:1px;background:var(--line);margin:0 2px;flex-shrink:0;align-self:stretch"></div>
      ${types.map(t => `<div class="lv4-fc ${activeLeadTypeFilter === t.id ? 'active' : ''}" onclick="setTypeFilter('${t.id}')">${t.label}</div>`).join('')}
    </div>`;
}

function renderLeadRow(lead) {
  const sc     = stateConfig(lead.lead_state);
  const ql     = qualityLabel(lead.lead_quality);
  const rr     = lead.read_receipt ? readReceiptIcon(lead.read_receipt) : null;
  const isPers = lead.lead_type === 'personal';
  const score  = lead.intent_score;
  const iColor = intentColor(score);
  const isWon  = lead.lead_state === 'won';

  // Engagement signal emojis — only shown when true
  const signals = [
    lead.sent_voice_note  && '🎤',
    lead.sent_media       && '📷',
    lead.sent_reaction    && '👍',
  ].filter(Boolean);

  return `
    <div class="lv4-card ${lead.id === activeLeadId ? 'active' : ''}"
         style="border-left-color:${sc.border}"
         onclick="openLeadDetail(${lead.id})">
      <div class="lv4-avatar ${isPers ? 'personal' : ''}">${lead.name.charAt(0)}</div>
      <div class="lv4-card-body">
        <div class="lv4-card-top">
          <span class="lv4-card-name">${lead.name}</span>
          <div class="lv4-card-right">
            ${lead.unread_count > 0 ? `<span class="lv4-unread">${lead.unread_count}</span>` : ''}
            ${rr && !lead.unread_count ? `<span class="lv4-rr" style="color:${rr.color}" title="${rr.title}">${rr.html}</span>` : ''}
            <span style="font-size:9.5px;color:var(--ink-4);font-weight:500">${timeAgo(lead.last_seen)}</span>
          </div>
        </div>
        <div class="lv4-summary">${lead.context_summary || lead.customer_intent || lead.phone}</div>
        <div class="lv4-card-meta">
          <span class="tp ${isWon ? 'tp-won' : 'tp-state'}">${sc.label}</span>
          ${ql === 'Hot'  ? `<span class="tp tp-hot">${ql}</span>`  : ''}
          ${ql === 'Warm' && !isWon ? `<span class="tp tp-warm">${ql}</span>` : ''}
          ${lead.is_ad_lead ? `<span class="tp tp-ad">${ic('ad',9)} Ad</span>` : ''}
          ${(lead.product_interests||[]).slice(0,1).map(p => `<span class="tp tp-product">${formatInterest(p)}</span>`).join('')}
          ${signals.length ? `<span class="lv4-signals">${signals.join('')}</span>` : ''}
        </div>
        ${score !== null && score !== undefined && !isPers ? `
          <div class="lv4-intent-bar" title="Intent score: ${score}/100">
            <div class="lv4-intent-fill" style="width:${score}%;background:${iColor}"></div>
          </div>` : ''}
      </div>
    </div>`;
}

// ─── Follow-up card render ────────────────────────────────────────────────────
function renderPhaseBar(lead) {
  const fu        = lead.followup;
  const sentCount = fu?.sent_steps?.length || 0;
  const percent   = Math.round((sentCount / 11) * 100);
  const minPct    = Math.round((5 / 11) * 100);
  return `
    <div class="fu-progress-wrap">
      <div class="fu-progress-row">
        <span class="fu-progress-label">${sentCount} of 11 sent</span>
        <button class="btn btn-xs btn-green" onclick="openBoughtModal('${lead.id}')">
          ${ic('check',10)} Mark as bought
        </button>
      </div>
      <div class="fu-progress-track">
        <div class="fu-progress-fill" style="width:${percent}%"></div>
        <div class="fu-progress-marker" style="left:${minPct}%" title="Recommended minimum (5/11)"></div>
      </div>
    </div>`;
}

function renderSequenceTimeline(lead) {
  const fu        = lead.followup;
  const sentSteps = fu?.sent_steps || [];
  const curStep   = fu?.current_step || 0;

  return DEFAULT_SEQUENCE.map(step => {
    const cfg       = KLT_CONFIG[step.klt];
    const isSent    = sentSteps.includes(step.step);
    const isCurrent = step.step === curStep;
    const isNext    = step.step === curStep + 1 && !isSent;
    const days      = getCumulativeDays(step.step - 1);

    let dotCls, dotTxt, nameCls, meta;
    if (isSent) {
      dotCls = 'dot-sent'; dotTxt = `${ic('check',10)}`; nameCls = ''; meta = 'Sent';
    } else if (isCurrent && fu?.pending_approval) {
      dotCls = 'dot-pending'; dotTxt = step.step; nameCls = ''; meta = 'Awaiting approval';
    } else if (isCurrent) {
      dotCls = 'dot-next'; dotTxt = step.step; nameCls = ''; meta = fu?.next_due ? `Due ${timeUntil(fu.next_due)}` : 'Scheduled';
    } else if (isNext) {
      dotCls = 'dot-next'; dotTxt = step.step; nameCls = ''; meta = `~day ${days}`;
    } else {
      dotCls = 'dot-future'; dotTxt = step.step; nameCls = 'muted'; meta = `~day ${days}`;
    }

    return `
      <div class="fu-step">
        <div class="fu-step-dot ${dotCls}">${dotTxt}</div>
        <div class="fu-step-body">
          <div class="fu-step-name ${nameCls}">
            <span class="ic" style="width:13px;height:13px;color:var(--ink-3)">${TOUCHPOINT_ICONS[step.type]}</span>
            ${step.name}
            <span class="fu-klt" style="background:${cfg.bg};color:${cfg.color}">${step.klt}</span>
          </div>
          <div class="fu-step-meta">${meta}</div>
          ${!isSent ? `<div class="fu-step-desc">${step.desc}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

function renderFollowupCard(lead) {
  const fu      = lead.followup;
  const isExp   = sequenceExpanded[lead.id] || false;
  const editing = editingFollowupId === lead.id;
  const rewriting = editingFollowupId === `${lead.id}-rewrite`;

  if (!fu || lead.lead_type === 'personal') return '';

  if (fu.status === 'not_enrolled') {
    return `
      <div class="fu-card">
        <div class="fu-no-consent">
          <div class="fu-no-consent-icon">💬</div>
          <div class="fu-no-consent-text">
            ${lead.name.split(' ')[0]} isn't in a follow-up sequence yet.<br>
            Send a consent message to start the 11-step journey.
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="sendConsentMessage(${lead.id})">
            Send Consent Message
          </button>
        </div>
        <div class="fu-seq-toggle" onclick="toggleSequence(${lead.id})">
          <span>${isExp ? '↑ Hide sequence' : '↓ Preview all 11 follow-ups'}</span>
          <span class="pref-link" onclick="event.stopPropagation();navigateToPreferences('followup-materials')">Edit →</span>
        </div>
        ${isExp ? `<div class="fu-seq">${renderSequenceTimeline(lead)}</div>` : ''}
      </div>`;
  }

  if (fu.status === 'opted_out') {
    return `
      <div class="fu-card">
        <div class="fu-status-row">
          <span style="font-size:18px">🚫</span>
          <div>
            <div class="fu-status-title">${lead.name.split(' ')[0]} opted out</div>
            <div class="fu-status-sub">No automated messages will be sent.</div>
          </div>
        </div>
      </div>`;
  }

  if (fu.status === 'completed') {
    return `
      <div class="fu-card">
        <div class="fu-status-row">
          ${ic('check',18)}
          <div>
            <div class="fu-status-title">Sequence complete</div>
            <div class="fu-status-sub">All ${DEFAULT_SEQUENCE.length} follow-ups sent.</div>
          </div>
        </div>
      </div>`;
  }

  // opted_in
  const step = DEFAULT_SEQUENCE.find(s => s.step === fu.current_step) || DEFAULT_SEQUENCE[0];
  const cfg  = KLT_CONFIG[step.klt];

  let currentBlock = '';
  if (fu.pending_approval && fu.draft) {
    currentBlock = `
      <div class="fu-draft">
        <div class="fu-draft-label">${ic('inbox',11)} Follow-up ${fu.current_step} · ${step.name} · needs review</div>
        <div class="fu-draft-text" id="fu-dt-${lead.id}">${fu.draft}</div>
      </div>
      ${editing ? `
        <div class="fu-edit-area">
          <textarea id="fu-ei-${lead.id}">${fu.draft}</textarea>
          <div class="fu-btns" style="margin-top:6px">
            <button class="btn btn-sm btn-green" onclick="saveEditedDraft(${lead.id})">${ic('check',13)} Save & Send</button>
            <button class="btn btn-sm btn-ghost" onclick="cancelEdit(${lead.id})">Cancel</button>
          </div>
        </div>
      ` : rewriting ? `
        <div class="fu-rewrite-area">
          <input id="fu-ri-${lead.id}" placeholder="e.g. 'make it shorter', 'mention the payment plan'…" />
          <div class="fu-btns" style="margin-top:8px">
            <button class="btn btn-sm btn-ghost" onclick="submitRewrite(${lead.id})">${ic('refresh',13)} Rewrite</button>
            <button class="btn btn-sm btn-ghost" onclick="cancelEdit(${lead.id})">Cancel</button>
          </div>
        </div>
      ` : `
        <div class="fu-btns">
          <button class="btn btn-sm btn-green" onclick="approveDraft(${lead.id})">${ic('check',13)} Approve</button>
          <button class="btn btn-sm btn-ghost" onclick="editDraft(${lead.id})">${ic('edit',13)} Edit</button>
          <button class="btn btn-sm btn-ghost" onclick="rewriteDraft(${lead.id})">${ic('refresh',13)} Rewrite</button>
          <button class="btn btn-sm btn-red" onclick="skipDraft(${lead.id})">${ic('x',13)}</button>
        </div>
      `}`;
  } else if (fu.next_due) {
    const overdue = new Date(fu.next_due) < new Date();
    currentBlock = `
      <div style="display:flex;align-items:center;gap:10px;padding:2px 0 12px;border-bottom:1px solid var(--line);margin-bottom:4px">
        <div style="width:32px;height:32px;border-radius:8px;background:${cfg.bg};display:flex;align-items:center;justify-content:center;color:${cfg.color};flex-shrink:0">
          <span class="ic" style="width:15px;height:15px">${TOUCHPOINT_ICONS[step.type]}</span>
        </div>
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--ink)">Follow-up ${fu.current_step} · ${step.name}</div>
          <div style="font-size:11px;color:${overdue ? 'var(--red)' : 'var(--ink-4)'};margin-top:2px">
            ${overdue ? '⚠ Overdue' : `Due in ${timeUntil(fu.next_due)}`} · ${step.desc}
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="fu-card">
      <div class="fu-card-head">
        <div class="fu-card-title">
          <span>Follow-up Sequence</span>
          <span style="color:var(--ink-4)">${fu.sent_steps.length}/${DEFAULT_SEQUENCE.length} sent</span>
        </div>
        ${renderPhaseBar(lead)}
        ${currentBlock}
      </div>
      <div class="fu-seq-toggle" onclick="toggleSequence(${lead.id})">
        <span>${isExp ? '↑ Hide timeline' : '↓ View all 11 steps'}</span>
        <span class="pref-link" onclick="event.stopPropagation();navigateToPreferences('followup-materials')">Edit →</span>
      </div>
      ${isExp ? `<div class="fu-seq">${renderSequenceTimeline(lead)}</div>` : ''}
    </div>`;
}

// ─── Read receipt visual ──────────────────────────────────────────────────────
function renderReadReceiptFlow(lead) {
  const steps = [
    { key: 'sent',      label: 'Sent',      color: '#94a3b8', icon: '✓'  },
    { key: 'delivered', label: 'Delivered', color: '#64748b', icon: '✓✓' },
    { key: 'read',      label: 'Read',      color: '#3b82f6', icon: '✓✓' },
    { key: 'replied',   label: 'Replied',   color: '#22c55e', icon: '↩'  },
  ];
  const order = ['sent','delivered','read','replied'];
  const curIdx = order.indexOf(lead.read_receipt || 'sent');

  return `
    <div class="lv4-receipt-flow">
      <div class="lv4-receipt-label">Message status</div>
      <div class="lv4-receipt-steps">
        ${steps.map((s, i) => {
          const isActive = i <= curIdx;
          return `
            ${i > 0 ? `<div class="lv4-receipt-arrow">›</div>` : ''}
            <div class="lv4-receipt-step">
              <div class="lv4-receipt-dot ${isActive ? 'active' : ''}"
                   style="${isActive ? `background:${s.color};color:#fff;border-color:${s.color}` : ''}">
                ${s.icon}
              </div>
              <div class="lv4-receipt-name" style="${isActive ? `color:${s.color}` : ''}">${s.label}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function renderDetailPanel(lead) {
  if (!lead) {
    return `
      <div class="lv4-placeholder">
        <div class="lv4-placeholder-card">
          ${ic('person', 56)}
          <p>Select a lead to view their profile</p>
          <div class="sub">Click any lead from the list</div>
        </div>
      </div>`;
  }

  const sc    = stateConfig(lead.lead_state);
  const ql    = qualityLabel(lead.lead_quality);
  const waUrl = `https://wa.me/${lead.phone.replace(/\D/g,'')}`;
  const fuPending = lead.followup?.pending_approval;
  const isWon = lead.lead_state === 'won';
  const score = lead.intent_score;
  const iColor = intentColor(score);

  // Engagement signals strip
  const signals = [
    { icon: '🎤', label: 'Voice note', active: lead.sent_voice_note, title: 'Lead sent a voice note' },
    { icon: '📷', label: 'Media',      active: lead.sent_media,      title: 'Lead sent an image or file' },
    { icon: '👍', label: 'Reaction',   active: lead.sent_reaction,   title: 'Lead reacted to a message' },
    { icon: '📡', label: score !== null ? `${score}` : '—', active: score >= 50, title: `Intent score: ${score}/100` },
  ];

  const nlpSection = (() => {
    const hasObj  = (lead.objection_tags||[]).length > 0;
    const hasComp = (lead.competitor_mentions||[]).length > 0;
    const hasQ    = (lead.pre_purchase_questions||[]).length > 0;
    if (!hasObj && !hasComp && !hasQ) return '';
    return `
      <div class="lv4-nlp-section">
        <div class="lv4-nlp-label">Conversation signals</div>
        ${hasObj ? `
          <div style="margin-bottom:7px">
            <div style="font-size:9px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Objections</div>
            <div class="lv4-tag-row">
              ${lead.objection_tags.map(t => `<span class="lv4-tag lv4-tag-obj">⚠ ${t.replace(/_/g,' ')}</span>`).join('')}
            </div>
          </div>` : ''}
        ${hasComp ? `
          <div style="margin-bottom:7px">
            <div style="font-size:9px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Compared to</div>
            <div class="lv4-tag-row">
              ${lead.competitor_mentions.map(c => `<span class="lv4-tag lv4-tag-comp">⚡ ${c}</span>`).join('')}
            </div>
          </div>` : ''}
        ${hasQ ? `
          <div>
            <div style="font-size:9px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Asked before buying</div>
            <div class="lv4-tag-row">
              ${lead.pre_purchase_questions.map(q => `<span class="lv4-tag lv4-tag-q">? ${q}</span>`).join('')}
            </div>
          </div>` : ''}
      </div>`;
  })();

  return `
    <div onclick="mobileBackFromDetail(event)" class="mobile-back-btn">
      ${ic('arrow',14)} Back to leads
    </div>
    <div class="lv4-detail-scroll">

      <!-- ── Header card ────────────────────────── -->
      <div class="lv4-dh">
        <div class="lv4-dh-top">
          <div class="lv4-dh-left">
            <div class="lv4-dh-avatar">${lead.name.charAt(0)}</div>
            <div>
              <div class="lv4-dh-name">${lead.name}</div>
              <div class="lv4-dh-sub">
                <span class="lv4-dh-phone">${lead.phone}</span>
                <span style="display:inline-flex;align-items:center;gap:3px;font-size:10.5px;color:var(--ink-3)">
                  <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${sc.dot}"></span>
                  ${sc.label}
                </span>
                ${ql === 'Hot'  ? `<span class="tp tp-hot">${ql}</span>` : ''}
                ${ql === 'Warm' && !isWon ? `<span class="tp tp-warm">${ql}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="lv4-dh-actions">
            <button class="btn btn-ghost btn-sm" onclick="openChatDrawer(${lead.id})">${ic('chat',14)}</button>
            <a href="tel:${lead.phone.replace(/\D/g,'')}" class="btn btn-ghost btn-sm" style="text-decoration:none">${ic('phone',14)}</a>
            <a href="${waUrl}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none">${ic('wa',14)} WhatsApp</a>
          </div>
        </div>

        <!-- Bought button + drawer launchers -->
        <div class="lv4-dh-bottom">
          <button class="btn-bought ${isWon ? 'won' : ''}" onclick="${isWon ? '' : `openBoughtModal('${lead.id}')`}">
            ${isWon
              ? `${ic('check',15)} Sold · KES ${lead.deal_value || '—'}`
              : `${ic('bag',15)} Mark as Bought`}
          </button>
          ${lead.lead_type !== 'personal' ? `
            <div class="lv4-drawer-btn" onclick="openProfileDrawer(${lead.id})" style="flex:0;white-space:nowrap;min-width:90px">
              ${ic('eye',14)} Profile
            </div>
            <div class="lv4-drawer-btn ${fuPending ? 'alert' : ''}" onclick="openFollowupsDrawer(${lead.id})" style="flex:0;white-space:nowrap;min-width:90px">
              ${ic('list',14)} Follow-ups
              ${fuPending ? `<span class="badge">1</span>` : ''}
            </div>` : ''}
        </div>
      </div>

      ${lead.lead_type === 'personal' ? `
        <div class="personal-notice">
          ${ic('person',14)}
          <span>Personal contact — no buying intent detected. Not included in follow-up queues.</span>
        </div>` : ''}

      <!-- ── Engagement signals ──────────────────── -->
      ${lead.lead_type !== 'personal' ? `
        <div class="lv4-signals-strip">
          ${signals.map(s => `
            <div class="lv4-sig-tile ${s.active ? 'active' : ''}" title="${s.title}">
              <div class="lv4-sig-tile-icon">${s.icon}</div>
              <div class="lv4-sig-tile-num">${s.label}</div>
              <div class="lv4-sig-tile-lbl">${s.icon === '📡' ? 'Intent' : s.active ? 'Yes' : 'No'}</div>
            </div>`).join('')}
        </div>

        <!-- Read receipt flow -->
        ${renderReadReceiptFlow(lead)}

        <!-- NLP signals -->
        ${nlpSection}
      ` : ''}

      <!-- ── Follow-up card ──────────────────────── -->
      ${renderFollowupCard(lead)}

      <!-- ── Next action ─────────────────────────── -->
      ${lead.next_action_plan ? `
        <div class="action-card">
          <div class="action-card-top">
            <span class="action-label">${ic('spark',12)} Suggested next step</span>
            <span class="ai-badge">AI</span>
          </div>
          <div class="action-text">${lead.next_action_plan}</div>
          <div class="action-btns">
            <button class="btn btn-primary btn-sm" onclick="alert('Queued for AI send at optimal time.')">
              ${ic('send',13)} Queue for AI
            </button>
            <a href="${waUrl}?text=${encodeURIComponent(lead.next_action_plan)}" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none">
              ${ic('wa',13)} Send now
            </a>
          </div>
        </div>` : ''}

    </div>`;
}

// ─── Profile Drawer ───────────────────────────────────────────────────────────
function openProfileDrawer(leadId) {
  const lead = leadsData.find(l => l.id === leadId);
  if (!lead) return;
  const waUrl = `https://wa.me/${lead.phone.replace(/\D/g,'')}`;

  const rows = [
    lead.customer_intent    && ['Intent',           lead.customer_intent],
    lead.psychology         && ['Psychology',        lead.psychology],
    lead.conv_stage         && ['Stage',             lead.conv_stage],
    lead.follow_up_count !== undefined && ['Follow-ups sent', lead.follow_up_count],
    lead.last_seen          && ['Last seen',         timeAgo(lead.last_seen) + ' ago'],
    lead.last_seen_online   && ['Last online',       timeAgo(lead.last_seen_online) + ' ago'],
    lead.read_receipt       && ['Message status',    lead.read_receipt.charAt(0).toUpperCase() + lead.read_receipt.slice(1)],
    lead.intent_score !== null && lead.intent_score !== undefined && ['Intent score', `${lead.intent_score} / 100`],
  ].filter(Boolean);

  const cart = (lead.cart_state||[]).length > 0 ? `
    <div class="lv4-section" style="margin-top:18px">
      <div class="lv4-sec-label">${ic('cart',12)} Interested in</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${lead.cart_state.map(i=>`<span class="tag">${i}</span>`).join('')}
      </div>
    </div>` : '';

  const trust = (lead.trust_markers||[]).length > 0 ? `
    <div class="lv4-section" style="margin-top:18px">
      <div class="lv4-sec-label">${ic('check',12)} Trust markers</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${lead.trust_markers.map(m=>`<span class="tag green">${ic('check',11)} ${m}</span>`).join('')}
      </div>
    </div>` : '';

  const vibe = lead.vibe_check ? `
    <div class="lv4-section" style="margin-top:18px">
      <div class="lv4-sec-label">${ic('eye',12)} Vibe check</div>
      <div class="card card-pad" style="font-size:12.5px;color:var(--ink-2);line-height:1.6;font-style:italic">${lead.vibe_check}</div>
    </div>` : '';

  const engagementSignals = `
    <div class="lv4-section" style="margin-top:18px">
      <div class="lv4-sec-label">${ic('zap',12)} Engagement signals</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${lead.sent_voice_note ? `<span class="tag">🎤 Sent voice note</span>` : ''}
        ${lead.sent_media      ? `<span class="tag">📷 Sent media</span>` : ''}
        ${lead.sent_reaction   ? `<span class="tag">👍 Reacted to message</span>` : ''}
        ${!lead.sent_voice_note && !lead.sent_media && !lead.sent_reaction
          ? `<span style="font-size:12px;color:var(--ink-4)">No engagement signals yet</span>` : ''}
      </div>
    </div>`;

  const nlpSignals = (() => {
    const hasObj  = (lead.objection_tags||[]).length > 0;
    const hasComp = (lead.competitor_mentions||[]).length > 0;
    const hasQ    = (lead.pre_purchase_questions||[]).length > 0;
    if (!hasObj && !hasComp && !hasQ) return '';
    return `
      <div class="lv4-section" style="margin-top:18px">
        <div class="lv4-sec-label">${ic('brain',12)} Conversation intelligence</div>
        ${hasObj  ? `<div style="margin-bottom:10px"><div style="font-size:9.5px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Objections raised</div><div style="display:flex;flex-wrap:wrap;gap:5px">${lead.objection_tags.map(t=>`<span class="lv4-tag lv4-tag-obj">⚠ ${t.replace(/_/g,' ')}</span>`).join('')}</div></div>` : ''}
        ${hasComp ? `<div style="margin-bottom:10px"><div style="font-size:9.5px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Competitors mentioned</div><div style="display:flex;flex-wrap:wrap;gap:5px">${lead.competitor_mentions.map(c=>`<span class="lv4-tag lv4-tag-comp">⚡ ${c}</span>`).join('')}</div></div>` : ''}
        ${hasQ    ? `<div><div style="font-size:9.5px;font-weight:700;color:var(--ink-4);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Questions asked</div><div style="display:flex;flex-direction:column;gap:4px">${lead.pre_purchase_questions.map(q=>`<span style="font-size:12px;color:var(--ink-2);padding:5px 8px;background:var(--bg);border-radius:6px;border:1px solid var(--line)">? ${q}</span>`).join('')}</div></div>` : ''}
      </div>`;
  })();

  const adSection = lead.is_ad_lead ? `
    <div class="lv4-section" style="margin-top:18px">
      <div class="lv4-sec-label">${ic('ad',12)} Ad attribution</div>
      <div class="card card-pad" style="display:flex;gap:12px;align-items:flex-start">
        ${lead.ad_thumbnail_url
          ? `<img src="${lead.ad_thumbnail_url}" style="width:46px;height:46px;border-radius:8px;object-fit:cover;flex-shrink:0" alt="Ad">`
          : `<div style="width:46px;height:46px;border-radius:8px;background:var(--bg-hover);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--ink-4)">${ic('ad',16)}</div>`}
        <div>
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-4);margin-bottom:2px">${lead.ad_platform||'Meta'}</div>
          <div style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:3px">${lead.ad_headline||'—'}</div>
          <div style="font-size:11px;color:var(--ink-3);line-height:1.4">${(lead.ad_body||'').slice(0,90)}${(lead.ad_body||'').length>90?'…':''}</div>
        </div>
      </div>
    </div>` : '';

  openDrawer('profile-drawer', `${lead.name}'s Profile`, `
    <div class="card card-pad" style="margin-bottom:0">
      ${rows.map(([k,v]) => `
        <div class="profile-row">
          <span class="profile-key">${k}</span>
          <span class="profile-val">${v}</span>
        </div>`).join('')}
    </div>
    ${cart}${trust}${vibe}${engagementSignals}${nlpSignals}${adSection}
    <div style="margin-top:18px;display:flex;gap:8px">
      <a href="${waUrl}" target="_blank" class="btn btn-primary" style="flex:1;justify-content:center;text-decoration:none">${ic('wa',14)} Open WhatsApp</a>
    </div>
  `);
}

// ─── Follow-ups Drawer ────────────────────────────────────────────────────────
function openFollowupsDrawer(leadId) {
  const lead = leadsData.find(l => l.id === leadId || l.id === Number(leadId));
  if (!lead) return;
  openDrawer('followups-drawer', 'Follow-up Sequence', renderFollowupsDrawerContent(lead));
}

function renderFollowupsDrawerContent(lead) {
  return `
    ${renderFollowupCard(lead)}
    <div style="margin-top:4px;padding-top:14px;border-top:1px solid var(--line)">
      <div class="lv4-sec-label" style="margin-bottom:12px">${ic('list',12)} Full Sequence Timeline</div>
      ${renderSequenceTimeline(lead)}
    </div>`;
}

// ─── Chat Drawer ──────────────────────────────────────────────────────────────
let messageSubscription = null;

async function openChatDrawer(leadId) {
  // 1. Find the lead data
  const lead = leadsData.find(l => l.id === leadId || l.id === Number(leadId));
  if (!lead) return;

  // 2. Clear any existing real-time listener to avoid memory leaks
  if (messageSubscription) window.supabase.removeChannel(messageSubscription);

  const waUrl = `https://wa.me/${lead.phone.replace(/\D/g,'')}`;

  // 3. Open the drawer shell
  const el = openDrawer('chat-drawer', `Chat · ${lead.name.split(' ')[0]}`, null, true);
  const drawer = document.getElementById('chat-drawer');
  const body = drawer.querySelector('.lv3-drawer-body'); // Changed to lv3 to match your CSS
  
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.padding = '0';

  // 4. Set up the Live Chat Layout
  body.innerHTML = `
    <div class="chat-messages" id="chat-msgs-${lead.id}" style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
        <!-- Bubbles will be injected here -->
    </div>
    <div class="chat-input-wrap">
      <div class="chat-reply-as">
        <span class="chat-reply-label">Reply as</span>
        <div class="chat-reply-modes">
          <span class="chat-reply-mode ai" id="mode-ai-${lead.id}">AI</span>
          <span class="chat-reply-mode you active" id="mode-user-${lead.id}">You</span>
        </div>
      </div>
      <div class="chat-input-row">
        <input type="text" id="live-msg-input-${lead.id}" placeholder="Type a message…" onkeydown="if(event.key==='Enter') sendLiveMessage(${lead.id})">
        <button class="chat-send" onclick="sendLiveMessage(${lead.id})">${ic('send',15)}</button>
      </div>
      <div style="text-align:center;margin-top:10px">
        <a href="${waUrl}" target="_blank" style="font-size:11px;color:var(--blue);font-weight:600;text-decoration:none">Open in WhatsApp ↗</a>
      </div>
    </div>`;

  // 5. Load History from Supabase
  const { data: history } = await window.supabase
    .from('messages')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: true });

  if (history) {
    history.forEach(msg => appendLiveBubble(msg, lead.id));
  }

  // 6. Start Listening for New Messages (Realtime)
  messageSubscription = window.supabase
    .channel(`live-chat-${lead.id}`)
    .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `lead_id=eq.${lead.id}` 
    }, payload => {
        appendLiveBubble(payload.new, lead.id);
    })
    .subscribe();
}

/**
 * Renders a single bubble using your premium CSS classes
 */
function appendLiveBubble(msg, leadId) {
    const container = document.getElementById(`chat-msgs-${leadId}`);
    if (!container) return;

    let wrapCls, bubCls, senderName;
    
    // Map database fields to UI Classes
    if (msg.direction === 'in') {
        wrapCls = 'in';
        bubCls = 'bubble-lead';
        senderName = 'Lead';
    } else {
        wrapCls = 'out';
        bubCls = msg.sender === 'ai' ? 'bubble-ai' : 'bubble-user';
        senderName = msg.sender === 'ai' ? 'AI' : 'You';
    }

    const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bubbleHtml = `
      <div class="chat-bw ${wrapCls}">
        <span class="chat-sender">${senderName}</span>
        <div class="chat-bubble ${bubCls}">${msg.message_text}</div>
        <span class="chat-time">${timeStr}</span>
      </div>`;

    container.insertAdjacentHTML('beforeend', bubbleHtml);
    container.scrollTop = container.scrollHeight;
}
// ─── Approval Drawer ──────────────────────────────────────────────────────────
function openApprovalDrawer() {
  const pending = leadsData.filter(l => l.followup?.pending_approval);
  const content = pending.length === 0 ? `
    <div class="lv3-empty" style="height:200px">
      ${ic('check',36)}
      <p style="font-size:14px;font-weight:700;color:var(--ink)">All clear</p>
      <p>No follow-ups waiting for approval.</p>
    </div>` : `
    ${pending.length > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;font-weight:600;color:#d97706">
        ${pending.length} follow-up${pending.length>1?'s':''} waiting · takes ~1 minute to review
      </div>` : ''}
    <div class="approval-list-container">
      ${pending.map(lead => {
        const fu   = lead.followup;
        const step = DEFAULT_SEQUENCE.find(s => s.step === fu.current_step) || DEFAULT_SEQUENCE[0];
        const cfg  = KLT_CONFIG[step.klt];
        return `
          <div class="approval-item" id="approval-item-${lead.id}">
            <div class="approval-item-head">
              <div>
                <div class="approval-item-name">${lead.name}</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:3px">
                  <span style="font-size:10px;font-weight:600;color:var(--ink-3)">Step ${fu.current_step} · ${step.name}</span>
                  <span class="fu-klt" style="background:${cfg.bg};color:${cfg.color}">${step.klt}</span>
                </div>
              </div>
              <button onclick="openLeadDetail(${lead.id});closeAllDrawers()" style="background:none;border:none;cursor:pointer;font-size:10px;font-weight:700;color:var(--blue)">View →</button>
            </div>
            <div class="approval-item-draft">${fu.draft}</div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-green" style="flex:1;justify-content:center" id="approve-btn-${lead.id}" onclick="approveDraft(${lead.id}, true)">
                ${ic('check',13)} Approve & Send
              </button>
              <button class="btn btn-sm btn-red" onclick="skipDraft(${lead.id});refreshApprovalDrawer()">${ic('x',13)}</button>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  openDrawer('approval-drawer', 'Approval Inbox', content);
}

function refreshApprovalDrawer() {
  const drawer = document.getElementById('approval-drawer');
  if (!drawer || !drawer.classList.contains('open')) return;
  rerenderAll();
  openApprovalDrawer();
}

// ... existing code in leads.js ...

// ─── NEW: LIVE CHAT SEND LOGIC ──────────────────────────────────────────────
window.sendLiveMessage = async function(leadId) {
    const input = document.getElementById(`live-msg-input-${leadId}`);
    const text = input.value.trim();
    if (!text) return;

    // 1. Determine sender (you could add logic here to switch between 'user' and 'ai')
    const sender = 'user'; 

    // 2. Save to Supabase
    // This will trigger the Realtime listener in openChatDrawer, 
    // and the bubble will appear instantly.
    const { error } = await window.supabase.from('messages').insert({
        business_id: window.currentBusinessId,
        lead_id: leadId,
        message_text: text,
        sender: sender,
        direction: 'out'
    });

    if (error) {
        console.error("Chat Error:", error);
        alert("Could not send message. Check console.");
    } else {
        input.value = '';
        
        // 3. Trigger the Edge Function to push to WhatsApp
        // Note: This won't work until you deploy the 'send-whatsapp-reply' function
        window.supabase.functions.invoke('send-whatsapp-reply', {
            body: { 
                leadId: leadId, 
                text: text, 
                businessId: window.currentBusinessId 
            }
        });
    }
};

// ─── Helper for UI icons ───
function ic(name, size) {
    return `<span class="ic" style="width:${size}px;height:${size}px">${ICON[name]}</span>`;
}
let currentChatSubscription = null;

// 1. Function to send a message from the UI
window.sendLiveMessage = async function(leadId) {
    const input = document.getElementById(`live-msg-input-${leadId}`);
    const text = input.value.trim();
    if (!text) return;

    // Save to local DB first (Realtime will show it instantly)
    const { error } = await window.supabase.from('messages').insert({
        business_id: window.currentBusinessId,
        lead_id: leadId,
        message_text: text,
        sender: 'user',
        direction: 'out'
    });

    if (!error) {
        input.value = '';
        // Trigger WhatsApp Dispatcher
        window.supabase.functions.invoke('send-whatsapp-reply', {
            body: { leadId, text, businessId: window.currentBusinessId }
        });
    }
};

// 2. Realtime Listener (Add this inside your openChatDrawer function)
function setupRealtime(leadId) {
    if (currentChatSubscription) window.supabase.removeChannel(currentChatSubscription);

    currentChatSubscription = window.supabase
        .channel(`chat-${leadId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages', 
            filter: `lead_id=eq.${leadId}` 
        }, payload => {
            // This function calls your existing bubble rendering logic
            appendLiveBubble(payload.new, leadId);
        })
        .subscribe();
}
window.approveDraft = async function(leadId, isFromInbox = false) {
    const lead = leadsData.find(l => l.id === leadId || l.id === Number(leadId));
    if (!lead || !lead.followup?.draft) return;

    const btn = document.getElementById(isFromInbox ? `approve-btn-${leadId}` : `btn-approve-inline-${leadId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-pulse">Sending...</span>`;
    }

    const draftText = lead.followup.draft;

    try {
        // 1. Save to the live messages table (sender = 'ai')
        const { error: msgError } = await window.supabase.from('messages').insert({
            business_id: window.currentBusinessId,
            lead_id: leadId,
            message_text: draftText,
            sender: 'ai',
            direction: 'out'
        });

        if (msgError) throw msgError;

        // 2. Trigger the WhatsApp Edge Function (The Dispatcher)
        await window.supabase.functions.invoke('send-whatsapp-reply', {
            body: { 
                leadId: leadId, 
                text: draftText, 
                businessId: window.currentBusinessId 
            }
        });

        // 3. Update local state to remove the pending flag
        lead.followup.pending_approval = false;
        lead.followup.sent_steps.push(lead.followup.current_step);
        lead.followup.current_step += 1;
        lead.followup.draft = null;

        // 4. UI Cleanup
        if (isFromInbox) {
            refreshApprovalDrawer(); 
        } else {
            rerenderAll(); // Refresh the main Lead detail view
        }

        showToast(`Follow-up sent to ${lead.name.split(' ')[0]}`, 'success');

    } catch (err) {
        console.error("Approval Error:", err);
        alert("Failed to send: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "Retry Approve";
        }
    }
};