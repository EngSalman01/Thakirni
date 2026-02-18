import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log("[v0] Creating test reviewer user...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "test_reviewer@thakirni.com",
      password: "TestReviewer123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Test Reviewer",
        role: "reviewer",
      },
    });

    if (error) {
      console.error("[v0] Error creating user:", error.message);
      process.exit(1);
    }

    console.log("[v0] User created successfully!");
    console.log("[v0] User ID:", data.user?.id);
    console.log("[v0] Email:", data.user?.email);
    console.log("\n=== TEST USER CREDENTIALS ===");
    console.log("Email: test_reviewer@thakirni.com");
    console.log("Password: TestReviewer123!");
    console.log("=============================\n");

    process.exit(0);
  } catch (error) {
    console.error("[v0] Unexpected error:", error);
    process.exit(1);
  }
}

createTestUser();
