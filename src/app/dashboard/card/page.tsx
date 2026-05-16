import { redirect } from "next/navigation";

export default function CardRedirect() {
  redirect("/dashboard#card");
}
