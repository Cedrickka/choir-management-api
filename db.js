'use strict';

const { createClient } = require('@supabase/supabase-js');

let client;

/**
 * Hostinger-compatible Supabase HTTP client.
 *
 * Prisma remains the source of truth for relational data and migrations via
 * DATABASE_URL. This client is available for future Supabase services such as
 * Storage and must not be used to bypass tenant guards or business services.
 */
function getSupabaseClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and a Supabase key must be configured before using the Supabase client.',
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

module.exports = { getSupabaseClient };
