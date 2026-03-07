import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log("Starting cleanup...");

  // Try to find any site with TEST4689 to delete the associated wedding
  try {
    const { data: site } = await supabase
      .from("sites")
      .select("wedding_id, slug")
      .eq("slug", "TEST4689")
      .single();
    if (site) {
      console.log("Found site with slug TEST4689, deleting its wedding...");
      await supabase.from("weddings").delete().eq("id", site.wedding_id);
    }
  } catch (e) {
    /* ignore */
  }

  // Actually try to see what wedding it belongs to by looking at sites
  const { data: sitesWithTest } = await supabase
    .from("sites")
    .select("*")
    .like("slug", "%TEST%");
  if (sitesWithTest && sitesWithTest.length > 0) {
    console.log(
      "Found other sites with TEST:",
      sitesWithTest.map((s) => s.slug),
    );
    for (const site of sitesWithTest) {
      await supabase.from("weddings").delete().eq("id", site.wedding_id);
    }
  }

  const { data: users, error: usersError } =
    await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Error listing users:", usersError);
    return;
  }

  const testUsers = users.users.filter((u) => u.email?.startsWith("testuser_"));
  console.log(`Found ${testUsers.length} test users to delete.`);

  for (const user of testUsers) {
    console.log(`Processing user ${user.email} (${user.id})...`);

    // Delete billing
    await supabase.from("billing").delete().eq("user_id", user.id);
    // Delete weddings
    await supabase.from("weddings").delete().eq("user_id", user.id);

    // Delete the user
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`Error deleting user ${user.email}:`, error);
    } else {
      console.log(`Deleted user ${user.email}`);
    }
  }

  console.log("Cleanup complete.");
}

cleanup();
