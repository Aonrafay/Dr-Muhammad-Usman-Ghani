import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const SUPABASE_URL = "https://oxrhkcihrixsgptwrnuk.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cmhrY2locml4c2dwdHdybnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI3NjkwMywiZXhwIjoyMDkyODUyOTAzfQ.6Lv8-gAOdRBIlqkB1pvBwhMFwzBHUwXIu6bWgGyr4vo";
const ADMIN_EMAIL = "aonrafay@gmail.com";

// Extract hostname from Supabase URL for PostgreSQL connection
const DB_HOST = "oxrhkcihrixsgptwrnuk.db.supabase.co";
const DB_PORT = 5432;
const DB_NAME = "postgres";

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  try {
    console.log("STEP 1: Creating admin_users table");
    
    const createTableSQL = `
      create table if not exists public.admin_users (
        id uuid primary key references auth.users(id) on delete cascade,
        email text not null unique,
        role text default 'admin',
        is_active boolean default true,
        created_at timestamptz default now()
      );
      
      alter table public.admin_users enable row level security;
      
      drop policy if exists "Anyone can view admin users" on public.admin_users;
      create policy "Anyone can view admin users"
      on public.admin_users
      for select
      using (true);
    `;

    // Execute SQL using the Supabase PostgreSQL API
    const { error: sqlError } = await adminClient.rpc("exec_sql", {
      sql: createTableSQL,
    }).catch(() => ({ error: null })); // Might not have exec_sql RPC, continue anyway

    console.log("STEP 2: Finding auth user for", ADMIN_EMAIL);
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) {
      console.error("Error listing users:", listError);
      return;
    }

    const users = usersData?.users || usersData || [];
    const adminAuthUser = users.find?.((u) => u.email === ADMIN_EMAIL);
    
    if (!adminAuthUser) {
      console.error(`Auth user ${ADMIN_EMAIL} not found`);
      console.error("Available users:", JSON.stringify(users, null, 2));
      return;
    }

    console.log(`Found auth user: ${adminAuthUser.id}`);

    console.log("\nSTEP 2: Creating/updating admin_users table entry");
    const { data, error } = await adminClient.from("admin_users").upsert(
      {
        id: adminAuthUser.id,
        email: ADMIN_EMAIL,
        role: "admin",
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Error upserting admin user:", error);
      return;
    }

    console.log("Success! Admin user record created/updated:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\nSTEP 3: Verifying admin_users table entry");
    const { data: verifyData, error: verifyError } = await adminClient
      .from("admin_users")
      .select("*")
      .eq("email", ADMIN_EMAIL)
      .single();

    if (verifyError) {
      console.error("Error verifying admin user:", verifyError);
      return;
    }

    console.log("Verified admin user entry:");
    console.log(JSON.stringify(verifyData, null, 2));
    console.log("\n✅ Admin user setup complete!");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

main();
