// ─── SVG Icon Dictionary (Premium Icons, No Emojis) ───────────────────────────
const ICONS = {
  bot: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2zm0 4c2.2 0 4 1.8 4 4v2h2v4h-2v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H6v-4h2v-2c0-2.2 1.8-4 4-4zm-2 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>`,
  materials: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  business: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-4a2 2 0 0 1 4 0v4"/></svg>`,
  whatsapp: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  billing: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="11" y2="15"/></svg>`,
  approval: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  manual: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  auto: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  time: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  target: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  pipeline: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 3v18M18 3v18M12 8v8M8 12h8"/></svg>`,
  bell: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  star: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  bulb: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 21h6M10 17h4M12 2a7 7 0 0 0-7 7c0 2.2 1 4.1 2.5 5.5.9.8 1.5 2 1.5 3.5V19h6v-1c0-1.5.6-2.7 1.5-3.5C18 13.1 19 11.2 19 9a7 7 0 0 0-7-7z"/></svg>`,
  gift: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
  story: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  cap: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  identity: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  contact: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  world: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  status: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  scale: `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M3 14l9-9 9 9"/><path d="M3 14v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg>`,
  check: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
  power: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>`,
  chevronDown: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`,
  chevronUp: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>`,
  upload: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  edit: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
};

// ─── Preferences State ────────────────────────────────────────────────────────
let activePrefSection  = 'followup';
let expandedMaterials  = {};
let editingMaterialId  = null;
let addingMaterialType = null;
let uploadedFilesData  = {}; // Temporarily holds uploaded file names for the UI

// ─── Mock Data ────────────────────────────────────────────────────────────────
let mockPrefs = {
  followup_enabled:       true,
  zone_recent_days:       7,
  zone_medium_days:       14,
  zone_recent_mode:       'approval',
  zone_medium_mode:       'manual',
  zone_old_mode:          'auto',
  max_per_lead:           12,
  daily_cap:              40,
  lifetime_sent:          243,
  quiet_start:            21,
  quiet_end:              8,
  active_days:            [1,2,3,4,5],
  stop_at_stage:          'paid',
  alert_at_stage:         'intent',
  nudge_enabled:          true,
  nudge_min_pending:      3,
  nudge_interval_hrs:     2,
  hot_lead_alert:         true,
  hot_lead_threshold:     8,
  mat_testimonial:        true,
  mat_tip:                true,
  mat_offer:              true,
  mat_story:              false,
  mat_educational:        false,
};

let mockMaterials = [
  { id: 1, type: 'testimonial', title: 'James, Lavington',    content: 'Installation was done in 3 hours, everything worked perfectly from day one. Best money I spent this year.', is_active: true,  expires_at: null, fileName: null },
  { id: 2, type: 'testimonial', title: 'Grace Njoroge',       content: 'No more KPLC bills! Paid itself back in 8 months. Highly recommend to anyone working from home.', is_active: true,  expires_at: null, fileName: null },
  { id: 3, type: 'tip',         title: 'Priority Mode Tip',   content: 'Setting your inverter to priority mode saves up to 20% more power in the first month. Most people don\'t know this.', is_active: true,  expires_at: null, fileName: null },
  { id: 4, type: 'offer',       title: '10% Early Bird Offer',content: 'Get 10% off any system installed this month. Just mention this offer when booking.', is_active: true,  expires_at: new Date(Date.now() + 15*24*60*60*1000).toISOString(), fileName: 'promo-banner.jpg' },
];

let mockBusiness = {
  name:        'SolarTech Kenya',
  type:        'service',
  currency:    'KES',
  timezone:    'Africa/Nairobi',
  language:    'auto',
  owner_phone: '+254 712 345 678',
  website_url: 'https://solartech.co.ke',
};

const mockBalance = { balance_usd: 4.23, spent_this_month: 1.77, spent_all_time: 12.45, followups_sent: 127, won_leads: 3 };

// ─── Section Config ────────────────────────────────────────────────────────────
const PREF_SECTIONS = [
  { id: 'followup',  icon: ICONS.bot,       label: 'Follow-up',  sub: 'Automation & zones'  },
  { id: 'materials', icon: ICONS.materials, label: 'Materials',  sub: 'Content settings'    },
  { id: 'business',  icon: ICONS.business,  label: 'Business',   sub: 'Profile & identity'  },
  { id: 'whatsapp',  icon: ICONS.whatsapp,  label: 'WhatsApp',   sub: 'Channel settings'    },
  { id: 'billing',   icon: ICONS.billing,   label: 'Billing',    sub: 'Balance & usage'     },
];

const ECOM_STAGES    = ['discovery','browsing','selection','intent','checkout','awaiting_payment','paid','fulfilled','post_purchase'];
const SERVICE_STAGES = ['discovery','qualified','proposal','negotiation','committed','active','completed','retention'];
const DAYS           = ['S','M','T','W','T','F','S'];

const MAT_CONFIG = {
  testimonial: { icon: ICONS.star,  label: 'Testimonials',  sub: 'Customer quotes and success stories',  color: '#FF8C00' },
  tip:         { icon: ICONS.bulb,  label: 'Expert Tips',   sub: 'Useful content that builds authority', color: '#378ADD' },
  offer:       { icon: ICONS.gift,  label: 'Offers',        sub: 'Promotions and urgency discounts',     color: '#28A745' },
  story:       { icon: ICONS.story, label: 'Business Story',sub: 'Your origin, mission, what drives you',color: '#8B5CF6' },
  educational: { icon: ICONS.cap,   label: 'Educational',   sub: 'Guides and how-to knowledge',          color: '#64748B' },
};

// ─── Global State for Business ID & Loaded Data ────────────────────────────────
let currentBusinessId = null;
let isDataLoaded = false;

// ─── Styles ───────────────────────────────────────────────────────────────────
function injectPrefStyles() {
  if (document.getElementById('pref-styles')) return;
  const style = document.createElement('style');
  style.id = 'pref-styles';
  style.textContent = `
    /* Inherit App Font Everywhere */
    .pref-wrap, .pref-wrap * { font-family: inherit; }

    /* Layout */
    .pref-wrap    { display:flex; width:100%; height:100%; position:relative; overflow:hidden; }
    .pref-sidebar { width:260px; flex-shrink:0; background:rgba(255,255,255,0.4); backdrop-filter:blur(24px); border-right:1px solid rgba(0,0,0,0.06); padding:32px 16px; display:flex; flex-direction:column; overflow-y:auto; }
    .pref-main    { flex:1; overflow-y:auto; padding:32px 40px 60px; display:flex; flex-direction:column; gap:28px; background:transparent; }
    
    /* Scrollbar */
    .pref-main::-webkit-scrollbar { width:6px; }
    .pref-main::-webkit-scrollbar-thumb { background:rgba(15,23,42,0.15); border-radius:10px; }

    /* Sidebar Nav */
    .pref-nav-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#64748B; padding:0 16px; margin-bottom:16px; }
    .pref-nav-item  { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:12px; cursor:pointer; transition:all 0.2s ease; margin-bottom:6px; border:1px solid transparent; }
    .pref-nav-item:hover  { background:rgba(255,255,255,0.6); }
    .pref-nav-item.active { background:rgba(255,255,255,0.9); color:#0F172A; box-shadow:0 4px 15px rgba(0,0,0,0.03); border-color:rgba(255,255,255,1); }
    .pref-nav-icon  { display:flex; align-items:center; justify-content:center; color:#64748B; transition:color 0.2s; }
    .pref-nav-item.active .pref-nav-icon { color:#28A745; }
    .pref-nav-text  { min-width:0; }
    .pref-nav-label { font-size:14px; font-weight:600; color:#0F172A; line-height:1.2; }
    .pref-nav-sub   { font-size:12px; color:#64748B; font-weight:500; margin-top:2px; }

    /* Page Header */
    .pref-page-header { margin-bottom:8px; }
    .pref-page-title  { font-size:26px; font-weight:800; color:#0F172A; letter-spacing:-0.02em; margin-bottom:6px; }
    .pref-page-sub    { font-size:14px; color:#64748B; font-weight:500; }

    /* Premium Glass Cards */
    .pref-glass-card { 
      background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%);
      backdrop-filter: blur(20px); 
      -webkit-backdrop-filter: blur(20px); 
      border: 1px solid rgba(255,255,255,1); 
      box-shadow: 0 8px 30px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1); 
      border-radius: 1.5rem; 
      padding: 28px 32px; 
      width: 100%; 
      box-sizing: border-box; 
    }
    .pref-card-head { display:flex; align-items:center; gap:10px; margin-bottom:24px; color:#0F172A; }
    .pref-card-icon { color:#64748B; display:flex; align-items:center; }
    .pref-card-title { font-size:16px; font-weight:700; letter-spacing:-0.01em; }

    /* Master Switch Card */
    .master-switch-card {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border-radius: 1.5rem; padding: 24px 32px; color: #fff;
      box-shadow: 0 10px 25px rgba(15,23,42,0.15);
    }
    .master-switch-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; display:flex; align-items:center; gap:10px;}
    .master-switch-sub { font-size: 13px; color: #94A3B8; font-weight: 500; }
    
    /* Apple-style Large Toggle */
    .master-tog-wrap { position:relative; width:56px; height:32px; flex-shrink:0; display:inline-block; }
    .master-tog-wrap input { opacity:0; width:0; height:0; position:absolute; }
    .master-tog-track { position:absolute; cursor:pointer; inset:0; background:rgba(255,255,255,0.2); border-radius:16px; transition:background 0.3s ease; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
    .master-tog-track::before { content:''; position:absolute; height:26px; width:26px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1); box-shadow:0 2px 5px rgba(0,0,0,0.2); }
    .master-tog-wrap input:checked ~ .master-tog-track { background:#28A745; }
    .master-tog-wrap input:checked ~ .master-tog-track::before { transform:translateX(24px); }

    /* Standard Toggle */
    .tog-wrap   { position:relative; width:44px; height:24px; flex-shrink:0; display:inline-block; }
    .tog-wrap input { opacity:0; width:0; height:0; position:absolute; }
    .tog-track  { position:absolute; cursor:pointer; inset:0; background:rgba(15,23,42,0.15); border-radius:12px; transition:background 0.2s ease; }
    .tog-track::before { content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:transform 0.2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .tog-wrap input:checked ~ .tog-track { background:#28A745; }
    .tog-wrap input:checked ~ .tog-track::before { transform:translateX(20px); }

    /* Content Rows & Dividers */
    .pref-row { display:flex; align-items:center; justify-content:space-between; gap:24px; padding: 6px 0; }
    .pref-divider { height:1px; background:rgba(15,23,42,0.06); margin: 20px 0; border:none; }
    .pref-row-label { font-size:14px; font-weight:600; color:#0F172A; }
    .pref-row-sub   { font-size:13px; color:#64748B; margin-top:4px; font-weight:500; line-height:1.4; }

    /* Controls: Steppers */
    .stepper { display:flex; align-items:center; background:rgba(255,255,255,1); border:1px solid rgba(15,23,42,0.1); border-radius:12px; overflow:hidden; box-shadow:0 2px 5px rgba(0,0,0,0.02); }
    .step-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:none; border:none; cursor:pointer; font-size:18px; color:#64748B; transition:all 0.15s; }
    .step-btn:hover { background:rgba(15,23,42,0.04); color:#0F172A; }
    .step-val { min-width:44px; text-align:center; font-size:14px; font-weight:700; color:#0F172A; padding:0 4px; }

    /* Days Control */
    .day-picker { display:flex; gap:8px; }
    .day-pill   { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; border:1px solid transparent; }
    .day-pill.on  { background:#0F172A; color:#fff; box-shadow:0 4px 10px rgba(15,23,42,0.2); }
    .day-pill.off { background:rgba(15,23,42,0.04); color:#64748B; border-color:rgba(15,23,42,0.08); }
    .day-pill:hover { transform:scale(1.05); }

    /* Zone Grid */
    .zone-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px; }
    .zone-card { background:rgba(255,255,255,0.6); border:1px solid rgba(15,23,42,0.08); border-radius:1.25rem; padding:24px; text-align:center; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,0.02); }
    .zone-badge { font-size:12px; font-weight:700; color:#64748B; margin-bottom:16px; background:rgba(15,23,42,0.05); padding:4px 12px; border-radius:20px; display:inline-block; letter-spacing:0.02em; }
    .zone-icon-wrap { width:48px; height:48px; background:rgba(15,23,42,0.03); border-radius:14px; display:flex; align-items:center; justify-content:center; color:#0F172A; margin-bottom:12px; }
    .zone-mode  { font-size:15px; font-weight:700; color:#0F172A; }
    .zone-mode-sub { font-size:12px; color:#64748B; margin-top:6px; min-height:36px; line-height:1.4; }

    /* Dropdown Overrides */
    .pref-select { padding:10px 36px 10px 14px; background:rgba(255,255,255,1); border:1px solid rgba(15,23,42,0.1); border-radius:12px; font-size:13px; font-weight:600; color:#0F172A; outline:none; cursor:pointer; appearance:none; -webkit-appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; background-size:16px; box-shadow:0 2px 5px rgba(0,0,0,0.02); font-family:inherit; }
    .pref-select:focus { border-color:#28A745; box-shadow:0 0 0 3px rgba(40,167,69,0.15); }

    /* Forms Framework profiles */
    .pref-field { margin-bottom:20px; }
    .pref-field:last-child { margin-bottom:0; }
    .pref-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#64748B; margin-bottom:10px; }
    .pref-input { width:100%; padding:12px 16px; background:rgba(255,255,255,1); border:1px solid rgba(15,23,42,0.1); border-radius:12px; font-size:14px; color:#0F172A; outline:none; box-sizing:border-box; font-family:inherit; transition:all 0.2s; box-shadow:inset 0 1px 2px rgba(0,0,0,0.02); }
    .pref-input:focus { border-color:#28A745; box-shadow:0 0 0 3px rgba(40,167,69,0.15); }
    
    /* Buttons */
    .pref-btn-primary { padding:12px 28px; background:#0F172A; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; }
    .pref-btn-primary:hover { background:#1E293B; transform:translateY(-1px); box-shadow:0 6px 15px rgba(15,23,42,0.2); }
    .pref-btn-secondary { padding:10px 20px; background:rgba(255,255,255,1); color:#0F172A; border:1px solid rgba(15,23,42,0.1); border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:8px; font-family:inherit; box-shadow:0 2px 4px rgba(0,0,0,0.02); }
    .pref-btn-secondary:hover { background:rgba(15,23,42,0.02); border-color:rgba(15,23,42,0.2); }
    .pref-btn-ghost { padding:8px 12px; background:transparent; color:#64748B; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:inherit; }
    .pref-btn-ghost:hover { background:rgba(15,23,42,0.05); color:#0F172A; }
    .pref-btn-danger { padding:8px 12px; background:rgba(239,68,68,0.08); color:#EF4444; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; display:inline-flex; align-items:center; gap:6px; font-family:inherit; }
    .pref-btn-danger:hover { background:rgba(239,68,68,0.15); }

    /* Range Sliders */
    .pref-slider { -webkit-appearance:none; width:100%; height:6px; border-radius:6px; background:rgba(15,23,42,0.08); outline:none; cursor:pointer; margin:16px 0 8px; }
    .pref-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:22px; height:22px; border-radius:50%; background:#fff; border:2px solid #0F172A; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.15); transition:transform 0.1s; }
    .pref-slider::-webkit-slider-thumb:hover { transform:scale(1.15); }

    /* Toast Notification */
    .pref-toast { position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px); background:#0F172A; color:#fff; padding:14px 28px; border-radius:100px; font-size:14px; font-weight:600; z-index:9999; opacity:0; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:none; box-shadow:0 10px 30px rgba(0,0,0,0.2); font-family:inherit; }
    .pref-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

    /* ── Materials UI Updates ── */
    .mat-wrapper { margin-bottom: 16px; border-radius: 1.25rem; background: rgba(255,255,255,0.6); border: 1px solid rgba(15,23,42,0.08); transition: all 0.2s; }
    .mat-wrapper.expanded { background: rgba(255,255,255,0.85); box-shadow: 0 10px 30px rgba(0,0,0,0.04); border-color: rgba(15,23,42,0.1); }
    
    .mat-list-card { display:flex; align-items:center; gap:20px; padding:20px 24px; cursor: pointer; transition: background 0.2s; border-radius: 1.25rem; }
    .mat-wrapper.expanded .mat-list-card { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: 1px solid rgba(15,23,42,0.05); background: transparent; }
    .mat-list-card:hover { background: rgba(255,255,255,0.5); }
    
    .mat-icon-box { width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .mat-info { flex:1; min-width:0; }
    .mat-title { font-size:15px; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:8px;}
    .mat-desc { font-size:13px; color:#64748B; margin-top:4px; line-height:1.4; }
    .mat-count-badge { font-size: 11px; background: rgba(15,23,42,0.06); padding: 3px 8px; border-radius: 6px; color: #64748B; font-weight: 700; }
    
    .mat-chevron { color: #94A3B8; margin-left: 12px; transition: transform 0.2s; }
    
    .mat-expanded-body { padding: 24px; background: rgba(255,255,255,0.4); border-bottom-left-radius: 1.25rem; border-bottom-right-radius: 1.25rem; }
    
    .mat-item { display:flex; align-items:flex-start; gap:16px; padding: 16px; background: rgba(255,255,255,0.7); border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; margin-bottom: 12px; transition: all 0.2s; }
    .mat-item:hover { background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .mat-item-dot { width:10px; height:10px; border-radius:50%; background:#28A745; flex-shrink:0; margin-top:6px; box-shadow:0 0 8px rgba(40,167,69,0.3); }
    .mat-item-dot.inactive { background:rgba(15,23,42,0.15); box-shadow:none; }
    .mat-item-content { flex: 1; min-width: 0; }
    .mat-item-title { font-size:14px; font-weight:700; color:#0F172A; margin-bottom:4px; display:flex; align-items:center; gap:8px;}
    .mat-item-text { font-size:13px; color:#64748B; line-height:1.5; }
    .mat-item-meta { font-size: 11px; color: #94A3B8; font-weight: 600; margin-top: 8px; display:flex; align-items:center; gap:12px; }
    .mat-item-actions { display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
    
    .mat-add-btn-large { width: 100%; padding: 16px; background: rgba(40,167,69,0.05); border: 1px dashed rgba(40,167,69,0.3); border-radius: 12px; color: #28A745; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
    .mat-add-btn-large:hover { background: rgba(40,167,69,0.1); border-color: #28A745; }

    .mat-form { background: #fff; border: 1px solid rgba(40,167,69,0.2); border-radius: 16px; padding: 24px; margin-bottom: 12px; box-shadow: 0 8px 25px rgba(0,0,0,0.05); }
    .mat-form input.mat-input-title { font-size: 16px; font-weight: 700; border: none; border-bottom: 1px solid rgba(15,23,42,0.1); border-radius: 0; padding: 8px 0; margin-bottom: 16px; box-shadow: none; background: transparent; }
    .mat-form textarea.mat-textarea { width: 100%; min-height: 100px; padding: 12px; background: rgba(15,23,42,0.02); border: 1px solid rgba(15,23,42,0.08); border-radius: 10px; font-size: 13px; color: #0F172A; resize: vertical; outline: none; font-family: inherit; margin-bottom: 16px; }
    .mat-form textarea.mat-textarea:focus { border-color: #28A745; background: #fff; }
    
    .upload-feedback { font-size: 12px; color: #378ADD; font-weight: 600; display:flex; align-items:center; gap:6px; margin-top:8px;}
  `;
  document.head.appendChild(style);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function renderPrefSidebar() {
  return `
    <div class="pref-nav-title">Settings</div>
    ${PREF_SECTIONS.map(s => `
      <div class="pref-nav-item ${activePrefSection === s.id ? 'active' : ''}" onclick="switchPrefSection('${s.id}')">
        <div class="pref-nav-icon">${s.icon}</div>
        <div class="pref-nav-text">
          <div class="pref-nav-label">${s.label}</div>
          <div class="pref-nav-sub">${s.sub}</div>
        </div>
      </div>`).join('')}
  `;
}

// ─── Follow-up Settings ───────────────────────────────────────────────────────
function renderFollowupSettings() {
  const stages = mockBusiness.type === 'ecommerce' ? ECOM_STAGES : SERVICE_STAGES;

  const zoneModes = {
    approval: { icon: ICONS.approval, label: 'Need Approval', sub: 'You review before sending' },
    manual:   { icon: ICONS.manual,   label: 'Manual Only',   sub: 'You decide who gets one' },
    auto:     { icon: ICONS.auto,     label: 'Auto-send',     sub: 'AI sends without asking' },
  };

  return `
    <div class="pref-page-header">
      <div class="pref-page-title">Follow-up Rules</div>
      <div class="pref-page-sub">Configure how and when the AI engages with your leads</div>
    </div>

    <div class="master-switch-card">
      <div>
        <div class="master-switch-title">${ICONS.power} AI Follow-up Engine</div>
        <div class="master-switch-sub">Master switch — turns all automated communications on or off</div>
      </div>
      <label class="master-tog-wrap">
        <input type="checkbox" ${mockPrefs.followup_enabled ? 'checked' : ''} onchange="setPref('followup_enabled',this.checked)">
        <span class="master-tog-track"></span>
      </label>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.time}</div>
        <div class="pref-card-title">Automation Zones</div>
      </div>
      <div class="zone-grid">
        ${['recent','medium','old'].map(z => {
          const label   = z === 'recent' ? `0 — ${mockPrefs.zone_recent_days} days` : z === 'medium' ? `${mockPrefs.zone_recent_days} — ${mockPrefs.zone_medium_days} days` : `${mockPrefs.zone_medium_days}+ days`;
          const modeKey = `zone_${z}_mode`;
          const mode    = zoneModes[mockPrefs[modeKey]];
          return `
            <div class="zone-card">
              <div class="zone-badge">${label}</div>
              <div class="zone-icon-wrap">${mode.icon}</div>
              <div class="zone-mode">${mode.label}</div>
              <div class="zone-mode-sub">${mode.sub}</div>
              <select class="pref-select" style="margin-top:20px;width:100%;text-align:center;background-position:calc(100% - 12px) center;" onchange="setPref('${modeKey}',this.value)">
                <option value="approval" ${mockPrefs[modeKey]==='approval'?'selected':''}>Need Approval</option>
                <option value="manual"   ${mockPrefs[modeKey]==='manual'  ?'selected':''}>Manual Only</option>
                <option value="auto"     ${mockPrefs[modeKey]==='auto'    ?'selected':''}>Auto-send</option>
              </select>
            </div>`;
        }).join('')}
      </div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.target}</div>
        <div class="pref-card-title">Limits & Schedule</div>
      </div>
      
      <div class="pref-row">
        <div>
          <div class="pref-row-label">Max follow-ups per lead</div>
          <div class="pref-row-sub">Sequence stops here even if lead hasn't responded</div>
        </div>
        <div class="stepper">
          <button class="step-btn" onclick="stepPref('max_per_lead',-1,1,20)">−</button>
          <span class="step-val" id="pref-max_per_lead">${mockPrefs.max_per_lead}</span>
          <button class="step-btn" onclick="stepPref('max_per_lead',1,1,20)">+</button>
        </div>
      </div>
      <hr class="pref-divider">
      
      <div class="pref-row">
        <div>
          <div class="pref-row-label">Daily follow-up cap</div>
          <div class="pref-row-sub">Protects your WhatsApp number from bans</div>
        </div>
        <div class="stepper">
          <button class="step-btn" onclick="stepPref('daily_cap',-5,10,200)">−</button>
          <span class="step-val" id="pref-daily_cap">${mockPrefs.daily_cap}</span>
          <button class="step-btn" onclick="stepPref('daily_cap',5,10,200)">+</button>
        </div>
      </div>
      <hr class="pref-divider">

      <div class="pref-row">
        <div>
          <div class="pref-row-label">Quiet hours</div>
          <div class="pref-row-sub">No follow-ups sent during this window</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <select class="pref-select" style="min-width:100px" onchange="setPref('quiet_start',parseInt(this.value))">
            ${Array.from({length:24},(_,i)=>`<option value="${i}" ${mockPrefs.quiet_start===i?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}
          </select>
          <span style="font-size:14px;color:#94A3B8;font-weight:600">to</span>
          <select class="pref-select" style="min-width:100px" onchange="setPref('quiet_end',parseInt(this.value))">
            ${Array.from({length:24},(_,i)=>`<option value="${i}" ${mockPrefs.quiet_end===i?'selected':''}>${String(i).padStart(2,'0')}:00</option>`).join('')}
          </select>
        </div>
      </div>
      <hr class="pref-divider">

      <div class="pref-row">
        <div>
          <div class="pref-row-label">Active days</div>
          <div class="pref-row-sub">Follow-ups only send on these days</div>
        </div>
        <div class="day-picker">
          ${DAYS.map((d,i) => `
            <div class="day-pill ${mockPrefs.active_days.includes(i)?'on':'off'}" onclick="toggleDay(${i})" title="${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}">${d}</div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.pipeline}</div>
        <div class="pref-card-title">Pipeline Triggers</div>
      </div>
      <div class="pref-row">
        <div>
          <div class="pref-row-label">Stop follow-ups at stage</div>
          <div class="pref-row-sub">Sequence ends when lead reaches this stage</div>
        </div>
        <select class="pref-select" style="min-width:200px" onchange="setPref('stop_at_stage',this.value)">
          <option value="">Never stop</option>
          ${stages.map(s=>`<option value="${s}" ${mockPrefs.stop_at_stage===s?'selected':''}>${s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('')}
        </select>
      </div>
      <hr class="pref-divider">
      <div class="pref-row">
        <div>
          <div class="pref-row-label">Flag for my attention at stage</div>
          <div class="pref-row-sub">You get alerted when a lead reaches this stage</div>
        </div>
        <select class="pref-select" style="min-width:200px" onchange="setPref('alert_at_stage',this.value)">
          <option value="">No alert</option>
          ${stages.map(s=>`<option value="${s}" ${mockPrefs.alert_at_stage===s?'selected':''}>${s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

// ─── Materials Section ────────────────────────────────────────────────────────
function renderMaterials() {
  return `
    <div class="pref-page-header">
      <div class="pref-page-title">Content Materials</div>
      <div class="pref-page-sub">Content the AI draws from when writing your follow-up messages. Turn on what you have.</div>
    </div>

    <div style="margin-top: 16px;">
      ${Object.entries(MAT_CONFIG).map(([type, cfg]) => {
        const isOn       = mockPrefs[`mat_${type}`];
        const items      = mockMaterials.filter(m => m.type === type);
        const activeItems = items.filter(m => m.is_active);
        const isExpanded = expandedMaterials[type] || false;
        const isAdding   = addingMaterialType === type;

        return `
          <div class="mat-wrapper ${isExpanded ? 'expanded' : ''}">
            <div class="mat-list-card" onclick="toggleMaterialExpand('${type}')">
              <div class="mat-icon-box" style="background:${cfg.color}15; color:${cfg.color}">
                ${cfg.icon}
              </div>
              <div class="mat-info">
                <div class="mat-title">
                  ${cfg.label}
                  ${isOn && activeItems.length > 0 ? `<span class="mat-count-badge">${activeItems.length} active</span>` : ''}
                </div>
                <div class="mat-desc">${cfg.sub}</div>
              </div>
              <div style="display:flex; align-items:center; gap:16px;" onclick="event.stopPropagation()">
                <label class="tog-wrap">
                  <input type="checkbox" ${isOn ? 'checked' : ''} onchange="toggleMatType('${type}',this.checked)">
                  <span class="tog-track"></span>
                </label>
                <div class="mat-chevron" onclick="toggleMaterialExpand('${type}')">
                  ${isExpanded ? ICONS.chevronUp : ICONS.chevronDown}
                </div>
              </div>
            </div>

            ${isExpanded ? `
              <div class="mat-expanded-body">
                ${!isOn ? `
                  <div style="text-align:center; padding:20px; color:#94A3B8; font-size:14px; font-weight:500;">
                    Turn this toggle on to manage and use ${cfg.label.toLowerCase()}.
                  </div>
                ` : `
                  
                  ${items.map(item => {
                    const isEditing = editingMaterialId === item.id;
                    const expired   = item.expires_at && new Date(item.expires_at) < new Date();
                    
                    if (isEditing) {
                      const fileFeedback = uploadedFilesData[`edit_${item.id}`] || item.fileName || "";
                      return `
                        <div class="mat-form">
                          <input type="text" id="edit-title-${item.id}" class="pref-input mat-input-title" value="${item.title}" placeholder="Title (e.g. Customer Name)">
                          <textarea id="edit-content-${item.id}" class="mat-textarea" placeholder="Content...">${item.content}</textarea>
                          
                          <div style="display:flex; gap:16px; margin-bottom:16px; align-items:center; flex-wrap:wrap;">
                            ${type === 'offer' ? `
                              <div style="flex:1; min-width:150px;">
                                <div style="font-size:11px; color:#64748B; font-weight:600; margin-bottom:6px; text-transform:uppercase;">Expiry Date</div>
                                <input type="date" id="edit-expiry-${item.id}" class="pref-input" value="${item.expires_at ? item.expires_at.split('T')[0] : ''}">
                              </div>
                            ` : ''}
                            <div style="flex:1;">
                              <div style="font-size:11px; color:#64748B; font-weight:600; margin-bottom:6px; text-transform:uppercase;">Attached File/Image</div>
                              <button class="pref-btn-secondary" onclick="document.getElementById('edit-file-${item.id}').click()">${ICONS.upload} Upload File</button>
                              <input type="file" id="edit-file-${item.id}" style="display:none;" onchange="handleFileUpload(this, 'edit_${item.id}')">
                              ${fileFeedback ? `<div class="upload-feedback">✓ ${fileFeedback}</div>` : ''}
                            </div>
                          </div>

                          <div style="display:flex; gap:12px; margin-top:20px;">
                            <button class="pref-btn-primary" onclick="saveMaterialEdit(${item.id}, '${type}')">Save Changes</button>
                            <button class="pref-btn-secondary" onclick="cancelMaterialEdit()">Cancel</button>
                          </div>
                        </div>
                      `;
                    }

                    return `
                      <div class="mat-item">
                        <div class="mat-item-dot ${item.is_active ? '' : 'inactive'}"></div>
                        <div class="mat-item-content">
                          <div class="mat-item-title">
                            ${item.title}
                            ${expired ? `<span style="font-size:10px; color:#EF4444; background:rgba(239,68,68,0.1); padding:2px 6px; border-radius:4px; font-weight:700;">Expired</span>` : ''}
                            ${!item.is_active ? `<span style="font-size:10px; color:#64748B; background:rgba(15,23,42,0.05); padding:2px 6px; border-radius:4px; font-weight:700;">Disabled</span>` : ''}
                          </div>
                          <div class="mat-item-text">${item.content}</div>
                          <div class="mat-item-meta">
                            ${item.expires_at && !expired ? `<span>🎁 Expires ${new Date(item.expires_at).toLocaleDateString()}</span>` : ''}
                            ${item.fileName ? `<span style="color:#378ADD;">📎 ${item.fileName}</span>` : ''}
                          </div>
                        </div>
                        <div class="mat-item-actions">
                          <button class="pref-btn-ghost" onclick="toggleMaterialItem(${item.id})">${item.is_active ? 'Disable' : 'Enable'}</button>
                          <button class="pref-btn-ghost" style="color:#378ADD;" onclick="editMaterial(${item.id})">${ICONS.edit} Edit</button>
                          <button class="pref-btn-danger" onclick="deleteMaterial(${item.id})">${ICONS.trash} Delete</button>
                        </div>
                      </div>
                    `;
                  }).join('')}

                  ${isAdding ? `
                    <div class="mat-form">
                      <input type="text" id="add-title-${type}" class="pref-input mat-input-title" placeholder="Title (e.g. Customer Name)">
                      <textarea id="add-content-${type}" class="mat-textarea" placeholder="Content/Description..."></textarea>
                      
                      <div style="display:flex; gap:16px; margin-bottom:16px; align-items:center; flex-wrap:wrap;">
                        ${type === 'offer' ? `
                          <div style="flex:1; min-width:150px;">
                            <div style="font-size:11px; color:#64748B; font-weight:600; margin-bottom:6px; text-transform:uppercase;">Expiry Date</div>
                            <input type="date" id="add-expiry-${type}" class="pref-input">
                          </div>
                        ` : ''}
                        <div style="flex:1;">
                          <div style="font-size:11px; color:#64748B; font-weight:600; margin-bottom:6px; text-transform:uppercase;">Attach Image/File</div>
                          <button class="pref-btn-secondary" onclick="document.getElementById('add-file-${type}').click()">${ICONS.upload} Upload File</button>
                          <input type="file" id="add-file-${type}" style="display:none;" onchange="handleFileUpload(this, 'add_${type}')">
                          ${uploadedFilesData[`add_${type}`] ? `<div class="upload-feedback">✓ ${uploadedFilesData[`add_${type}`]} attached</div>` : ''}
                        </div>
                      </div>

                      <div style="display:flex; gap:12px; margin-top:20px;">
                        <button class="pref-btn-primary" onclick="saveNewMaterial('${type}')">Save ${cfg.label.split(' ')[0]}</button>
                        <button class="pref-btn-secondary" onclick="cancelAddMaterial()">Cancel</button>
                      </div>
                    </div>
                  ` : `
                    <button class="mat-add-btn-large" onclick="startAddMaterial('${type}')">+ Add New ${cfg.label.split(' ')[0]}</button>
                  `}
                `}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ─── Business Profile ─────────────────────────────────────────────────────────
function renderBusiness() {
  return `
    <div class="pref-page-header">
      <div class="pref-page-title">Business Profile</div>
      <div class="pref-page-sub">Information the AI uses to define your voice and identity</div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.identity}</div>
        <div class="pref-card-title">Identity & Sector</div>
      </div>
      <div class="pref-field">
        <div class="pref-label">Business Name</div>
        <input class="pref-input" id="biz-name" value="${mockBusiness.name}" placeholder="e.g. SolarTech Kenya">
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:24px">
        <div class="pref-field">
          <div class="pref-label">Business Type</div>
          <select class="pref-select" id="biz-type" style="width:100%">
            <option value="service"    ${mockBusiness.type==='service'   ?'selected':''}>Service Business</option>
            <option value="ecommerce"  ${mockBusiness.type==='ecommerce' ?'selected':''}>E-commerce</option>
            <option value="general"    ${mockBusiness.type==='general'   ?'selected':''}>General / Other</option>
          </select>
        </div>
        <div class="pref-field">
          <div class="pref-label">Default Currency</div>
          <select class="pref-select" id="biz-currency" style="width:100%">
            <option value="KES" ${mockBusiness.currency==='KES'?'selected':''}>KES — Kenyan Shilling</option>
            <option value="USD" ${mockBusiness.currency==='USD'?'selected':''}>USD — US Dollar</option>
            <option value="UGX" ${mockBusiness.currency==='UGX'?'selected':''}>UGX — Ugandan Shilling</option>
            <option value="TZS" ${mockBusiness.currency==='TZS'?'selected':''}>TZS — Tanzanian Shilling</option>
          </select>
        </div>
      </div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.contact}</div>
        <div class="pref-card-title">Contact Information</div>
      </div>
      <div class="pref-field">
        <div class="pref-label">Owner WhatsApp Number</div>
        <input class="pref-input" id="biz-phone" value="${mockBusiness.owner_phone}" placeholder="+254 7XX XXX XXX">
        <div style="font-size:12px;color:#64748B;margin-top:8px;font-weight:500">Alerts and approval nudges will be sent to this number.</div>
      </div>
      <div class="pref-field">
        <div class="pref-label">Website URL</div>
        <input class="pref-input" id="biz-website" value="${mockBusiness.website_url}" placeholder="https://">
      </div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.world}</div>
        <div class="pref-card-title">Region Settings</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:24px">
        <div class="pref-field">
          <div class="pref-label">Timezone</div>
          <select class="pref-select" id="biz-tz" style="width:100%">
            <option value="Africa/Nairobi"   ${mockBusiness.timezone==='Africa/Nairobi'  ?'selected':''}>Nairobi (EAT +3)</option>
            <option value="Africa/Lagos"     ${mockBusiness.timezone==='Africa/Lagos'    ?'selected':''}>Lagos (WAT +1)</option>
            <option value="Africa/Johannesburg"   ${mockBusiness.timezone==='Africa/Johannesburg'  ?'selected':''}>Johannesburg (SAST +2)</option>
            <option value="Africa/Dar_es_Salaam"  ${mockBusiness.timezone==='Africa/Dar_es_Salaam' ?'selected':''}>Dar es Salaam (EAT +3)</option>
          </select>
        </div>
        <div class="pref-field">
          <div class="pref-label">AI Output Language</div>
          <select class="pref-select" id="biz-lang" style="width:100%">
            <option value="auto"    ${mockBusiness.language==='auto'   ?'selected':''}>Auto-detect per lead</option>
            <option value="english" ${mockBusiness.language==='english'?'selected':''}>Strictly English</option>
            <option value="swahili" ${mockBusiness.language==='swahili'?'selected':''}>Strictly Swahili</option>
            <option value="mixed"   ${mockBusiness.language==='mixed'  ?'selected':''}>Blend (Sheng/Mixed)</option>
          </select>
        </div>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end;">
      <button class="pref-btn-primary" onclick="saveBusiness()">${ICONS.check} Save Profile</button>
    </div>
  `;
}

// ─── WhatsApp Channel ─────────────────────────────────────────────────────────
function renderWhatsApp() {
  const dailyUsed = 12;  
  const pct = Math.round((dailyUsed / mockPrefs.daily_cap) * 100);

  return `
    <div class="pref-page-header">
      <div class="pref-page-title">WhatsApp Connection</div>
      <div class="pref-page-sub">Manage your sending numbers and API integrations</div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.status}</div>
        <div class="pref-card-title">Connection Status</div>
      </div>
      
      <div style="display:flex; align-items:center; gap:20px; padding:20px 24px; background:rgba(40,167,69,0.05); border:1px solid rgba(40,167,69,0.2); border-radius:1rem; margin-bottom:24px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#28A745; box-shadow:0 0 0 4px rgba(40,167,69,0.2);"></div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;color:#0F172A">Active & Connected</div>
          <div style="font-size:13px;color:#64748B;font-weight:500;margin-top:4px;">+254 712 345 678 · Standard API</div>
        </div>
        <button onclick="alert('QR code scan modal triggered')" class="pref-btn-secondary">Reconnect</button>
      </div>

      <div style="font-size:14px; font-weight:700; color:#0F172A; margin-bottom:12px;">Today's Output</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;color:#64748B;margin-bottom:8px">
        <span>${dailyUsed} messages sent</span>
        <span>${mockPrefs.daily_cap - dailyUsed} remaining</span>
      </div>
      <div style="height:8px; background:rgba(15,23,42,0.06); border-radius:10px; overflow:hidden;">
        <div style="height:100%; background:${pct>80?'#EF4444':'#28A745'}; border-radius:10px; width:${pct}%"></div>
      </div>
    </div>

    <div class="pref-glass-card">
      <div class="pref-card-head">
        <div class="pref-card-icon">${ICONS.scale}</div>
        <div class="pref-card-title">Scale with WABA</div>
      </div>
      <div style="font-size:14px; color:#475569; line-height:1.6; margin-bottom:20px;">
        Official WhatsApp Business API (WABA) removes daily app constraints, starting at 250 verified template messages per day and scaling automatically to 10k, 100k, and unlimited as your business grows. Recommended for high-volume accounts.
      </div>
      <button class="pref-btn-primary" onclick="alert('WABA setup initiated')">Upgrade to Official API</button>
    </div>
  `;
}

// ─── Billing ──────────────────────────────────────────────────────────────────
function renderBilling() {
  // We use KES as the primary display here
  return `
    <div class="pref-page-header">
      <div class="pref-page-title">Billing & Usage</div>
      <div class="pref-page-sub">Pay per lead advancement — top up your AI credits</div>
    </div>

    <div class="pref-glass-card" style="text-align:center; padding:40px 32px;">
      <div style="font-size:13px; color:#64748B; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px;">Available Credit</div>
      <div id="display-balance" style="font-size:48px; font-weight:800; color:#0F172A; letter-spacing:-0.03em; line-height:1; margin-bottom:24px;">KES 0.00</div>
      <button class="pref-btn-primary" style="padding:16px 40px; font-size:15px; border-radius:100px;" onclick="window.openAddFundsModal()">+ Add Funds</button>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:24px;">
      <div class="pref-glass-card" style="padding:24px;">
        <div style="font-size:24px; font-weight:800; color:#0F172A;">${mockBalance.spent_this_month.toFixed(2)}</div>
        <div style="font-size:12px; font-weight:600; color:#64748B; text-transform:uppercase; letter-spacing:0.05em; margin-top:6px;">KES Spent This Month</div>
      </div>
      <div class="pref-glass-card" style="padding:24px;">
        <div style="font-size:24px; font-weight:800; color:#28A745;">${mockBalance.won_leads}</div>
        <div style="font-size:12px; font-weight:600; color:#64748B; text-transform:uppercase; letter-spacing:0.05em; margin-top:6px;">Leads Won</div>
      </div>
    </div>
  `;
}
// ─── Section Router ───────────────────────────────────────────────────────────
function renderPrefContent() {
  switch (activePrefSection) {
    case 'followup':  return renderFollowupSettings();
    case 'materials': return renderMaterials();
    case 'business':  return renderBusiness();
    case 'whatsapp':  return renderWhatsApp();
    case 'billing':   return renderBilling();
    default:          return renderFollowupSettings();
  }
}

// ─── Core Logic & Actions ─────────────────────────────────────────────────────
function switchPrefSection(id) {
  activePrefSection = id;
  document.getElementById('pref-sidebar-inner').innerHTML = renderPrefSidebar();
  document.getElementById('pref-main-inner').innerHTML    = renderPrefContent();
}

async function setPref(key, val) {
  mockPrefs[key] = val;
  
  // Persist to Supabase if we have a business ID
  if (currentBusinessId) {
    const updates = {};
    updates[key] = val;
    
    const result = await settingsService.updateBusinessSettings(currentBusinessId, updates);
    if (!result.success) {
      console.error('Failed to save preference:', result.error);
      showPrefToast('Error saving setting');
      return;
    }
  }
  
  showPrefToast('Settings saved');
  const stepEl = document.getElementById(`pref-${key}`);
  if (stepEl) stepEl.textContent = val;
}

async function stepPref(key, delta, min, max) {
  const current = mockPrefs[key] || 0;
  const next    = Math.max(min, Math.min(max, current + delta));
  await setPref(key, next);
}

async function toggleDay(dayIndex) {
  const days = [...mockPrefs.active_days];
  const idx  = days.indexOf(dayIndex);
  if (idx > -1) days.splice(idx, 1); else days.push(dayIndex);
  
  mockPrefs.active_days = days;
  
  // Persist to Supabase
  if (currentBusinessId) {
    const result = await settingsService.updateBusinessSettings(currentBusinessId, { active_days: JSON.stringify(days) });
    if (!result.success) {
      console.error('Failed to save active days:', result.error);
      showPrefToast('Error saving schedule');
      return;
    }
  }
  
  showPrefToast('Schedule updated');
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

// ─── Materials Logic ───
async function toggleMatType(type, enabled) {
  mockPrefs[`mat_${type}`] = enabled;
  
  // Persist to Supabase
  if (currentBusinessId) {
    const updates = {};
    updates[`mat_${type}`] = enabled;
    const result = await settingsService.updateBusinessSettings(currentBusinessId, updates);
    if (!result.success) {
      console.error('Failed to save material type:', result.error);
      showPrefToast('Error saving setting');
      return;
    }
  }
  
  showPrefToast(enabled ? `${MAT_CONFIG[type].label} enabled` : `${MAT_CONFIG[type].label} disabled`);
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

function toggleMaterialExpand(type) {
  expandedMaterials[type] = !expandedMaterials[type];
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

async function toggleMaterialItem(id) {
  const mat = mockMaterials.find(m => m.id === id);
  if (mat) { 
    mat.is_active = !mat.is_active;
    
    // Persist to Supabase
    if (currentBusinessId) {
      const result = await settingsService.updateMaterial(id, { is_active: mat.is_active });
      if (!result.success) {
        console.error('Failed to update material:', result.error);
        showPrefToast('Error updating material');
        return;
      }
    }
    
    showPrefToast(mat.is_active ? 'Material Enabled' : 'Material Disabled'); 
  }
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

function startAddMaterial(type) {
  addingMaterialType = type;
  expandedMaterials[type] = true;
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
  setTimeout(() => document.getElementById(`add-title-${type}`)?.focus(), 50);
}

function cancelAddMaterial() {
  addingMaterialType = null;
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

async function saveNewMaterial(type) {
  const title   = document.getElementById(`add-title-${type}`)?.value?.trim();
  const content = document.getElementById(`add-content-${type}`)?.value?.trim();
  const expiry  = document.getElementById(`add-expiry-${type}`)?.value || null;
  
  if (!title || !content) { alert('Title and content are required.'); return; }
  
  if (currentBusinessId) {
    const materialData = {
      business_id: currentBusinessId,
      material_type: type,
      title: title,
      content: content,
      is_active: true,
      expires_at: expiry ? new Date(expiry).toISOString() : null,
    };
    
    const result = await settingsService.addMaterial(materialData);
    if (!result.success) {
      console.error('Failed to save material:', result.error);
      showPrefToast('Error saving material');
      return;
    }
    
    // Add the returned data to our mock materials
    mockMaterials.push({
      id: result.data.id,
      type,
      title,
      content,
      is_active: true,
      expires_at: expiry ? new Date(expiry).toISOString() : null,
      fileName: uploadedFilesData[`add_${type}`] || null
    });
  } else {
    // Fallback for when businessId is not available
    mockMaterials.push({
      id: Date.now(),
      type,
      title,
      content,
      is_active: true,
      expires_at: expiry ? new Date(expiry).toISOString() : null,
      fileName: uploadedFilesData[`add_${type}`] || null
    });
  }
  
  addingMaterialType = null;
  uploadedFilesData[`add_${type}`] = null; // reset
  showPrefToast('New material saved');
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

function editMaterial(id) {
  editingMaterialId = id;
  const mat = mockMaterials.find(m => m.id === id);
  if(mat) expandedMaterials[mat.type] = true;
  
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
  setTimeout(() => document.getElementById(`edit-title-${id}`)?.focus(), 50);
}

async function saveMaterialEdit(id, type) {
  const title   = document.getElementById(`edit-title-${id}`)?.value?.trim();
  const content = document.getElementById(`edit-content-${id}`)?.value?.trim();
  const expiry  = document.getElementById(`edit-expiry-${id}`)?.value || null;
  
  const mat = mockMaterials.find(m => m.id === id);
  if (!mat || !title || !content) { alert('Title and content are required.'); return; }
  
  if (currentBusinessId) {
    const updates = {
      title: title,
      content: content,
      expires_at: expiry ? new Date(expiry).toISOString() : null,
    };
    
    const result = await settingsService.updateMaterial(id, updates);
    if (!result.success) {
      console.error('Failed to update material:', result.error);
      showPrefToast('Error saving changes');
      return;
    }
  }
  
  mat.title      = title;
  mat.content    = content;
  mat.expires_at = expiry ? new Date(expiry).toISOString() : null;
  
  // Only overwrite filename if a new file was uploaded during this edit session
  if(uploadedFilesData[`edit_${id}`]) {
    mat.fileName = uploadedFilesData[`edit_${id}`];
  }
  
  editingMaterialId = null;
  uploadedFilesData[`edit_${id}`] = null; // reset
  showPrefToast('Changes saved');
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

function cancelMaterialEdit() {
  editingMaterialId = null;
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

async function deleteMaterial(id) {
  if (!confirm('Are you sure you want to delete this material?')) return;
  
  if (currentBusinessId) {
    const result = await settingsService.deleteMaterial(id);
    if (!result.success) {
      console.error('Failed to delete material:', result.error);
      showPrefToast('Error deleting material');
      return;
    }
  }
  
  const idx = mockMaterials.findIndex(m => m.id === id);
  if (idx > -1) mockMaterials.splice(idx, 1);
  showPrefToast('Material deleted');
  document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
}

function handleFileUpload(input, key) {
  if (input.files && input.files[0]) {
    const fileName = input.files[0].name;
    uploadedFilesData[key] = fileName;
    // Trigger re-render to show the file name feedback
    document.getElementById('pref-main-inner').innerHTML = renderPrefContent();
  }
}

// ─── Profile Logic ───
async function saveBusiness() {
  const name        = document.getElementById('biz-name')?.value    || mockBusiness.name;
  const type        = document.getElementById('biz-type')?.value    || mockBusiness.type;
  const currency    = document.getElementById('biz-currency')?.value || mockBusiness.currency;
  const owner_phone = document.getElementById('biz-phone')?.value   || mockBusiness.owner_phone;
  const website_url = document.getElementById('biz-website')?.value || mockBusiness.website_url;
  const timezone    = document.getElementById('biz-tz')?.value      || mockBusiness.timezone;
  const language    = document.getElementById('biz-lang')?.value    || mockBusiness.language;

  // Update local state
  mockBusiness.name        = name;
  mockBusiness.type        = type;
  mockBusiness.currency    = currency;
  mockBusiness.owner_phone = owner_phone;
  mockBusiness.website_url = website_url;
  mockBusiness.timezone    = timezone;
  mockBusiness.language    = language;

  // Persist to Supabase
  if (currentBusinessId) {
    const updates = {
      name,
      business_type: type,
      currency,
      owner_phone,
      website_url,
      timezone,
      language
    };

    const result = await settingsService.updateBusinessSettings(currentBusinessId, updates);
    if (!result.success) {
      console.error('Failed to save business profile:', result.error);
      showPrefToast('Error saving profile');
      return;
    }
  }

  showPrefToast('Profile saved successfully');
}

// ─── Toast Notification ───────────────────────────────────────────────────────
let toastTimer = null;
function showPrefToast(msg) {
  let toast = document.getElementById('pref-toast-el');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pref-toast-el';
    toast.className = 'pref-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<div style="display:flex; align-items:center; gap:10px;">${ICONS.check} ${msg}</div>`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Initialize Data from Supabase ──────────────────────────────────────────
async function initializePreferencesData(businessId) {
  try {
    if (!businessId) {
      console.error('No business ID provided for preferences');
      showPrefToast('Error: No business context');
      return false;
    }

    currentBusinessId = businessId;

    // Fetch all settings data from Supabase
    const result = await settingsService.fetchSettings(businessId);
    if (!result.success) {
      console.error('Failed to fetch settings:', result.error);
      showPrefToast('Error loading settings');
      return false;
    }

    // Load business data
    const business = result.data.business;
    if (business) {
      mockBusiness.name        = business.name || mockBusiness.name;
      mockBusiness.type        = business.business_type || mockBusiness.type;
      mockBusiness.currency    = business.currency || mockBusiness.currency;
      mockBusiness.owner_phone = business.owner_phone || mockBusiness.owner_phone;
      mockBusiness.website_url = business.website_url || mockBusiness.website_url;
      mockBusiness.timezone    = business.timezone || mockBusiness.timezone;
      mockBusiness.language    = business.language || mockBusiness.language;
      
      // Load followup preferences
      mockPrefs.followup_enabled   = business.followup_enabled !== false;
      mockPrefs.zone_recent_days   = business.zone_recent_days || 7;
      mockPrefs.zone_medium_days   = business.zone_medium_days || 14;
      mockPrefs.zone_recent_mode   = business.zone_recent_mode || 'approval';
      mockPrefs.zone_medium_mode   = business.zone_medium_mode || 'manual';
      mockPrefs.zone_old_mode      = business.zone_old_mode || 'auto';
      mockPrefs.max_per_lead       = business.max_per_lead || 12;
      mockPrefs.daily_cap          = business.daily_cap || 40;
      mockPrefs.quiet_start        = business.quiet_start || 21;
      mockPrefs.quiet_end          = business.quiet_end || 8;
      mockPrefs.active_days        = business.active_days ? JSON.parse(business.active_days) : [1,2,3,4,5];
      mockPrefs.stop_at_stage      = business.stop_at_stage || 'paid';
      mockPrefs.alert_at_stage     = business.alert_at_stage || 'intent';
      mockPrefs.nudge_enabled      = business.nudge_enabled !== false;
      mockPrefs.nudge_min_pending  = business.nudge_min_pending || 3;
      mockPrefs.nudge_interval_hrs = business.nudge_interval_hrs || 2;
      mockPrefs.hot_lead_alert     = business.hot_lead_alert !== false;
      mockPrefs.hot_lead_threshold = business.hot_lead_threshold || 8;
      mockPrefs.mat_testimonial    = business.mat_testimonial !== false;
      mockPrefs.mat_tip            = business.mat_tip !== false;
      mockPrefs.mat_offer          = business.mat_offer !== false;
      mockPrefs.mat_story          = business.mat_story || false;
      mockPrefs.mat_educational    = business.mat_educational || false;
      
      mockPrefs.lifetime_sent = business.lifetime_sent || 0;
    }

    // Load balance data
    const balance = result.data.balance;
    if (balance) {
      mockBalance.balance_usd        = balance.balance_usd || 0;
      mockBalance.spent_this_month   = balance.spent_this_month || 0;
      mockBalance.spent_all_time     = balance.spent_all_time || 0;
      mockBalance.followups_sent     = balance.followups_sent || 0;
      mockBalance.won_leads          = balance.won_leads || 0;
    }

    // Fetch materials
    const matsResult = await settingsService.fetchMaterials(businessId);
    if (matsResult.success && matsResult.data) {
      mockMaterials = matsResult.data.map(m => ({
        id:         m.id,
        type:       m.material_type,
        title:      m.title,
        content:    m.content,
        is_active:  m.is_active,
        expires_at: m.expires_at,
        fileName:   m.file_url ? m.file_url.split('/').pop() : null
      }));
    }

    isDataLoaded = true;
    return true;
  } catch (error) {
    console.error('Error initializing preferences:', error);
    showPrefToast('Error loading preferences');
    return false;
  }
}

// ─── Main Render ──────────────────────────────────────────────────────────────
async function renderPreferencesContent(initialSection = 'followup', businessId = null) {
  // Initialize data from Supabase if not already loaded
  if (!isDataLoaded || businessId) {
    const loadResult = await initializePreferencesData(businessId || currentBusinessId);
    if (!loadResult && !isDataLoaded) {
      // Data loading failed, show error
      document.getElementById('content-area').innerHTML = '<div style="padding:40px; text-align:center; color:#EF4444;">Failed to load preferences. Please refresh the page.</div>';
      return;
    }
  }

  injectPrefStyles();
  if (PREF_SECTIONS.some(s => s.id === initialSection)) activePrefSection = initialSection;

  const contentArea = document.getElementById('content-area');
  
  // Clean up previous classes to let our CSS handle the layout
  contentArea.className = 'overflow-hidden'; 
  contentArea.style.padding = '0';
  contentArea.style.height = '100%';

  contentArea.innerHTML = `
    <div class="pref-wrap">
      <div class="pref-sidebar" id="pref-sidebar-inner">
        ${renderPrefSidebar()}
      </div>
      <div class="pref-main" id="pref-main-inner">
        ${renderPrefContent()}
      </div>
    </div>
  `;
}

window.renderPreferences = renderPreferencesContent;

// ─── Register Module ──────────────────────────────────────────────────────────
if (typeof PAGE_CONFIG !== 'undefined') {
  PAGE_CONFIG.preferences = {
    title:       'Preferences',
    description: 'Manage your AI rules and business configuration.',
    navId:       'nav-preferences',
    render: function(passedBusinessId) {
      const activeId = passedBusinessId || localStorage.getItem('business_id');
      if (activeId) {
        renderPreferencesContent('followup', activeId);
      } else {
        console.error('[Preferences Error] No business ID available.');
      }
    }
  };
}
// --- PAYMENT SYSTEM LOGIC ---

window.openAddFundsModal = () => document.getElementById('add-funds-modal').classList.remove('hidden');
window.closeAddFundsModal = () => document.getElementById('add-funds-modal').classList.add('hidden');

window.submitAddFunds = async function() {
    const amount = document.getElementById('funds-amount').value;
    const phone = document.getElementById('funds-phone').value;
    const btn = document.getElementById('btn-pay-now');
    const status = document.getElementById('payment-status');

    if (!phone || phone.length < 10) return alert("Please enter a valid M-Pesa number");

    btn.disabled = true;
    btn.innerHTML = `<span class="animate-pulse">Requesting...</span>`;
    status.classList.remove('hidden');
    status.innerHTML = "Sending M-Pesa STK Push...";
    status.className = "p-3 rounded-xl text-xs font-medium bg-blue-50 text-blue-600 mb-4";

    try {
        // Trigger the Edge Function
        const { data, error } = await window.supabase.functions.invoke('initiate-instasend-stk', {
            body: { 
                amount: amount, 
                customer_phone: phone, 
                business_id: window.currentBusinessId 
            }
        });

        if (error) throw error;

        status.innerHTML = "STK Sent! Check your phone and enter M-Pesa PIN.";
        status.className = "p-3 rounded-xl text-xs font-medium bg-orange-50 text-orange-600 mb-4";
        btn.innerHTML = "Waiting for PIN...";

        // Auto-refresh balance after 20 seconds (M-Pesa processing time)
        setTimeout(async () => {
            await window.refreshBalance();
            window.closeAddFundsModal();
            showPrefToast("Balance Updated!");
        }, 20000);

    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = "Try Again";
        status.innerHTML = "Error: " + err.message;
        status.className = "p-3 rounded-xl text-xs font-medium bg-red-50 text-red-600 mb-4";
    }
};

window.refreshBalance = async function() {
    const { data, error } = await window.supabase
        .from('business_balances')
        .select('balance_kes')
        .eq('business_id', window.currentBusinessId)
        .maybeSingle();
    
    const balEl = document.getElementById('display-balance');
    if (balEl && data) {
        balEl.innerHTML = `KES ${parseFloat(data.balance_kes).toLocaleString()}`;
    }
};
function showPrefToast(msg) {
    const toast = document.getElementById('success-toast');
    const toastMsg = document.getElementById('toast-message');
    if (toast && toastMsg) {
        toastMsg.innerText = msg;
        toast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
    }
}