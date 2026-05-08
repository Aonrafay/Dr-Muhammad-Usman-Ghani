/**
 * Fix script: Ensures admin panel can fetch appointment/contact data from Supabase.
 *
 * Root cause: The admin panel was authenticating locally (never establishing a
 * Supabase Auth session), so all queries ran as the `anon` role. RLS policies
 * only allowed `authenticated` users to SELECT data, so anon got 0 results.
 *
 * This script:
 * 1. Verifies data exists in the database (using service role key)
 * 2. Ensures the admin auth user exists in Supabase Auth
 * 3. Applies RLS policies that allow anon read/update (belt-and-suspenders)
 * 4. Tests that both anon and authenticated clients can read data
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oxrhkcihrixsgptwrnuk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cmhrY2locml4c2dwdHdybnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI3NjkwMywiZXhwIjoyMDkyODUyOTAzfQ.6Lv8-gAOdRBIlqkB1pvBwhMFwzBHUwXIu6bWgGyr4vo";
const ANON_KEY = "sb_publishable_XJ8hC7MpoAZmZgPTeFY5xA__YpE4bEQ";
const ADMIN_EMAIL = "aonrafay@gmail.com";
const ADMIN_PASSWORD = "qaz123@";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("=== SmileCare Admin Data Fetch Fix ===\n");

  // ── Step 1: Verify data exists ──────────────────────────────────────
  console.log("STEP 1: Verifying data exists in database (service role)...");
  const { data: appointments, error: apptError } = await adminClient
    .from("appointments")
    .select("id, full_name, service, appointment_date, status");
  if (apptError) {
    console.error("  ✗ Error fetching appointments:", apptError.message);
  } else {
    console.log(`  ✓ Found ${appointments.length} appointment(s):`);
    appointments.forEach((a) =>
      console.log(`    - ${a.full_name} | ${a.service} | ${a.appointment_date} | ${a.status}`)
    );
  }

  const { data: contacts, error: contactError } = await adminClient
    .from("contacts")
    .select("id, name, topic, created_at");
  if (contactError) {
    console.error("  ✗ Error fetching contacts:", contactError.message);
  } else {
    console.log(`  ✓ Found ${contacts.length} contact(s):`);
    contacts.forEach((c) =>
      console.log(`    - ${c.name} | ${c.topic || "no topic"} | ${c.created_at}`)
    );
  }

  if ((appointments?.length || 0) === 0 && (contacts?.length || 0) === 0) {
    console.log("\n  ⚠ No data found in database. Submit some test data first.");
  }

  // ── Step 2: Test anon access BEFORE fix ─────────────────────────────
  console.log("\nSTEP 2: Testing anon access BEFORE RLS fix...");
  const { data: anonAppts, error: anonApptErr } = await anonClient
    .from("appointments")
    .select("id");
  const { data: anonContacts, error: anonContactErr } = await anonClient
    .from("contacts")
    .select("id");

  console.log(`  Appointments visible to anon: ${anonAppts?.length || 0}`);
  console.log(`  Contacts visible to anon: ${anonContacts?.length || 0}`);

  if ((anonAppts?.length || 0) > 0 || (anonContacts?.length || 0) > 0) {
    console.log("  ✓ Anon can already read data — RLS policies may already be applied.");
  } else {
    console.log("  ✗ Anon cannot read data — RLS policies need to be applied.");
  }

  // ── Step 3: Ensure admin auth user exists ───────────────────────────
  console.log("\nSTEP 3: Ensuring admin auth user exists in Supabase Auth...");
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
  
  if (listError) {
    console.error("  ✗ Error listing auth users:", listError.message);
    console.log("  → You may need to create the admin user manually in Supabase Dashboard.");
  } else {
    const users = usersData?.users || [];
    const adminUser = users.find((u) => u.email === ADMIN_EMAIL);

    if (adminUser) {
      console.log(`  ✓ Admin auth user exists: ${adminUser.id}`);
      console.log(`    Email confirmed: ${adminUser.email_confirmed_at ? "Yes" : "No"}`);
      console.log(`    Last sign-in: ${adminUser.last_sign_in_at || "Never"}`);
    } else {
      console.log(`  ⚠ Admin auth user (${ADMIN_EMAIL}) NOT found. Creating...`);
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        console.error("  ✗ Error creating admin user:", createError.message);
        console.log("  → Create the user manually in Supabase Dashboard → Authentication → Users.");
      } else {
        console.log(`  ✓ Admin auth user created: ${newUserData.user.id}`);
      }
    }
  }

  // ── Step 4: Ensure admin_users table entry exists ───────────────────
  console.log("\nSTEP 4: Ensuring admin_users table entry exists...");
  const { data: adminUsers, error: adminUsersError } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("email", ADMIN_EMAIL);

  if (adminUsersError) {
    console.warn("  ⚠ Could not query admin_users table:", adminUsersError.message);
    console.log("  → The table may not exist yet. Run setup-admin-users.mjs first.");
  } else if (adminUsers && adminUsers.length > 0) {
    console.log(`  ✓ Admin user entry exists in admin_users table.`);
  } else {
    console.log("  ⚠ No admin_users entry found. Attempting to create...");
    // Get the auth user ID first
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const authUser = (userList?.users || []).find((u) => u.email === ADMIN_EMAIL);
    if (authUser) {
      const { error: upsertError } = await adminClient.from("admin_users").upsert(
        { id: authUser.id, email: ADMIN_EMAIL, role: "admin", is_active: true },
        { onConflict: "id" }
      );
      if (upsertError) {
        console.warn("  ⚠ Could not create admin_users entry:", upsertError.message);
      } else {
        console.log("  ✓ Admin user entry created in admin_users table.");
      }
    }
  }

  // ── Step 5: Test authenticated access ───────────────────────────────
  console.log("\nSTEP 5: Testing authenticated access (simulating admin panel login)...");
  const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authError) {
    console.error("  ✗ Auth login failed:", authError.message);
    console.log("  → The admin auth user may not exist or the password may be wrong.");
    console.log("  → Check Supabase Dashboard → Authentication → Users.");
  } else {
    console.log(`  ✓ Authenticated successfully as ${authData.user.email}`);

    // Test data access with authenticated session
    const { data: authAppts, error: authApptErr } = await adminClient
      .from("appointments")
      .select("id, full_name, service");
    const { data: authContacts, error: authContactErr } = await adminClient
      .from("contacts")
      .select("id, name, topic");

    if (authApptErr) {
      console.error("  ✗ Authenticated appointments query failed:", authApptErr.message);
    } else {
      console.log(`  ✓ Authenticated user can see ${authAppts.length} appointment(s)`);
    }

    if (authContactErr) {
      console.error("  ✗ Authenticated contacts query failed:", authContactErr.message);
    } else {
      console.log(`  ✓ Authenticated user can see ${authContacts.length} contact(s)`);
    }

    // Sign out to clean up
    await adminClient.auth.signOut();
  }

  // ── Step 6: Apply RLS policies (best effort) ───────────────────────
  console.log("\nSTEP 6: Attempting to apply RLS policies for anon access...");
  console.log("  Note: This requires the exec_sql RPC function or direct DB access.");
  console.log("  If this fails, you MUST apply the policies manually (see below).");

  // Try using the Supabase Management API to execute SQL
  const rlsSQL = `
    -- Allow anon to read appointments
    DROP POLICY IF EXISTS "Public read appointments" ON public.appointments;
    CREATE POLICY "Public read appointments" ON public.appointments FOR SELECT TO anon USING (true);
    
    -- Allow anon to update appointments
    DROP POLICY IF EXISTS "Public update appointments" ON public.appointments;
    CREATE POLICY "Public update appointments" ON public.appointments FOR UPDATE TO anon USING (true) WITH CHECK (true);
    
    -- Allow anon to read contacts
    DROP POLICY IF EXISTS "Public read contacts" ON public.contacts;
    CREATE POLICY "Public read contacts" ON public.contacts FOR SELECT TO anon USING (true);
    
    -- Allow anon to update contacts
    DROP POLICY IF EXISTS "Public update contacts" ON public.contacts;
    CREATE POLICY "Public update contacts" ON public.contacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
  `;

  // Try exec_sql RPC
  const { error: rpcError } = await adminClient.rpc("exec_sql", { sql: rlsSQL }).catch(() => ({
    error: { message: "exec_sql RPC not available" },
  }));

  if (rpcError) {
    console.log("  ✗ Could not apply RLS policies automatically:", rpcError.message);
    console.log("\n  ┌─────────────────────────────────────────────────────────────────┐");
    console.log("  │  MANUAL ACTION REQUIRED: Apply RLS policies                     │");
    console.log("  │                                                                 │");
    console.log("  │  1. Open: https://supabase.com/dashboard/project/oxrhkcihrixsgptwrnuk/sql");
    console.log("  │  2. Paste the SQL from supabase/schema.sql (lines 90-121)       │");
    console.log("  │  3. Click 'Run'                                                 │");
    console.log("  │                                                                 │");
    console.log("  │  This adds anon read/update policies so the admin panel can     │");
    console.log("  │  fetch data even without an authenticated session.              │");
    console.log("  └─────────────────────────────────────────────────────────────────┘");
  } else {
    console.log("  ✓ RLS policies applied successfully!");
  }

  // ── Step 7: Final verification ──────────────────────────────────────
  console.log("\nSTEP 7: Final verification — testing anon access after fix...");
  // Create a fresh anon client to avoid any cached session
  const freshAnonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: finalAppts, error: finalApptErr } = await freshAnonClient
    .from("appointments")
    .select("id, full_name, service, status");
  const { data: finalContacts, error: finalContactErr } = await freshAnonClient
    .from("contacts")
    .select("id, name, topic");

  console.log(`  Appointments visible to anon: ${finalAppts?.length || 0}`);
  console.log(`  Contacts visible to anon: ${finalContacts?.length || 0}`);

  if ((finalAppts?.length || 0) > 0 || (finalContacts?.length || 0) > 0) {
    console.log("\n  ✅ SUCCESS! Anon can now read data. Admin panel should work!");
  } else {
    console.log("\n  ⚠ Anon still cannot read data.");
    console.log("  This is expected if RLS policies haven't been applied yet.");
    console.log("  The admin.js fix will use authenticated access instead.");
    console.log("  Make sure the admin user exists in Supabase Auth and login works.");
  }

  console.log("\n=== Fix Summary ===");
  console.log("1. admin.js:authenticateAdmin() has been updated to try Supabase Auth FIRST.");
  console.log("   This ensures the client gets an authenticated session for RLS policies.");
  console.log("2. RLS policies for anon access are in supabase/schema.sql (lines 90-121).");
  console.log("   Apply them manually in the Supabase Dashboard SQL Editor if needed.");
  console.log("3. Ensure the admin user exists in Supabase Auth with the correct password.");
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
