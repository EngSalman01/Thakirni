import { createClient } from "@supabase/supabase-js";

// Password comes from the environment — never hardcode it.
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;
if (!TEST_USER_PASSWORD) {
  throw new Error("Set TEST_USER_PASSWORD before running this script");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log("Creating test reviewer user...");

    const { data, error } = await supabase.auth.admin.createUser({
      email: "test_reviewer@thakirni.com",
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Test Reviewer",
        role: "reviewer",
      },
    });

    if (error) {
      console.error("Error creating user:", error.message);
      process.exit(1);
    }

    console.log("User created successfully!");
    console.log("User ID:", data.user?.id);
    console.log("Email:", data.user?.email);
    console.log("\n=== TEST USER CREDENTIALS ===");
    console.log("Email: test_reviewer@thakirni.com");
    console.log("=============================\n");

    process.exit(0);
  } catch (error) {
    console.error("Unexpected error:", error);
    process.exit(1);
  }
}

createTestUser();
