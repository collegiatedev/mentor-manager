import { redirect } from "next/navigation";
import { checkRole } from "~/api/checkRole";

export default function AdminDashboard() {
  // If the user does not have the admin role, redirect them to the home page
  if (!checkRole("admin")) {
    redirect("/");
  }

  return (
    <>
      <h1>This is the admin dashboard</h1>
      <p>This page is restricted to users with the admin role.</p>
    </>
  );
}
