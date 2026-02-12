import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <Hero />
      <Footer />
    </main>
  );
}
