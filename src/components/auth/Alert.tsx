import type { ReactNode } from "react";

export default function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: ReactNode;
}) {
  return <div className={`auth-alert auth-alert-${kind}`}>{children}</div>;
}
