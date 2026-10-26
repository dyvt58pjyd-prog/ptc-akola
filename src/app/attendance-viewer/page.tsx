import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AttendanceViewerClient from "./AttendanceViewerClient";

export const dynamic = "force-dynamic";

export default async function AttendanceViewerPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "OFFICER")) {
    redirect("/");
  }

  return <AttendanceViewerClient />;
}
