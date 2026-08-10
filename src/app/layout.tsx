import type { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeConnect",
  description: "A pixel-perfect WhatsApp Web clone",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
