import { redirect } from "next/navigation";

/**
 * /vault/memories — redirect to the new-memory creation page.
 * The memories content is surfaced through the vault dashboard and upload page.
 */
export default function MemoriesPage() {
  redirect("/vault/new-memory");
}
