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
                    .select('whatsapp_connected, status')
                    .eq('business_id', businessId)
                    .single();

                if (data?.whatsapp_connected || data?.status === 'connected') {
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
        if (typeof window.openAddFundsModal === 'function') {
            const amountInput = document.getElementById('funds-amount');
            if (amountInput) amountInput.value = 1000;
            window.openAddFundsModal();
            showToast('Opening payment gateway...');
            
            const checkBalanceInterval = setInterval(async () => {
                const client = getSupabase();
                const { data } = await client.from('business_balances').select('balance_kes').eq('business_id', getBusinessId()).single();
                if (data && data.balance_kes >= 1000) {
                    clearInterval(checkBalanceInterval);
                    Object.assign(window.onboardingData, { credits_paid: true, balance_kes: data.balance_kes });
                    await advanceStep(2);
                    showToast('Payment confirmed!', 'success');
                }
            }, 5000);
        } else {
             // Fallback logic
             const client = getSupabase();
             await client.from('business_onboarding').update({ credits_paid: true }).eq('business_id', getBusinessId());
             Object.assign(window.onboardingData, { credits_paid: true });
             await advanceStep(2);
        }
    };

    window.openWhatsAppModal = async function () {
        if (_isConnectingWa) return; 
        _isConnectingWa = true;

        const modal = document.getElementById('wa-modal');
        const loadingZone = document.getElementById('wa-loading-zone');
        const authZone = document.getElementById('wa-auth-zone');
        const qrImg = document.getElementById('wa-qr-img');

        if (!modal || !qrImg) return;

        authZone.classList.add('hidden');
        loadingZone.classList.remove('hidden');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100', 'pointer-events-auto');

        startProgressPhrasesLoop();

        try {
            const businessId = getBusinessId();
            const websiteUrl = window.onboardingData?.website_url || "";
            
            // FIX: Corrected spelling to 'onboarding-orchestrator'
            const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-orchestrator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create_instance', businessId, websiteUrl })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error: ${errText || response.statusText}`);
            }

            const data = await response.json();
            console.log('[Onboarding] Orchestrator Response:', data);

            if (data.error) throw new Error(data.error);

            // Handle detection of existing valid connection
            const isAlreadyOpen = data.status === 'ALREADY_CONNECTED' || 
                                 data.status === 'CONNECTED' || 
                                 (data.data?.instance?.state === 'open');

            if (isAlreadyOpen) {
                showToast("WhatsApp already linked!", "success");
                window.closeWhatsAppModal();
                await advanceStep(3);
                return;
            }

            // --- THE FIX: CATCH EVERY POSSIBLE QR KEY ---
            const rawQr = data.qrcode || 
                          data.data?.qrcode || 
                          data.data?.Qrcode || 
                          data.data?.base64 || 
                          data.base64 || 
                          data.code || 
                          (data.data && data.data.qr);

            if (rawQr) {
                // Ensure the string is clean and has the proper prefix
                let cleanQr = String(rawQr).trim().replace(/["']/g, "");
                qrImg.src = cleanQr.startsWith('data:image') ? cleanQr : `data:image/png;base64,${cleanQr}`;
                
                loadingZone.classList.add('hidden');
                authZone.classList.remove('hidden');
                startBackgroundStatusPolling();
            } else {
                // If we get here, log the whole object to help debug
                console.error("Missing QR in response:", data);
                throw new Error("No QR code was generated. Please wait 10 seconds and try again.");
            }
        } catch (err) {
            console.error('[Onboarding] Orchestrator error:', err);
            _isConnectingWa = false; 
            loadingZone.innerHTML = `
                <div class="p-4 bg-red-50 rounded-xl text-center">
                    <p class="text-red-600 text-xs font-bold mb-2">${err.message}</p>
                    <button onclick="_isConnectingWa=false; openWhatsAppModal()" class="text-[10px] bg-red-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-wider">Retry Connection</button>
                </div>
            `;
        }
    };

    window.verifyAndProceed = async function() {
        const businessId = getBusinessId();
        const client = getSupabase();
        
        showToast("Verifying connection...");
        
        const { data } = await client
            .from('businesses')
            .select('whatsapp_connected, status')
            .eq('business_id', businessId)
            .single();

        if (data?.whatsapp_connected || data?.status === 'connected') {
            await advanceStep(3); // Move to Leads Activation
        } else {
            showToast("We can't see your phone yet. Please ensure the scan was successful.", "error");
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

    if (!mobileContainer.classList.contains('hidden')) {
        mobileContainer.classList.add('hidden');
        qrContainer.classList.remove('hidden');
        toggleBtn.textContent = "Are you using a mobile phone? Click here";
        return;
    }

    qrContainer.classList.add('hidden');
    mobileContainer.classList.remove('hidden');
    toggleBtn.textContent = "Switch back to QR scan code";

    const existingCode = document.getElementById('wa-pairing-code');
    if (existingCode) return;  

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
        const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-orchestrator', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pair_phone', instanceName: _instanceName, instanceToken: window._instanceToken, phoneNumber })

        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

        const code = data.pairing_code || data.code;
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

    window.getLeadPrice = function() {
        const dynamicPrice = window.onboardingData?.lead_price_kes; 
        return (typeof dynamicPrice === 'number' && dynamicPrice > 0) ? dynamicPrice : 0.75;
    };

    window.updateLeadSlider = function(val) {
        const count = parseInt(val, 10);
        document.getElementById('leads-selected-display').textContent = count;
        const pricePerLead = window.getLeadPrice();
        const cost = (count * pricePerLead).toFixed(2);
        document.getElementById('leads-cost-display').textContent = cost;
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
            const response = await fetch('https://xgtnbxdxbbywvzrttixf.supabase.co/functions/v1/onboarding-orchestrator', {
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
                    throw new Error(`Insufficient funds.`);
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

    let _botPollTimer = null;
    let _botDotsTimer = null;
    let _fallbackMessageTimer = null;

    window.startBotBuildPolling = function() {
        if (_botPollTimer) return; 
        
        const client = getSupabase();
        const businessId = getBusinessId();
        const banner = document.getElementById('bot-build-banner');
        
        if (!client || !businessId || !banner) return;

        let dots = 0;
        _botDotsTimer = setInterval(() => {
            const el = document.getElementById('bot-loading-dots');
            if (el) {
                dots = (dots + 1) % 4;
                el.textContent = '.'.repeat(dots);
            }
        }, 500);

        const fallbackMessages = ["Gathering historical data...", "Analysing profile...", "Getting the tone right...", "Training your model...", "Configuring swarm agents..."];
        let msgIdx = 0;
        _fallbackMessageTimer = setInterval(() => {
            const msgEl = document.getElementById('bot-build-message');
            if (msgEl && !msgEl.dataset.workerOverridden) {
                msgEl.textContent = fallbackMessages[msgIdx];
                msgIdx = (msgIdx + 1) % fallbackMessages.length;
            }
        }, 8000); 

        _botPollTimer = setInterval(async () => {
            try {
                const [onRes, businessRes] = await Promise.all([
                    client.from('business_onboarding').select('sync_status').eq('business_id', businessId).single(),
                    client.from('businesses').select('persona_pack_status').eq('business_id', businessId).single()
                ]);

                const syncStatus = onRes.data?.sync_status;
                const personaStatus = businessRes.data?.persona_pack_status;

                const msgEl = document.getElementById('bot-build-message');
                if (syncStatus?.message && msgEl && msgEl.textContent !== syncStatus.message) {
                    msgEl.textContent = syncStatus.message;
                    msgEl.dataset.workerOverridden = "true"; 
                }

                if (personaStatus === 'ready') {
                    clearInterval(_botPollTimer);
                    clearInterval(_botDotsTimer);
                    clearInterval(_fallbackMessageTimer);
                    const titleEl = document.getElementById('bot-build-title');
                    const emojiEl = document.getElementById('bot-build-emoji');
                    const actionBtn = document.getElementById('bot-build-action');
                    if (titleEl) titleEl.innerHTML = "Bot Build Completed Successfully!";
                    if (msgEl) msgEl.textContent = "Your AI is fully trained and ready to handle leads.";
                    if (emojiEl) { emojiEl.classList.remove('animate-pulse'); emojiEl.textContent = "✅"; }
                    if (actionBtn) actionBtn.classList.remove('hidden');
                }
                
                if (personaStatus === 'insufficient_funds' || personaStatus === 'failed') {
                    clearInterval(_botPollTimer); clearInterval(_botDotsTimer); clearInterval(_fallbackMessageTimer);
                    const titleEl = document.getElementById('bot-build-title');
                    if (titleEl) { titleEl.innerHTML = "Bot Build Paused"; titleEl.classList.replace('text-[#28A745]', 'text-red-500'); }
                    if (msgEl) msgEl.textContent = personaStatus === 'insufficient_funds' ? 'Insufficient credits. Please top up.' : 'An error occurred.';
                }
            } catch (err) {}
        }, 5000); 
    };

    window.completeFollowUps = async function () {
        showToast('Saving follow-up preferences…');
        Object.assign(window.onboardingData, { followup_configured: true });
        await advanceStep(5);
    };

    window.completeProducts = async function () {
        showToast('Finalising product catalog…');
        Object.assign(window.onboardingData, { products_seeded: true });
        await advanceStep(6); 
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    function _render() {
        const el = document.getElementById('content-area');
        const d = window.onboardingData;
        if (!el || !d) return;

        const currentStep = d.current_step || 1;
        const progressPct = Math.round(((currentStep - 1) / 5) * 100);

        el.innerHTML = `
            <div class="flex flex-col w-full max-w-3xl mx-auto pb-10">
                <div id="bot-build-banner" class="${currentStep >= 4 ? 'flex' : 'hidden'} flex-col w-full mb-8 p-4 rounded-xl border border-[#28A745]/30 bg-slate-100/80 backdrop-blur-md shadow-sm transition-all duration-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span id="bot-build-emoji" class="text-2xl animate-pulse">🤖</span>
                            <div>
                                <h4 id="bot-build-title" class="text-sm font-black text-[#28A745] uppercase tracking-wider">Building your bot<span id="bot-loading-dots">...</span></h4>
                                <p id="bot-build-message" class="text-xs font-bold text-slate-500 mt-0.5">Organising data...</p>
                            </div>
                        </div>
                        <div id="bot-build-action" class="hidden"><button onclick="window.switchPage('playground')" class="px-5 py-2.5 bg-[#28A745] text-white text-xs font-black rounded-xl shadow-lg">Try it Out! 🚀</button></div>
                    </div>
                </div>

                <div class="mb-6 text-center md:text-left">
                    <h1 class="text-3xl font-black text-[#0F172A] mb-2 tracking-tight">Let's Get You Set Up</h1>
                    <div class="mb-6 bg-slate-100 rounded-full h-2 overflow-hidden"><div class="h-2 bg-[#0F172A] transition-all duration-700" style="width:${progressPct}%"></div></div>
                </div>

                <div class="flex flex-col gap-3">
                    <div class="glass-card p-6 ${currentStep === 1 ? 'border-l-4 border-l-[#0F172A]' : 'opacity-50'}">
                        <div class="flex items-center justify-between">
                            <div><h3 class="text-xl font-black text-[#0F172A]">Step 1: Load Credits</h3><p class="text-sm font-medium text-slate-500">Minimum KES 1,000 required.</p></div>
                            <button onclick="initiatePayment()" class="${currentStep === 1 ? '' : 'hidden'} px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl shadow-lg">Add Credits</button>
                        </div>
                    </div>
                    <div class="glass-card p-6 ${currentStep === 2 ? 'border-l-4 border-l-[#0F172A]' : 'opacity-50'}">
                        <div class="flex items-center justify-between">
                            <div><h3 class="text-xl font-black text-[#0F172A]">Step 2: Connect WhatsApp</h3><p class="text-sm font-medium text-slate-500">Link your phone to train AI.</p></div>
                            <button onclick="openWhatsAppModal()" class="${currentStep === 2 ? '' : 'hidden'} px-8 py-3.5 bg-[#0F172A] text-white font-bold rounded-xl shadow-lg">Connect WhatsApp</button>
                        </div>
                    </div>
                    <div class="glass-card p-8 ${currentStep === 3 ? 'border-l-4 border-l-[#0F172A]' : 'opacity-50'}">
                        <div class="flex flex-col gap-3 w-full">
                            <div class="flex flex-col gap-1 px-1 mb-1">
                                <span class="text-xs font-bold text-slate-500 flex justify-between">Found: <span class="text-[#0F172A] font-black">${d.leads_processed || 0}</span></span>
                                <span class="text-xs font-bold text-[#28A745] flex justify-between">Balance: <span class="font-black">KES ${d.balance_kes ? parseFloat(d.balance_kes).toLocaleString() : '0.00'}</span></span>
                                <span class="text-xs font-bold text-slate-400 flex justify-between">Cost: <span class="text-[#28A745] font-black">KES <span id="leads-cost-display">0.00</span></span></span>
                            </div>
                            <input type="range" id="leads-slider" min="0" max="${d.leads_processed || 100}" value="0" oninput="updateLeadSlider(this.value)" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]">
                            <p class="text-center text-sm font-bold mt-1">Activate <span id="leads-selected-display" class="text-[#0F172A] font-black text-lg">0</span> Leads</p>
                            <div class="flex flex-col gap-2 mt-2">
                                <div class="flex gap-2"><button id="activate-leads-btn" onclick="activateSelectedLeads()" class="flex-1 px-8 py-3 bg-[#0F172A] text-white font-bold rounded-xl">Activate</button><button onclick="skipLeads()" class="px-6 py-3 bg-slate-100 border rounded-xl font-bold">Skip</button></div>
                                <button onclick="window.location.reload()" class="text-[10px] text-blue-500 font-bold hover:underline text-center">🔄 Refresh Found Count & Balance</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="wa-modal" class="fixed inset-0 z-[1100] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onclick="closeWhatsAppModal()"></div>
                <div id="wa-modal-content" class="glass-card w-full max-w-sm relative z-10 p-8 text-center bg-white">
                    <h2 class="text-2xl font-black text-[#0F172A] mb-4">Link WhatsApp</h2>
                    <div id="wa-loading-zone" class="py-6"><div class="w-8 h-8 border-4 border-t-[#28A745] rounded-full animate-spin mx-auto mb-3"></div><p id="wa-loader-text" class="text-sm font-bold text-slate-500">Initializing...</p></div>
                    <div id="wa-auth-zone" class="hidden my-4 flex flex-col items-center justify-center">
                        <div id="wa-qr-container" class="bg-slate-50 p-4 rounded-xl border mb-4"><img id="wa-qr-img" class="w-48 h-48 mx-auto mix-blend-multiply" src="" /></div>
                        <div id="wa-mobile-container" class="hidden text-left bg-slate-50 p-4 rounded-xl border mb-4"></div>
                        <button id="mobile-toggle-btn" onclick="toggleMobileView()" class="text-xs font-bold text-slate-400 underline mb-2">Are you using a mobile phone?</button>
                        <button onclick="verifyAndProceed()" class="w-full mt-4 py-3 bg-[#28A745] text-white font-black rounded-xl shadow-lg">I've Scanned It</button>
                    </div>
                    <button onclick="closeWhatsAppModal()" class="w-full mt-2 py-3.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                </div>
            </div>`;
        
        if (currentStep >= 4) setTimeout(() => window.startBotBuildPolling(), 100);
    }

    window._renderOnboarding = async function (businessId) {
        const activeId = businessId || getBusinessId();
        const client = getSupabase();
        if (!client || !activeId) return;
        try {
            const [onRes, balRes] = await Promise.all([
                client.from('business_onboarding').select('*').eq('business_id', activeId).maybeSingle(),
                client.from('business_balances').select('balance_kes').eq('business_id', activeId).maybeSingle()
            ]);
            if (onRes.data) {
                window.onboardingData = onRes.data;
                window.onboardingData.balance_kes = balRes.data?.balance_kes || 0.00;
                _render();
            }
        } catch (err) { console.error('[Onboarding] Fetch error:', err); }
    };
})();