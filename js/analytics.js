// ─────────────────────────────────────────────────────────────────────────────
// analytics.js  —  HeySasa Dashboard · Analytics Module
// ─────────────────────────────────────────────────────────────────────────────
//
// LIVE DATA ONLY
// ─────────────────────────────────────────────────────────────────────────────
// analyticsService.getDashboardMetrics() is the single source of truth.
// The render layer uses lightweight structural defaults only to prevent
// render-time crashes when a field is empty, but all displayed values
// should come from the live service.
// ─────────────────────────────────────────────────────────────────────────────

const AN_DEFAULTS = {
    funnel: [
        { stage: 'Total contacts', count: 0 },
        { stage: 'Business leads', count: 0 },
        { stage: 'Replied', count: 0 },
        { stage: 'Showed interest', count: 0 },
        { stage: 'Converted', count: 0 }
    ],
    weeklyTrend: Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, new: 0 })),
    stateBreakdown: [],
    topQuestions: [],
    competitorMentions: [],
    objections: [],
    sentimentTrend: [],
    adLeaderboard: [],
    productDemand: [],
    productCombos: [],
    heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)),
    intentPeakHour: 0,
    intentPeakDay: '',
    leadResponseDist: [
        { bucket: '< 2 min', count: 0 },
        { bucket: '2–10 min', count: 0 },
        { bucket: '10–30 min', count: 0 },
        { bucket: '30–60 min', count: 0 },
        { bucket: '1–6 hrs', count: 0 },
        { bucket: '6+ hrs', count: 0 }
    ],
    convHealth: {
        avg_reply_time_min: 0,
        open_unread: 0,
        pct_ai_managed: 0,
        pct_gone_cold: 0,
        pct_never_replied: 0,
        opt_out_count: 0
    },
    readReceipts: { sent: 0, delivered: 0, read: 0, replied: 0 },
    deliveryFailures: 0,
    humanVsAiClose: { ai: 0, human: 0 },
    followupStepConversion: Array.from({ length: 11 }, (_, i) => ({ step: i + 1, name: '', replies: 0, conversions: 0 })),
    voiceNoteLeads: 0,
    mediaLeads: 0,
    reactionCount: 0,
    consentAcceptRate: 0
};

// ─── Runtime data (merged from analyticsService) ──────────────────────────────
let analyticsData = null;
let activeAnSection = 'overview';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct   = (n, d) => d ? Math.round(n / d * 100) : 0;
const comma = (n)    => n?.toLocaleString() ?? '0';

