import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TestMark — Smart bookmark testing for developers and QA teams",
  description: "TestMark automatically tests your bookmarked URLs and alerts you when they break. Perfect for developers, QA engineers, and site owners who need to monitor critical links across projects. Never let a broken bookmark slow down your workflow again.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}