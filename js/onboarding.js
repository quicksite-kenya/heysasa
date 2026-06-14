/**
 * onboarding.js — HeySasa! New-User Setup Wizard
 *
 * Registers as PAGE_CONFIG.overview ONLY when onboarding_complete is false.
 * If onboarding_complete is already true when this module loads,
 * it skips registration entirely — dashboard-overview.js owns the slot.
 *
 * State lives in window.onboardingData (populated by nav.js on boot).
 * This module UPDATES that object in-place and writes through to Supabase;
 * it never re-fetches from scratch.
 *
 * Onboarding steps:
 * 1. Load Credits (credits_paid)
 * 2. Connect WhatsApp + auto-train AI (whatsapp_connected)
 * 3. Process Leads (leads_processed)
 * 4. Configure Follow-ups (followup_configured)
 * 5. Add Products (products_seeded)
 * → current_step = 6 + onboarding_complete = true → hand off to dashboard-overview.js
 */

(function () {
    'use strict';

    // ─── Helpers ───────────────────────────────────────────────────────────────
    function getBusinessId() {
        return localStorage.getItem('business_id');
    }

    function getSupabase() {
        return window.getSupabase?.();
    }

    // ─── Supabase write helper ─────────────────────────────────────────────────
    async function _persistUpdate(fields) {
        console.log('[Onboarding] Persisting update fields:', fields);
        const client = getSupabase();
        const businessId = getBusinessId();
        if (!client || !businessId) {
            console.warn('[Onboarding] Persist update skipped; missing client or business ID.', { businessId, client: !!client });
            return;
        }

        const { data, error } = await client
            .from('business_onboarding')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('business_id', businessId);

        if (error) {
            console.error('[Onboarding] Persist update failed:', error, 'fields:', fields, 'businessId:', businessId);
        } else {
            console.log('[Onboarding] Persist update succeeded:', data);
        }
    }

    // ─── Advance to next step ──────────────────────────────────────────────────
    async function advanceStep(newStep) {
        if (!window.onboardingData) {
            console.warn('[Onboarding] advanceStep() called without onboardingData.');
            return;
        }

        console.log('[Onboarding] advanceStep ->', newStep, 'current onboardingData:', window.onboardingData);
        const fields = { current_step: newStep };

        // Step 6 = all done
        if (newStep > 5) {
            fields.onboarding_complete = true;
            console.log('[Onboarding] Completing onboarding and handing off to dashboard.');

            // Write through
            await _persistUpdate(fields);

            // Update in-memory state
            Object.assign(window.onboardingData, fields);

            // Hand off: re-render overview — overviewRouter.js will now
            // delegate to the dashboard render function since onboarding_complete is true
            window.switchPage('overview');
            return;
        }

        await _persistUpdate(fields);
        Object.assign(window.onboardingData, fields);
        _render();
    }

    // ─── Toast ─────────────────────────────────────────────────────────────────
    function showToast(message, type = 'success') {
        let toast = document.getElementById('hs-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'hs-toast';
            toast.style.cssText = `
                position:fixed;bottom:24px;right:24px;padding:14px 22px;border-radius:12px;
                font-size:14px;font-weight:600;color:#fff;
                box-shadow:0 8px 24px rgba(0,0,0,.15);
                transform:translateY(80px);opacity:0;
                transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .3s;
                z-index:9999;
            `;
            document.body.appendChild(toast);
        }
        toast.style.background = type === 'error' ? '#EF4444' : '#0F172A';
        toast.textContent = message;
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity   = '1';
        });
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.transform = 'translateY(80px)';
            toast.style.opacity   = '0';
        }, 4000);
    }

    // ─── WA Poll & Orchestrator Progress ───────────────────────────────────────
    let _waPollTimer = null;
    let _progressTextInterval = null;

    function startProgressPhrasesLoop() {
        const phrases = [
            "Analyzing business profile...",
            "Organizing internal databases...",
            "Assembling system catalog...",
            "Learning business information rules...",
            "Training AI swarm agents...",
            "Polishing operational workflows..."
        ];
        let index = 0;
        if (_progressTextInterval) clearInterval(_progressTextInterval);
        _progressTextInterval = setInterval(() => {
            index = (index + 1) % phrases.length;
            const textEl = document.getElementById('wa-loader-text');
            if (textEl) textEl.textContent = phrases[index];
        }, 4500);
    }

    function startBackgroundStatusPolling() {
        if (_waPollTimer) clearInterval(_waPollTimer);
        const client = getSupabase();
        const businessId = getBusinessId();

        _waPollTimer = setInterval(async () => {
            try {
                // We poll the main 'businesses' table since that's where the webhook saves connection status
                const { data } = await client
                    .from('businesses')
                    .select('whatsapp_connected')
                    .eq('business_id', businessId)
                    .single();

                if (data?.whatsapp_connected) {
                    clearInterval(_waPollTimer);
                    if (_progressTextInterval) clearInterval(_progressTextInterval);

                    const textEl = document.getElementById('wa-loader-text');
                    if (textEl) textEl.textContent = "WhatsApp Linked Successfully!";

                    // Update local state and advance
                    Object.assign(window.onboardingData, { whatsapp_connected: true });
                    
                    setTimeout(async () => {
                        window.closeWhatsAppModal?.();
                        showToast('WhatsApp Connected!');
                        await advanceStep(3);
                    }, 1500);
                }
            } catch (err) {
                console.error('[Onboarding] Poll error:', err);
            }
        }, 4000);
    }

