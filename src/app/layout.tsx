import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SplashScreen from "@/components/SplashScreen";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Police Training Centre Akola",
  description: "Recruit Training Tracker System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <SplashScreen />
        <div className="app-container">
          {/* Sidebar Navigation */}
          <Sidebar role={session?.role || null} />

          {/* Main Content Area */}
          <main className={session ? "main-content" : "main-content-full"}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
