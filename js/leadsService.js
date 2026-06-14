// ─────────────────────────────────────────────────────────────────────────────
// leadsService.js  —  HeySasa Dashboard · Leads Data Service  (v2)
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED FROM v1
// ─────────────────────────────────────────────────────────────────────────────
// v1 was missing all the v4 fields that leads.js now displays:
//   read_receipt, last_seen_online, sent_voice_note, sent_media,
//   sent_reaction, intent_score, competitor_mentions, objection_tags,
//   pre_purchase_questions, vibe_check, next_action_plan, psychology,
//   customer_intent, conv_stage
//
// All these are now written by enrichment-worker.js and read here.
//
// VIEWS USED
// ─────────────────────────────────────────────────────────────────────────────
// v_lead_summary — primary view, joins contacts + conversations + ad_attributions.
//   Must include all columns listed in the SELECT below.
//   If your view doesn't include a column, the field will silently default.
// ─────────────────────────────────────────────────────────────────────────────

window.leadsService = {

    // ── Priority tabs ─────────────────────────────────────────────────────────
    // These are the high-priority lists that the leads.js UI tabs show.
    // Each tab has its own filter + sort logic.
    PRIORITY_TABS: {

        // Hot leads: high intent, haven't been followed up urgently
        hot: {
            label:       '🔥 Hot',
            description: 'High intent — need action now',
            filter:      lead => lead.intent_score >= 70 && lead.lead_state !== 'won' && lead.lead_state !== 'lost',
            sort:        (a, b) => (b.intent_score || 0) - (a.intent_score || 0)
        },

        // Unread: leads with messages waiting for reply
        unread: {
            label:       '📬 Unread',
            description: 'Waiting for your reply',
            filter:      lead => (lead.unread_count || 0) > 0,
            sort:        (a, b) => new Date(b.last_seen) - new Date(a.last_seen)
        },

        // Stalled: leads that went cold and need a follow-up push
        stalled: {
            label:       '⏰ Stalled',
            description: 'Gone quiet — rescue now',
            filter:      lead => lead.lead_state === 'stalled' || lead.lead_state === 'ghosted',
            sort:        (a, b) => (a.intent_score || 0) - (b.intent_score || 0)  // lowest intent first (most at risk)
        },

        // Needs approval: follow-up drafts waiting for business owner to send
        approval: {
            label:       '✍️ Approval',
            description: 'Follow-up messages ready to send',
            filter:      lead => lead.followup?.pending_approval === true,
            sort:        (a, b) => new Date(a.followup?.next_due || 0) - new Date(b.followup?.next_due || 0)
        },

        // Ad leads: leads that came from paid ads (business ROI tracking)
        ad_leads: {
            label:       '📣 Ad leads',
            description: 'Leads from paid campaigns',
            filter:      lead => lead.is_ad_lead === true,
            sort:        (a, b) => (b.intent_score || 0) - (a.intent_score || 0)
        }
    },

    // ── Main fetch ────────────────────────────────────────────────────────────
    async fetchLiveLeads(businessId) {
        businessId = businessId || window.currentBusinessId || localStorage.getItem('business_id');
        const client = window.getSupabase ? window.getSupabase() : window.supabase;
        if (!client) {
            console.error('[Leads v2] Supabase client not initialized.');
            return null;
        }
        if (!businessId) {
            console.error('[Leads v2] fetchLiveLeads missing businessId.');
            return null;
        }

        try {
            // Fetch from the lead summary view — includes all enrichment fields
            const { data: leads, error } = await client
                .from('v_lead_summary')
                .select(`
                    id,
                    name,
                    phone,
                    lead_state,
                    lead_type,
                    lead_quality,
                    is_ad_lead,
                    ad_id,
                    ad_platform,
                    ad_headline,
                    ad_body,
                    ad_thumbnail_url,
                    original_ad_id,
                    unread_count,
                    last_seen,
                    context_summary,
                    customer_intent,
                    psychology,
                    conv_stage,
                    follow_up_count,
                    product_interests,
                    cart_state,
                    trust_markers,
                    vibe_check,
                    next_action_plan,
                    product_sold,
                    deal_value,
                    purchase_date,
                    do_not_contact,
                    follow_up_opted_in,
                    follow_up_opted_in_at,
                    follow_up_opted_out_at,
                    consent_message_sent_at,
                    is_business_chat,
                    social_id,
                    read_receipt,
                    last_seen_online,
                    sent_voice_note,
                    sent_media,
                    sent_reaction,
                    intent_score,
                    competitor_mentions,
                    objection_tags,
                    pre_purchase_questions,
                    nlp_enriched_at,
                    structural_enriched_at,
                    followup_status,
                    followup_current_step,
                    followup_sent_steps,
                    followup_pending_approval,
                    followup_draft,
                    followup_next_due
                `)
                .eq('business_id', businessId)
                .order('intent_score', { ascending: false, nullsLast: true });

            if (error) throw error;

            return leads.map(lead => this._mapLead(lead));

        } catch (e) {
            console.error('[Leads v2] fetchLiveLeads failed:', e.message);
            return null;
        }
    },

    // ── Lead mapper — database row → UI shape ─────────────────────────────────
    _mapLead(lead) {
        return {
            id:               lead.id,
            name:             lead.name             || 'Unknown',
            phone:            lead.phone            || '',
            lead_state:       lead.lead_state       || 'new',
            lead_type:        lead.lead_type        || 'unknown',
            lead_quality:     lead.lead_quality     || 'warm',
            is_ad_lead:       !!lead.is_ad_lead,
            ad_id:            lead.ad_id            || null,
            ad_platform:      lead.ad_platform      || null,
            ad_headline:      lead.ad_headline      || null,
            ad_body:          lead.ad_body          || null,
            ad_thumbnail_url: lead.ad_thumbnail_url || null,
            original_ad_id:   lead.original_ad_id  || null,
            unread_count:     lead.unread_count     || 0,
            last_seen:        lead.last_seen        || new Date().toISOString(),
            context_summary:  lead.context_summary  || '',
            customer_intent:  lead.customer_intent  || '',
            psychology:       lead.psychology       || '',
            conv_stage:       lead.conv_stage       || 'New Lead',
            follow_up_count:  lead.follow_up_count  || 0,
            product_interests: Array.isArray(lead.product_interests) ? lead.product_interests : [],
            cart_state:       Array.isArray(lead.cart_state)    ? lead.cart_state    : [],
            trust_markers:    Array.isArray(lead.trust_markers) ? lead.trust_markers : [],
            vibe_check:       lead.vibe_check       || null,
            next_action_plan: lead.next_action_plan || null,
            product_sold:     lead.product_sold     || null,
            deal_value:       lead.deal_value       || null,
            purchase_date:    lead.purchase_date    || null,
            is_business_chat: lead.is_business_chat !== false,

            // ── v4 enrichment fields ─────────────────────────────────────
            // Written by enrichment-worker.js — may be null until first pass
            read_receipt:           lead.read_receipt       || 'sent',
            last_seen_online:       lead.last_seen_online   || null,
            sent_voice_note:        !!lead.sent_voice_note,
            sent_media:             !!lead.sent_media,
            sent_reaction:          !!lead.sent_reaction,
            intent_score:           lead.intent_score       ?? null,
            competitor_mentions:    Array.isArray(lead.competitor_mentions)    ? lead.competitor_mentions    : [],
            objection_tags:         Array.isArray(lead.objection_tags)         ? lead.objection_tags         : [],
            pre_purchase_questions: Array.isArray(lead.pre_purchase_questions) ? lead.pre_purchase_questions : [],

            // ── Follow-up state (flattened from v_lead_summary join) ─────
            followup: lead.followup_status ? {
                status:           lead.followup_status,
                current_step:     lead.followup_current_step  || 0,
                sent_steps:       Array.isArray(lead.followup_sent_steps) ? lead.followup_sent_steps : [],
                pending_approval: !!lead.followup_pending_approval,
                draft:            lead.followup_draft   || null,
                next_due:         lead.followup_next_due || null
            } : {
                status:           'not_enrolled',
                current_step:     0,
                sent_steps:       [],
                pending_approval: false,
                draft:            null,
                next_due:         null
            },

            // Transcript lazy-loaded separately via fetchChatTranscript()
            transcript: []
        };
    },

    // ── Priority tab counts ───────────────────────────────────────────────────
    // Returns badge counts for all tabs without re-fetching leads.
    // Pass in the leadsData array that was already fetched.
    getPriorityTabCounts(leads) {
        const counts = {};
        for (const [tabId, tab] of Object.entries(this.PRIORITY_TABS)) {
            counts[tabId] = leads.filter(tab.filter).length;
        }
        return counts;
    },

    // ── Priority tab leads ────────────────────────────────────────────────────
    // Returns filtered + sorted leads for a given tab ID.
    getPriorityTabLeads(leads, tabId) {
        const tab = this.PRIORITY_TABS[tabId];
        if (!tab) return leads;
        return [...leads].filter(tab.filter).sort(tab.sort);
    },

    // ── Lazy chat transcript ──────────────────────────────────────────────────
    async fetchChatTranscript(leadId) {
        const client = window.getSupabase ? window.getSupabase() : window.supabase;
        if (!client) return [];

        try {
            const { data: messages, error } = await client
                .from('messages')
                .select('direction, role, type, content, created_at')
                .eq('contact_id', leadId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;

            return messages.map(m => {
                const isFromLead = m.direction === 'in';
                const isAI       = m.role === 'ai';
                const sender     = isFromLead ? 'Lead' : (isAI ? 'AI' : 'User');

                const text  = m.content?.text || '';
                const type  = m.type || m.content?.type || 'text';
                const media = type !== 'text' ? ` [${type}]` : '';

                return {
                    sender,
                    msg:  (text || type) + media,
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            });

        } catch (e) {
            console.error('[Leads v2] fetchChatTranscript failed:', e.message);
            return [];
        }
    },

    // ── Approve follow-up draft ───────────────────────────────────────────────
    // Called when the business owner approves a pending follow-up message.
    async approveFollowUpDraft(leadId, draft) {
        const client = window.getSupabase ? window.getSupabase() : window.supabase;
        if (!client) return { ok: false };

        try {
            const { error } = await client
                .from('follow_up_queue')
                .update({
                    status:           'approved',
                    approved_at:      new Date().toISOString(),
                    approved_message: draft
                })
                .eq('contact_id', leadId)
                .eq('status', 'pending_approval')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            return { ok: true };

        } catch (e) {
            console.error('[Leads v2] approveFollowUpDraft failed:', e.message);
            return { ok: false, error: e.message };
        }
    },

    // ── Update lead state ─────────────────────────────────────────────────────
    async updateLeadState(leadId, newState) {
        const client = window.getSupabase ? window.getSupabase() : window.supabase;
        if (!client) return { ok: false };

        const validStates = ['new','engaged','warm','stalled','ghosted','won','lost','do_not_contact'];
        if (!validStates.includes(newState)) return { ok: false, error: 'invalid state' };

        try {
            const { error } = await client
                .from('contacts')
                .update({ lead_state: newState, updated_at: new Date().toISOString() })
                .eq('id', leadId);

            if (error) throw error;
            return { ok: true };

        } catch (e) {
            console.error('[Leads v2] updateLeadState failed:', e.message);
            return { ok: false, error: e.message };
        }
    }
};