function infoIcon(text) {
    return `<span class="an-info" tabindex="0">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span class="an-tip">${text}</span>
    </span>`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function injectAnalyticsStyles() {
    if (document.getElementById('analytics-styles-v2')) return;
    const s = document.createElement('style');
    s.id = 'analytics-styles-v2';
    s.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');

        /* ── Root ─────────────────────────────────────────────────────── */
        .an-wrap {
            display: flex; flex-direction: column;
            width: 100%; height: 100%; position: relative;
            font-family: 'DM Sans', sans-serif;
            background: #f5f6f8;
            color: #0f172a;
        }

        /* ── Nav ──────────────────────────────────────────────────────── */
        .an-topnav {
            display: flex; align-items: center; gap: 4px;
            padding: 14px 20px 0;
            flex-shrink: 0;
            overflow-x: auto;
        }
        .an-topnav::-webkit-scrollbar { display: none; }
        .an-tab {
            display: flex; align-items: center; gap: 7px;
            padding: 8px 16px 10px;
            border-radius: 10px 10px 0 0;
            font-size: 12.5px; font-weight: 600;
            color: #64748b; cursor: pointer;
            background: transparent; border: none;
            border-bottom: 2px solid transparent;
            transition: all 0.18s; white-space: nowrap;
            letter-spacing: 0.01em;
        }
        .an-tab:hover { color: #0f172a; background: rgba(255,255,255,0.5); }
        .an-tab.active {
            color: #0f172a;
            background: #fff;
            border-bottom-color: #3B6D11;
            box-shadow: 0 -1px 0 0 #e2e8f0 inset, 1px 0 0 0 #e2e8f0 inset, -1px 0 0 0 #e2e8f0 inset;
        }
        .an-tab svg { width: 14px; height: 14px; flex-shrink: 0; }
        .an-tab-divider {
            width: 1px; height: 16px; background: #e2e8f0;
            margin: 0 4px; flex-shrink: 0; align-self: center;
        }

        /* ── Content ──────────────────────────────────────────────────── */
        .an-content {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            padding: 20px; display: flex; flex-direction: column; gap: 16px;
            border-top: 1px solid #e2e8f0;
            background: #f5f6f8;
        }
        .an-content::-webkit-scrollbar { width: 4px; }
        .an-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        /* ── Cards ────────────────────────────────────────────────────── */
        .an-card {
            background: #fff;
            border: 1px solid #e8edf2;
            border-radius: 14px;
            padding: 20px 22px;
        }
        .an-card.clickable { cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
        .an-card.clickable:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }

        .an-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }
        .an-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .an-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }

        /* ── KPI tile ─────────────────────────────────────────────────── */
        .an-kpi {
            background: #fff; border: 1px solid #e8edf2;
            border-radius: 14px; padding: 18px 20px;
            display: flex; flex-direction: column; gap: 4px;
        }
        .an-kpi.clickable { cursor: pointer; transition: box-shadow 0.15s, transform 0.15s; }
        .an-kpi.clickable:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .an-kpi-label {
            font-size: 10.5px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.08em; color: #94a3b8;
            display: flex; align-items: center; gap: 5px;
        }
        .an-kpi-dot {
            width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }
        .dot-g { background: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.18); }
        .dot-a { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.18); }
        .dot-r { background: #ef4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.18); }
        .dot-b { background: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.18); }
        .an-kpi-num {
            font-size: 32px; font-weight: 700; color: #0f172a;
            line-height: 1.05; letter-spacing: -0.02em;
        }
        .an-kpi-sub { font-size: 11.5px; color: #94a3b8; font-weight: 400; }
        .an-kpi-trend {
            display: inline-flex; align-items: center; gap: 3px;
            font-size: 10.5px; font-weight: 600; margin-top: 2px;
            padding: 2px 7px; border-radius: 5px;
        }
        .trend-up   { background: #f0fdf4; color: #16a34a; }
        .trend-down { background: #fef2f2; color: #dc2626; }
        .trend-flat { background: #f8fafc; color: #64748b; }

        /* ── Section label ────────────────────────────────────────────── */
        .an-sec-lbl {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.1em; color: #94a3b8;
            margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .an-sec-lbl::after {
            content: ''; flex: 1; height: 1px; background: #f1f5f9;
        }

        /* ── Funnel bars ──────────────────────────────────────────────── */
        .an-funnel-row {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 10px;
        }
        .an-funnel-row:last-child { margin-bottom: 0; }
        .an-funnel-name {
            width: 118px; flex-shrink: 0;
            font-size: 12.5px; font-weight: 500; color: #334155;
        }
        .an-funnel-track {
            flex: 1; height: 22px;
            background: #f1f5f9; border-radius: 6px; overflow: hidden;
            position: relative;
        }
        .an-funnel-fill {
            height: 100%; border-radius: 6px;
            display: flex; align-items: center; justify-content: flex-end;
            padding-right: 10px;
            transition: width 0.9s cubic-bezier(0.4,0,0.2,1);
        }
        .an-funnel-fill span {
            font-size: 11px; font-weight: 700; color: #fff;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .an-funnel-pct {
            width: 38px; text-align: right;
            font-size: 12px; font-weight: 600; color: #64748b;
            font-family: 'DM Mono', monospace;
        }
        .an-drop-badge {
            font-size: 9.5px; font-weight: 600; color: #ef4444;
            background: #fef2f2; padding: 1px 5px; border-radius: 4px;
            margin-left: 4px; flex-shrink: 0;
        }

        /* ── Trend bars ───────────────────────────────────────────────── */
        .an-trend-wrap {
            display: flex; align-items: flex-end; gap: 6px;
            height: 88px; margin-top: 16px;
        }
        .an-trend-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .an-trend-bar-bg {
            width: 100%; flex: 1; background: #f1f5f9;
            border-radius: 5px; overflow: hidden;
            display: flex; align-items: flex-end;
        }
        .an-trend-bar {
            width: 100%; border-radius: 5px;
            transition: height 0.8s ease;
        }
        .an-trend-lbl { font-size: 10px; color: #94a3b8; font-weight: 600; }

        /* ── Heatmap ──────────────────────────────────────────────────── */
        .an-hm-wrap { overflow-x: auto; padding-bottom: 8px; }
        .an-hm-grid {
            display: grid;
            grid-template-columns: 32px repeat(24, minmax(18px, 1fr));
            gap: 3px; min-width: 560px;
        }
        .an-hm-ly {
            font-size: 10.5px; color: #94a3b8; font-weight: 600;
            display: flex; align-items: center; justify-content: flex-end;
            padding-right: 6px;
        }
        .an-hm-lx { font-size: 9.5px; color: #cbd5e1; text-align: center; font-weight: 500; }
        .an-hm-cell {
            aspect-ratio: 1; border-radius: 3px;
            cursor: crosshair; transition: transform 0.1s;
            position: relative;
        }
        .an-hm-cell:hover { transform: scale(1.25); z-index: 2; }
        .an-hm-legend {
            display: flex; align-items: center; gap: 6px;
            margin-top: 14px; justify-content: flex-end;
        }
        .an-hm-legend span { font-size: 10.5px; color: #94a3b8; }

        /* ── Donut chart ──────────────────────────────────────────────── */
        .an-donut-wrap {
            display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .an-donut-svg { flex-shrink: 0; }
        .an-donut-legend { flex: 1; min-width: 120px; display: flex; flex-direction: column; gap: 8px; }
        .an-donut-row {
            display: flex; align-items: center; gap: 8px;
            font-size: 12px; color: #334155;
        }
        .an-donut-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .an-donut-val { margin-left: auto; font-weight: 600; font-family: 'DM Mono', monospace; font-size: 11.5px; }

        /* ── Horizontal bar ───────────────────────────────────────────── */
        .an-hbar-row { margin-bottom: 12px; }
        .an-hbar-row:last-child { margin-bottom: 0; }
        .an-hbar-top {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 5px;
        }
        .an-hbar-name { font-size: 12.5px; font-weight: 500; color: #1e293b; }
        .an-hbar-num  { font-size: 12px; font-weight: 600; color: #64748b; font-family: 'DM Mono', monospace; }
        .an-hbar-track {
            height: 7px; background: #f1f5f9; border-radius: 4px; overflow: hidden;
        }
        .an-hbar-fill {
            height: 100%; border-radius: 4px;
            transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Ad card ──────────────────────────────────────────────────── */
        .an-ad-item {
            display: flex; gap: 14px; padding: 14px 16px;
            border-radius: 12px; background: #f8fafc;
            border: 1px solid #e8edf2; margin-bottom: 10px;
            cursor: pointer; transition: all 0.15s;
        }
        .an-ad-item:last-child { margin-bottom: 0; }
        .an-ad-item:hover { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .an-ad-thumb {
            width: 56px; height: 56px; border-radius: 10px;
            object-fit: cover; flex-shrink: 0;
            border: 1px solid #e2e8f0;
        }
        .an-ad-thumb-ph {
            width: 56px; height: 56px; border-radius: 10px;
            background: #e2e8f0; display: flex; align-items: center;
            justify-content: center; flex-shrink: 0; color: #94a3b8;
        }
        .an-ad-body { flex: 1; min-width: 0; }
        .an-ad-title {
            font-size: 13px; font-weight: 600; color: #0f172a;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 3px;
        }
        .an-ad-sub {
            font-size: 11.5px; color: #64748b;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 9px;
        }
        .an-ad-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .an-pill {
            font-size: 10.5px; font-weight: 600; padding: 2px 8px; border-radius: 5px;
            display: inline-flex; align-items: center; gap: 4px;
        }
        .pill-green  { background: #f0fdf4; color: #166534; }
        .pill-amber  { background: #fffbeb; color: #92400e; }
        .pill-blue   { background: #eff6ff; color: #1d4ed8; }
        .pill-slate  { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
        .pill-red    { background: #fef2f2; color: #991b1b; }

        /* ── Score ring ───────────────────────────────────────────────── */
        .an-score-ring { position: relative; display: inline-flex; flex-shrink: 0; }
        .an-score-ring text { font-family: 'DM Sans', sans-serif; }

        /* ── Objection pills ──────────────────────────────────────────── */
        .an-obj-row {
            display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
        }
        .an-obj-row:last-child { margin-bottom: 0; }
        .an-obj-label {
            width: 120px; flex-shrink: 0;
            font-size: 12.5px; font-weight: 500; color: #334155;
        }
        .an-obj-track {
            flex: 1; height: 20px; background: #f1f5f9;
            border-radius: 5px; overflow: hidden;
        }
        .an-obj-fill {
            height: 100%; border-radius: 5px; opacity: 0.8;
            transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
            display: flex; align-items: center; justify-content: flex-end;
            padding-right: 8px;
        }
        .an-obj-fill span { font-size: 10.5px; font-weight: 700; color: #fff; }
        .an-obj-num {
            width: 36px; text-align: right;
            font-size: 11.5px; font-weight: 600; color: #64748b;
            font-family: 'DM Mono', monospace;
        }

        /* ── Read receipt flow ────────────────────────────────────────── */
        .an-flow-wrap { display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin-top: 4px; }
        .an-flow-step { flex: 1; min-width: 80px; }
        .an-flow-line {
            display: flex; align-items: center; gap: 0;
        }
        .an-flow-bar-wrap {
            flex: 1; height: 8px; border-radius: 0;
            background: #f1f5f9; overflow: hidden;
        }
        .an-flow-bar-wrap:first-child { border-radius: 4px 0 0 4px; }
        .an-flow-bar-wrap.last-child  { border-radius: 0 4px 4px 0; }
        .an-flow-fill { height: 100%; transition: width 0.8s ease; }
        .an-flow-meta { text-align: center; margin-top: 6px; }
        .an-flow-count { font-size: 13px; font-weight: 700; color: #0f172a; display: block; }
        .an-flow-lbl   { font-size: 10px; color: #94a3b8; font-weight: 600; }
        .an-flow-arrow {
            color: #cbd5e1; font-size: 14px; margin: 0 2px;
            flex-shrink: 0; align-self: center; padding-bottom: 14px;
        }

        /* ── Question list ────────────────────────────────────────────── */
        .an-q-row {
            display: flex; align-items: center; gap: 10px;
            padding: 9px 0; border-bottom: 1px solid #f1f5f9;
        }
        .an-q-row:last-child { border-bottom: none; }
        .an-q-rank {
            width: 20px; height: 20px; border-radius: 50%;
            background: #f1f5f9; display: flex; align-items: center;
            justify-content: center; font-size: 9.5px; font-weight: 700;
            color: #64748b; flex-shrink: 0;
        }
        .an-q-text { flex: 1; font-size: 12.5px; color: #1e293b; font-weight: 500; }
        .an-q-count {
            font-size: 11.5px; font-weight: 600; color: #64748b;
            font-family: 'DM Mono', monospace;
        }
        .an-q-bar { width: 60px; height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
        .an-q-bar-fill { height: 100%; border-radius: 2px; background: #3B6D11; }

        /* ── Competitor cards ─────────────────────────────────────────── */
        .an-comp-item {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; border-radius: 10px;
            background: #f8fafc; border: 1px solid #e8edf2;
            margin-bottom: 8px;
        }
        .an-comp-item:last-child { margin-bottom: 0; }
        .an-comp-name {
            font-size: 13px; font-weight: 700; color: #0f172a;
            min-width: 70px;
        }
        .an-comp-ctx { font-size: 11.5px; color: #64748b; flex: 1; }
        .an-comp-count {
            font-size: 12px; font-weight: 700;
            color: #334155; font-family: 'DM Mono', monospace;
        }

        /* ── Followup step performance ────────────────────────────────── */
        .an-step-row {
            display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
        }
        .an-step-row:last-child { margin-bottom: 0; }
        .an-step-num {
            width: 22px; height: 22px; border-radius: 50%;
            background: #f1f5f9; display: flex; align-items: center;
            justify-content: center; font-size: 9.5px; font-weight: 700;
            color: #64748b; flex-shrink: 0;
        }
        .an-step-name {
            width: 130px; flex-shrink: 0;
            font-size: 12px; font-weight: 500; color: #334155;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .an-step-track {
            flex: 1; height: 18px; background: #f1f5f9;
            border-radius: 5px; overflow: hidden;
        }
        .an-step-fill {
            height: 100%; border-radius: 5px;
            background: #3B6D11; opacity: 0.75;
            display: flex; align-items: center; justify-content: flex-end;
            padding-right: 7px; transition: width 0.8s ease;
        }
        .an-step-fill span { font-size: 10px; font-weight: 700; color: #fff; }
        .an-step-conv {
            width: 28px; text-align: right; font-size: 11px;
            font-weight: 700; color: #16a34a; font-family: 'DM Mono', monospace;
        }

        /* ── Engagement signal tiles ──────────────────────────────────── */
        .an-signal-wrap { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
        .an-signal {
            background: #f8fafc; border: 1px solid #e8edf2;
            border-radius: 10px; padding: 12px 14px;
            text-align: center;
        }
        .an-signal-icon { font-size: 20px; margin-bottom: 5px; }
        .an-signal-num { font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1; }
        .an-signal-lbl { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }

        /* ── Sentiment line ───────────────────────────────────────────── */
        .an-sentiment-wrap { position: relative; height: 72px; margin-top: 8px; }
        .an-sentiment-svg { width: 100%; height: 100%; overflow: visible; }

        /* ── Info tooltip ─────────────────────────────────────────────── */
        .an-info {
            display: inline-flex; align-items: center; justify-content: center;
            width: 14px; height: 14px; color: #cbd5e1; cursor: default;
            position: relative; vertical-align: middle; margin-left: 4px;
        }
        .an-info svg { width: 13px; height: 13px; }
        .an-info:hover { color: #3B6D11; }
        .an-tip {
            visibility: hidden; opacity: 0;
            position: absolute; bottom: 130%; left: 50%;
            transform: translateX(-50%);
            width: 200px; background: #0f172a; color: #e2e8f0;
            font-size: 11px; font-weight: 400; line-height: 1.5;
            padding: 7px 10px; border-radius: 7px; text-align: center;
            pointer-events: none; transition: opacity 0.15s;
            white-space: normal; z-index: 200;
        }
        .an-tip::after {
            content: ''; position: absolute; top: 100%; left: 50%;
            margin-left: -4px; border: 4px solid transparent;
            border-top-color: #0f172a;
        }
        .an-info:hover .an-tip { visibility: visible; opacity: 1; }

        /* ── Drawer ───────────────────────────────────────────────────── */
        .an-overlay {
            position: fixed; inset: 0; background: rgba(15,23,42,0.25);
            backdrop-filter: blur(3px); opacity: 0; pointer-events: none;
            transition: opacity 0.25s; z-index: 200;
        }
        .an-overlay.open { opacity: 1; pointer-events: all; }
        .an-drawer {
            position: fixed; top: 0; right: 0; height: 100%;
            width: 460px; max-width: 100vw;
            background: #fff; border-left: 1px solid #e2e8f0;
            box-shadow: -16px 0 48px rgba(0,0,0,0.07);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
            z-index: 201; display: flex; flex-direction: column;
        }
        .an-drawer.open { transform: translateX(0); }
        .an-drawer-head {
            padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
            display: flex; align-items: center; justify-content: space-between;
            flex-shrink: 0;
        }
        .an-drawer-title { font-size: 16px; font-weight: 700; color: #0f172a; }
        .an-drawer-close {
            background: #f1f5f9; border: none;
            width: 30px; height: 30px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #64748b; transition: all 0.15s;
        }
        .an-drawer-close:hover { background: #e2e8f0; color: #0f172a; }
        .an-drawer-body { flex: 1; overflow-y: auto; padding: 24px; }
        .an-drawer-body::-webkit-scrollbar { width: 4px; }
        .an-drawer-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        /* ── Drawer table ─────────────────────────────────────────────── */
        .an-dtable { width: 100%; border-collapse: collapse; }
        .an-dtable th {
            text-align: left; padding: 10px 12px;
            font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.07em;
            color: #94a3b8; border-bottom: 1px solid #f1f5f9; font-weight: 600;
        }
        .an-dtable td {
            padding: 13px 12px; border-bottom: 1px solid #f8fafc;
            font-size: 12.5px; color: #1e293b; font-weight: 500;
        }
        .an-dtable tr:last-child td { border-bottom: none; }

        /* ── Loading / error ──────────────────────────────────────────── */
        .an-loading {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; flex: 1; gap: 14px; padding: 48px;
        }
        .an-spinner {
            width: 28px; height: 28px;
            border: 2.5px solid rgba(59,109,17,0.12);
            border-top-color: #3B6D11;
            border-radius: 50%; animation: an-spin 0.7s linear infinite;
        }
        @keyframes an-spin { to { transform: rotate(360deg); } }
        .an-loading-text { font-size: 12.5px; font-weight: 600; color: #94a3b8; }
        .an-error {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; flex: 1; gap: 10px; padding: 48px; text-align: center;
        }
        .an-error-icon { font-size: 28px; }
        .an-error-title { font-size: 14px; font-weight: 700; color: #0f172a; }
        .an-error-sub   { font-size: 12.5px; color: #64748b; max-width: 260px; line-height: 1.5; }
        .an-retry-btn {
            margin-top: 6px; padding: 9px 18px; border-radius: 9px;
            background: #3B6D11; color: #fff; font-size: 12.5px;
            font-weight: 700; border: none; cursor: pointer;
            transition: opacity 0.15s; font-family: inherit;
        }
        .an-retry-btn:hover { opacity: 0.85; }

        /* ── Mobile ───────────────────────────────────────────────────── */
        @media (max-width: 640px) {
            .an-content { padding: 12px; gap: 12px; }
            .an-grid-2  { grid-template-columns: 1fr; }
            .an-grid-3  { grid-template-columns: repeat(2, 1fr); }
            .an-grid-4  { grid-template-columns: repeat(2, 1fr); }
            .an-drawer  { width: 100%; }
        }
    `;
    document.head.appendChild(s);
}

// ─── Section config ───────────────────────────────────────────────────────────
const AN_SECTIONS = [
    { id: 'overview',  label: 'Overview',   icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>' },
    { id: 'market',    label: 'Market',     icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>' },
    { id: 'ads',       label: 'Ad Impact',  icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>' },
    { id: 'demand',    label: 'Demand',     icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>' },
    { id: 'timing',    label: 'Timing',     icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
    { id: 'health',    label: 'Health',     icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>' }
];

// ─── Nav + routing ────────────────────────────────────────────────────────────
window.setAnalyticsSection = function(id) {
    activeAnSection = id;
    document.querySelectorAll('.an-tab').forEach(t => t.classList.toggle('active', t.dataset.id === id));
    const body = document.getElementById('an-body');
    if (body) { body.innerHTML = buildSection(); _animateBars(); }
};

function buildNav() {
    return AN_SECTIONS.map(s => `
        <button class="an-tab ${activeAnSection === s.id ? 'active' : ''}" data-id="${s.id}" onclick="setAnalyticsSection('${s.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">${s.icon}</svg> ${s.label}
        </button>`
    ).join('<div class="an-tab-divider"></div>');
}

function buildSection() {
    switch (activeAnSection) {
        case 'overview': return renderOverview();
        case 'market':   return renderMarket();
        case 'ads':      return renderAds();
        case 'demand':   return renderDemand();
        case 'timing':   return renderTiming();
        case 'health':   return renderHealth();
        default:         return renderOverview();
    }
}

// ─── Bar animation (CSS transition trigger) ───────────────────────────────────
function _animateBars() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.querySelectorAll('[data-w]').forEach(el => {
                el.style.width = el.dataset.w;
            });
        });
    });
}

// ─── Drawer system ────────────────────────────────────────────────────────────
function openDrawer(title, html) {
    document.getElementById('an-drawer-title').textContent = title;
    document.getElementById('an-drawer-body').innerHTML = html;
    document.getElementById('an-overlay').classList.add('open');
    document.getElementById('an-drawer').classList.add('open');
}
window.closeDrawer = function() {
    document.getElementById('an-overlay').classList.remove('open');
    document.getElementById('an-drawer').classList.remove('open');
};

// ─── SVG donut helper ─────────────────────────────────────────────────────────
function buildDonut(segments, size = 96, strokeW = 14) {
    const r = (size - strokeW) / 2;
    const circ = 2 * Math.PI * r;
    const cx = size / 2, cy = size / 2;
    let offset = 0;
    const paths = segments.map(seg => {
        const dash = (seg.pct / 100) * circ;
        const gap  = circ - dash;
        const p = `<circle cx="${cx}" cy="${cy}" r="${r}"
            fill="none" stroke="${seg.color}" stroke-width="${strokeW}"
            stroke-dasharray="${dash} ${gap}"
            stroke-dashoffset="${-offset}"
            stroke-linecap="butt"/>`;
        offset += dash;
        return p;
    });
    return `<svg class="an-donut-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
        style="transform:rotate(-90deg)">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${strokeW}"/>
        ${paths.join('')}
    </svg>`;
}

// ─── Score ring helper ────────────────────────────────────────────────────────
function buildScoreRing(score, size = 52) {
    const r = 20, circ = 2 * Math.PI * r;
    const cx = size / 2, cy = size / 2;
    const dash = (score / 100) * circ;
    const col = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
    return `<svg class="an-score-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="5"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="5"
            stroke-dasharray="${dash} ${circ - dash}"
            stroke-dashoffset="${circ / 4}"
            stroke-linecap="round"/>
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
            font-size="11" font-weight="700" fill="${col}" font-family="DM Sans,sans-serif">${score}</text>
    </svg>`;
}

// ─── Sentiment sparkline ──────────────────────────────────────────────────────
function buildSentimentLine(trend) {
    if (!Array.isArray(trend) || trend.length === 0) {
        return `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#64748b; font-size:12px;">No sentiment data available yet.</div>`;
    }

    const W = 100, H = 60;
    const vals = trend.map(t => t.score);
    const min = Math.min(...vals) - 0.05;
    const max = Math.max(...vals) + 0.05;
    const range = max - min || 0.1;
    const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const lastX = W, lastY = H - ((vals[vals.length-1] - min) / range) * H;
    return `<svg viewBox="0 0 100 60" preserveAspectRatio="none" class="an-sentiment-svg">
        <polyline points="${pts}" fill="none" stroke="#3B6D11" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="2.5" fill="#3B6D11"/>
    </svg>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function renderOverview() {
    const d   = analyticsData;
    const f   = d.funnel;
    const top = f[0]?.count || 0;
    const rr  = pct(f[2]?.count || 0, f[1]?.count || 0);
    const cvr = pct(f[4]?.count || 0, f[1]?.count || 0);
    const wk  = Array.isArray(d.weeklyTrend) && d.weeklyTrend.length ? d.weeklyTrend : Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, new: 0 }));
    const maxW = Math.max(...wk.map(w => w.new), 1);
    const lastW = wk[wk.length - 1]?.new || 0;
    const prevW = wk[wk.length - 2]?.new || 1;
    const wkDelta = Math.round(((lastW - prevW) / Math.max(prevW, 1)) * 100);

    const funnelRows = f.map((row, i) => {
        const w = pct(row.count, top);
        const drop = i > 0 ? pct(row.count, f[i-1].count) : 100;
        const opacities = [1, 0.8, 0.62, 0.46, 0.34];
        return `
        <div class="an-funnel-row">
            <span class="an-funnel-name">${row.stage}</span>
            <div class="an-funnel-track">
                <div class="an-funnel-fill" style="width:0%; background:rgba(59,109,17,${opacities[i]})" data-w="${w}%">
                    <span>${comma(row.count)}</span>
                </div>
            </div>
            <span class="an-funnel-pct">${w}%</span>
            ${i > 0 ? `<span class="an-drop-badge">↓${100-drop}%</span>` : '<span style="width:48px"></span>'}
        </div>`;
    }).join('');

    const trendBars = wk.map((w, i) => {
        const h = pct(w.new, maxW);
        const isLast = i === wk.length - 1;
        return `<div class="an-trend-col">
            <div class="an-trend-bar-bg">
                <div class="an-trend-bar" style="height:0%; background:${isLast ? '#27500A' : '#3B6D11'}; opacity:${isLast ? 1 : 0.55}" data-w="${h}%" data-h="${h}%"></div>
            </div>
            <span class="an-trend-lbl">${w.week}</span>
        </div>`;
    }).join('');

    return `
    <div class="an-grid-4">
        <div class="an-kpi clickable" onclick="openDrawer('Pipeline funnel', _drawerFunnel())">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-g"></span> Business leads</div>
            <div class="an-kpi-num">${comma(f[1].count)}</div>
            <div class="an-kpi-sub">from ${comma(top)} total contacts</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${rr >= 70 ? 'dot-g' : 'dot-a'}"></span> Reply rate</div>
            <div class="an-kpi-num">${rr}%</div>
            <div class="an-kpi-sub">${comma(f[2].count)} leads responded</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${cvr >= 20 ? 'dot-g' : 'dot-a'}"></span> Conversion</div>
            <div class="an-kpi-num">${cvr}%</div>
            <div class="an-kpi-sub">${comma(f[4].count)} deals closed</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-b"></span> This week</div>
            <div class="an-kpi-num">${comma(lastW)}</div>
            <div class="an-kpi-sub">new leads
                <span class="an-kpi-trend ${wkDelta >= 0 ? 'trend-up' : 'trend-down'}">${wkDelta >= 0 ? '↑' : '↓'}${Math.abs(wkDelta)}%</span>
            </div>
        </div>
    </div>

    <div class="an-grid-2">
        <div class="an-card clickable" onclick="openDrawer('Pipeline funnel', _drawerFunnel())">
            <div class="an-sec-lbl">Conversion funnel</div>
            ${funnelRows}
        </div>
        <div class="an-card">
            <div class="an-sec-lbl">Weekly lead volume</div>
            <div class="an-trend-wrap">${trendBars}</div>
        </div>
    </div>

    <div class="an-card">
        <div class="an-sec-lbl">Lead sentiment ${infoIcon('Average tone of incoming messages per week. Higher = warmer leads.')}</div>
        <div style="display:flex; align-items:center; gap:20px;">
            <div style="flex:1">
                <div class="an-sentiment-wrap">${buildSentimentLine(d.sentimentTrend)}</div>
                <div style="display:flex; justify-content:space-between; margin-top:4px">
                    ${d.sentimentTrend.map(t => `<span style="font-size:9.5px;color:#cbd5e1;font-weight:600">${t.week}</span>`).join('')}
                </div>
            </div>
            <div style="text-align:right; flex-shrink:0">
                <div style="font-size:28px;font-weight:700;color:#0f172a;line-height:1">${Math.round(d.sentimentTrend[d.sentimentTrend.length-1].score * 100)}%</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:2px">positive this week</div>
                <span class="an-kpi-trend trend-up" style="margin-top:6px;display:inline-flex">↑ improving</span>
            </div>
        </div>
    </div>`;
}

function _drawerFunnel() {
    const states = analyticsData.stateBreakdown;
    const total  = states.reduce((s, x) => s + x.count, 0);
    const rows = states.map(s => `<tr><td>${s.label}</td><td>${comma(s.count)}</td><td>${pct(s.count, total)}%</td></tr>`).join('');
    return `
        <div style="font-size:12px;color:#64748b;margin-bottom:18px;line-height:1.5">
            Current distribution of all business leads across pipeline states.
        </div>
        <table class="an-dtable">
            <thead><tr><th>State</th><th>Leads</th><th>Share</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — MARKET INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════
function renderMarket() {
    const d    = analyticsData;
    const maxQ = d.topQuestions[0]?.count || 1;
    const hasObjections = Array.isArray(d.objections) && d.objections.length > 0;
    const topObjection = d.objections[0] || { pct: 0, count: 0, label: 'No objections yet', color: '#94a3b8' };
    const maxO = Math.max(...d.objections.map(o => o.count), 1);

    const qRows = d.topQuestions.map((q, i) => `
        <div class="an-q-row">
            <div class="an-q-rank">${i + 1}</div>
            <div class="an-q-text">${q.question}</div>
            <div class="an-q-bar"><div class="an-q-bar-fill" style="width:0%" data-w="${q.pct}%"></div></div>
            <div class="an-q-count">${q.count}×</div>
        </div>`).join('');

    const objRows = hasObjections ? d.objections.map(o => `
        <div class="an-obj-row">
            <div class="an-obj-label">${o.label}</div>
            <div class="an-obj-track">
                <div class="an-obj-fill" style="width:0%; background:${o.color}" data-w="${o.pct}%">
                    <span>${o.pct}%</span>
                </div>
            </div>
            <div class="an-obj-num">${o.count}</div>
        </div>`).join('') : `<div style="padding:20px 0 0;color:#64748b;font-size:13px">No objection data available yet.</div>`;

    const compItems = d.competitorMentions.map(c => `
        <div class="an-comp-item">
            <div class="an-comp-name">${c.name}</div>
            <div class="an-comp-ctx">mentioned for ${c.context}</div>
            <div class="an-comp-count">${c.count}×</div>
        </div>`).join('');

    // Objection donut
    const donutSegs = hasObjections ? d.objections.map(o => ({ pct: o.pct, color: o.color })) : [];
    const donutLegend = hasObjections ? d.objections.map(o => `
        <div class="an-donut-row">
            <div class="an-donut-dot" style="background:${o.color}"></div>
            <span>${o.label}</span>
            <span class="an-donut-val">${o.pct}%</span>
        </div>`).join('') : `<div style="color:#64748b;font-size:13px">No objection data yet.</div>`;

    return `
    <div class="an-grid-2">
        <div class="an-card">
            <div class="an-sec-lbl">Top questions before buying ${infoIcon('Most frequent questions asked by leads before they convert. Use these to improve your FAQ and bot training.')}</div>
            ${qRows}
        </div>
        <div class="an-card">
            <div class="an-sec-lbl">Why leads don't convert ${infoIcon('Top objections extracted from conversations where leads went cold or were lost.')}</div>
            <div class="an-donut-wrap" style="margin-bottom:16px">
                ${buildDonut(donutSegs, 100, 16)}
                <div class="an-donut-legend">${donutLegend}</div>
            </div>
            ${objRows}
        </div>
    </div>

    <div class="an-grid-2">
        <div class="an-card">
            <div class="an-sec-lbl">Competitor mentions ${infoIcon('Which competitors leads name during conversations, and why.')}</div>
            ${compItems}
            <div style="margin-top:12px; padding:10px 12px; background:#fffbeb; border-radius:8px; border:1px solid #fde68a">
                <div style="font-size:11.5px; color:#92400e; line-height:1.5; font-weight:500">
                    💡 <strong>Jumia</strong> is your most common price comparison. Consider adding a direct price-match statement in your WhatsApp opening message.
                </div>
            </div>
        </div>
        <div class="an-card">
            <div class="an-sec-lbl">Price objection rate ${infoIcon('How often price is raised as a barrier to purchase.')}</div>
            <div style="display:flex; align-items:center; gap:16px; padding: 8px 0 16px">
                <div>
                    <div style="font-size:42px; font-weight:700; color:#ef4444; line-height:1; letter-spacing:-0.03em">${topObjection.pct}%</div>
                    <div style="font-size:12px; color:#94a3b8; margin-top:4px">of lost leads cite price</div>
                </div>
                <div style="flex:1; padding-left:8px">
                    <div style="font-size:12px; color:#334155; line-height:1.6">
                        ${topObjection.count} leads dropped off due to pricing. This is the single largest lever for conversion improvement.
                    </div>
                    <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap">
                        <span class="an-pill pill-amber">Consider payment plans</span>
                        <span class="an-pill pill-amber">Add value framing</span>
                    </div>
                </div>
            </div>
            <div class="an-sec-lbl" style="margin-top:4px">Other blockers</div>
            ${d.objections.slice(1).map(o => `
                <div class="an-hbar-row">
                    <div class="an-hbar-top">
                        <span class="an-hbar-name">${o.label}</span>
                        <span class="an-hbar-num">${o.count}</span>
                    </div>
                    <div class="an-hbar-track">
                        <div class="an-hbar-fill" style="width:0%; background:${o.color}; opacity:0.6" data-w="${pct(o.count, maxO)}%"></div>
                    </div>
                </div>`).join('')}
        </div>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — AD IMPACT
// ═══════════════════════════════════════════════════════════════════════════════
function renderAds() {
    const d   = analyticsData;
    const ads = d.adLeaderboard;
    const best = ads[0] || { quality_score: 0 };
    const totalLeads = ads.reduce((s, a) => s + a.lead_count, 0);

    const adItems = ads.map(ad => {
        const rr  = pct(ad.reply_count, ad.lead_count);
        const cvr = pct(ad.conversion_count, ad.lead_count);
        return `
        <div class="an-ad-item" onclick="openDrawer('Ad: ${ad.headline.replace(/'/g,"\\'")}', _drawerAd('${ad.ad_id}'))">
            ${ad.thumbnail
                ? `<img src="${ad.thumbnail}" class="an-ad-thumb" alt="">`
                : `<div class="an-ad-thumb-ph"><svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9l4-4 4 4 5-5 5 5"/></svg></div>`}
            <div class="an-ad-body">
                <div class="an-ad-title">${ad.headline}</div>
                <div class="an-ad-sub">${ad.body}</div>
                <div class="an-ad-pills">
                    <span class="an-pill pill-slate">${ad.platform}</span>
                    <span class="an-pill pill-green">${ad.lead_count} leads</span>
                    <span class="an-pill ${cvr >= 15 ? 'pill-green' : 'pill-amber'}">${cvr}% conv</span>
                    <span class="an-pill pill-blue">${ad.cycle_days_avg}d cycle</span>
                </div>
            </div>
            ${buildScoreRing(ad.quality_score)}
        </div>`;
    }).join('');

    const noAds = `<div style="text-align:center;padding:32px;color:#94a3b8;font-size:13px">No ad data recorded yet.</div>`;

    return `
    <div class="an-grid-3">
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-g"></span> Active ads</div>
            <div class="an-kpi-num">${ads.length}</div>
            <div class="an-kpi-sub">running campaigns</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-b"></span> Leads from ads</div>
            <div class="an-kpi-num">${comma(totalLeads)}</div>
            <div class="an-kpi-sub">${pct(totalLeads, analyticsData.funnel[1].count)}% of all business leads</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${best.quality_score >= 75 ? 'dot-g' : 'dot-a'}"></span> Top quality score</div>
            <div class="an-kpi-num">${Math.round(best.quality_score)}</div>
            <div class="an-kpi-sub">best campaign score /100</div>
        </div>
    </div>

    <div class="an-card">
        <div class="an-sec-lbl">Campaign leaderboard ${infoIcon('Click any ad to see its full funnel breakdown. Score = composite of reply rate, conversion, and lead quality.')}</div>
        ${ads.length > 0 ? adItems : noAds}
    </div>

    <div class="an-card">
        <div class="an-sec-lbl">Sales cycle by ad (avg days to convert) ${infoIcon('How long from first WhatsApp message to purchase, per campaign.')}</div>
        ${ads.map(ad => `
            <div class="an-hbar-row">
                <div class="an-hbar-top">
                    <span class="an-hbar-name">${ad.headline.split('—')[0].trim().substring(0, 30)}</span>
                    <span class="an-hbar-num">${ad.cycle_days_avg}d</span>
                </div>
                <div class="an-hbar-track">
                    <div class="an-hbar-fill" style="width:0%; background:#3B6D11" data-w="${pct(ad.cycle_days_avg, 10) * 100 / 100}%"></div>
                </div>
            </div>`).join('')}
    </div>`;
}

function _drawerAd(adId) {
    const ad = analyticsData.adLeaderboard.find(a => a.ad_id === adId);
    if (!ad) return '<p style="color:#94a3b8;font-size:13px">Ad not found.</p>';
    const steps = [
        { label: 'Generated', count: ad.lead_count },
        { label: 'Replied', count: ad.reply_count },
        { label: 'Interested', count: ad.product_interest_count },
        { label: 'Converted', count: ad.conversion_count }
    ];
    const fRows = steps.map((s, i) => {
        const w = pct(s.count, steps[0].count);
        return `<div class="an-funnel-row">
            <span class="an-funnel-name">${s.label}</span>
            <div class="an-funnel-track">
                <div class="an-funnel-fill" style="width:${w}%; background:rgba(59,109,17,${1 - i * 0.2})">
                    <span>${comma(s.count)}</span>
                </div>
            </div>
            <span class="an-funnel-pct">${w}%</span>
        </div>`;
    }).join('');
    return `
        ${ad.thumbnail ? `<img src="${ad.thumbnail}" style="width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:16px" alt="">` : ''}
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">${ad.headline}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:20px">${ad.body}</div>
        <div class="an-sec-lbl">Funnel performance</div>
        ${fRows}
        <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;display:flex;gap:16px;flex-wrap:wrap">
            <div><div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.07em">Platform</div><div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:2px">${ad.platform}</div></div>
            <div><div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.07em">Avg cycle</div><div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:2px">${ad.cycle_days_avg} days</div></div>
            <div><div style="font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.07em">Quality score</div><div style="font-size:13px;font-weight:600;color:#0f172a;margin-top:2px">${Math.round(ad.quality_score)} / 100</div></div>
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4 — DEMAND
// ═══════════════════════════════════════════════════════════════════════════════
function renderDemand() {
    const d    = analyticsData;
    const prods = d.productDemand;
    const maxP  = Math.max(...prods.map(p => p.count), 1);
    const colors = ['#3B6D11','#27500A','#4a8c15','#5aaa1a','#6fcc22','#84d93a'];

    const bars = prods.map((p, i) => `
        <div class="an-hbar-row">
            <div class="an-hbar-top">
                <span class="an-hbar-name">${p.label}</span>
                <span class="an-hbar-num">${comma(p.count)}</span>
            </div>
            <div class="an-hbar-track">
                <div class="an-hbar-fill" style="width:0%; background:${colors[i % colors.length]}" data-w="${pct(p.count, maxP)}%"></div>
            </div>
        </div>`).join('');

    // Donut for product share
    const totalD = prods.reduce((s, p) => s + p.count, 0);
    const donutSegs = prods.map((p, i) => ({ pct: pct(p.count, totalD), color: colors[i % colors.length] }));
    const donutLeg  = prods.map((p, i) => `
        <div class="an-donut-row">
            <div class="an-donut-dot" style="background:${colors[i % colors.length]}"></div>
            <span>${p.label}</span>
            <span class="an-donut-val">${pct(p.count, totalD)}%</span>
        </div>`).join('');

    const comboRows = Array.isArray(d.productCombos) && d.productCombos.length ? d.productCombos.map(c => `
        <div style="display:flex; align-items:center; gap:8px; padding:9px 0; border-bottom:1px solid #f1f5f9">
            <span class="an-pill pill-green" style="font-size:11.5px">${c.a}</span>
            <span style="font-size:11px; color:#94a3b8">+</span>
            <span class="an-pill pill-green" style="font-size:11.5px">${c.b}</span>
            <span style="margin-left:auto; font-size:11.5px; font-weight:600; color:#64748b; font-family:'DM Mono',monospace">${c.count}×</span>
        </div>`).join('') : `<div style="padding:20px 0 0;color:#64748b;font-size:13px">No product combo data available yet.</div>`;

    const productComboCopy = Array.isArray(d.productCombos) && d.productCombos.length ? `
        <div style="margin-top:12px; padding:10px 12px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0">
            <div style="font-size:11.5px; color:#166534; line-height:1.5; font-weight:500">
                💡 Consider bundling <strong>${d.productCombos[0].a} + ${d.productCombos[0].b}</strong> — asked together ${d.productCombos[0].count} times.
            </div>
        </div>` : `<div style="margin-top:12px; padding:10px 12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0">
            <div style="font-size:11.5px; color:#64748b; line-height:1.5; font-weight:500">
                No product bundle data available yet.
            </div>
        </div>`;

    return `
    <div class="an-grid-2">
        <div class="an-card">
            <div class="an-sec-lbl">Product demand ranking ${infoIcon('Products mentioned by leads most often. Ranked by frequency of interest expressed in conversations.')}</div>
            ${bars}
        </div>
        <div class="an-card">
            <div class="an-sec-lbl">Share of demand</div>
            <div class="an-donut-wrap">
                ${buildDonut(donutSegs, 110, 18)}
                <div class="an-donut-legend">${donutLeg}</div>
            </div>
        </div>
    </div>

    <div class="an-card" style="max-width:480px">
        <div class="an-sec-lbl">Frequently bought together ${infoIcon('Leads who ask about product A also commonly ask about product B. Bundle and upsell opportunity.')}</div>
        ${comboRows}
        ${productComboCopy}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5 — TIMING
// ═══════════════════════════════════════════════════════════════════════════════
function renderTiming() {
    const d    = analyticsData;
    const hm   = d.heatmap;
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const maxV = Math.max(...hm.flat(), 1);

    function hmColor(v) {
        if (!v) return '#f8fafc';
        const t = v / maxV;
        if (t < 0.2)  return 'rgba(59,109,17,0.15)';
        if (t < 0.4)  return 'rgba(59,109,17,0.35)';
        if (t < 0.65) return 'rgba(59,109,17,0.58)';
        if (t < 0.85) return 'rgba(59,109,17,0.78)';
        return '#27500A';
    }

    const xLabels = '<div></div>' + Array.from({length:24}, (_,h) =>
        h % 4 === 0 ? `<div class="an-hm-lx">${h}:00</div>` : '<div></div>'
    ).join('');

    const rows = hm.map((row, di) =>
        `<div class="an-hm-ly">${days[di]}</div>` +
        row.map(v => `<div class="an-hm-cell" style="background:${hmColor(v)}" title="${v} messages"></div>`).join('')
    ).join('');

    const maxRD = Math.max(...d.leadResponseDist.map(b => b.count), 1);
    const rdBars = d.leadResponseDist.map(b => `
        <div class="an-hbar-row">
            <div class="an-hbar-top">
                <span class="an-hbar-name">${b.bucket}</span>
                <span class="an-hbar-num">${b.count}</span>
            </div>
            <div class="an-hbar-track">
                <div class="an-hbar-fill" style="width:0%; background:#3B6D11" data-w="${pct(b.count, maxRD)}%"></div>
            </div>
        </div>`).join('');

    return `
    <div class="an-grid-3">
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-g"></span> Peak buying intent</div>
            <div class="an-kpi-num">${d.intentPeakHour}:00</div>
            <div class="an-kpi-sub">${d.intentPeakDay} — highest purchase signals</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-b"></span> Fastest lead response</div>
            <div class="an-kpi-num">${d.leadResponseDist[0].count}</div>
            <div class="an-kpi-sub">replied in under 2 minutes</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot dot-a"></span> Slow to respond</div>
            <div class="an-kpi-num">${d.leadResponseDist[d.leadResponseDist.length-1].count}</div>
            <div class="an-kpi-sub">took 6+ hours to reply</div>
        </div>
    </div>

    <div class="an-card">
        <div class="an-sec-lbl">Activity heatmap ${infoIcon('Darker = more messages. Use this to schedule your follow-ups and AI sending windows.')}</div>
        <div class="an-hm-wrap">
            <div class="an-hm-grid">
                ${xLabels}${rows}
            </div>
        </div>
        <div class="an-hm-legend">
            <span>Quiet</span>
            ${['#f8fafc','rgba(59,109,17,0.15)','rgba(59,109,17,0.35)','rgba(59,109,17,0.58)','#27500A'].map(c =>
                `<div style="width:14px;height:10px;border-radius:2px;background:${c}"></div>`).join('')}
            <span>Busy</span>
        </div>
        <div style="margin-top:12px; padding:10px 12px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0">
            <div style="font-size:11.5px; color:#166534; line-height:1.5; font-weight:500">
                💡 Peak buying intent is at <strong>${d.intentPeakHour}:00 on ${d.intentPeakDay}</strong>. Schedule your best follow-ups to arrive 30 min before this window.
            </div>
        </div>
    </div>

    <div class="an-card" style="max-width:520px">
        <div class="an-sec-lbl">How fast leads reply to you ${infoIcon('Lead response time distribution. Fast replies signal high intent. Segment your follow-up urgency by this.')}</div>
        ${rdBars}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6 — HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
function renderHealth() {
    const d = analyticsData;
    const h = d.convHealth;
    const rr = d.readReceipts;

    // Read receipt flow
    const flowSteps = [
        { label: 'Sent',      count: rr.sent,      color: '#94a3b8' },
        { label: 'Delivered', count: rr.delivered, color: '#3b82f6' },
        { label: 'Read',      count: rr.read,      color: '#f59e0b' },
        { label: 'Replied',   count: rr.replied,   color: '#22c55e' }
    ];
    const maxF = flowSteps[0].count;
    const flowHTML = flowSteps.map((step, i) => `
        ${i > 0 ? `<div class="an-flow-arrow">›</div>` : ''}
        <div class="an-flow-step">
            <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-bottom:8px">
                <div style="height:100%;width:${pct(step.count, maxF)}%;background:${step.color};border-radius:4px;transition:width 0.8s ease"></div>
            </div>
            <div class="an-flow-meta">
                <span class="an-flow-count">${comma(step.count)}</span>
                <span class="an-flow-lbl">${step.label}</span>
            </div>
        </div>`).join('');

    // Follow-up step performance
    const maxReplies = Math.max(...d.followupStepConversion.map(s => s.replies), 1);
    const stepRows = d.followupStepConversion.map(s => `
        <div class="an-step-row">
            <div class="an-step-num">${s.step}</div>
            <div class="an-step-name">${s.name}</div>
            <div class="an-step-track">
                <div class="an-step-fill" style="width:0%" data-w="${pct(s.replies, maxReplies)}%">
                    <span>${s.replies}</span>
                </div>
            </div>
            <div class="an-step-conv">+${s.conversions}</div>
        </div>`).join('');

    // Engagement signals
    const signals = [
        { icon: '🎤', num: d.voiceNoteLeads,  lbl: 'Voice notes sent' },
        { icon: '📷', num: d.mediaLeads,       lbl: 'Images / media' },
        { icon: '👍', num: d.reactionCount,    lbl: 'Emoji reactions' },
        { icon: '✅', num: d.consentAcceptRate+'%', lbl: 'Consent rate' }
    ];
    const signalHTML = signals.map(sig => `
        <div class="an-signal">
            <div class="an-signal-icon">${sig.icon}</div>
            <div class="an-signal-num">${sig.num}</div>
            <div class="an-signal-lbl">${sig.lbl}</div>
        </div>`).join('');

    // AI vs human
    const aiTotal = d.humanVsAiClose.ai + d.humanVsAiClose.human;
    const aiPct   = pct(d.humanVsAiClose.ai, aiTotal);
    const aiDonut = buildDonut([
        { pct: aiPct,     color: '#3B6D11' },
        { pct: 100-aiPct, color: '#f1f5f9' }
    ], 80, 14);

    return `
    <div class="an-grid-4">
        <div class="an-kpi clickable" onclick="openDrawer('Health breakdown', _drawerHealth())">
            <div class="an-kpi-label"><span class="an-kpi-dot ${h.avg_reply_time_min <= 15 ? 'dot-g' : 'dot-a'}"></span> Avg reply time</div>
            <div class="an-kpi-num">${h.avg_reply_time_min}m</div>
            <div class="an-kpi-sub">target: under 15 min</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${h.open_unread === 0 ? 'dot-g' : 'dot-r'}"></span> Unread now</div>
            <div class="an-kpi-num">${h.open_unread}</div>
            <div class="an-kpi-sub">leads awaiting reply</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${h.pct_ai_managed >= 50 ? 'dot-g' : 'dot-a'}"></span> AI handled</div>
            <div class="an-kpi-num">${h.pct_ai_managed}%</div>
            <div class="an-kpi-sub">fully resolved by AI</div>
        </div>
        <div class="an-kpi">
            <div class="an-kpi-label"><span class="an-kpi-dot ${h.pct_gone_cold <= 15 ? 'dot-g' : 'dot-a'}"></span> Gone cold</div>
            <div class="an-kpi-num">${h.pct_gone_cold}%</div>
            <div class="an-kpi-sub">need follow-up now</div>
        </div>
    </div>

    <div class="an-card">
        <div class="an-sec-lbl">Message journey — read receipts ${infoIcon('Track how many of your sent messages are delivered, read, and then replied to. Requires Evolution API read receipt data.')}</div>
        <div class="an-flow-wrap" style="gap:6px; margin-top:8px">${flowHTML}</div>
        ${d.deliveryFailures > 0 ? `
        <div style="margin-top:12px; padding:10px 12px; background:#fef2f2; border-radius:8px; border:1px solid #fecaca">
            <div style="font-size:11.5px; color:#991b1b; line-height:1.5; font-weight:500">
                ⚠️ <strong>${d.deliveryFailures} messages</strong> failed to deliver — wrong numbers, blocked contacts, or no data. Review these leads.
            </div>
        </div>` : ''}
    </div>

    <div class="an-grid-2">
        <div class="an-card">
            <div class="an-sec-lbl">Follow-up step performance ${infoIcon('Replies triggered and conversions won per follow-up step. Green number = conversions. Find your highest-impact steps.')}</div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:10px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; padding:0 0 0 30px">
                <span style="flex:1; padding-left:130px">Replies</span>
                <span>Conv.</span>
            </div>
            ${stepRows}
        </div>
        <div style="display:flex; flex-direction:column; gap:16px">
            <div class="an-card">
                <div class="an-sec-lbl">AI vs human closes ${infoIcon('Conversion attribution — how many deals closed with AI only vs. human handoff.')}</div>
                <div style="display:flex; align-items:center; gap:16px">
                    ${buildDonut([{pct:aiPct,color:'#3B6D11'},{pct:100-aiPct,color:'#f1f5f9'}], 80, 14)}
                    <div style="flex:1">
                        <div style="display:flex; gap:8px; margin-bottom:6px">
                            <span class="an-pill pill-green">AI: ${d.humanVsAiClose.ai}</span>
                            <span class="an-pill pill-slate">Human: ${d.humanVsAiClose.human}</span>
                        </div>
                        <div style="font-size:11.5px; color:#64748b; line-height:1.5">${aiPct}% of conversions handled entirely by AI.</div>
                    </div>
                </div>
            </div>
            <div class="an-card">
                <div class="an-sec-lbl">WhatsApp engagement signals</div>
                <div class="an-signal-wrap">${signalHTML}</div>
            </div>
        </div>
    </div>`;
}

function _drawerHealth() {
    const h = analyticsData.convHealth;
    return `
        <table class="an-dtable">
            <tbody>
                <tr><td>Average reply time</td><td><strong>${h.avg_reply_time_min} min</strong></td></tr>
                <tr><td>Never replied rate</td><td><strong>${h.pct_never_replied}%</strong> of leads</td></tr>
                <tr><td>Gone cold rate</td><td><strong>${h.pct_gone_cold}%</strong> of pipeline</td></tr>
                <tr><td>Opt-outs</td><td><strong>${h.opt_out_count}</strong> leads</td></tr>
                <tr><td>Delivery failures</td><td><strong>${analyticsData.deliveryFailures}</strong> messages</td></tr>
                <tr><td>Consent acceptance</td><td><strong>${analyticsData.consentAcceptRate}%</strong></td></tr>
            </tbody>
        </table>
        <div style="margin-top:20px; padding:12px; background:#f8fafc; border-radius:8px; font-size:12px; color:#64748b; line-height:1.6">
            Maintaining reply times under 15 minutes significantly boosts conversion likelihood. Use AI auto-replies for off-hours to hold attention while you sleep.
        </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOUNTING & RENDERING
// ═══════════════════════════════════════════════════════════════════════════════
function _mountDashboard(contentArea) {
    contentArea.innerHTML = `
        <div class="an-wrap">
            <nav class="an-topnav" id="an-nav">${buildNav()}</nav>
            <div class="an-content" id="an-body">${buildSection()}</div>

            <div id="an-overlay" class="an-overlay" onclick="closeDrawer()"></div>
            <div id="an-drawer" class="an-drawer">
                <div class="an-drawer-head">
                    <div class="an-drawer-title" id="an-drawer-title">Details</div>
                    <button class="an-drawer-close" onclick="closeDrawer()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="an-drawer-body" id="an-drawer-body"></div>
            </div>
        </div>`;

    _animateBars();
}

function _renderLoading(contentArea) {
    contentArea.innerHTML = `
        <div class="an-wrap" style="align-items:center;justify-content:center">
            <div class="an-loading">
                <div class="an-spinner"></div>
                <div class="an-loading-text">Loading analytics…</div>
            </div>
        </div>`;
}

function _renderError(contentArea) {
    contentArea.innerHTML = `
        <div class="an-wrap" style="align-items:center;justify-content:center">
            <div class="an-error">
                <div class="an-error-icon">📡</div>
                <div class="an-error-title">Couldn't load analytics</div>
                <div class="an-error-sub">Check your connection and try again.</div>
                <button class="an-retry-btn" onclick="renderAnalyticsContent()">Retry</button>
            </div>
        </div>`;
}

// ─── Main entry point ─────────────────────────────────────────────────────────
async function renderAnalyticsContent(businessId) {
    injectAnalyticsStyles();
    const contentArea = document.getElementById('content-area');

    contentArea.classList.remove('items-center', 'justify-center', 'p-4', 'overflow-y-auto');
    contentArea.classList.add('overflow-hidden');
    contentArea.style.padding = '0';

    _renderLoading(contentArea);

    const activeId = businessId || window.getActiveBusinessId?.() || localStorage.getItem('business_id');
    if (!activeId) {
        console.warn('[Analytics] No active business ID.');
        _renderError(contentArea);
        return;
    }

    // ── Attempt live data only; do not fall back to mocked values ───────────
    let liveData = null;
    if (window.analyticsService?.getDashboardMetrics) {
        try {
            liveData = await window.analyticsService.getDashboardMetrics(activeId);
        } catch (e) {
            console.warn('[Analytics] getDashboardMetrics failed, no live analytics available.', e);
        }
    }

    if (!liveData || typeof liveData !== 'object') {
        console.error('[Analytics] No live analytics data received.');
        _renderError(contentArea);
        return;
    }

    // Merge live payload with minimal structural defaults.
    analyticsData = Object.assign({}, AN_DEFAULTS, liveData);

    console.log('[Analytics] Data mounted.', 'Live');
    _mountDashboard(contentArea);
}

// ─── Page config hook ─────────────────────────────────────────────────────────
if (typeof PAGE_CONFIG !== 'undefined') {
    PAGE_CONFIG.analytics = {
        title:       'Analytics',
        description: 'Business intelligence from your conversations.',
        navId:       'nav-analytics',
        render: function(passedBusinessId) {
            const activeId = passedBusinessId || localStorage.getItem('business_id');
            if (activeId) renderAnalyticsContent(activeId);
            else console.error('[Analytics] No business ID available.');
        }
    };
}