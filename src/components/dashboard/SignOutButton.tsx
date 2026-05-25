"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      className="m-signout-btn"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Ieși din cont
    </button>
  );
}
