import { redirect } from "next/navigation";

export default function BackendIndex() {
  redirect("/backend/overview");
}
