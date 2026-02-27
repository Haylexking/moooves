import { redirect } from "next/navigation"

export default function HomePage() {
  // Disable landing page, redirect everyone to onboarding/login
  redirect("/onboarding")
}