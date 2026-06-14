/**
 * navigation.js — HeySasa! Navigation & Bootstrap
 *
 * Responsibilities (only these):
 *   1. Auth gate on every page switch
 *   2. Fetch + cache onboarding status once → window.onboardingData
 *   3. Route 'overview' — onboarding.js or overview.js self-register;
 *      nav just calls whatever render fn is in PAGE_CONFIG.overview
 *   4. Non-overview pages: pass through if complete or WA connected,
 *      otherwise show a step-specific gate screen
 *
 * PAGE REGISTRATION CONTRACT (every page module):
 *
 *   if (typeof window.PAGE_CONFIG !== 'undefined') {
 *     window.PAGE_CONFIG.myPage = {
 *       title:       'My Page',
 *       description: 'Short description.',
 *       navId:       'nav-my-page',
 *       render:      myRenderFunction   // direct reference, not a string
 *     };
 *   }
 */

// ─── Page registry ─────────────────────────────────────────────────────────────
window.PAGE_CONFIG = {};

// ─── Internal state ────────────────────────────────────────────────────────────
let _currentPage          = null;
let _debounceTimer        = null;
let _onboardingFetched    = false;
let _onboardingRetryCount = 0;
const MAX_ONBOARDING_RETRIES = 5;

// ─── Loader (Shimmer Skeleton) ─────────────────────────────────────────────────
// Displays a non-blocking skeleton screen while content loads
function _showLoader() {
    const el = document.getElementById('content-area');
    if (!el) {
        console.warn('[Nav] _showLoader() skipped: #content-area not found.');
        return;
    }
    
    console.log('[Nav] Showing loader screen.');
    
    // Reset element classes and ensure proper state
    el.className = 'w-full h-full p-4 md:p-8 overflow-y-auto custom-scrollbar absolute inset-0 z-10 opacity-100 pointer-events-auto';
    
    el.innerHTML = `
        <style>
            @keyframes shimmer {
                0%   { background-position: -200% 0; }
                100% { background-position:  200% 0; }
            }
            .sk {
                background: linear-gradient(90deg,#F8FAFC 25%,#E2E8F0 50%,#F8FAFC 75%);
                background-size: 200% 100%;
                animation: shimmer 2s infinite linear;
                border: 1px solid #E2E8F0;
                box-shadow: 0 1px 2px rgba(0,0,0,.05);
            }
            .sk-pill {
                background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);
                background-size: 200% 100%;
                animation: shimmer 2s infinite linear;
                border-radius: 8px;
            }
        </style>
        <div style="width:100%;height:100%;display:flex;flex-direction:column;gap:24px;padding:8px;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div class="sk-pill" style="width:250px;height:36px;"></div>
                <div class="sk-pill" style="width:120px;height:36px;"></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
                <div class="sk" style="height:130px;border-radius:16px;"></div>
                <div class="sk" style="height:130px;border-radius:16px;"></div>
                <div class="sk" style="height:130px;border-radius:16px;"></div>
            </div>
            <div class="sk" style="flex:1;border-radius:16px;min-height:400px;"></div>
        </div>`;
}

// ─── Onboarding gate for non-overview pages ────────────────────────────────────
//
// Returns 'pass_through' if the page should render normally (WA connected).
// Otherwise renders a gate screen and returns undefined (caller must stop).
//
function _renderOnboardingGate(page) {
    const el = document.getElementById('content-area');
    if (!el) return undefined;

    const d = window.onboardingData || {};

    // WhatsApp connected = real data available even mid-onboarding → pass through
    if (d.whatsapp_connected) return 'pass_through';

    const configs = {
        analytics: {
            iconBg: '#EFF6FF', iconColor: '#3B82F6',
            icon: '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
            title: 'Analytics unlock after WhatsApp connects',
            desc: 'Once your WhatsApp is linked, your AI will analyse real conversation data and surface it here.',
            step: 2,
        },
        leads: {
            iconBg: '#F0FDF4', iconColor: '#22C55E',
            icon: '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            title: 'Your leads live here once WhatsApp is connected',
            desc: 'Leads are pulled from your real WhatsApp conversations. Connect first and they will appear automatically.',
            step: 2,
        },
        products: {
            iconBg: '#FFFBEB', iconColor: '#F59E0B',
            icon: '<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
            title: 'Give Sasa your product info to start selling',
            desc: 'Adding products lets your AI accurately pitch, price, and sell to customers in real-time.',
            step: 5,
        },
    };

    const cfg = configs[page] || {
        iconBg: '#F1F5F9', iconColor: '#64748B', icon: '',
        title: 'Complete setup to unlock this feature',
        desc: 'Finish your onboarding steps to access this section.',
        step: 1,
    };

    el.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'width:100%;height:100%;padding:48px;text-align:center;gap:20px;' +
        'background:#FFFFFF;border-radius:16px;box-sizing:border-box;border:1px dashed #E2E8F0;">' +
            '<div style="background:' + cfg.iconBg + ';color:' + cfg.iconColor + ';padding:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;">' +
                cfg.icon +
            '</div>' +
            '<h2 style="font-size:24px;font-weight:800;color:#0F172A;margin:0;max-width:500px;">' + cfg.title + '</h2>' +
            '<p style="font-size:15px;color:#475569;max-width:440px;line-height:1.6;margin:0 auto;">' + cfg.desc + '</p>' +
            '<div style="margin-top:8px;">' +
                '<button onclick="window.switchPage(\'overview\')" ' +
                    'style="padding:14px 32px;border-radius:12px;background:#0F172A;color:#fff;font-size:14px;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,.1);" ' +
                    'onmouseover="this.style.background=\'#1E293B\';" ' +
                    'onmouseout="this.style.background=\'#0F172A\';">' +
                    'Continue Setup &mdash; Step ' + cfg.step +
                '</button>' +
            '</div>' +
        '</div>';

    return undefined;
}

