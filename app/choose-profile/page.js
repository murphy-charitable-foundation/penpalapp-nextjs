import { redirect } from "next/navigation";

export default function ChooseProfilePage() {
  // Alias route: /choose-profile -> /choose-account
  redirect("/choose-account");
}

