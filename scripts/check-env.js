#!/usr/bin/env node

// Quick script to verify Supabase environment variables are set
console.log("Checking Supabase Environment Variables...\n");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "✅ Set" : "❌ NOT SET");
console.log(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
  anonKey ? "✅ Set" : "❌ NOT SET",
);

if (!url || !anonKey) {
  console.log("\n❌ ERROR: Environment variables are missing!");
  console.log(
    "\nOn Vercel, add these in: Project Settings → Environment Variables",
  );
  console.log("Get values from: Supabase Dashboard → Project Settings → API");
  process.exit(1);
}

console.log("\n✅ All environment variables are set!");
