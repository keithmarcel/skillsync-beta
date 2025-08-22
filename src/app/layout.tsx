import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkillSync - Skills Assessment & Job Matching",
  description: "Assess your skills, discover career opportunities, and find educational programs in Pinellas County, FL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased bg-gray-50`}>
        <Navbar />
        <main className="pt-12 sm:pt-20 min-h-screen">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
