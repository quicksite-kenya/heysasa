// =========================================================================
// 1. GLOBAL CONTEXT DECLARATIONS (TOP LAYER)
// =========================================================================

/**
 * Universally retrieves the active business identifier.
 * Standardized to 'business_id' to match login and onboarding logic.
 */
window.getActiveBusinessId = () => {
    const id = localStorage.getItem('business_id');
    if (!id) {
        console.warn("[Context Warning] No business_id found in storage.");
    }
    return id;
};

/**
 * SECURE VERIFICATION: Checks Supabase session and links the user to their business row.
 * Handles the logic for Dashboard redirection.
 */
window.verifyBusinessLink = async () => {
    const supabase = window.getSupabase ? window.getSupabase() : window.supabase;
    
    if (!supabase) {
        console.error("[Verify] Supabase client not found.");
        return { status: 'ERROR', message: 'Client not initialized' };
    }

    // 1. Check for an active Supabase Auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return { status: 'NO_SESSION' };
    }

    // 2. Fetch the business record linked to this user's UID
    // Note: This assumes your 'businesses' table has a 'user_id' column
    const { data: business, error: dbError } = await supabase
        .from('businesses')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

    if (dbError) {
        console.error("[Verify] Database fetch error:", dbError.message);
        return { status: 'ERROR', message: dbError.message };
    }

    // 3. Return results for the dashboard router
    if (business && business.business_id) {
        localStorage.setItem('business_id', business.business_id);
        return { status: 'SUCCESS', id: business.business_id };
    } else {
        // User is logged in, but has no business row (needs onboarding)
        return { status: 'NO_BUSINESS' };
    }
};

// =========================================================================
// 2. CENTRALIZED API WRAPPER (METHODS LAYER)
// =========================================================================
window.supabaseAPI = {
    db: {
        /**
         * Fetches a single row by its standard database UUID column 'id'
         */
        fetchOne: async (tableName, id) => {
            const client = window.getSupabase();
            if (!client) {
                return { success: false, error: new Error("Supabase client not initialized") };
            }

            try {
                const { data, error } = await client
                    .from(tableName)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return { success: true, data: data };
            } catch (err) {
                console.error(`Error fetching from ${tableName} by UUID:`, err);
                return { success: false, error: err };
            }
        },

        /**
         * Fetches a single row by matching the short 8-character string 'business_id' column
         */
        fetchOneByShortId: async (tableName, shortId) => {
            const client = window.getSupabase();
            if (!client) {
                return { success: false, error: new Error("Supabase client not initialized") };
            }

            try {
                const { data, error } = await client
                    .from(tableName)
                    .select('*')
                    .eq('business_id', shortId)
                    .maybeSingle();

                if (error) throw error;
                return { success: true, data: data };
            } catch (err) {
                console.error(`Error fetching from ${tableName} by short ID:`, err);
                return { success: false, error: err };
            }
        }
    }
};