let _isConnectingWa = false;
let _instanceName   = null; 

    // ─── Step actions (exposed globally so inline onclick can reach them) ──────
    window.initiatePayment = async function () {
        showToast('Initiating payment…');
        // TODO: replace mock with real payment integration
        const client = getSupabase();
        if (client) {
            await client.from('business_onboarding')
                .update({ credits_paid: true })
                .eq('business_id', getBusinessId());
        }
        Object.assign(window.onboardingData, { credits_paid: true });
        showToast('Payment confirmed!');
        await advanceStep(2);
    };

    window.openWhatsAppModal = async function () {
        if (_isConnectingWa) return; // Prevent double clicks
        _isConnectingWa = true;

        const modal   = document.getElementById('wa-modal');
        const content = document.getElementById('wa-modal-content');
        const loadingZone = document.getElementById('wa-loading-zone');
        const authZone = document.getElementById('wa-auth-zone');
        const qrImg   = document.getElementById('wa-qr-img');

        if (!modal) return;

        // Reset UI state cleanly
        authZone.classList.add('hidden');
        loadingZone.classList.remove('hidden');
        loadingZone.innerHTML = `
            <div class="w-8 h-8 border-4 border-slate-200 border-t-[#28A745] rounded-full animate-spin mx-auto mb-3"></div>
            <p id="wa-loader-text" class="text-sm font-bold text-slate-500 animate-pulse">Initializing...</p>
        `;

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');
        setTimeout(() => {
            content?.classList.remove('scale-95', 'translate-y-4', 'opacity-0');
            content?.classList.add('scale-100', 'translate-y-0', 'opacity-100');
        }, 10);

        startProgressPhrasesLoop();

        try {
            const businessId = getBusinessId();
            const websiteUrl = window.onboardingData?.website_url || "";
            const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-ochestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_instance', businessId, websiteUrl })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

           if (data?.qrcode) {
    _instanceName = data.instance_name;
    window._instanceToken = data.instance_token;  // ← add this
    loadingZone.classList.add('hidden');
    authZone.classList.remove('hidden');
    const qr = data.qrcode;
    qrImg.src = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
    startBackgroundStatusPolling();
            } else {
                throw new Error("No QR code returned from server.");
            }
        } catch (err) {
            console.error('[Onboarding] Orchestrator error:', err);
            if (_progressTextInterval) clearInterval(_progressTextInterval);
            
            // Unlock so they can try again
            _isConnectingWa = false; 

            // Clearly break the loading UI and show the exact error
            loadingZone.innerHTML = `
                <div class="p-4 bg-red-50 rounded-xl border border-red-100">
                    <svg class="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-xs font-bold text-red-700 mb-2">Connection Failed</p>
                    <p class="text-xs text-red-600 font-medium">${err.message}</p>
                </div>
            `;
        }
    };

    window.closeWhatsAppModal = function () {
    _isConnectingWa = false;
    _instanceName   = null;
    window._instanceToken = null; // Always reset lock on close
        const modal   = document.getElementById('wa-modal');
        const content = document.getElementById('wa-modal-content');
        
        if (_waPollTimer) clearInterval(_waPollTimer);
        if (_progressTextInterval) clearInterval(_progressTextInterval);
        
        content?.classList.remove('scale-100', 'translate-y-0', 'opacity-100');
        content?.classList.add('scale-95', 'translate-y-4', 'opacity-0');
        setTimeout(() => {
            modal?.classList.remove('opacity-100', 'pointer-events-auto');
            modal?.classList.add('opacity-0', 'pointer-events-none');
        }, 200);
    };

    window.toggleMobileView = async function () {
    const qrContainer     = document.getElementById('wa-qr-container');
    const mobileContainer = document.getElementById('wa-mobile-container');
    const toggleBtn       = document.getElementById('mobile-toggle-btn');

    // ── Switch back to QR ──
    if (!mobileContainer.classList.contains('hidden')) {
        mobileContainer.classList.add('hidden');
        qrContainer.classList.remove('hidden');
        toggleBtn.textContent = "Are you using a mobile phone? Click here";
        return;
    }

    // ── Switch to phone pairing ──
    qrContainer.classList.add('hidden');
    mobileContainer.classList.remove('hidden');
    toggleBtn.textContent = "Switch back to QR scan code";

    // Show phone input if pairing code not yet fetched
    const existingCode = document.getElementById('wa-pairing-code');
    if (existingCode) return;  // already fetched, don't re-fetch

    mobileContainer.innerHTML = `
        <p class="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-3">Enter your WhatsApp number</p>
        <div class="flex gap-2 mb-3">
            <input id="wa-phone-input" type="tel" placeholder="+254 7XX XXX XXX"
                   class="flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border border-slate-200 
                          bg-white focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"/>
            <button onclick="requestPairingCode()"
                    class="px-4 py-2.5 bg-[#0F172A] text-white text-sm font-bold rounded-xl 
                           hover:bg-slate-800 transition-all whitespace-nowrap">
                Get Code
            </button>
        </div>
        <p class="text-[10px] text-slate-400 font-medium">Include country code e.g. +254712345678</p>
    `;
};

