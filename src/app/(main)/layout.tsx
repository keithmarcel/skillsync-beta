import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Navbar } from "@/components/navbar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Footer } from "@/components/ui/footer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkillSync - Skills Assessment & Job Matching",
  description: "Assess your skills, discover career opportunities, and find educational programs in Pinellas County, FL",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-12 sm:pt-20 [&:has(.auth-page)]:pt-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
