/**
 * dashboard-overview.js — HeySasa! Live Dashboard
 *
 * Registers as PAGE_CONFIG.overview ONLY when onboarding_complete is true.
 * If the user is still in onboarding, this file loads but skips registration
 * so onboarding.js keeps ownership of the overview slot.
 *
 * Load order in HTML:
 *   <script src="onboarding.js"></script>           ← always registers first
 *   <script src="dashboard-overview.js"></script>   ← overwrites when complete
 *
 * When onboarding.js calls advanceStep(6) and sets onboarding_complete = true,
 * it then calls window.switchPage('overview') which re-reads PAGE_CONFIG.overview.
 * At that point this module's registration (set during page load) is already in
 * place, so the full dashboard renders immediately.
 */

(function () {
    'use strict';

    function getBusinessId() {
        return localStorage.getItem('business_id');
    }

    function getSupabase() {
        return window.getSupabase?.();
    }

    // ─── Data fetchers ─────────────────────────────────────────────────────────
    async function fetchDashboardData(businessId) {
        const client = getSupabase();
        if (!client || !businessId) return null;

        try {
            // Updated to fetch from the new business_balances table
            const [profileRes, metricsRes, activityRes, balanceRes] = await Promise.all([
                client.from('businesses')
                      .select('name, phone, owner_email, business_type, created_at')
                      .eq('business_id', businessId)
                      .single(),
                client.from('business_metrics')
                      .select('total_leads, active_conversations, messages_sent, revenue_attributed, conversion_rate')
                      .eq('business_id', businessId)
                      .maybeSingle(),
                client.from('conversation_events')
                      .select('event_type, created_at, lead_name, summary')
                      .eq('business_id', businessId)
                      .order('created_at', { ascending: false })
                      .limit(6),
                client.from('business_balances')
                      .select('balance_kes')
                      .eq('business_id', businessId)
                      .maybeSingle()
            ]);

            return {
                profile:  profileRes.data  || null,
                metrics:  metricsRes.data  || null,
                activity: activityRes.data || [],
                balance:  balanceRes.data  || { balance_kes: 0 }
            };
        } catch (err) {
            console.error('[Dashboard] Data fetch error:', err);
            return null;
        }
    }

    // ─── Formatting helpers ────────────────────────────────────────────────────
    function fmt(n, prefix = '') {
        if (n == null) return '0';
        if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)     return `${prefix}${(n / 1_000).toFixed(1)}K`;
        return `${prefix}${parseFloat(n).toLocaleString()}`;
    }

    function timeAgo(isoString) {
        if (!isoString) return '';
        const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
        if (diff < 60)       return 'just now';
        if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    function eventIcon(type) {
        const icons = {
            new_lead:    { bg: '#EFF6FF', color: '#3B82F6', svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>` },
            message_sent:{ bg: '#F0FDF4', color: '#22C55E', svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>` },
            sale_made:   { bg: '#FFF7ED', color: '#F97316', svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1"/>` },
            default:     { bg: '#F8FAFC', color: '#64748B', svg: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>` },
        };
        return icons[type] || icons.default;
    }

    // ─── Render ────────────────────────────────────────────────────────────────
    async function _render(businessId) {
        console.log('[Dashboard] Render start for businessId:', businessId);
        const el = document.getElementById('content-area');
        if (!el) {
            console.error('[Dashboard] Rendering aborted: #content-area not found.');
            return;
        }

        // Set proper classes for full-height dashboard content with scrolling and transitions
        el.className = 'absolute inset-0 z-10 p-4 md:p-8 overflow-y-auto custom-scrollbar opacity-100 pointer-events-auto transition-opacity duration-700';

        const data = await fetchDashboardData(businessId);
        if (!data) {
            console.warn('[Dashboard] No data returned for businessId:', businessId); 
        }
        const p = data?.profile  || {};
        const m = data?.metrics  || {};
        const a = data?.activity || [];
        const b = data?.balance  || { balance_kes: 0 };

        const plan   = p.plan    || 'Starter';
        const name   = p.name    || 'Your Business';
        const bal    = b.balance_kes != null ? `KES ${parseFloat(b.balance_kes).toLocaleString()}` : 'KES 0.00';
        const joined = p.created_at ? new Date(p.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '';

        const statCards = [
            { label: 'Total Leads',      value: fmt(m.total_leads),             icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>`, accent: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Active Chats',     value: fmt(m.active_conversations),    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>`, accent: '#22C55E', bg: '#F0FDF4' },
            { label: 'Messages Sent',    value: fmt(m.messages_sent),           icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>`, accent: '#8B5CF6', bg: '#F5F3FF' },
            { label: 'Revenue via AI',   value: fmt(m.revenue_attributed, 'KES '), icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`, accent: '#F59E0B', bg: '#FFFBEB' },
        ];

        const statHTML = statCards.map(s => `
            <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px;
                        display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:13px;font-weight:600;color:#64748B;">${s.label}</span>
                    <div style="background:${s.bg};color:${s.accent};padding:8px;border-radius:10px;display:flex;">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">${s.icon}</svg>
                    </div>
                </div>
                <div style="font-size:28px;font-weight:800;color:#0F172A;line-height:1;">${s.value}</div>
            </div>`).join('');

        const activityHTML = a.length === 0
            ? `<div style="padding:32px;text-align:center;color:#94A3B8;font-size:14px;">No activity yet — your AI will log events here as it works.</div>`
            : a.map(ev => {
                const ic = eventIcon(ev.event_type);
                return `
                    <div style="display:flex;align-items:center;gap:14px;padding:14px 0;
                                border-bottom:1px solid #F1F5F9;">
                        <div style="background:${ic.bg};color:${ic.color};padding:10px;border-radius:10px;flex-shrink:0;">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">${ic.svg}</svg>
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:14px;font-weight:600;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${ev.lead_name || 'Unknown'}
                            </div>
                            <div style="font-size:12px;color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${ev.summary || ev.event_type || ''}
                            </div>
                        </div>
                        <div style="font-size:11px;color:#94A3B8;white-space:nowrap;">${timeAgo(ev.created_at)}</div>
                    </div>`;
            }).join('');

        el.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:24px;max-width:1200px;margin:0 auto;padding-bottom:40px;">

                <!-- Business Profile Banner -->
                <div style="background:#0F172A;border-radius:20px;padding:28px 32px;
                            display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;">
                    <div style="display:flex;align-items:center;gap:16px;">
                        <div style="width:52px;height:52px;background:#1E293B;border-radius:14px;
                                    display:flex;align-items:center;justify-content:center;
                                    font-size:22px;font-weight:800;color:#fff;flex-shrink:0;">
                            ${name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-size:20px;font-weight:800;color:#fff;">${name}</div>
                            <div style="font-size:13px;color:#94A3B8;margin-top:2px;">
                                ${p.phone || ''} ${joined ? '· Member since ' + joined : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;">
                        <div style="background:#1E293B;border-radius:12px;padding:12px 18px;text-align:center;cursor:pointer;" onclick="window.switchPage('preferences')">
                            <div style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">AI Tokens</div>
                            <div style="font-size:18px;font-weight:800;color:#34D399;margin-top:2px;">${bal}</div>
                        </div>
                        <div style="background:#1E293B;border-radius:12px;padding:12px 18px;text-align:center;">
                            <div style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:.05em;">Plan</div>
                            <div style="font-size:18px;font-weight:800;color:#fff;margin-top:2px;">${plan}</div>
                        </div>
                        <div style="background:#22C55E;border-radius:12px;padding:12px 18px;text-align:center;cursor:pointer;"
                             onclick="window.switchPage('overview')"
                             onmouseover="this.style.background='#16A34A'"
                             onmouseout="this.style.background='#22C55E'">
                            <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.05em;">WhatsApp</div>
                            <div style="font-size:14px;font-weight:800;color:#fff;margin-top:2px;">● Connected</div>
                        </div>
                    </div>
                </div>

                <!-- Stat Cards -->
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
                    ${statHTML}
                </div>

                <!-- Main content: activity + quick actions -->
                <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;"
                     class="dashboard-grid">
                    <!-- Activity Feed -->
                    <div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                            <h3 style="font-size:16px;font-weight:800;color:#0F172A;">Live Activity</h3>
                            <button onclick="window.switchPage('leads')"
                                    style="font-size:12px;font-weight:600;color:#3B82F6;background:none;border:none;cursor:pointer;padding:0;">
                                View all leads →
                            </button>
                        </div>
                        ${activityHTML}
                    </div>

                    <!-- Quick Actions -->
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        ${[
                            { label: 'View Analytics',   page: 'analytics',   icon: '#3B82F6', bg: '#EFF6FF' },
                            { label: 'Manage Leads',     page: 'leads',       icon: '#22C55E', bg: '#F0FDF4' },
                            { label: 'Add Stock (AI)',   page: 'products',    icon: '#F59E0B', bg: '#FFFBEB' },
                            { label: 'AI Preferences',   page: 'preferences', icon: '#8B5CF6', bg: '#F5F3FF' },
                        ].map(q => `
                            <button onclick="window.switchPage('${q.page}')"
                                    style="background:#fff;border:1px solid #E2E8F0;border-radius:14px;
                                           padding:16px 20px;text-align:left;cursor:pointer;width:100%;
                                           display:flex;align-items:center;gap:14px;
                                           transition:box-shadow .15s,transform .15s;
                                           box-shadow:0 1px 3px rgba(0,0,0,.05);"
                                    onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)';this.style.transform='translateY(-2px)'"
                                    onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,.05)';this.style.transform='translateY(0)'">
                                <div style="background:${q.bg};color:${q.icon};padding:10px;border-radius:10px;flex-shrink:0;">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                    </svg>
                                </div>
                                <span style="font-size:14px;font-weight:700;color:#0F172A;">${q.label}</span>
                            </button>`).join('')}
                    </div>
                </div>
            </div>

            <style>
                @media (max-width: 768px) {
                    .dashboard-grid { grid-template-columns: 1fr !important; }
                }
            </style>`;
    }

    // ─── Registration ──────────────────────────────────────────────────────────
    window._renderDashboard = async function (businessId) {
        const activeId = businessId || getBusinessId();
        await _render(activeId);
    };

})();