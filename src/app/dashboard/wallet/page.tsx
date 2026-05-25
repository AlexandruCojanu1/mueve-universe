import { redirect } from "next/navigation";

export default function WalletRedirect() {
  redirect("/dashboard/profile#wallet");
}
