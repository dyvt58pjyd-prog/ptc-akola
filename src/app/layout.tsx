import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Navigation from "@/components/Navigation";
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
        <div className="app-container">
          {/* Sidebar Navigation */}
          {session && (
            <aside className="sidebar">
              <Link href="/" className="sidebar-brand">
                <img
                  src="/logo.png"
                  alt="Maharashtra Police Training Directorate Logo"
                  className="sidebar-logo"
                  style={{ borderRadius: "50%" }}
                />
                <span>PTC Akola</span>
              </Link>
              <Navigation role={session.role} />
            </aside>
          )}

          {/* Main Content Area */}
          <main className={session ? "main-content" : "main-content-full"}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