window.requestPairingCode = async function () {
    const input = document.getElementById('wa-phone-input');
    const phoneNumber = input?.value?.trim();
    if (!phoneNumber) { showToast('Enter your phone number first', 'error'); return; }
    if (!_instanceName) { showToast('Session expired. Please close and retry.', 'error'); return; }

    const btn = document.querySelector('[onclick="requestPairingCode()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Requesting...'; }

    try {
        const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-ochestrator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pair_phone', instanceName: _instanceName, instanceToken: window._instanceToken, phoneNumber })

        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

        const code = data.pairing_code;
        const container = document.getElementById('wa-mobile-container');
        container.innerHTML = `
            <p class="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-3">Your Pairing Code</p>
            <div id="wa-pairing-code" 
                 class="text-3xl font-black text-[#0F172A] tracking-[0.3em] text-center py-4 
                        bg-slate-50 rounded-xl border border-slate-200 mb-4 font-mono">
                ${code}
            </div>
            <ol class="list-decimal list-inside text-xs text-slate-600 space-y-1.5 font-medium leading-relaxed">
                <li>Open <b>WhatsApp</b> on your phone</li>
                <li>Tap <b>Linked Devices → Link with phone number</b></li>
                <li>Enter the code above</li>
            </ol>
        `;
        // Polling is already running from QR phase — no need to restart
    } catch (err) {
        showToast(err.message || 'Failed to get pairing code', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Get Code'; }
    }
};

    window.processLeads = async function (autoSync) {
        if (autoSync) {
            showToast('Syncing historical leads…');
            getSupabase()?.functions.invoke('process-leads', {
                body: { businessId: getBusinessId(), autoSync: true }
            });
        } else {
            showToast('Skipping auto-sync. You can trigger it manually later.');
        }
        Object.assign(window.onboardingData, { leads_processed: 999 });
        await advanceStep(4);
    };

    // ─── Dynamic Pricing Helper ─────────────────────────────────────────────────
    window.getLeadPrice = function() {
        // Draw from the database/onboarding data if available, fallback to 0.75
        const dynamicPrice = window.onboardingData?.lead_price_kes; 
        return (typeof dynamicPrice === 'number' && dynamicPrice > 0) ? dynamicPrice : 0.75;
    };

    window.updateLeadSlider = function(val) {
        const count = parseInt(val, 10);
        document.getElementById('leads-selected-display').textContent = count;
        
        // Calculate cost using the dynamic price
        const pricePerLead = window.getLeadPrice();
        const cost = (count * pricePerLead).toFixed(2);
        
        document.getElementById('leads-cost-display').textContent = cost;
        
        // Disable button if 0
        const btn = document.getElementById('activate-leads-btn');
        if (btn) {
            btn.disabled = count === 0;
        }
    };

    window.activateSelectedLeads = async function() {
        const slider = document.getElementById('leads-slider');
        const count = parseInt(slider.value, 10);
        
        if (count < 1) return;

        const btn = document.getElementById('activate-leads-btn');
        btn.disabled = true;
        btn.textContent = 'Activating...';
        showToast(`Activating ${count} leads...`);

        try {
            const businessId = getBusinessId();
            const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-ochestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'activate_leads', 
                    businessId: businessId,
                    count: count 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 402 || data.error === 'insufficient_funds') {
                    throw new Error(`Insufficient funds. You need KES ${data.required_kes?.toFixed(2) || 'more credits'}.`);
                }
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            showToast(`Successfully activated ${count} leads!`, 'success');
            Object.assign(window.onboardingData, { leads_processed: count });
            await advanceStep(4);

        } catch (err) {
            console.error('[Onboarding] Lead activation failed:', err);
            showToast(err.message || 'Failed to activate leads.', 'error');
            btn.disabled = false;
            btn.textContent = 'Activate';
        }
    };

    window.skipLeads = async function() {
        showToast('Skipping lead activation for now.');
        Object.assign(window.onboardingData, { leads_processed: 0 });
        await advanceStep(4);
    };

    // ─── Bot Build Background Polling ───────────────────────────────────────────
    let _botPollTimer = null;
    let _botDotsTimer = null;
    let _fallbackMessageTimer = null;

    window.startBotBuildPolling = function() {
        if (_botPollTimer) return; // already polling
        
        const client = getSupabase();
        const businessId = getBusinessId();
        const banner = document.getElementById('bot-build-banner');
        
        if (!client || !businessId || !banner) return;

        // 1. Animate the dots
        let dots = 0;
        _botDotsTimer = setInterval(() => {
            const el = document.getElementById('bot-loading-dots');
            if (el) {
                dots = (dots + 1) % 4;
                el.textContent = '.'.repeat(dots);
            }
        }, 500);

        // 2. Slow fallback messages in case worker is silent
        const fallbackMessages = [
            "Gathering historical data...",
            "Analysing your business profile...",
            "Getting the tone right...",
            "Training your model...",
            "Configuring swarm agents..."
        ];
        let msgIdx = 0;
        _fallbackMessageTimer = setInterval(() => {
            const msgEl = document.getElementById('bot-build-message');
            // Only use fallback if we haven't received a fresh specific message from the worker recently
            if (msgEl && !msgEl.dataset.workerOverridden) {
                msgEl.textContent = fallbackMessages[msgIdx];
                msgIdx = (msgIdx + 1) % fallbackMessages.length;
            }
        }, 8000); // 8 seconds per message (nice and slow)

        // 3. Poll Supabase for actual status
        _botPollTimer = setInterval(async () => {
            try {
                // Check both onboarding status and main business persona status
                const [onboardingRes, businessRes] = await Promise.all([
                    client.from('business_onboarding').select('sync_status').eq('business_id', businessId).single(),
                    client.from('businesses').select('persona_pack_status').eq('business_id', businessId).single()
                ]);

                const syncStatus = onboardingRes.data?.sync_status;
                const personaStatus = businessRes.data?.persona_pack_status;

                // Update text if worker provides a message
                const msgEl = document.getElementById('bot-build-message');
                if (syncStatus?.message && msgEl && msgEl.textContent !== syncStatus.message) {
                    msgEl.textContent = syncStatus.message;
                    msgEl.dataset.workerOverridden = "true"; 
                }

                // Check for completion
                if (personaStatus === 'ready') {
                    clearInterval(_botPollTimer);
                    clearInterval(_botDotsTimer);
                    clearInterval(_fallbackMessageTimer);

                    // Update UI to success state
                    const titleEl = document.getElementById('bot-build-title');
                    const emojiEl = document.getElementById('bot-build-emoji');
                    const actionBtn = document.getElementById('bot-build-action');

                    if (titleEl) titleEl.innerHTML = "Bot Build Completed Successfully!";
                    if (msgEl) msgEl.textContent = "Your AI is fully trained and ready to handle leads.";
                    if (emojiEl) {
                        emojiEl.classList.remove('animate-pulse');
                        emojiEl.textContent = "✅";
                    }
                    if (actionBtn) actionBtn.classList.remove('hidden');
                }
                
                // Handle failure/insufficient funds state
                if (personaStatus === 'insufficient_funds' || personaStatus === 'failed') {
                    clearInterval(_botPollTimer);
                    clearInterval(_botDotsTimer);
                    clearInterval(_fallbackMessageTimer);
                    
                    const titleEl = document.getElementById('bot-build-title');
                    if (titleEl) {
                        titleEl.innerHTML = "Bot Build Paused";
                        titleEl.classList.replace('text-[#28A745]', 'text-red-500');
                    }
                    if (msgEl) msgEl.textContent = personaStatus === 'insufficient_funds' ? 'Insufficient credits. Please top up to finish building.' : 'An error occurred. We will retry automatically.';
                    banner.classList.replace('border-[#28A745]/30', 'border-red-500/30');
                }

            } catch (err) {
                console.error('[BotPolling] Error checking status:', err);
            }
        }, 5000); // Poll every 5 seconds
    };

    window.completeFollowUps = async function () {
        showToast('Saving follow-up preferences…');
        Object.assign(window.onboardingData, { followup_configured: true });
        await advanceStep(5);
    };

    window.completeProducts = async function () {
        showToast('Finalising product catalog…');
        Object.assign(window.onboardingData, { products_seeded: true });
        await advanceStep(6); // triggers handoff to dashboard
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    function _render() {
        console.log('[Onboarding] Rendering onboarding UI. onboardingData:', window.onboardingData);
        const el = document.getElementById('content-area');
        if (!el) {
            console.error('[Onboarding] Rendering aborted: #content-area not found.');
            return;
        }
        if (!window.onboardingData) {
            console.error('[Onboarding] Rendering aborted: onboardingData missing.');
            return;
        }

        // Set proper classes for full-height content with scrolling and transitions
        el.className = 'absolute inset-0 z-10 p-4 md:p-8 overflow-y-auto custom-scrollbar flex items-start justify-center opacity-100 pointer-events-auto transition-opacity duration-700';

        const d = window.onboardingData;
        const currentStep = d.current_step || 1;

        // Safety: if somehow onboarding_complete got set, hand off
        if (d.onboarding_complete) {
            window.switchPage('overview');
            return;
        }

        const steps = [
            {
                id: 1, isDone: !!d.credits_paid,
                title: 'Load Credits',
                desc:  'Add KES 1,000 minimum to unlock high-value AI systems.',
                icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
                action: `<button onclick="initiatePayment()" class="w-full md:w-auto px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap">Add Credits</button>`,
            },
            {
                id: 2, isDone: !!d.whatsapp_connected,
                title: 'Connect WhatsApp & Train AI',
                desc:  'Link your WhatsApp. Your chat history automatically trains your AI.',
                icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
                action: `<button onclick="openWhatsAppModal()" class="w-full md:w-auto px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap">Connect WhatsApp</button>`,
            },
            {
                id: 3, isDone: (currentStep > 3),
                title: 'Process All Leads',
                desc:  'Select how many historical leads to activate for your AI to follow up with.',
                icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
                action: `
                    <div class="flex flex-col gap-3 w-full md:w-[300px]">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-xs font-bold text-slate-500">Total Found: <span id="leads-found-count" class="text-[#0F172A] font-black">${d.leads_processed || 0}</span></span>
                            <span class="text-xs font-bold text-[#28A745]">Cost: KES <span id="leads-cost-display">0.00</span></span>
                        </div>
                        <input type="range" id="leads-slider" min="0" max="${d.leads_processed || 100}" value="0" 
                               oninput="updateLeadSlider(this.value)"
                               class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]">
                        <p class="text-center text-sm font-bold text-slate-700 mt-1">Activate <span id="leads-selected-display" class="text-[#0F172A] font-black text-lg">0</span> Leads</p>
                        
                        <div class="flex gap-2 mt-2">
                            <button id="activate-leads-btn" onclick="activateSelectedLeads()" class="flex-1 px-8 py-3 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">Activate</button>
                            <button onclick="skipLeads()" class="px-6 py-3 bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Skip</button>
                        </div>
                    </div>`,
            },
            {
                id: 4, isDone: !!d.followup_configured,
                title: 'Configure Follow-ups',
                desc:  'Tell your AI how to handle automated follow-ups. It does the heavy lifting.',
                icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
                action: `<button onclick="completeFollowUps()" class="w-full md:w-auto px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap">Set Preferences</button>`,
            },
            {
                id: 5, isDone: !!d.products_seeded,
                title: 'Add Your Products',
                desc:  'Seed your product catalog so your AI can accurately pitch and sell.',
                icon:  `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
                action: `<button onclick="completeProducts()" class="w-full md:w-auto px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg whitespace-nowrap">Process &amp; Add</button>`,
            },
        ];

        let stepsHTML = '';
        steps.forEach(step => {
            const isActive    = step.id === currentStep;
            const isCompleted = step.isDone || step.id < currentStep;
            const isLocked    = step.id > currentStep && !step.isDone;

            if (isActive) {
                stepsHTML += `
                    <div class="glass-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center
                                justify-between gap-6 shadow-xl border-l-4 border-l-[#0F172A] bg-white
                                transform transition-all duration-500">
                        <div class="flex items-start gap-4 flex-1">
                            <div class="w-12 h-12 bg-[#0F172A] text-white rounded-xl flex items-center
                                        justify-center shrink-0 shadow-lg shadow-slate-900/20">
                                ${step.icon}
                            </div>
                            <div>
                                <h3 class="text-xl font-black text-[#0F172A] mb-1">
                                    Step ${step.id}: ${step.title}
                                </h3>
                                <p class="text-sm font-medium text-slate-500 max-w-lg">${step.desc}</p>
                            </div>
                        </div>
                        <div class="w-full md:w-auto">${step.action}</div>
                    </div>`;
            } else if (isCompleted) {
                stepsHTML += `
                    <div class="p-4 flex items-center gap-4 opacity-50 transform scale-95 transition-all duration-500">
                        <div class="w-8 h-8 bg-[#28A745] text-white rounded-full flex items-center justify-center shrink-0">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        </div>
                        <h3 class="text-sm font-bold text-slate-500 line-through">Step ${step.id}: ${step.title}</h3>
                    </div>`;
            } else if (isLocked) {
                stepsHTML += `
                    <div class="p-4 flex items-center gap-4 opacity-40 transform scale-95 grayscale transition-all duration-500">
                        <div class="w-8 h-8 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center font-bold text-xs">
                            ${step.id}
                        </div>
                        <h3 class="text-sm font-bold text-slate-400">Step ${step.id}: ${step.title}</h3>
                    </div>`;
            }
        });

        // Progress bar
        const progressPct = Math.round(((currentStep - 1) / 5) * 100);

        el.innerHTML = `
            <div class="flex flex-col w-full max-w-3xl mx-auto pb-10">
                
                <div id="bot-build-banner" class="${currentStep >= 4 ? 'flex' : 'hidden'} flex-col w-full mb-8 p-4 rounded-xl border border-[#28A745]/30 bg-slate-100/80 backdrop-blur-md shadow-sm transition-all duration-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span id="bot-build-emoji" class="text-2xl animate-pulse">🤖</span>
                            <div>
                                <h4 id="bot-build-title" class="text-sm font-black text-[#28A745] uppercase tracking-wider">
                                    Building your AI bot<span id="bot-loading-dots">...</span>
                                </h4>
                                <p id="bot-build-message" class="text-xs font-bold text-slate-500 mt-0.5">Organising data and preparing systems...</p>
                            </div>
                        </div>
                        <div id="bot-build-action" class="hidden">
                            <button onclick="window.switchPage('playground')" class="px-5 py-2.5 bg-[#28A745] text-white text-xs font-black rounded-xl shadow-lg shadow-[#28A745]/20 hover:bg-[#218838] hover:scale-105 transition-all">
                                Try it Out! 🚀
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mb-6 text-center md:text-left">
                    <h1 class="text-3xl font-black text-[#0F172A] mb-2 tracking-tight">Let's Get You Set Up</h1>
                    <p class="text-sm text-slate-500 font-medium">Complete this quick checklist (&lt; 5 mins) to launch your AI.</p>
                </div>

                <div class="mb-6 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div class="h-2 rounded-full bg-[#0F172A] transition-all duration-700"
                         style="width:${progressPct}%"></div>
                </div>
                <p class="text-xs text-slate-400 font-bold mb-8 text-right -mt-4">${currentStep - 1} of 5 complete</p>

                <div class="flex flex-col gap-3">
                    ${stepsHTML}
                </div>
            </div>

            <div id="wa-modal"
                 class="fixed inset-0 z-[110] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onclick="closeWhatsAppModal()"></div>
                <div id="wa-modal-content"
                     class="glass-card w-full max-w-sm relative z-10 p-8 shadow-2xl border border-white/80
                            transform scale-95 translate-y-4 opacity-0 transition-all duration-300 ease-out text-center">

                    <div class="w-12 h-12 bg-[#28A745]/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg class="w-6 h-6 text-[#28A745]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                        </svg>
                    </div>

                    <h2 class="text-2xl font-black text-[#0F172A] mb-2 tracking-tight">Link WhatsApp</h2>
                    
                    <div id="wa-loading-zone" class="py-6">
                        <div class="w-8 h-8 border-4 border-slate-200 border-t-[#28A745] rounded-full animate-spin mx-auto mb-3"></div>
                        <p id="wa-loader-text" class="text-sm font-bold text-slate-500 animate-pulse">Initializing...</p>
                    </div>

                    <div id="wa-auth-zone" class="hidden my-4 flex flex-col items-center justify-center">
                        <p class="text-xs text-slate-500 mb-4 font-medium">
                            Point your phone camera toward this code screen to pair instantly.
                        </p>
                        
                        <div id="wa-qr-container" class="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                            <img id="wa-qr-img" class="w-48 h-48 mx-auto mix-blend-multiply" src="" alt="WhatsApp QR Code"/>
                        </div>

                        <div id="wa-mobile-container" class="hidden text-left bg-[#0F172A]/5 border border-[#0F172A]/10 p-4 rounded-xl w-full mb-4">
                            <p class="text-[10px] font-bold text-[#0F172A] uppercase tracking-wider mb-2">Mobile Instructions</p>
                            <ol class="list-decimal list-inside text-xs text-slate-600 space-y-2 font-medium leading-relaxed">
                                <li>Open <b>WhatsApp</b></li>
                                <li>Tap <b>Linked Devices</b></li>
                                <li>Select <b>Link with phone number</b></li>
                                <li>Enter the pairing code shown above</li>
                            </ol>
                        </div>

                        <button id="mobile-toggle-btn" onclick="toggleMobileView()" class="text-xs font-bold text-slate-400 hover:text-[#28A745] underline cursor-pointer mb-2">
                            Are you using a mobile phone? Click here
                        </button>
                    </div>

                    <button onclick="closeWhatsAppModal()"
                            class="w-full mt-2 py-3.5 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800
                                   rounded-xl transition-all border border-transparent">
                        Cancel
                    </button>
                </div>
            </div>`;

        // Kick off the bot status polling if we are past the lead activation step
        if (currentStep >= 4) {
            // Slight delay to ensure DOM is fully painted
            setTimeout(() => window.startBotBuildPolling(), 100);
        }
    }

    // ─── Expose render function ───────────────────────────────────────────────
    // overviewRouter.js will call this when onboarding is incomplete
    window._renderOnboarding = async function (businessId) {
        const activeId = businessId || getBusinessId();
        console.log('[Onboarding] _renderOnboarding called. businessId:', businessId, 'activeId:', activeId, 'onboardingDataLoaded:', !!window.onboardingData);

        // If onboardingData is already loaded (nav.js fetched it), render immediately
        if (window.onboardingData) {
            _render();
            return;
        }

        // Fallback: fetch ourselves if nav.js hasn't populated yet
        let client = getSupabase();
        if (!client && typeof window.waitForSupabase === 'function') {
            console.warn('[Onboarding] Supabase client not ready; waiting briefly for CDN init.');
            client = await window.waitForSupabase(2000, 100);
        }

        if (!client || !activeId) {
            console.error('[Onboarding] No Supabase client or business ID.', {
                hasClient: !!client,
                businessId: activeId,
                diagnostics: window.supabaseInitDiagnostics,
            });
            return;
        }

        try {
            let { data, error } = await client
                .from('business_onboarding')
                .select('*')
                .eq('business_id', activeId)
                .maybeSingle();

            if (error) {
                console.error('[Onboarding] Fallback fetch returned error:', error);
            }

            if (!data && !error) {
                console.log('[Onboarding] No onboarding row found in fallback fetch; creating new row for', activeId);
                const { data: newRow, error: insertError } = await client
                    .from('business_onboarding')
                    .insert({ business_id: activeId, current_step: 1, onboarding_complete: false })
                    .select()
                    .single();

                if (insertError) {
                    console.error('[Onboarding] Fallback insert returned error:', insertError);
                }
                data = newRow;
            }

            if (data) {
                window.onboardingData = data;
                _render();
            } else {
                console.warn('[Onboarding] Fallback fetch returned no data for', activeId, 'diagnostics:', window.supabaseInitDiagnostics);
            }
        } catch (err) {
            console.error('[Onboarding] Fetch error:', err, 'diagnostics:', window.supabaseInitDiagnostics);
            throw err; // let nav.js show the error state
        }
    };
})();