"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import {
    ArrowLeft, Plus, Trash2, Eye, EyeOff, Globe, FileText,
    Image, AlignLeft, Columns, Zap, BarChart2, Minus,
    GripVertical, Settings, X, Check, ExternalLink, ShieldAlert,
    ChevronDown, ChevronUp, Save, Pencil, Copy, Users, Activity, CalendarDays, Clock, Layout, HelpCircle
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Block Type Definitions ───────────────────────────────────────────────────

type BlockType = "hero" | "text" | "two_col" | "cta" | "stats" | "divider" | "image" | "ribbon" | "team" | "bug_chart" | "booking" | "marquee_ticker" | "login" | "grid_features" | "faq" | "pricing" | "testimonials" | "video_hero" | "countdown" | "newsletter" | "comparison" | "steps" | "logo_cloud" | "banner" | "gallery" | "map_embed" | "contact_form" | "timeline" | "code_block" | "progress_bars" | "icon_cards" | "social_proof" | "embed" | "number_counter" | "data_table" | "accordion" | "breadcrumb" | "quote" | "feature_highlight" | "startup_hero" | "startup_team" | "split_faq";

interface Block {
    id: string;
    type: BlockType;
    data: Record<string, any>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string; defaults: Record<string, any> }[] = [
    {
        type: "hero", label: "Hero Banner", icon: <Zap className="w-4 h-4" />, description: "Full-width headline with subtitle and CTA button",
        defaults: { heading: "Your Headline Here", subheading: "Supporting text that explains your value proposition.", ctaText: "Get Started", ctaUrl: "/", badge: "" },
    },
    {
        type: "ribbon", label: "Sliding Ribbon", icon: <Activity className="w-4 h-4" />, description: "Infinite marquee scrolling text ribbon",
        defaults: {
            text: "Build fast, responsive, and beautiful interfaces with BugScribe · Track bugs automatically · Zero setup required · Trusted by 10,000+ developers ·",
            speed: "35", direction: "left", tilt: "true", colorScheme: "cyan",
        },
    },
    {
        type: "marquee_ticker", label: "Diagonal Marquee", icon: <Zap className="w-4 h-4" />, description: "Two-row diagonal scrolling badges",
        defaults: {
            row1: "Capture Bugs Instantly, Screenshot & Annotate, Drag & Drop Kanban, Priority Tracking, Team Collaboration, One-Click Reports, Chrome Extension",
            row2: "Build Fast Ship Confidently, Visual Bug Reports, Designed for Developers, Beautiful Interfaces, Zero Config Setup, Responsive Components"
        },
    },
    {
        type: "team", label: "Team Section", icon: <Users className="w-4 h-4" />, description: "Grid of team members with photos and roles",
        defaults: {
            heading: "Meet The People Behind BugScribe",
            subheading: "We are a team of builders, designers, and problem-solvers dedicated to helping you work smarter every day.",
            member1Name: "Sophie Tan", member1Role: "Founder & CEO", member1Photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
            member2Name: "Liam Johnson", member2Role: "Chief Technology Officer", member2Photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            member3Name: "Ava Smith", member3Role: "Head of Marketing", member3Photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
            member4Name: "Noah Brown", member4Role: "Product Manager", member4Photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            member5Name: "Emma Wilson", member5Role: "Lead Designer", member5Photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            member6Name: "Oliver Lee", member6Role: "Data Analyst", member6Photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
        },
    },
    {
        type: "booking", label: "Booking Form", icon: <CalendarDays className="w-4 h-4" />, description: "Calendly-style appointment scheduler",
        defaults: {
            sectionHeading: "Book a Free Consultation", sectionSubheading: "Schedule time with our team — no commitment required.",
            eventName: "30-min Strategy Call", duration: "30", description: "A focused session to understand your needs and explore how BugScribe can help your team.",
            hostName: "BugScribe Team", hostAvatar: "",
            timeSlots: "09:00 AM,10:30 AM,12:00 PM,02:00 PM,03:30 PM,05:00 PM",
            accentColor: "#00D4FF", showPhone: true, showCompany: true, requireMessage: false,
        },
    },
    {
        type: "bug_chart", label: "Bug Analytics", icon: <BarChart2 className="w-4 h-4" />, description: "Spider/radar chart showing bug analysis metrics",
        defaults: {
            heading: "Bug Intelligence Dashboard", subheading: "Real-time analysis of your project health across all dimensions.",
            engagement: "85", pagesSession: "72", sessionDuration: "68", conversion: "54", retention: "79",
            label1: "Google Search", val1: "70", label2: "Display Ads", val2: "58", label3: "Newsletter", val3: "71", label4: "Social Media", val4: "58",
        },
    },
    {
        type: "text", label: "Rich Text", icon: <AlignLeft className="w-4 h-4" />, description: "Multi-paragraph text content block",
        defaults: { heading: "", body: "Write your content here..." },
    },
    {
        type: "two_col", label: "Two Columns", icon: <Columns className="w-4 h-4" />, description: "Side-by-side text and content layout",
        defaults: { leftHeading: "Left Column", leftBody: "Left-side content goes here.", rightHeading: "Right Column", rightBody: "Right-side content goes here.", imageLeft: "", imageRight: "" },
    },
    {
        type: "cta", label: "Call to Action", icon: <Zap className="w-4 h-4" />, description: "Prominent CTA section with gradient background",
        defaults: { heading: "Ready to get started?", subtext: "Join thousands of teams already using BugScribe.", primaryBtnText: "Start Free", primaryBtnUrl: "/", secondaryBtnText: "Learn More", secondaryBtnUrl: "/" },
    },
    {
        type: "stats", label: "Stats Grid", icon: <BarChart2 className="w-4 h-4" />, description: "Display 3 key metrics in a card grid",
        defaults: { stat1Value: "10K+", stat1Label: "Users", stat2Value: "99.9%", stat2Label: "Uptime", stat3Value: "500+", stat3Label: "Projects" },
    },
    {
        type: "image", label: "Image Banner", icon: <Image className="w-4 h-4" />, description: "Full-width or contained image with optional caption",
        defaults: { src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200", alt: "Image", caption: "", fullWidth: true },
    },
    {
        type: "divider", label: "Divider", icon: <Minus className="w-4 h-4" />, description: "Visual separator between sections",
        defaults: { style: "line" },
    },
    {
        type: "login", label: "Login Section", icon: <ShieldAlert className="w-4 h-4" />, description: "Centered login section with button",
        defaults: { heading: "Welcome to BugScribe", subheading: "Sign in to access your projects and track bugs in real-time.", btnText: "Sign In to Dashboard" },
    },
    {
        type: "grid_features", label: "Feature Grid", icon: <Columns className="w-4 h-4" />, description: "3x2 grid of features with icons",
        defaults: {
            heading: "Everything you need to ship faster",
            subheading: "Powerful tools designed to help your team track, manage, and resolve bugs efficiently.",
            f1Title: "Visual Reporting", f1Desc: "Annotate screenshots directly in your browser.",
            f2Title: "Team Sync", f2Desc: "Real-time updates across your entire workspace.",
            f3Title: "Smart Alerts", f3Desc: "Get notified on Slack or Discord instantly.",
            f4Title: "Deep Analytics", f4Desc: "Track resolution times and team performance.",
            f5Title: "Secure API", f5Desc: "Integrate with your existing CI/CD pipelines.",
            f6Title: "Dark Mode", f6Desc: "Because developers never sleep.",
        },
    },
    {
        type: "pricing", label: "Pricing Table", icon: <Layout className="w-4 h-4" />, description: "3-tier pricing comparison table",
        defaults: {
            heading: "Simple, Transparent Pricing",
            subheading: "Choose the plan that's right for your team. All plans include 14-day free trial.",
            p1Name: "Starter", p1Price: "0", p1Features: "1 Project,3 Team Members,Basic Bug Tracking,Email Support", p1Btn: "Get Started",
            p2Name: "Pro", p2Price: "49", p2Features: "Unlimited Projects,10 Team Members,Advanced Analytics,Priority Support,API Access", p2Btn: "Select Pro", p2Popular: "true",
            p3Name: "Enterprise", p3Price: "199", p3Features: "Custom Integration,Unlimited Members,SSO & Security,Dedicated Success Manager", p3Btn: "Contact Sales",
        },
    },
    {
        type: "testimonials", label: "Testimonials", icon: <Users className="w-4 h-4" />, description: "Customer quotes with avatars",
        defaults: {
            heading: "Trusted by Developers Worldwide",
            t1Quote: "BugScribe has completely transformed our QA workflow. We ship 2x faster now.", t1Author: "Sarah Chen", t1Role: "Senior Engineer at TechFlow",
            t2Quote: "The visual reporting is a game-changer. No more back-and-forth explaining bugs.", t2Author: "Marc Dupont", t2Role: "Product Manager",
            t3Quote: "Setup took 5 minutes. The fastest ROI we've seen on any dev tool this year.", t3Author: "Alex Rivers", t3Role: "Solo Dev",
        },
    },
    {
        type: "video_hero", label: "Video Hero", icon: <Zap className="w-4 h-4" />, description: "Full-screen video background hero section",
        defaults: { videoUrl: "", badge: "", heading: "The Future of Bug Tracking", subheading: "See BugScribe in action — built for speed, designed for teams.", btnText: "Get Started Free", btnUrl: "/" },
    },
    {
        type: "countdown", label: "Countdown Timer", icon: <Clock className="w-4 h-4" />, description: "Live countdown clock to a target date",
        defaults: { heading: "Early Access Closes In", subheading: "Don't miss out — limited seats available.", targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], label: "Register now to get 30% off" },
    },
    {
        type: "newsletter", label: "Newsletter Signup", icon: <AlignLeft className="w-4 h-4" />, description: "Email subscription capture form",
        defaults: { badge: "Newsletter", heading: "Stay in the Loop", subheading: "Get product updates, tips, and early access to new features.", placeholder: "Enter your email", btnText: "Subscribe", successMessage: "You're subscribed! 🎉", disclaimer: "No spam, ever. Unsubscribe at any time." },
    },
    {
        type: "comparison", label: "Comparison Table", icon: <Columns className="w-4 h-4" />, description: "Feature comparison across 3 tiers",
        defaults: {
            heading: "How We Compare", col1: "Competitors", col2: "BugScribe", col3: "Enterprise",
            features: "Bug Reports,Screenshot Capture,Team Collaboration,API Access,Analytics Dashboard",
            f1c1: "Limited", f1c2: "Unlimited", f1c3: "Unlimited",
            f2c1: "false", f2c2: "true", f2c3: "true",
            f3c1: "Paid Add-on", f3c2: "true", f3c3: "true",
            f4c1: "false", f4c2: "true", f4c3: "true",
            f5c1: "Basic", f5c2: "Advanced", f5c3: "Custom",
        },
    },
    {
        type: "steps", label: "How It Works", icon: <Activity className="w-4 h-4" />, description: "Numbered step-by-step process guide",
        defaults: {
            heading: "Get Started in 3 Easy Steps", subheading: "No credit card required. Setup takes under 5 minutes.",
            step1Title: "Install the Extension", step1Desc: "Add BugScribe to Chrome in one click from the Web Store.",
            step2Title: "Connect Your Project", step2Desc: "Paste your project key into the dashboard to link reports.",
            step3Title: "Capture & Report", step3Desc: "Click the widget, annotate the screenshot, and submit.",
        },
    },
    {
        type: "logo_cloud", label: "Logo Cloud", icon: <Image className="w-4 h-4" />, description: "Partner or customer logo strip",
        defaults: {
            heading: "Trusted by teams at",
            logo1Name: "GitHub", logo1Url: "",
            logo2Name: "Vercel", logo2Url: "",
            logo3Name: "Stripe", logo3Url: "",
            logo4Name: "Notion", logo4Url: "",
            logo5Name: "Linear", logo5Url: "",
        },
    },
    {
        type: "banner", label: "Announcement Banner", icon: <Zap className="w-4 h-4" />, description: "Dismissable info/warning/success/error banner strip",
        defaults: { emoji: "🚀", text: "BugScribe v2.0 is here! New AI-powered bug categorization.", linkText: "Learn more →", linkUrl: "/", variant: "info", dismissible: "true" },
    },
    {
        type: "gallery", label: "Image Gallery", icon: <Image className="w-4 h-4" />, description: "Responsive photo grid/gallery",
        defaults: {
            heading: "Gallery", columns: "3",
            img1Src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800", img1Alt: "Dashboard",
            img2Src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800", img2Alt: "Analytics",
            img3Src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", img3Alt: "Reports",
        },
    },
    {
        type: "map_embed", label: "Map Embed", icon: <Globe className="w-4 h-4" />, description: "Google Maps or custom iframe map",
        defaults: { heading: "Find Us", address: "San Francisco, CA", embedUrl: "", height: "400px" },
    },
    {
        type: "contact_form", label: "Contact Form", icon: <AlignLeft className="w-4 h-4" />, description: "Full contact form with name, email, and message",
        defaults: { heading: "Get in Touch", subheading: "We'd love to hear from you. Fill out the form and we'll respond within 24 hours.", showSubject: "true", subjectPlaceholder: "How can we help?", messagePlaceholder: "Your message...", btnText: "Send Message", successMessage: "Message sent successfully!" },
    },
    {
        type: "timeline", label: "Timeline", icon: <Activity className="w-4 h-4" />, description: "Alternating vertical timeline of events",
        defaults: {
            heading: "Our Journey", subheading: "How we got from idea to product.",
            ev1Year: "2022", ev1Title: "Founded", ev1Desc: "BugScribe was born in a weekend hackathon with 3 engineers.",
            ev2Year: "2023", ev2Title: "First 1,000 Users", ev2Desc: "We hit our first milestone after launching on Product Hunt.",
            ev3Year: "2024", ev3Title: "Series A", ev3Desc: "Raised $4M to build the future of visual bug tracking.",
        },
    },
    {
        type: "code_block", label: "Code Block", icon: <FileText className="w-4 h-4" />, description: "Syntax-highlighted code snippet with copy button",
        defaults: { heading: "", filename: "widget.js", code: `<script src="https://cdn.bugscribe.io/widget.js" data-key="YOUR_PROJECT_KEY" defer></script>`, caption: "Add this to your website's <body> tag" },
    },
    {
        type: "progress_bars", label: "Progress / Skills", icon: <BarChart2 className="w-4 h-4" />, description: "Animated horizontal skill/progress bars",
        defaults: { heading: "Our Expertise", bar1Label: "Bug Detection", bar1Value: "96", bar2Label: "User Satisfaction", bar2Value: "92", bar3Label: "Uptime", bar3Value: "99", bar4Label: "Support Response", bar4Value: "88" },
    },
    {
        type: "icon_cards", label: "Icon Cards", icon: <Columns className="w-4 h-4" />, description: "Grid of emoji-icon cards with title and description",
        defaults: {
            heading: "Why Teams Love BugScribe", subheading: "Everything you need, nothing you don't.",
            card1Emoji: "⚡", card1Title: "Lightning Fast", card1Desc: "Captures and sends bug reports in under 2 seconds.",
            card2Emoji: "🎯", card2Title: "Pixel Precise", card2Desc: "Annotate exact elements with arrows, boxes and text.",
            card3Emoji: "🔒", card3Title: "Secure by Default", card3Desc: "End-to-end encryption and SOC 2 Type II compliant.",
            card4Emoji: "🌍", card4Title: "Works Everywhere", card4Desc: "Any website, any tech stack, any team size.",
            card5Emoji: "📊", card5Title: "Smart Analytics", card5Desc: "Reduce MTTR with AI-powered bug categorization.",
            card6Emoji: "🤝", card6Title: "Team Sync", card6Desc: "Real-time collaboration with Slack and Discord.",
        },
    },
    {
        type: "social_proof", label: "Social Proof", icon: <Users className="w-4 h-4" />, description: "Trust badges with large numbers and labels",
        defaults: {
            heading: "Trusted by developers worldwide",
            badge1Emoji: "⭐", badge1Value: "4.9/5", badge1Label: "Average Rating",
            badge2Emoji: "👥", badge2Value: "10,000+", badge2Label: "Active Users",
            badge3Emoji: "🐛", badge3Value: "2.5M+", badge3Label: "Bugs Tracked",
            badge4Emoji: "🚀", badge4Value: "500+", badge4Label: "Teams Onboarded",
        },
    },
    {
        type: "embed", label: "iFrame Embed", icon: <ExternalLink className="w-4 h-4" />, description: "Generic iframe for Figma, CodePen, YouTube, etc.",
        defaults: { heading: "", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", height: "480px" },
    },
    {
        type: "number_counter", label: "Number Counters", icon: <BarChart2 className="w-4 h-4" />, description: "Large animated metric counters grid",
        defaults: {
            heading: "",
            num1Value: "10K", num1Suffix: "+", num1Label: "Developers",
            num2Value: "99.9", num2Suffix: "%", num2Label: "Uptime",
            num3Value: "2M", num3Suffix: "+", num3Label: "Bugs Tracked",
            num4Value: "150", num4Suffix: "+", num4Label: "Countries",
        },
    },
    {
        type: "data_table", label: "Data Table", icon: <Layout className="w-4 h-4" />, description: "Simple structured data table",
        defaults: { heading: "", headers: "Plan,Price,Projects,Members", rows: "Starter,$0,1,3\nPro,$49,Unlimited,10\nEnterprise,$199,Unlimited,Unlimited" },
    },
    {
        type: "accordion", label: "Accordion", icon: <ChevronDown className="w-4 h-4" />, description: "Collapsible accordion sections (non-FAQ)",
        defaults: {
            heading: "Frequently Asked Questions",
            q1: "Do I need a credit card to sign up?", a1: "No. BugScribe offers a free tier with no credit card required.",
            q2: "Can I use BugScribe with any website?", a2: "Yes. Add the widget script to any HTML page and you're ready.",
            q3: "How do I add teammates?", a3: "Go to Project Settings → Team → Invite by email address.",
        },
    },
    {
        type: "breadcrumb", label: "Breadcrumb Nav", icon: <ArrowLeft className="w-4 h-4" />, description: "Clickable breadcrumb navigation trail",
        defaults: { items: "Home,/;Features,/features;Current Page," },
    },
    {
        type: "quote", label: "Pull Quote", icon: <AlignLeft className="w-4 h-4" />, description: "Large featured customer or founder quote",
        defaults: { quote: "The best bug tracker I've ever used. It pays for itself in the first sprint.", author: "Taylor Kim", role: "CTO at Launchpad.io", avatar: "" },
    },
    {
        type: "feature_highlight", label: "Feature Highlight", icon: <Zap className="w-4 h-4" />, description: "Two-column image + feature list highlight",
        defaults: {
            badge: "Highlight", heading: "Ship Bugs to Zero, Not the Backlog", subheading: "BugScribe gives your team the tools to find, report, and resolve issues before they reach production.",
            feat1Icon: "📸", feat1Title: "One-Click Screenshots", feat1Desc: "Capture and annotate directly in the browser.",
            feat2Icon: "⚡", feat2Title: "Instant Reports", feat2Desc: "Reports appear in your dashboard in real-time.",
            feat3Icon: "📊", feat3Title: "Smart Analytics", feat3Desc: "See trends, hotspots and resolution times at a glance.",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800", reverse: "false",
        },
    },
    {
        type: "startup_hero", label: "Startup Hero", icon: <Zap className="w-4 h-4" />, description: "Hero section with foreground people image and light background",
        defaults: {
            heading: "Build your Startup with Futuredesks",
            image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800",
            primaryBtnText: "Let's Explore", primaryBtnUrl: "/",
            secondaryBtnText: "Contact Us", secondaryBtnUrl: "/",
            trustedText: "Trusted by 1.3L+ Audience",
            avatars: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100,https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100,https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"
        },
    },
    {
        type: "startup_team", label: "Startup Team", icon: <Users className="w-4 h-4" />, description: "Grid of image-heavy team member cards",
        defaults: {
            heading: "Team Behind Wonders",
            subtext: "Our Team",
            m1Name: "Tushar Rawat", m1Role: "Founder", m1Photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
            m2Name: "Aastha Negi", m2Role: "Co-founder", m2Photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
            m3Name: "Aditya Agarwal", m3Role: "Chief Operations Head", m3Photo: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400",
            m4Name: "Utkarsh Rajoriya", m4Role: "Full Stack Developer", m4Photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400",
            m5Name: "Yatendra Sharma", m5Role: "Flutter Developer", m5Photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            m6Name: "Mansingh", m6Role: "Full Stack Developer", m6Photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            m7Name: "Deepak Kumar", m7Role: "Flutter Developer", m7Photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
            m8Name: "Manish Das Sharma", m8Role: "Chief Technical Officer", m8Photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
        },
    },
    {
        type: "split_faq", label: "Split FAQ", icon: <HelpCircle className="w-4 h-4" />, description: "FAQ with heading on the left and accordions on the right",
        defaults: {
            heading: "Frequently Asked Questions",
            q1: "How long does it take to deliver a pre-built application or website?", a1: "It depends on the requirements, usually 1-2 weeks.",
            q2: "Do you provide the complete source code after development?", a2: "Yes, you have full ownership.",
            q3: "What's the difference between a pre-built and a custom development project?", a3: "Pre-built is faster, custom is tailored to your needs.",
            q4: "Do you provide maintenance and support after delivery?", a4: "Yes, we offer ongoing support.",
            q5: "What technologies do you use for development?", a5: "We use Node.js, React, Tailwind, Next.js.",
        },
    },
];

// ─── Animated Delete Modal ────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [phase, setPhase] = useState<"idle" | "dropping" | "shaking">("idle");

    const handleConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        setPhase("dropping");
        setTimeout(() => setPhase("shaking"), 600);
        setTimeout(async () => {
            await onConfirm();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 w-full max-w-xs text-center shadow-2xl animate-slide-up">
                {/* Trash animation area */}
                <div className="relative h-32 flex items-end justify-center mb-4">
                    {/* Ball dropping */}
                    <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-all duration-500 ease-in ${phase === "idle" ? "opacity-100 translate-y-0" : "translate-y-16 opacity-0"}`}
                        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", boxShadow: "0 0 14px rgba(225,29,72,0.5)" }}
                    />
                    {/* Hand */}
                    <div className={`absolute top-4 left-1/2 -translate-x-[30px] transition-all duration-500 ${phase !== "idle" ? "opacity-0 translate-y-4" : "opacity-100"}`}>
                        <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                            <path d="M5 20 Q10 8 20 6 Q30 8 35 20" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 Q14 26 20 26 Q26 26 28 20" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />
                        </svg>
                    </div>
                    {/* Trash can */}
                    <div className={`transition-all duration-300 ${phase === "shaking" ? "animate-[wiggle_0.3s_ease-in-out_2]" : ""}`}
                        style={{ animation: phase === "shaking" ? "wiggle 0.3s ease-in-out 2" : undefined }}>
                        <svg width="52" height="58" viewBox="0 0 52 58" fill="none">
                            {/* Lid — tilts when dropping */}
                            <g className={`transition-transform duration-500 origin-right ${phase !== "idle" ? "-rotate-45 translate-y-[-4px] translate-x-[8px]" : ""}`}>
                                <rect x="8" y="8" width="36" height="5" rx="2.5" fill="none" stroke="#94a3b8" strokeWidth="2" />
                                <rect x="18" y="4" width="16" height="6" rx="2" fill="none" stroke="#94a3b8" strokeWidth="2" />
                            </g>
                            {/* Body */}
                            <rect x="10" y="14" width="32" height="38" rx="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="20" y1="22" x2="20" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="26" y1="22" x2="26" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="32" y1="22" x2="32" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <p className="text-white font-bold text-lg mb-1">Are you sure?</p>
                <p className="text-slate-500 text-sm mb-6">This page will be permanently deleted and cannot be recovered.</p>

                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1A1A24] border border-[#2A2A40] text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                    >
                        No, cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", boxShadow: "0 4px 16px rgba(225,29,72,0.3)" }}
                    >
                        {isDeleting ? "Deleting…" : "Yes, delete"}
                    </button>
                </div>
            </div>
            <style>{`@keyframes wiggle { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }`}</style>
        </div>
    );
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, index, total }: {
    block: Block; onChange: (data: Record<string, any>) => void;
    onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
    index: number; total: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const def = BLOCK_TYPES.find(b => b.type === block.type)!;
    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChange({ ...block.data, [key]: e.target.value });
    const setBool = (key: string, val: boolean) => onChange({ ...block.data, [key]: val });

    return (
        <>
            {showDeleteModal && (
                <DeleteModal
                    onConfirm={async () => { onDelete(); setShowDeleteModal(false); }}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
            <div className="card border-surface-border ring-1 ring-surface-border/50 overflow-hidden group">
                {/* Block Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0D0D14] border-b border-surface-border">
                    <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                        {def.icon}
                        {def.label}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                        <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded text-slate-600 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded text-slate-600 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-surface-hover transition-colors">
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setShowDeleteModal(true)} className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete block">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Block Fields */}
                {expanded && (
                    <div className="p-4 space-y-3 animate-fade-in">
                        {block.type === "hero" && (
                            <>
                                <Field label="Badge Text (optional)" value={block.data.badge} onChange={set("badge")} placeholder="e.g. New Feature" />
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} placeholder="Your main headline" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea placeholder="Supporting text..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Button Text" value={block.data.ctaText} onChange={set("ctaText")} placeholder="Get Started" />
                                    <Field label="Button URL" value={block.data.ctaUrl} onChange={set("ctaUrl")} placeholder="/" />
                                </div>
                            </>
                        )}
                        {block.type === "ribbon" && (
                            <>
                                <Field label="Ribbon Text (use · as separator)" value={block.data.text} onChange={set("text")} textarea rows={2} placeholder="Build fast · Ship faster · Zero bugs ·" />
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Speed (seconds)</label>
                                        <input type="number" min="10" max="120" className="input" value={block.data.speed || "35"} onChange={set("speed")} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Direction</label>
                                        <select className="input" value={block.data.direction || "left"} onChange={set("direction")}>
                                            <option value="left">← Left</option>
                                            <option value="right">Right →</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Color</label>
                                        <select className="input" value={block.data.colorScheme || "cyan"} onChange={set("colorScheme")}>
                                            <option value="cyan">Cyan</option>
                                            <option value="white">White</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={block.data.tilt !== "false"} onChange={e => onChange({ ...block.data, tilt: e.target.checked ? "true" : "false" })} className="w-3.5 h-3.5 accent-brand-500" />
                                    Diagonal tilt effect
                                </label>
                            </>
                        )}
                        {block.type === "marquee_ticker" && (
                            <>
                                <Field label="Row 1 Items (comma separated)" value={block.data.row1} onChange={set("row1")} textarea rows={2} />
                                <Field label="Row 2 Items (comma separated)" value={block.data.row2} onChange={set("row2")} textarea rows={2} />
                            </>
                        )}
                        {block.type === "login" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} placeholder="Welcome to BugScribe" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea placeholder="Sign in context..." />
                                <Field label="Button Text" value={block.data.btnText} onChange={set("btnText")} placeholder="Sign In to Dashboard" />
                            </>
                        )}
                        {block.type === "grid_features" && (
                            <>
                                <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Section Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 mt-4">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="space-y-2">
                                            <Field label={`Feature ${i} Title`} value={block.data[`f${i}Title`]} onChange={set(`f${i}Title`)} />
                                            <Field label={`Feature ${i} Desc`} value={block.data[`f${i}Desc`]} onChange={set(`f${i}Desc`)} textarea rows={2} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {block.type === "pricing" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-4 border-t border-white/5 pt-4 mt-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1"><Field label={`Plan ${i} Name`} value={block.data[`p${i}Name`]} onChange={set(`p${i}Name`)} /></div>
                                            <div className="w-24"><Field label="Price ($)" value={block.data[`p${i}Price`]} onChange={set(`p${i}Price`)} /></div>
                                        </div>
                                        <Field label="Features (comma separated)" value={block.data[`p${i}Features`]} onChange={set(`p${i}Features`)} textarea rows={2} />
                                        <Field label="Button Text" value={block.data[`p${i}Btn`]} onChange={set(`p${i}Btn`)} />
                                        {i === 2 && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <input type="checkbox" checked={block.data.p2Popular === "true"} onChange={e => onChange({ ...block.data, p2Popular: e.target.checked ? "true" : "false" })} id="popular-chk" />
                                                <label htmlFor="popular-chk" className="text-xs text-slate-400">Mark as Popular</label>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        )}
                        {block.type === "testimonials" && (() => {
                            type Testimonial = { quote: string; author: string; role: string };
                            const items: Testimonial[] = block.data._testimonials ?? [
                                ...([1,2,3].map(i => ({ quote: block.data[`t${i}Quote`] || "", author: block.data[`t${i}Author`] || "", role: block.data[`t${i}Role`] || "" }))).filter(t => t.quote || t.author)
                            ];
                            if (!items.length) items.push({ quote: "", author: "", role: "" });
                            const setItems = (next: Testimonial[]) => onChange({ ...block.data, _testimonials: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Testimonials</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Testimonial" defaultItem={{ quote: "", author: "", role: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <Field label="Quote" value={item.quote} onChange={(e: any) => update({ quote: e.target.value })} textarea />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Field label="Author" value={item.author} onChange={(e: any) => update({ author: e.target.value })} placeholder="Jane Doe" />
                                                    <Field label="Role" value={item.role} onChange={(e: any) => update({ role: e.target.value })} placeholder="CEO at Acme" />
                                                </div>
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "faq" && (() => {
                            type QA = { q: string; a: string };
                            const items: QA[] = block.data._faqs ?? [
                                ...([1,2,3].map(i => ({ q: block.data[`q${i}`] || "", a: block.data[`a${i}`] || "" }))).filter(x => x.q)
                            ];
                            if (!items.length) items.push({ q: "", a: "" });
                            const setItems = (next: QA[]) => onChange({ ...block.data, _faqs: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Questions</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Question" defaultItem={{ q: "", a: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <Field label="Question" value={item.q} onChange={(e: any) => update({ q: e.target.value })} />
                                                <Field label="Answer" value={item.a} onChange={(e: any) => update({ a: e.target.value })} textarea />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "team" && (() => {
                            type TeamMember = { name: string; role: string; photo: string };
                            const members: TeamMember[] = block.data._members ?? [
                                ...([1,2,3,4,5,6].map(n => ({ name: block.data[`member${n}Name`] || "", role: block.data[`member${n}Role`] || "", photo: block.data[`member${n}Photo`] || "" }))).filter(m => m.name)
                            ];
                            if (!members.length) members.push({ name: "", role: "", photo: "" });
                            const setMembers = (next: TeamMember[]) => onChange({ ...block.data, _members: next });
                            return (
                                <>
                                    <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} placeholder="Meet The Team" />
                                    <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea rows={2} placeholder="Team description..." />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Team Members</p>
                                    <DynList items={members} setItems={setMembers} addLabel="Add Member" defaultItem={{ name: "", role: "", photo: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Field label="Name" value={item.name} onChange={(e: any) => update({ name: e.target.value })} placeholder="Full Name" />
                                                    <Field label="Role" value={item.role} onChange={(e: any) => update({ role: e.target.value })} placeholder="CEO" />
                                                </div>
                                                <Field label="Photo URL" value={item.photo} onChange={(e: any) => update({ photo: e.target.value })} placeholder="https://..." />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "bug_chart" && (
                            <>
                                <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} placeholder="Bug Analytics" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea rows={2} placeholder="Description..." />
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Radar Chart Metrics (0–100)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { key: "engagement", label: "Engagement" },
                                        { key: "pagesSession", label: "Pages/Session" },
                                        { key: "sessionDuration", label: "Session Dur." },
                                        { key: "conversion", label: "Conversion" },
                                        { key: "retention", label: "Retention" },
                                    ].map(m => (
                                        <div key={m.key}>
                                            <label className="text-xs text-slate-500 block mb-1">{m.label}</label>
                                            <input type="number" min="0" max="100" className="input text-center" value={block.data[m.key] || 0} onChange={set(m.key)} />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Campaign Legend (up to 4)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(n => (
                                        <div key={n} className="flex gap-2">
                                            <div className="flex-1"><Field label={`Label ${n}`} value={block.data[`label${n}`]} onChange={set(`label${n}`)} placeholder="Source" /></div>
                                            <div className="w-16"><Field label="%" value={block.data[`val${n}`]} onChange={set(`val${n}`)} placeholder="70" /></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {block.type === "booking" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Section Heading" value={block.data.sectionHeading} onChange={set("sectionHeading")} placeholder="Book a Free Consultation" />
                                    <Field label="Section Subheading" value={block.data.sectionSubheading} onChange={set("sectionSubheading")} placeholder="Schedule time with us..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Event Name" value={block.data.eventName} onChange={set("eventName")} placeholder="30-min Strategy Call" />
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Duration (minutes)</label>
                                        <select className="input" value={block.data.duration || "30"} onChange={set("duration")}>
                                            {["15", "30", "45", "60", "90"].map(d => <option key={d} value={d}>{d} min</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Field label="Description" value={block.data.description} onChange={set("description")} textarea rows={2} placeholder="What will you discuss?" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Host Name" value={block.data.hostName} onChange={set("hostName")} placeholder="John Doe" />
                                    <Field label="Host Avatar URL" value={block.data.hostAvatar} onChange={set("hostAvatar")} placeholder="https://..." />
                                </div>
                                <Field label="Available Time Slots (comma-separated)" value={block.data.timeSlots} onChange={set("timeSlots")} textarea rows={2} placeholder="09:00 AM,10:30 AM,12:00 PM" />
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={block.data.accentColor || "#00D4FF"} onChange={set("accentColor")} className="w-10 h-9 rounded border border-surface-border cursor-pointer bg-transparent" />
                                        <input className="input flex-1" value={block.data.accentColor || "#00D4FF"} onChange={set("accentColor")} placeholder="#00D4FF" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 pt-1">
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={block.data.showPhone !== false} onChange={e => setBool("showPhone", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Show Phone field
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={block.data.showCompany !== false} onChange={e => setBool("showCompany", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Show Company field
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={!!block.data.requireMessage} onChange={e => setBool("requireMessage", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Require message
                                    </label>
                                </div>
                            </>
                        )}
                        {block.type === "text" && (
                            <>
                                <Field label="Section Heading (optional)" value={block.data.heading} onChange={set("heading")} placeholder="Section title" />
                                <Field label="Body Content *" value={block.data.body} onChange={set("body")} textarea rows={6} placeholder="Your text content here..." />
                            </>
                        )}
                        {block.type === "two_col" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Left Column</p>
                                    <Field label="Heading" value={block.data.leftHeading} onChange={set("leftHeading")} placeholder="Left heading" />
                                    <Field label="Body" value={block.data.leftBody} onChange={set("leftBody")} textarea placeholder="Left content..." />
                                    <Field label="Image URL (optional)" value={block.data.imageLeft} onChange={set("imageLeft")} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Right Column</p>
                                    <Field label="Heading" value={block.data.rightHeading} onChange={set("rightHeading")} placeholder="Right heading" />
                                    <Field label="Body" value={block.data.rightBody} onChange={set("rightBody")} textarea placeholder="Right content..." />
                                    <Field label="Image URL (optional)" value={block.data.imageRight} onChange={set("imageRight")} placeholder="https://..." />
                                </div>
                            </div>
                        )}
                        {block.type === "cta" && (
                            <>
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} placeholder="Ready to get started?" />
                                <Field label="Subtext" value={block.data.subtext} onChange={set("subtext")} placeholder="Short supporting line..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Primary Button Text" value={block.data.primaryBtnText} onChange={set("primaryBtnText")} placeholder="Get Started" />
                                    <Field label="Primary Button URL" value={block.data.primaryBtnUrl} onChange={set("primaryBtnUrl")} placeholder="/" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Secondary Button Text" value={block.data.secondaryBtnText} onChange={set("secondaryBtnText")} placeholder="Learn More" />
                                    <Field label="Secondary Button URL" value={block.data.secondaryBtnUrl} onChange={set("secondaryBtnUrl")} placeholder="/" />
                                </div>
                            </>
                        )}
                        {block.type === "stats" && (
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="space-y-2">
                                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Stat {n}</p>
                                        <Field label="Value" value={block.data[`stat${n}Value`]} onChange={set(`stat${n}Value`)} placeholder="10K+" />
                                        <Field label="Label" value={block.data[`stat${n}Label`]} onChange={set(`stat${n}Label`)} placeholder="Users" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {block.type === "image" && (
                            <>
                                <Field label="Image URL *" value={block.data.src} onChange={set("src")} placeholder="https://..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Alt Text" value={block.data.alt} onChange={set("alt")} placeholder="Descriptive alt text" />
                                    <Field label="Caption (optional)" value={block.data.caption} onChange={set("caption")} placeholder="Figure 1: ..." />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={!!block.data.fullWidth} onChange={e => setBool("fullWidth", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                    Full-width image
                                </label>
                            </>
                        )}
                        {block.type === "divider" && (
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1">Style</label>
                                <select className="input w-40" value={block.data.style} onChange={set("style")}>
                                    <option value="line">Line</option>
                                    <option value="dots">Dots</option>
                                    <option value="gradient">Gradient</option>
                                </select>
                            </div>
                        )}
                        {block.type === "video_hero" && (
                            <>
                                <Field label="YouTube Video URL" value={block.data.videoUrl} onChange={set("videoUrl")} placeholder="https://www.youtube.com/watch?v=..." />
                                <Field label="Badge (optional)" value={block.data.badge} onChange={set("badge")} placeholder="New" />
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} placeholder="Your headline" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Button Text" value={block.data.btnText} onChange={set("btnText")} placeholder="Get Started" />
                                    <Field label="Button URL" value={block.data.btnUrl} onChange={set("btnUrl")} placeholder="/" />
                                </div>
                            </>
                        )}
                        {block.type === "countdown" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} placeholder="Sale Ends In" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} placeholder="Limited time offer" />
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1">Target Date</label>
                                    <input type="date" className="input" value={block.data.targetDate || ''} onChange={set("targetDate")} />
                                </div>
                                <Field label="Label below timer" value={block.data.label} onChange={set("label")} placeholder="Register before this date" />
                            </>
                        )}
                        {block.type === "newsletter" && (
                            <>
                                <Field label="Badge" value={block.data.badge} onChange={set("badge")} placeholder="Newsletter" />
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Input Placeholder" value={block.data.placeholder} onChange={set("placeholder")} />
                                    <Field label="Button Text" value={block.data.btnText} onChange={set("btnText")} />
                                </div>
                                <Field label="Success Message" value={block.data.successMessage} onChange={set("successMessage")} />
                                <Field label="Disclaimer (optional)" value={block.data.disclaimer} onChange={set("disclaimer")} placeholder="No spam, ever." />
                            </>
                        )}
                        {block.type === "comparison" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                <div className="grid grid-cols-3 gap-3">
                                    <Field label="Column 1" value={block.data.col1} onChange={set("col1")} placeholder="Basic" />
                                    <Field label="Column 2 (highlighted)" value={block.data.col2} onChange={set("col2")} placeholder="Pro" />
                                    <Field label="Column 3" value={block.data.col3} onChange={set("col3")} placeholder="Enterprise" />
                                </div>
                                <Field label="Feature Names (comma separated)" value={block.data.features} onChange={set("features")} textarea rows={3} placeholder="Feature 1,Feature 2,Feature 3" />
                                <p className="text-[10px] text-slate-500">For each cell use keys like f1c1 (feature 1 col 1). Use &quot;true&quot; for ✓, &quot;false&quot; for ✗, or any text.</p>
                            </>
                        )}
                        {block.type === "steps" && (() => {
                            type Step = { title: string; desc: string };
                            const items: Step[] = block.data._steps ?? [
                                ...([1,2,3].map(i => ({ title: block.data[`step${i}Title`] || "", desc: block.data[`step${i}Desc`] || "" }))).filter(s => s.title)
                            ];
                            if (!items.length) items.push({ title: "", desc: "" });
                            const setItems = (next: Step[]) => onChange({ ...block.data, _steps: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Steps</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Step" defaultItem={{ title: "", desc: "" }}
                                        renderItem={(item, update, idx) => (
                                            <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00D4FF' }}>{idx + 1}</div>
                                                <div className="space-y-1.5">
                                                    <Field label="Step Title" value={item.title} onChange={(e: any) => update({ title: e.target.value })} placeholder="Step Title" />
                                                    <Field label="Description" value={item.desc} onChange={(e: any) => update({ desc: e.target.value })} textarea rows={2} />
                                                </div>
                                            </div>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "logo_cloud" && (() => {
                            const logos: {name: string; url: string}[] = block.data._logos ?? [
                                ...([1,2,3,4,5].map(i => ({ name: block.data[`logo${i}Name`] || "", url: block.data[`logo${i}Url`] || "" }))).filter(l => l.name || l.url)
                            ];
                            if (!logos.length) logos.push({ name: "", url: "" });
                            const setLogos = (next: typeof logos) => onChange({ ...block.data, _logos: next });
                            return (
                                <>
                                    <Field label="Heading Label" value={block.data.heading} onChange={set("heading")} placeholder="Trusted by teams at" />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Logos</p>
                                    <DynList items={logos} setItems={setLogos} addLabel="Add Logo" defaultItem={{ name: "", url: "" }}
                                        renderItem={(item, update) => (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Field label="Logo URL" value={item.url} onChange={(e: any) => update({ url: e.target.value })} placeholder="https://..." />
                                                <Field label="Alt Text" value={item.name} onChange={(e: any) => update({ name: e.target.value })} placeholder="Company Name" />
                                            </div>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "banner" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Variant</label>
                                        <select className="input" value={block.data.variant || 'info'} onChange={set('variant')}>
                                            <option value="info">Info (Cyan)</option>
                                            <option value="warning">Warning (Yellow)</option>
                                            <option value="success">Success (Green)</option>
                                            <option value="error">Error (Red)</option>
                                        </select>
                                    </div>
                                    <Field label="Emoji" value={block.data.emoji} onChange={set("emoji")} placeholder="🚀" />
                                </div>
                                <Field label="Banner Text" value={block.data.text} onChange={set("text")} textarea rows={2} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Link Text" value={block.data.linkText} onChange={set("linkText")} placeholder="Learn more →" />
                                    <Field label="Link URL" value={block.data.linkUrl} onChange={set("linkUrl")} placeholder="/" />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={block.data.dismissible !== 'false'} onChange={e => onChange({ ...block.data, dismissible: e.target.checked ? 'true' : 'false' })} className="w-3.5 h-3.5 accent-brand-500" />
                                    Allow dismissal
                                </label>
                            </>
                        )}
                        {block.type === "gallery" && (() => {
                            const imgs: {src: string; alt: string}[] = block.data._imgs ?? [
                                ...([1,2,3].map(i => ({ src: block.data[`img${i}Src`] || "", alt: block.data[`img${i}Alt`] || "" }))).filter(x => x.src)
                            ];
                            if (!imgs.length) imgs.push({ src: "", alt: "" });
                            const setImgs = (next: typeof imgs) => onChange({ ...block.data, _imgs: next });
                            return (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                        <div>
                                            <label className="text-xs text-slate-400 font-medium block mb-1">Columns</label>
                                            <select className="input" value={block.data.columns || '3'} onChange={set('columns')}>
                                                <option value="2">2 Columns</option>
                                                <option value="3">3 Columns</option>
                                                <option value="4">4 Columns</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Images</p>
                                    <DynList items={imgs} setItems={setImgs} addLabel="Add Image" defaultItem={{ src: "", alt: "" }}
                                        renderItem={(item, update) => (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Field label="Image URL" value={item.src} onChange={(e: any) => update({ src: e.target.value })} placeholder="https://..." />
                                                <Field label="Alt Text" value={item.alt} onChange={(e: any) => update({ alt: e.target.value })} placeholder="Description" />
                                            </div>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "startup_hero" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Hero Image URL" value={block.data.image} onChange={set("image")} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Primary Button Text" value={block.data.primaryBtnText} onChange={set("primaryBtnText")} />
                                    <Field label="Primary Button URL" value={block.data.primaryBtnUrl} onChange={set("primaryBtnUrl")} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Secondary Button Text" value={block.data.secondaryBtnText} onChange={set("secondaryBtnText")} />
                                    <Field label="Secondary Button URL" value={block.data.secondaryBtnUrl} onChange={set("secondaryBtnUrl")} />
                                </div>
                                <Field label="Trusted By Text" value={block.data.trustedText} onChange={set("trustedText")} />
                                <Field label="Avatar Image URLs (comma separated)" value={block.data.avatars} onChange={set("avatars")} textarea />
                            </>
                        )}
                        {block.type === "startup_team" && (() => {
                            type STMember = { name: string; role: string; photo: string };
                            const members: STMember[] = block.data._members ?? [
                                ...([1,2,3,4,5,6,7,8].map(i => ({ name: block.data[`m${i}Name`] || "", role: block.data[`m${i}Role`] || "", photo: block.data[`m${i}Photo`] || "" }))).filter(m => m.name)
                            ];
                            if (!members.length) members.push({ name: "", role: "", photo: "" });
                            const setMembers = (next: STMember[]) => onChange({ ...block.data, _members: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <Field label="Subtext (e.g. Our Team)" value={block.data.subtext} onChange={set("subtext")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Members</p>
                                    <DynList items={members} setItems={setMembers} addLabel="Add Member" defaultItem={{ name: "", role: "", photo: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Field label="Name" value={item.name} onChange={(e: any) => update({ name: e.target.value })} placeholder="Full Name" />
                                                    <Field label="Role" value={item.role} onChange={(e: any) => update({ role: e.target.value })} placeholder="Engineer" />
                                                </div>
                                                <Field label="Photo URL" value={item.photo} onChange={(e: any) => update({ photo: e.target.value })} placeholder="https://..." />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "split_faq" && (() => {
                            type QA = { q: string; a: string };
                            const items: QA[] = block.data._faqs ?? [
                                ...([1,2,3,4,5].map(i => ({ q: block.data[`q${i}`] || "", a: block.data[`a${i}`] || "" }))).filter(x => x.q)
                            ];
                            if (!items.length) items.push({ q: "", a: "" });
                            const setItems = (next: QA[]) => onChange({ ...block.data, _faqs: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Questions</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Question" defaultItem={{ q: "", a: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <Field label="Question" value={item.q} onChange={(e: any) => update({ q: e.target.value })} />
                                                <Field label="Answer" value={item.a} onChange={(e: any) => update({ a: e.target.value })} textarea />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "map_embed" && (
                            <>
                                <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} placeholder="Find Us" />
                                <Field label="Address (fallback if no embed URL)" value={block.data.address} onChange={set("address")} placeholder="San Francisco, CA" />
                                <Field label="Custom Embed URL (optional)" value={block.data.embedUrl} onChange={set("embedUrl")} placeholder="https://maps.google.com/maps?q=...&output=embed" />
                                <Field label="Height" value={block.data.height} onChange={set("height")} placeholder="400px" />
                            </>
                        )}
                        {block.type === "contact_form" && (
                            <>
                                <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Button Text" value={block.data.btnText} onChange={set("btnText")} />
                                    <Field label="Success Message" value={block.data.successMessage} onChange={set("successMessage")} />
                                </div>
                                <Field label="Subject Placeholder" value={block.data.subjectPlaceholder} onChange={set("subjectPlaceholder")} />
                                <Field label="Message Placeholder" value={block.data.messagePlaceholder} onChange={set("messagePlaceholder")} />
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={block.data.showSubject !== 'false'} onChange={e => onChange({ ...block.data, showSubject: e.target.checked ? 'true' : 'false' })} className="w-3.5 h-3.5 accent-brand-500" />
                                    Show Subject field
                                </label>
                            </>
                        )}
                        {block.type === "timeline" && (() => {
                            type TLEvent = { year: string; title: string; desc: string };
                            const items: TLEvent[] = block.data._events ?? [
                                ...([1,2,3].map(i => ({ year: block.data[`ev${i}Year`] || "", title: block.data[`ev${i}Title`] || "", desc: block.data[`ev${i}Desc`] || "" }))).filter(e => e.title || e.year)
                            ];
                            if (!items.length) items.push({ year: "", title: "", desc: "" });
                            const setItems = (next: TLEvent[]) => onChange({ ...block.data, _events: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Events</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Event" defaultItem={{ year: "", title: "", desc: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <Field label="Year / Date" value={item.year} onChange={(e: any) => update({ year: e.target.value })} placeholder="2024" />
                                                    <div className="col-span-2"><Field label="Title" value={item.title} onChange={(e: any) => update({ title: e.target.value })} placeholder="Milestone" /></div>
                                                </div>
                                                <Field label="Description" value={item.desc} onChange={(e: any) => update({ desc: e.target.value })} textarea rows={2} />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "code_block" && (
                            <>
                                <Field label="Heading (optional)" value={block.data.heading} onChange={set("heading")} placeholder="Quick Install" />
                                <Field label="Filename" value={block.data.filename} onChange={set("filename")} placeholder="index.html" />
                                <Field label="Code *" value={block.data.code} onChange={set("code")} textarea rows={8} placeholder="// Your code here" />
                                <Field label="Caption (optional)" value={block.data.caption} onChange={set("caption")} />
                            </>
                        )}
                        {block.type === "progress_bars" && (() => {
                            type Bar = { label: string; value: string };
                            const items: Bar[] = block.data._bars ?? [
                                ...([1,2,3,4].map(i => ({ label: block.data[`bar${i}Label`] || "", value: block.data[`bar${i}Value`] || "" }))).filter(b => b.label)
                            ];
                            if (!items.length) items.push({ label: "", value: "" });
                            const setItems = (next: Bar[]) => onChange({ ...block.data, _bars: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Bars</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Bar" defaultItem={{ label: "", value: "" }}
                                        renderItem={(item, update) => (
                                            <div className="grid grid-cols-[1fr_5rem] gap-2">
                                                <Field label="Label" value={item.label} onChange={(e: any) => update({ label: e.target.value })} placeholder="Skill Name" />
                                                <Field label="% (0-100)" value={item.value} onChange={(e: any) => update({ value: e.target.value })} placeholder="80" />
                                            </div>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "icon_cards" && (() => {
                            type ICard = { emoji: string; title: string; desc: string };
                            const items: ICard[] = block.data._cards ?? [
                                ...([1,2,3,4,5,6].map(i => ({ emoji: block.data[`card${i}Emoji`] || "", title: block.data[`card${i}Title`] || "", desc: block.data[`card${i}Desc`] || "" }))).filter(c => c.title)
                            ];
                            if (!items.length) items.push({ emoji: "", title: "", desc: "" });
                            const setItems = (next: ICard[]) => onChange({ ...block.data, _cards: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Cards</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Card" defaultItem={{ emoji: "⚡", title: "", desc: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <div className="grid grid-cols-[4rem_1fr] gap-2">
                                                    <Field label="Emoji" value={item.emoji} onChange={(e: any) => update({ emoji: e.target.value })} placeholder="🚀" />
                                                    <Field label="Title" value={item.title} onChange={(e: any) => update({ title: e.target.value })} />
                                                </div>
                                                <Field label="Description" value={item.desc} onChange={(e: any) => update({ desc: e.target.value })} textarea rows={2} />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "social_proof" && (() => {
                            type Badge = { emoji: string; value: string; label: string };
                            const items: Badge[] = block.data._badges ?? [
                                ...([1,2,3,4].map(i => ({ emoji: block.data[`badge${i}Emoji`] || "", value: block.data[`badge${i}Value`] || "", label: block.data[`badge${i}Label`] || "" }))).filter(b => b.value || b.label)
                            ];
                            if (!items.length) items.push({ emoji: "⭐", value: "", label: "" });
                            const setItems = (next: Badge[]) => onChange({ ...block.data, _badges: next });
                            return (
                                <>
                                    <Field label="Heading Label" value={block.data.heading} onChange={set("heading")} placeholder="Trusted by developers worldwide" />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Badges</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Badge" defaultItem={{ emoji: "⭐", value: "", label: "" }}
                                        renderItem={(item, update) => (
                                            <div className="grid grid-cols-[3rem_1fr_1fr] gap-2">
                                                <Field label="Icon" value={item.emoji} onChange={(e: any) => update({ emoji: e.target.value })} placeholder="⭐" />
                                                <Field label="Value" value={item.value} onChange={(e: any) => update({ value: e.target.value })} placeholder="10K+" />
                                                <Field label="Label" value={item.label} onChange={(e: any) => update({ label: e.target.value })} placeholder="Users" />
                                            </div>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "embed" && (
                            <>
                                <Field label="Heading (optional)" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Embed URL *" value={block.data.url} onChange={set("url")} placeholder="https://www.youtube.com/embed/..." />
                                <Field label="Height" value={block.data.height} onChange={set("height")} placeholder="480px" />
                            </>
                        )}
                        {block.type === "number_counter" && (() => {
                            type Counter = { prefix: string; value: string; suffix: string; label: string };
                            const items: Counter[] = block.data._counters ?? [
                                ...([1,2,3,4].map(i => ({ prefix: block.data[`num${i}Prefix`] || "", value: block.data[`num${i}Value`] || "", suffix: block.data[`num${i}Suffix`] || "", label: block.data[`num${i}Label`] || "" }))).filter(c => c.value || c.label)
                            ];
                            if (!items.length) items.push({ prefix: "", value: "", suffix: "+", label: "" });
                            const setItems = (next: Counter[]) => onChange({ ...block.data, _counters: next });
                            return (
                                <>
                                    <Field label="Section Heading (optional)" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Counters</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Counter" defaultItem={{ prefix: "", value: "", suffix: "+", label: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <div className="grid grid-cols-[3rem_1fr_3rem] gap-2">
                                                    <Field label="Prefix" value={item.prefix} onChange={(e: any) => update({ prefix: e.target.value })} placeholder="$" />
                                                    <Field label="Value" value={item.value} onChange={(e: any) => update({ value: e.target.value })} placeholder="10K" />
                                                    <Field label="Suffix" value={item.suffix} onChange={(e: any) => update({ suffix: e.target.value })} placeholder="+" />
                                                </div>
                                                <Field label="Label" value={item.label} onChange={(e: any) => update({ label: e.target.value })} placeholder="Users" />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "data_table" && (
                            <>
                                <Field label="Heading (optional)" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Column Headers (comma separated)" value={block.data.headers} onChange={set("headers")} placeholder="Name,Price,Status" />
                                <Field label="Rows (one per line, comma separated values)" value={block.data.rows} onChange={set("rows")} textarea rows={6} placeholder={`Row 1 Value 1,Value 2,Value 3\nRow 2 Value 1,Value 2,Value 3`} />
                            </>
                        )}
                        {block.type === "accordion" && (() => {
                            type QA = { q: string; a: string };
                            const items: QA[] = block.data._items ?? [
                                ...([1,2,3,4,5].map(i => ({ q: block.data[`q${i}`] || "", a: block.data[`a${i}`] || "" }))).filter(x => x.q)
                            ];
                            if (!items.length) items.push({ q: "", a: "" });
                            const setItems = (next: QA[]) => onChange({ ...block.data, _items: next });
                            return (
                                <>
                                    <Field label="Heading" value={block.data.heading} onChange={set("heading")} />
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-1">Items</p>
                                    <DynList items={items} setItems={setItems} addLabel="Add Item" defaultItem={{ q: "", a: "" }}
                                        renderItem={(item, update) => (
                                            <>
                                                <Field label="Question" value={item.q} onChange={(e: any) => update({ q: e.target.value })} />
                                                <Field label="Answer" value={item.a} onChange={(e: any) => update({ a: e.target.value })} textarea />
                                            </>
                                        )}
                                    />
                                </>
                            );
                        })()}
                        {block.type === "breadcrumb" && (
                            <>
                                <Field
                                    label="Items (format: Label,/path;Next,/path;Current,)"
                                    value={block.data.items}
                                    onChange={set("items")}
                                    textarea
                                    rows={3}
                                    placeholder="Home,/;Products,/products;Current Page,"
                                />
                                <p className="text-[10px] text-slate-500">Separate items with semicolons. Leave the last URL empty for the current page (not a link).</p>
                            </>
                        )}
                        {block.type === "quote" && (
                            <>
                                <Field label="Quote Text *" value={block.data.quote} onChange={set("quote")} textarea rows={4} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Author Name" value={block.data.author} onChange={set("author")} placeholder="Jane Doe" />
                                    <Field label="Role / Company" value={block.data.role} onChange={set("role")} placeholder="CEO at Acme" />
                                </div>
                                <Field label="Author Avatar URL (optional)" value={block.data.avatar} onChange={set("avatar")} placeholder="https://..." />
                            </>
                        )}
                        {block.type === "feature_highlight" && (
                            <>
                                <Field label="Badge (optional)" value={block.data.badge} onChange={set("badge")} />
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea />
                                <Field label="Image URL" value={block.data.image} onChange={set("image")} placeholder="https://..." />
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={block.data.reverse === 'true'} onChange={e => onChange({ ...block.data, reverse: e.target.checked ? 'true' : 'false' })} className="w-3.5 h-3.5 accent-brand-500" />
                                    Reverse layout (image on left)
                                </label>
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Features (up to 3)</p>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className="w-16"><Field label="Icon" value={block.data[`feat${i}Icon`]} onChange={set(`feat${i}Icon`)} placeholder="🚀" /></div>
                                        <div className="flex-1 space-y-1.5">
                                            <Field label={`Feature ${i} Title`} value={block.data[`feat${i}Title`]} onChange={set(`feat${i}Title`)} />
                                            <Field label="Description" value={block.data[`feat${i}Desc`]} onChange={set(`feat${i}Desc`)} textarea rows={2} />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function Field({ label, value, onChange, placeholder = "", textarea = false, rows = 3 }: {
    label: string; value: string; onChange: any; placeholder?: string; textarea?: boolean; rows?: number;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">{label}</label>
            {textarea ? (
                <textarea className="input" rows={rows} value={value || ""} onChange={onChange} placeholder={placeholder} />
            ) : (
                <input className="input" value={value || ""} onChange={onChange} placeholder={placeholder} />
            )}
        </div>
    );
}

// ─── Dynamic repeatable item list ─────────────────────────────────────────────

function DynList<T extends Record<string, string>>({
    items, setItems, addLabel, defaultItem, renderItem,
}: {
    items: T[];
    setItems: (items: T[]) => void;
    addLabel: string;
    defaultItem: T;
    renderItem: (item: T, update: (patch: Partial<T>) => void, idx: number) => React.ReactNode;
}) {
    const update = (i: number) => (patch: Partial<T>) =>
        setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-[#0D0D14] rounded-xl border border-surface-border group/item">
                    <div className="flex-1 space-y-2">{renderItem(item, update(i), i)}</div>
                    <button
                        onClick={() => remove(i)}
                        className="shrink-0 mt-0.5 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                        title="Remove"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
            <button
                onClick={() => setItems([...items, { ...defaultItem }])}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5 text-xs text-slate-500 hover:text-brand-400 font-semibold transition-all"
            >
                <Plus className="w-3.5 h-3.5" /> {addLabel}
            </button>
        </div>
    );
}

// ─── Page Manager List View ───────────────────────────────────────────────────

function PageList({ devToken, onEdit, onNew }: { devToken: string; onEdit: (id: string) => void; onNew: () => void }) {
    const rawPages = useQuery(api.pages.list, { devToken });
    const pages = rawPages ?? [];
    const togglePublish = useMutation(api.pages.togglePublish);
    const remove = useMutation(api.pages.remove);
    const createDefaultHome = useMutation(api.pages.createDefaultHome);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const copyUrl = (slug: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
    };

    const hasHome = pages.some((p: any) => p.slug === "");

    const handleCreateHome = async () => {
        const id = await createDefaultHome({ devToken });
        onEdit(id);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {deleteTarget && (
                <DeleteModal
                    onConfirm={async () => { await remove({ devToken, id: deleteTarget as any }); setDeleteTarget(null); }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            {pages.length === 0 && !hasHome ? (
                <div className="card border-dashed border-2 bg-transparent py-20 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-brand-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-lg">No pages yet</p>
                        <p className="text-slate-500 text-sm mt-1">Create your first custom page with the builder below.</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <button onClick={handleCreateHome} className="btn-primary">
                            <Plus className="w-4 h-4" /> Initialize Home Page
                        </button>
                        <button onClick={onNew} className="btn-ghost border border-surface-border">
                            <Plus className="w-4 h-4" /> Custom Page
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {/* Show persistent Home Page creation if missing */}
                    {rawPages !== undefined && !hasHome && (
                        <div className="card p-4 flex items-center gap-4 border-dashed border-2 hover:border-brand-500/50 transition-all cursor-pointer bg-brand-500/5" onClick={handleCreateHome}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-500/10 border border-brand-500/20">
                                <Globe className="w-5 h-5 text-brand-400 opacity-50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white font-semibold text-sm truncate">Home Page</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-600/30">Not Created</span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono">/ (home)</p>
                                <p className="text-slate-600 text-xs mt-0.5">Click to initialize your custom landing page.</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button className="btn-primary py-1 px-3 text-xs">Create Setup</button>
                            </div>
                        </div>
                    )}
                    {pages.map((page: any) => (
                        <div key={page._id} className="card p-4 flex items-center gap-4 hover:border-brand-500/30 transition-all">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${page.isPublished ? "bg-green-500/10 border border-green-500/20" : "bg-slate-700/30 border border-slate-600/30"}`}>
                                {page.isPublished ? <Globe className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-slate-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white font-semibold text-sm truncate">{page.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.isPublished ? "bg-green-500/15 text-green-400 border border-green-500/25" : "bg-slate-700/50 text-slate-500 border border-slate-600/30"}`}>
                                        {page.isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono">/{page.slug}</p>
                                <p className="text-slate-600 text-xs mt-0.5">{page.blocks.length} block{page.blocks.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {page.isPublished && (
                                    <a href={`/${page.slug}`} target="_blank" className="p-2 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all" title="View live">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                <button onClick={() => copyUrl(page.slug)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-all" title="Copy URL">
                                    {copied === page.slug ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => togglePublish({ devToken, id: page._id })}
                                    className={`p-2 rounded-lg transition-all ${page.isPublished ? "text-green-400 hover:text-orange-400 hover:bg-orange-500/10" : "text-slate-500 hover:text-green-400 hover:bg-green-500/10"}`}
                                    title={page.isPublished ? "Unpublish" : "Publish"}
                                >
                                    {page.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onEdit(page._id)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-all" title="Edit">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                {/* Animated delete button */}
                                <button
                                    onClick={() => setDeleteTarget(page._id)}
                                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all group/del"
                                    title="Delete page"
                                >
                                    <Trash2 className="w-4 h-4 group-hover/del:animate-bounce" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page Editor (Create / Edit) ──────────────────────────────────────────────

function PageEditor({ devToken, editId, onDone }: { devToken: string; editId: string | null; onDone: () => void }) {
    const existing = useQuery(api.pages.getById, editId ? { id: editId as any, devToken } : "skip");
    const createMut = useMutation(api.pages.create);
    const updateMut = useMutation(api.pages.update);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [meta, setMeta] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [showInMenu, setShowInMenu] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showBlockPicker, setShowBlockPicker] = useState(false);
    const [saved, setSaved] = useState(false);

    const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s\/]/g, "").replace(/\/{2,}/g, "/").trim().replace(/\s+/g, "-");

    useEffect(() => {
        if (existing) {
            setTitle(existing.title);
            setSlug(existing.slug);
            setMeta(existing.metaDescription || "");
            setIsPublished(existing.isPublished);
            setShowInMenu(existing.showInMenu || false);
            setBlocks(existing.blocks as Block[]);
        }
    }, [existing]);

    const addBlock = (type: BlockType) => {
        const def = BLOCK_TYPES.find(b => b.type === type)!;
        setBlocks(prev => [...prev, { id: `${type}-${Date.now()}`, type, data: { ...def.defaults } }]);
        setShowBlockPicker(false);
    };

    const updateBlock = (index: number, data: Record<string, any>) => setBlocks(prev => prev.map((b, i) => i === index ? { ...b, data } : b));
    const deleteBlock = (index: number) => setBlocks(prev => prev.filter((_, i) => i !== index));
    const moveBlock = (from: number, to: number) => {
        if (to < 0 || to >= blocks.length) return;
        setBlocks(prev => { const arr = [...prev]; [arr[from], arr[to]] = [arr[to], arr[from]]; return arr; });
    };

    const handleSave = async (publish?: boolean) => {
        if (!title.trim()) { setError("Title is required."); return; }
        // Allow empty slug for root home page
        const finalSlug = slug.trim() === "/" ? "" : slug.trim();
        setSaving(true); setError("");
        try {
            const finalPublish = publish !== undefined ? publish : isPublished;
            if (editId) {
                await updateMut({ devToken, id: editId as any, title: title.trim(), slug: finalSlug, metaDescription: meta || undefined, isPublished: finalPublish, showInMenu, blocks });
            } else {
                await createMut({ devToken, title: title.trim(), slug: finalSlug, metaDescription: meta || undefined, isPublished: finalPublish, showInMenu, blocks });
            }
            setSaved(true);
            setTimeout(() => { setSaved(false); if (!editId) onDone(); }, 800);
            if (publish !== undefined) setIsPublished(finalPublish);
        } catch (e: any) { setError(e.message || "Failed to save."); }
        finally { setSaving(false); }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <button onClick={onDone} className="btn-ghost flex items-center gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" /> All Pages
                </button>
                <div className="flex-1" />
                {error && <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">{error}</p>}
                <button onClick={() => handleSave(false)} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm">
                    <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : saved ? "Saved ✓" : "Save Draft"}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                    <Globe className="w-3.5 h-3.5" /> {isPublished ? "Update & Publish" : "Publish"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-3">
                    {/* Page settings */}
                    <div className="card p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" /> Page Settings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Page Title *</label>
                                <input className="input text-base font-semibold" placeholder="About Us" value={title}
                                    onChange={e => { setTitle(e.target.value); if (!editId) setSlug(autoSlug(e.target.value)); }} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1">Page Slug *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">/</span>
                                    <input className="input pl-6 font-mono text-sm" placeholder="catalog/about-us" value={slug} onChange={e => setSlug(e.target.value.replace(/^\/+/,''))} />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Status</label>
                                <div className={`flex items-center gap-2 h-[37px] px-3 rounded-lg border text-xs font-semibold ${isPublished ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-surface-border bg-surface text-slate-500"}`}>
                                    {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {isPublished ? "Published" : "Draft"}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Navigation Menu</label>
                                <label className="flex items-center gap-2 h-[37px] px-3 rounded-lg border border-surface-border bg-surface cursor-pointer hover:bg-surface-hover transition-colors">
                                    <input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} className="w-4 h-4 accent-brand-500" />
                                    <span className="text-xs font-semibold text-slate-300">Show in Top Menu</span>
                                </label>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Meta Description (SEO)</label>
                                <textarea className="input h-16 resize-none" placeholder="Brief description for search engines (150–160 chars)..." value={meta} onChange={e => setMeta(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Blocks */}
                    {blocks.map((block, i) => (
                        <BlockEditor
                            key={block.id} block={block} index={i} total={blocks.length}
                            onChange={data => updateBlock(i, data)}
                            onDelete={() => deleteBlock(i)}
                            onMoveUp={() => moveBlock(i, i - 1)}
                            onMoveDown={() => moveBlock(i, i + 1)}
                        />
                    ))}

                    {/* Add Block Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowBlockPicker(p => !p)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-surface-border hover:border-brand-500/40 hover:bg-brand-500/5 text-slate-500 hover:text-brand-400 transition-all text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" /> Add Block
                        </button>
                        {showBlockPicker && (
                            <div className="absolute left-0 right-0 top-14 z-50 card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 shadow-2xl ring-1 ring-brand-500/20 animate-slide-down">
                                {BLOCK_TYPES.map(bt => (
                                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                                        className="flex flex-col items-start gap-1.5 p-3 rounded-lg border border-surface-border hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left">
                                        <div className="text-brand-400">{bt.icon}</div>
                                        <span className="text-xs font-semibold text-white">{bt.label}</span>
                                        <span className="text-[10px] text-slate-500 leading-tight">{bt.description}</span>
                                    </button>
                                ))}
                                <button onClick={() => setShowBlockPicker(false)} className="col-span-2 sm:col-span-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-white py-1.5 transition-colors">
                                    <X className="w-3 h-3" /> Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Structure Sidebar */}
                <div className="space-y-4">
                    <div className="card p-4 sticky top-28">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> Page Structure
                        </h3>
                        {blocks.length === 0 ? (
                            <p className="text-slate-600 text-xs text-center py-6">No blocks yet.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {blocks.map((block, i) => {
                                    const def = BLOCK_TYPES.find(b => b.type === block.type)!;
                                    return (
                                        <div key={block.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-hover text-xs border border-transparent hover:border-brand-500/20 hover:bg-brand-500/5 transition-all">
                                            <span className="text-brand-400 shrink-0">{def.icon}</span>
                                            <span className="text-slate-300 truncate flex-1 min-w-0">{block.data.heading || block.data.sectionHeading || block.data.title || def.label}</span>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <button
                                                    onClick={() => moveBlock(i, i - 1)}
                                                    disabled={i === 0}
                                                    title="Move up"
                                                    className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronUp className="w-3 h-3" />
                                                </button>
                                                <span className="text-slate-600 text-[10px] font-mono w-4 text-center">{i + 1}</span>
                                                <button
                                                    onClick={() => moveBlock(i, i + 1)}
                                                    disabled={i === blocks.length - 1}
                                                    title="Move down"
                                                    className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {title && slug && (
                            <div className="mt-4 pt-4 border-t border-surface-border">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Live URL</p>
                                <a href={`/${slug.replace(/^\/+/,'')}`} target="_blank" className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono truncate">
                                    /{slug.replace(/^\/+/,'')} <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page Builder ────────────────────────────────────────────────────────

function PageBuilderContent() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "new" | "edit">("list");
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    if (currentUser === undefined) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center">
                    <div className="skeleton w-16 h-16 rounded-full mb-4" />
                    <p className="text-slate-500 animate-pulse">Loading Page Builder...</p>
                </div>
            </div>
        );
    }

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-24 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
                    <p className="text-slate-400 mb-8">Only Super Admins can access the Page Builder.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen"><Navbar />
            <main className="max-w-5xl mx-auto px-4 pt-28 pb-16">
                <div className="flex items-center justify-between mb-8 animate-slide-up">
                    <div>
                        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <FileText className="w-3.5 h-3.5" /> Admin · Page Builder
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {view === "list" ? "Custom Pages" : view === "new" ? "New Page" : "Edit Page"}
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            {view === "list" ? "Create and manage public pages with your brand theme." : "Use blocks to build the page layout."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {view === "list" && (
                            <>
                                <Link href="/admin" className="btn-ghost flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Admin</Link>
                                <button onClick={() => { setEditId(null); setView("new"); }} className="btn-primary flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> New Page
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {view === "list" && devToken && (
                    <PageList devToken={devToken} onEdit={id => { setEditId(id); setView("edit"); }} onNew={() => { setEditId(null); setView("new"); }} />
                )}
                {(view === "new" || view === "edit") && devToken && (
                    <PageEditor devToken={devToken} editId={editId} onDone={() => { setView("list"); setEditId(null); }} />
                )}
            </main>
        </div>
    );
}

export default function PageBuilderPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return (
        <div className="min-h-screen"><Navbar />
            <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center">
                <div className="skeleton w-16 h-16 rounded-full mb-4" />
                <p className="text-slate-500 animate-pulse">Initializing...</p>
            </div>
        </div>
    );
    return <PageBuilderContent />;
}