// ─── Error fallback ────────────────────────────────────────────────────────────
function _renderPageError(page, err) {
    const el = document.getElementById('content-area');
    if (!el) return;
    console.error('[Nav] Render error on "' + page + '":', err);
    el.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'width:100%;height:100%;padding:48px;text-align:center;gap:16px;box-sizing:border-box;">' +
            '<div style="background:#FEE2E2;padding:20px;border-radius:50%;">' +
                '<svg width="36" height="36" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="12" y1="8" x2="12" y2="12"/>' +
                    '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
                '</svg>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:700;color:#0F172A;margin-top:8px;">We hit a small snag</div>' +
            '<div style="font-size:15px;color:#64748B;max-width:340px;line-height:1.6;">' +
                'We could not load this right now. It might be a quick connection issue.' +
            '</div>' +
            '<button onclick="window.switchPage(\'' + page + '\')" ' +
                'style="margin-top:16px;padding:12px 28px;border-radius:10px;background:#FFFFFF;color:#0F172A;' +
                'font-size:14px;font-weight:600;border:1px solid #CBD5E1;cursor:pointer;" ' +
                'onmouseover="this.style.background=\'#F8FAFC\';" ' +
                'onmouseout="this.style.background=\'#FFFFFF\';">' +
                'Try Again' +
            '</button>' +
        '</div>';
}

// ─── Not-found fallback ────────────────────────────────────────────────────────
function _renderNotRegistered(page) {
    const el = document.getElementById('content-area');
    if (!el) return;
    console.warn('[Nav] Page "' + page + '" not registered.');
    el.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'width:100%;height:100%;padding:48px;text-align:center;gap:16px;box-sizing:border-box;">' +
            '<div style="background:#F1F5F9;padding:20px;border-radius:50%;">' +
                '<svg width="36" height="36" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
                    '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>' +
                '</svg>' +
            '</div>' +
            '<div style="font-size:22px;font-weight:700;color:#0F172A;margin-top:8px;">Coming Soon</div>' +
            '<div style="font-size:15px;color:#64748B;max-width:340px;line-height:1.6;">' +
                'We are polishing this feature. Check back shortly!' +
            '</div>' +
        '</div>';
}

