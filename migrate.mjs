/**
 * One-time migration: existing PostgreSQL → Supabase
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your-service-role-key \
 *   OLD_DATABASE_URL=postgres://... \
 *   node migrate.mjs
 *
 * What it does:
 *   1. Reads users, cards, catalog_cards, bug_reports, bug_replies, announcements from the old DB
 *   2. Creates Supabase auth users (email+generated password, they'll need to use "Forgot Password" to set their own)
 *   3. Inserts profiles, cards, catalog_cards, bugs, replies, announcements into Supabase
 *
 * Run once, then delete this file.
 */

import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const OLD_DB  = process.env.OLD_DATABASE_URL;
const SB_URL  = process.env.SUPABASE_URL;
const SB_KEY  = process.env.SUPABASE_SERVICE_KEY; // service role key (not anon)

if (!OLD_DB || !SB_URL || !SB_KEY) {
  console.error('Set OLD_DATABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const old = postgres(OLD_DB, { ssl: { rejectUnauthorized: false } });
const sb = createClient(SB_URL, SB_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function chunk(arr, size, fn) {
  for (let i = 0; i < arr.length; i += size) await fn(arr.slice(i, i + size), i);
}

const toBool = (v) => v === 1 || v === true || v === '1';

async function run() {
  console.log('Reading old database…');
  const [users, cards, catalogCards, bugReports, bugReplies, announcements] = await Promise.all([
    old`SELECT * FROM users ORDER BY id`,
    old`SELECT * FROM cards ORDER BY id`,
    old`SELECT * FROM catalog_cards ORDER BY id`,
    old`SELECT * FROM bug_reports ORDER BY id`,
    old`SELECT * FROM bug_replies ORDER BY id`,
    old`SELECT * FROM announcements ORDER BY id`,
  ]);

  console.log(`Found: ${users.length} users, ${cards.length} cards, ${catalogCards.length} catalog cards, ${bugReports.length} bugs, ${bugReplies.length} replies, ${announcements.length} announcements`);

  // Map old user ID → new Supabase UUID
  const userIdMap = new Map(); // old int id → new UUID

  console.log('\nCreating Supabase auth users…');
  for (const u of users) {
    // Generate a random temp password — users will reset via "Forgot Password"
    const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: tempPassword,
      email_confirm: true, // skip email confirmation for migration
      user_metadata: {
        username:   u.username,
        first_name: u.first_name || null,
        last_name:  u.last_name  || null,
      },
    });
    if (error) {
      console.error(`  ✗ ${u.username} (${u.email}): ${error.message}`);
      continue;
    }
    userIdMap.set(u.id, data.user.id);

    // The trigger creates the profile automatically, but let's patch is_admin if needed
    if (u.is_admin) {
      await sb.from('profiles').update({ is_admin: true }).eq('id', data.user.id);
    }
    console.log(`  ✓ ${u.username} → ${data.user.id}`);
  }

  console.log('\nMigrating cards…');
  const mappedCards = cards
    .filter(c => userIdMap.has(c.user_id))
    .map(c => ({
      user_id:     userIdMap.get(c.user_id),
      owned:       toBool(c.owned),
      wishlisted:  toBool(c.wishlisted),
      card_number: c.card_number,
      set_name:    c.set_name,
      description: c.description,
      team_city:   c.team_city,
      team_name:   c.team_name,
      rookie:      toBool(c.rookie),
      auto:        toBool(c.auto),
      mem:         c.mem,
      serial:      c.serial,
      serial_of:   c.serial_of,
      thickness:   c.thickness,
      year:        c.year,
      product:     c.product,
      grade:       c.grade,
      duplicates:  c.duplicates || 0,
      created_at:  c.created_at,
      owned_at:    c.owned_at,
    }));

  await chunk(mappedCards, 500, async (batch, i) => {
    const { error } = await sb.from('cards').insert(batch);
    if (error) console.error(`  ✗ cards batch ${i}: ${error.message}`);
    else console.log(`  ✓ cards ${i}–${i + batch.length}`);
  });

  console.log('\nMigrating catalog cards…');
  const mappedCatalog = catalogCards.map(c => ({
    card_number: c.card_number, set_name: c.set_name, description: c.description,
    team_city: c.team_city, team_name: c.team_name,
    rookie: toBool(c.rookie), auto: toBool(c.auto),
    mem: c.mem, serial: c.serial, serial_of: c.serial_of,
    thickness: c.thickness, year: c.year, product: c.product, grade: c.grade,
    created_at: c.created_at,
  }));

  await chunk(mappedCatalog, 500, async (batch, i) => {
    const { error } = await sb.from('catalog_cards').insert(batch);
    if (error) console.error(`  ✗ catalog batch ${i}: ${error.message}`);
    else console.log(`  ✓ catalog ${i}–${i + batch.length}`);
  });

  // Map old bug IDs → new bug IDs (Supabase auto-assigns bigserial)
  console.log('\nMigrating bug reports…');
  const bugIdMap = new Map(); // old id → new id
  for (const b of bugReports) {
    if (!userIdMap.has(b.user_id)) continue;
    const { data, error } = await sb.from('bug_reports').insert({
      user_id: userIdMap.get(b.user_id), title: b.title,
      description: b.description, status: b.status,
      created_at: b.created_at, updated_at: b.updated_at,
    }).select('id').single();
    if (error) { console.error(`  ✗ bug ${b.id}: ${error.message}`); continue; }
    bugIdMap.set(b.id, data.id);
    console.log(`  ✓ bug ${b.id} → ${data.id}`);
  }

  console.log('\nMigrating bug replies…');
  for (const r of bugReplies) {
    if (!bugIdMap.has(r.bug_id) || !userIdMap.has(r.admin_id)) continue;
    const { error } = await sb.from('bug_replies').insert({
      bug_id: bugIdMap.get(r.bug_id), admin_id: userIdMap.get(r.admin_id),
      message: r.message, created_at: r.created_at,
    });
    if (error) console.error(`  ✗ reply ${r.id}: ${error.message}`);
  }

  console.log('\nMigrating announcements…');
  for (const a of announcements) {
    const { error } = await sb.from('announcements').insert({
      title: a.title || '', message: a.message,
      created_at: a.created_at, updated_at: a.updated_at,
    });
    if (error) console.error(`  ✗ announcement ${a.id}: ${error.message}`);
  }

  console.log('\n✅ Migration complete!');
  console.log('⚠️  All migrated users need to use "Forgot Password" to set their password.');
  console.log('   Delete this file (migrate.mjs) when done.');

  await old.end();
}

run().catch(err => { console.error(err); process.exit(1); });
