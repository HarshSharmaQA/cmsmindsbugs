import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
    title: { default: "BugScribe", template: "%s | BugScribe" },
    description: "Visual feedback & bug tracking for software teams. Capture screenshots, annotate issues, and resolve bugs faster.",
    keywords: ["bug tracking", "visual feedback", "QA", "testing", "screenshot"],
    openGraph: {
        title: "BugScribe",
        description: "Visual feedback & bug tracking for software teams.",
        type: "website",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
            <body suppressHydrationWarning>
                <ConvexClientProvider>
                    {children}
                </ConvexClientProvider>
            </body>
        </html>
    );
}