// ─── Auth gate ─────────────────────────────────────────────────────────────────
function _enforceAuthentication() {
    if (!localStorage.getItem('business_id')) {
        console.warn('[Nav] No business_id — redirecting to login.');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

async function _loadOnboardingStatus() {
    if (_onboardingFetched) return true;

    const businessId = localStorage.getItem('business_id');
    const client = window.getSupabase ? window.getSupabase() : null;

    if (!businessId || !client) return false;

    try {
        const { data, error } = await client
            .from('business_onboarding')
            .select('*')
            .eq('business_id', businessId)
            .maybeSingle();

        if (error) {
            // Check for Foreign Key error (Business doesn't exist)
            if (error.code === '23503') {
                console.error('[Nav] Critical Error: Business ID in storage does not exist in database.');
                localStorage.clear(); // Clear invalid data
                window.location.href = 'login.html';
                return false;
            }
            throw error;
        }

        if (data) {
            window.onboardingData = data;
            _onboardingFetched = true;
            return true;
        } else {
            // Try to create the row, but catch errors
            console.log('[Nav] Creating fresh onboarding row for:', businessId);
            const { data: newRow, error: insertError } = await client
                .from('business_onboarding')
                .insert({ business_id: businessId, current_step: 1, onboarding_complete: false })
                .select()
                .single();

            if (insertError) {
                console.error('[Nav] Failed to create onboarding row:', insertError.message);
                _onboardingFetched = false; // Stop the loop
                return false; 
            }

            window.onboardingData = newRow;
            _onboardingFetched = true;
            return true;
        }
    } catch (err) {
        console.error('[Nav] General error loading status:', err);
        return false;
    }
}

// ─── Core switch function ──────────────────────────────────────────────────────
window.switchPage = function(page) {
    if (_debounceTimer) clearTimeout(_debounceTimer);

    _debounceTimer = setTimeout(function() {
        _runSwitch(page);
    }, 150);
};

// Separated so the async logic is properly awaited inside its own function,
// not trapped inside a setTimeout callback where await has no effect on callers.
async function _runSwitch(page) {
    if (!_enforceAuthentication()) return;

    // Block until onboarding status is in memory
    const onboardingReady = await _loadOnboardingStatus();
    if (!onboardingReady) {
        console.warn('[Nav] Onboarding status not ready; deferring page render until Supabase client becomes available.');
        if (_onboardingRetryCount <= MAX_ONBOARDING_RETRIES) {
            setTimeout(function() {
                console.log('[Nav] Retrying switchPage for', page);
                window.switchPage(page);
            }, 300);
        } else {
            _renderPageError(page, new Error('Unable to initialize Supabase client after retries.'));
        }
        return;
    }

    var businessId = localStorage.getItem('business_id');

    console.log('[Nav] switching to:', page, '| businessId:', businessId);
    console.log('[Nav] current onboardingData:', window.onboardingData);

    // ── 1. Nav highlight ──────────────────────────────────────────────────────
    document.querySelectorAll('[id^="nav-"]').forEach(function(el) {
        el.classList.remove('active');
    });

    var config = window.PAGE_CONFIG[page];
    var navId  = (config && config.navId) ? config.navId : ('nav-' + page);
    var navEl  = document.getElementById(navId);
    if (navEl) navEl.classList.add('active');

    // ── 2. Header text ────────────────────────────────────────────────────────
    var titleEl = document.getElementById('section-title');
    var descEl  = document.getElementById('section-description');
    if (titleEl) titleEl.textContent = (config && config.title) ? config.title : (page.charAt(0).toUpperCase() + page.slice(1));
    if (descEl)  descEl.textContent  = (config && config.description) ? config.description : '';

    // ── 3. Show loader ────────────────────────────────────────────────────────
    _showLoader();
    _currentPage = page;
    console.log('[Nav] Loader active for page:', page);

    // ── 4. Overview — always allowed, render fn decided by load order ─────────
    //    onboarding.js registers first; overview.js overwrites when complete.
    if (page === 'overview') {
        console.log('[Nav] Overview page selected. PAGE_CONFIG.overview:', config);
        if (!config || typeof config.render !== 'function') {
            console.error('[Nav] PAGE_CONFIG.overview missing or render fn unavailable.');
            _renderNotRegistered(page);
            return;
        }
        try {
            console.log('[Nav] Invoking overview render function.');
            await config.render(businessId);
        } catch (err) {
            _renderPageError(page, err);
        }
        return;
    }

    // ── 5. Non-overview: onboarding gate ──────────────────────────────────────
    var isComplete = window.onboardingData && window.onboardingData.onboarding_complete === true;

    if (!isComplete) {
        console.log('[Nav] Onboarding incomplete; rendering gate for page:', page);
        var gateResult = _renderOnboardingGate(page);
        if (gateResult !== 'pass_through') {
            console.log('[Nav] Gate screen displayed for page:', page, '— stopping render.');
            return; // gate rendered, stop here
        }
        console.log('[Nav] Onboarding gate passed for page:', page);
    }

    // ── 6. Registered render function ────────────────────────────────────────
    console.log('[Nav] Rendering page with registered config:', page, config);
    if (!config || typeof config.render !== 'function') {
        console.error('[Nav] Page render aborted because PAGE_CONFIG.' + page + ' is not registered or render is not a function.');
        _renderNotRegistered(page);
        return;
    }

    try {
        await config.render(businessId);
    } catch (err) {
        _renderPageError(page, err);
    }
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    if (!_enforceAuthentication()) return;

    // Fetch onboarding status eagerly so it is ready before first switchPage
    await _loadOnboardingStatus();

    // Wire sidebar nav clicks
    document.querySelectorAll('[id^="nav-"]').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.switchPage(item.id.replace('nav-', ''));
        });
    });

    console.log('[Nav] Ready.');
    window.switchPage('overview');
});