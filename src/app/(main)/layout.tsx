import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthLayoutWrapper } from "@/components/auth/auth-layout-wrapper";

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
    <AuthLayoutWrapper>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AuthLayoutWrapper>
  );
}
