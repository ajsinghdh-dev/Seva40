import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
const dmSans = localFont({
  src: [
    { path: "../public/fonts/dm-sans-400.ttf", weight: "400" },
    { path: "../public/fonts/dm-sans-500.ttf", weight: "500" },
    { path: "../public/fonts/dm-sans-600.ttf", weight: "600" },
    { path: "../public/fonts/dm-sans-700.ttf", weight: "700" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Seva 40 · Small acts. Lasting impact.",
  description:
    "A community service workspace for students in grades 10–12. Find seva, share evidence, and track committee-approved hours.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
