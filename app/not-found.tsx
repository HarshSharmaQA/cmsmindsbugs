import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />
            
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 pt-32 pb-20">
                <div className="max-w-5xl mx-auto px-4 text-center flex flex-col items-center justify-center">
                    <img 
                        src="/404-logo.png" 
                        alt="BugScribe 404 Logo" 
                        className="w-[300px] h-auto mb-8 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
                    />
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Oops! Page Not Found</h1>
                    <p className="text-slate-400 mb-10 text-lg max-w-lg mx-auto leading-relaxed">
                        We couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you might have mistyped the address.
                    </p>
                    <Link href="/" className="btn-primary inline-flex">
                        Return Home
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
