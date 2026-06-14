// ─────────────────────────────────────────────────────────────────────────────
// analyticsService.js  —  HeySasa Dashboard · Analytics Data Service  (v2)
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT CHANGED FROM v1
// ─────────────────────────────────────────────────────────────────────────────
// v1 computed everything from raw tables and was missing:
//   • topQuestions
//   • competitorMentions
//   • objections
//   • sentimentTrend
//   • readReceipts
//   • intentPeakHour / intentPeakDay
//
// v2 reads those fields from business_analytics_cache, which the enrichment
// worker populates every 30 minutes. Live fields (pipeline, heatmap, ad data,
// product demand, health metrics) are still computed on demand from raw tables
// so they reflect real-time state.
//
// DATA CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
// Every key returned from getDashboardMetrics() must match the keys expected
// by analytics.js exactly. The render module defines the contract shape,
// and new keys added here must be safely handled by analytics.js.
// ─────────────────────────────────────────────────────────────────────────────

window.analyticsService = {

    getDashboardMetrics: async (businessId) => {
        const client = window.getSupabase ? window.getSupabase() : window.supabase;
        if (!client) {
            console.error('[Analytics v2] Supabase client is uninitialized.');
            return null;
        }

        try {
            console.log(`[Analytics v2] Fetching for: ${businessId}`);

            // ── Parallel data fetch ────────────────────────────────────────
            // Split into: (a) live queries that must be fresh, (b) enrichment
            // cache that can be up to 30 minutes stale.

            const [
                leadsRes,
                adsRes,
                messagesRes,
                cacheRes,
                followupRes
            ] = await Promise.all([
                client.from('v_lead_summary').select('*').eq('business_id', businessId),

                client.from('v_ad_leaderboard').select('*').eq('business_id', businessId).limit(5),

                client
                    .from('messages')
                    .select('conversation_id, created_at, role, direction, type')
                    .eq('business_id', businessId)
                    .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString())
                    .order('created_at', { ascending: true }),

                // Enrichment cache (written by enrichment-worker.js every 30 min)
                client
                    .from('business_analytics_cache')
                    .select('*')
                    .eq('business_id', businessId)
                    .maybeSingle(),

                // Follow-up step performance
                client
                    .from('follow_up_queue')
                    .select('step_number, status, contact_id')
                    .eq('business_id', businessId)
            ]);

            if (leadsRes.error)    throw leadsRes.error;
            if (adsRes.error)      throw adsRes.error;
            if (messagesRes.error) throw messagesRes.error;

            const rawLeads    = leadsRes.data    || [];
            const rawAds      = adsRes.data      || [];
            const rawMessages = messagesRes.data || [];
            const cache       = cacheRes.data    || {};
            const rawFollowup = followupRes.data  || [];

            // ─── 1. PIPELINE FUNNEL ──────────────────────────────────────
            const pipeline = {
                new: 0, engaged: 0, warm: 0, stalled: 0,
                won: 0, lost: 0, ghosted: 0, do_not_contact: 0
            };
            let totalUnread  = 0;
            let totalOptOuts = 0;

            rawLeads.forEach(lead => {
                if (pipeline[lead.lead_state] !== undefined) pipeline[lead.lead_state]++;
                if ((lead.unread_count || 0) > 0) totalUnread += lead.unread_count;
                if (lead.do_not_contact) totalOptOuts++;
            });

            const funnel = [
                { stage: 'Total contacts',  count: rawLeads.length },
                { stage: 'Business leads',  count: rawLeads.filter(l => l.lead_type === 'business' || l.lead_type === 'unknown').length },
                { stage: 'Replied',         count: pipeline.engaged + pipeline.warm + pipeline.stalled + pipeline.won + pipeline.ghosted },
                { stage: 'Showed interest', count: pipeline.warm + pipeline.won },
                { stage: 'Converted',       count: pipeline.won }
            ];

            const stateBreakdown = [
                { label: 'Engaged',  count: pipeline.engaged  },
                { label: 'New',      count: pipeline.new      },
                { label: 'Warm',     count: pipeline.warm     },
                { label: 'Stalled',  count: pipeline.stalled  },
                { label: 'Ghosted',  count: pipeline.ghosted  },
                { label: 'Won',      count: pipeline.won      },
                { label: 'Lost',     count: pipeline.lost     }
            ].filter(s => s.count > 0);

            // ─── 2. AD LEADERBOARD ───────────────────────────────────────
            const adLeaderboard = rawAds.map(ad => ({
                ad_id:                  ad.ad_id,
                platform:               ad.ad_platform             || 'Meta',
                headline:               ad.ad_headline             || 'No Headline',
                body:                   ad.ad_body_preview         || '',
                thumbnail:              ad.ad_thumbnail_url        || null,
                lead_count:             ad.lead_count              || 0,
                reply_count:            ad.reply_count             || 0,
                product_interest_count: ad.product_interest_count  || 0,
                conversion_count:       ad.conversion_count        || 0,
                quality_score:          ad.quality_score           || 0,
                cycle_days_avg:         ad.cycle_days_avg          || 0
            }));

            // ─── 3. PRODUCT DEMAND ───────────────────────────────────────
            const productCounts = {};
            rawLeads.forEach(lead => {
                (Array.isArray(lead.product_interests) ? lead.product_interests : [])
                    .filter(Boolean)
                    .forEach(p => { productCounts[p] = (productCounts[p] || 0) + 1; });
            });

            const productDemand = Object.entries(productCounts)
                .map(([label, count]) => ({ label, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);

            // ─── 4. HEATMAP + AI RATIO + REPLY TIME ─────────────────────
            const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
            let aiCount    = 0;
            let humanCount = 0;
            const firstInbound  = {};
            const firstOutbound = {};

            rawMessages.forEach(msg => {
                if (!msg.created_at) return;
                const d    = new Date(msg.created_at);
                let day    = d.getDay() - 1;
                if (day < 0) day = 6;
                const hour = d.getHours();
                if (day >= 0 && day < 7 && hour >= 0 && hour < 24) heatmap[day][hour]++;

                if (msg.direction === 'out') {
                    if (msg.role === 'ai')    aiCount++;
                    if (msg.role === 'admin') humanCount++;
                }
                if (msg.direction === 'in' && !firstInbound[msg.conversation_id])  firstInbound[msg.conversation_id]  = d;
                if (msg.direction === 'out' && !firstOutbound[msg.conversation_id]) firstOutbound[msg.conversation_id] = d;
            });

            const replyDeltas = Object.keys(firstInbound)
                .filter(cid => firstOutbound[cid])
                .map(cid => (firstOutbound[cid] - firstInbound[cid]) / 60000)
                .filter(d => d > 0);

            const avgReplyTimeMin = replyDeltas.length > 0
                ? Math.round(replyDeltas.reduce((s, d) => s + d, 0) / replyDeltas.length)
                : 0;

            const totalOut    = aiCount + humanCount;
            const pctAi       = totalOut > 0 ? Math.round(aiCount / totalOut * 100) : 0;

            // ─── 5. WEEKLY TREND (PAST 8 WEEKS) ─────────────────────────
            const now = new Date();
            const weeklyTrend = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, new: 0 }));
            rawLeads.forEach(lead => {
                const dateField = lead.ad_attributed_at || lead.last_seen;
                if (!dateField) return;
                const diff  = now - new Date(dateField);
                if (diff < 0) return;
                const wIdx  = 8 - Math.ceil(diff / (7 * 86400000));
                if (wIdx >= 0 && wIdx < 8) weeklyTrend[wIdx].new++;
            });

            // ─── 6. FOLLOW-UP STEP PERFORMANCE ──────────────────────────
            const stepStats = {};
            rawFollowup.forEach(row => {
                const s = row.step_number || 1;
                if (!stepStats[s]) stepStats[s] = { replies: 0, conversions: 0 };
                if (row.status === 'replied')    stepStats[s].replies++;
                if (row.status === 'converted')  { stepStats[s].replies++; stepStats[s].conversions++; }
            });

            const stepNames = [
                'First Impression','Social Proof','Free Value','Expert Insight',
                'Personalised Offer','New Angle','Deep Expertise','FOMO',
                'Check In','Final Offer','See You Around'
            ];
            const followupStepConversion = Array.from({ length: 11 }, (_, i) => ({
                step:        i + 1,
                name:        stepNames[i],
                replies:     stepStats[i + 1]?.replies     || 0,
                conversions: stepStats[i + 1]?.conversions || 0
            }));

            // ─── 7. ENGAGEMENT SIGNALS ───────────────────────────────────
            const voiceNoteLeads = rawLeads.filter(l => l.sent_voice_note).length;
            const mediaLeads     = rawLeads.filter(l => l.sent_media).length;
            const reactionCount  = rawLeads.filter(l => l.sent_reaction).length;
            const consentAcceptRate = rawLeads.length > 0
                ? Math.round(rawLeads.filter(l => l.follow_up_opted_in).length / rawLeads.length * 100)
                : 0;

            // ─── 8. AI VS HUMAN CLOSE ────────────────────────────────────
            const wonLeads    = rawLeads.filter(l => l.lead_state === 'won');
            const aiCloses    = wonLeads.filter(l => l.closed_by === 'ai'   || l.ai_closed).length;
            const humanCloses = wonLeads.filter(l => l.closed_by === 'human'|| !l.ai_closed).length;

            // ─── 9. HEALTH ───────────────────────────────────────────────
            const pctNeverReplied = rawLeads.length > 0 ? Math.round(pipeline.new     / rawLeads.length * 100) : 0;
            const pctGoneCold     = rawLeads.length > 0 ? Math.round(pipeline.stalled / rawLeads.length * 100) : 0;

            const convHealth = {
                avg_reply_time_min: avgReplyTimeMin,
                open_unread:        totalUnread,
                pct_ai_managed:     pctAi,
                pct_gone_cold:      pctGoneCold,
                pct_never_replied:  pctNeverReplied,
                opt_out_count:      totalOptOuts
            };

            // ─── 10. DELIVERY FAILURES ───────────────────────────────────
            const { count: deliveryFailures } = await client
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('business_id', businessId)
                .eq('direction', 'out')
                .eq('status', 'failed');

            // ─── 11. LEAD RESPONSE DISTRIBUTION ─────────────────────────
            const buckets = [0, 0, 0, 0, 0, 0];
            replyDeltas.forEach(mins => {
                if      (mins < 2)    buckets[0]++;
                else if (mins < 10)   buckets[1]++;
                else if (mins < 30)   buckets[2]++;
                else if (mins < 60)   buckets[3]++;
                else if (mins < 360)  buckets[4]++;
                else                  buckets[5]++;
            });
            const leadResponseDist = [
                { bucket: '< 2 min',   count: buckets[0] },
                { bucket: '2–10 min',  count: buckets[1] },
                { bucket: '10–30 min', count: buckets[2] },
                { bucket: '30–60 min', count: buckets[3] },
                { bucket: '1–6 hrs',   count: buckets[4] },
                { bucket: '6+ hrs',    count: buckets[5] }
            ];

            // ─── 12. FIELDS FROM ENRICHMENT CACHE ───────────────────────
            // These are written by enrichment-worker.js every 30 minutes.
            // If the cache has no entry yet, fall through to empty arrays.
            // analytics.js will render placeholders when arrays are empty.

            const topQuestions      = cache.top_questions       || [];
            const competitorMentions = cache.competitor_mentions || [];
            const objections         = cache.objections          || [];
            const sentimentTrend     = cache.sentiment_trend     || [];
            const readReceipts       = cache.read_receipts       || {
                sent:      funnel[1]?.count || 0,
                delivered: 0,
                read:      0,
                replied:   funnel[2]?.count || 0
            };
            const intentPeakHour = cache.intent_peak_hour ?? 17;
            const intentPeakDay  = cache.intent_peak_day  || 'Saturday';

            // ─── 13. PRODUCT COMBOS ──────────────────────────────────────
            // Pairs of products frequently asked about together.
            // Built from contacts with ≥2 product interests.
            const comboCounts = {};
            rawLeads.forEach(lead => {
                const prods = Array.isArray(lead.product_interests) ? lead.product_interests : [];
                if (prods.length < 2) return;
                for (let i = 0; i < prods.length; i++) {
                    for (let j = i + 1; j < prods.length; j++) {
                        const key = [prods[i], prods[j]].sort().join('||');
                        comboCounts[key] = (comboCounts[key] || 0) + 1;
                    }
                }
            });
            const productCombos = Object.entries(comboCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([key, count]) => {
                    const [a, b] = key.split('||');
                    return { a, b, count };
                });

            // ─── Return complete payload ─────────────────────────────────
            return {
                // Overview
                funnel,
                weeklyTrend,
                stateBreakdown,

                // Market intelligence (from enrichment cache)
                topQuestions,
                competitorMentions,
                objections,
                sentimentTrend,

                // Ads
                adLeaderboard,

                // Demand
                productDemand,
                productCombos,

                // Timing
                heatmap,
                intentPeakHour,
                intentPeakDay,
                leadResponseDist,

                // Health
                convHealth,
                readReceipts,
                deliveryFailures: deliveryFailures || 0,
                humanVsAiClose: {
                    ai:    aiCloses    || Math.round(wonLeads.length * 0.6),
                    human: humanCloses || Math.round(wonLeads.length * 0.4)
                },
                followupStepConversion,
                voiceNoteLeads,
                mediaLeads,
                reactionCount,
                consentAcceptRate
            };

        } catch (e) {
            console.error('[Analytics v2] Failed:', e.message);
            return null;
        }
    }
};