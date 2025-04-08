"use client"

import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BicepsFlexed, Dumbbell, Salad, ArrowRight, UserCircle2 } from "lucide-react";
import fithome from "../../public/devinefithome.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const pixelRef = useRef(null);

  // Minecraft-style pixel animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (pixelRef.current) {
        const pixels = pixelRef.current.querySelectorAll(".pixel");
        pixels.forEach(pixel => {
          if (Math.random() > 0.98) {
            pixel.style.opacity = (Math.random() > 0.5) ? "1" : "0.8";
          }
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9ECCC] font-pixel">
      {/* Background pixel grid */}
      <div
        ref={pixelRef}
        className="fixed inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(40,1fr)] pointer-events-none z-0 opacity-10"
      >
        {[...Array(1600)].map((_, i) => (
          <div
            key={i}
            className="pixel bg-[#5D4037] border border-[#8D6E63]"
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="bg-[#795548] border-b-4 border-[#3E2723] px-6 py-3 relative z-10 shadow-[0_4px_0_#3E2723]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BicepsFlexed className="h-8 w-8 text-[#FFD54F]" />
            <span className="text-3xl font-bold text-[#FFD54F] tracking-wider">
              DevineFit
            </span>
          </div>

          <div className="hidden md:flex gap-6 items-center">
            <Button variant="ghost" className="text-[#FFD54F] hover:bg-[#3E2723] hover:text-[#FFD54F] border-2 border-[#3E2723] shadow-[2px_2px_0_#3E2723]">
              Features
            </Button>
            <Button variant="ghost" className="text-[#FFD54F] hover:bg-[#3E2723] hover:text-[#FFD54F] border-2 border-[#3E2723] shadow-[2px_2px_0_#3E2723]">
              About
            </Button>
            <Button variant="ghost" className="text-[#FFD54F] hover:bg-[#3E2723] hover:text-[#FFD54F] border-2 border-[#3E2723] shadow-[2px_2px_0_#3E2723]">
              Contact
            </Button>
          </div>

          <Link href="/login" passHref>
            <Button className="bg-[#3E2723] hover:bg-[#5D4037] text-[#FFD54F] border-2 border-[#3E2723] shadow-[3px_3px_0_#3E2723]">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-[#3E2723] leading-tight mb-6 tracking-wide">
              LEVEL UP <br />
              YOUR FITNESS JOURNEY
            </h1>
            <p className="text-xl text-[#5D4037] mb-8 tracking-wide">
              Personalized workouts, posture correction, and AI-powered
              coaching to help you achieve your fitness goals.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/register" passHref>
                <Button className="bg-[#FF6D00] hover:bg-[#F57C00] text-[#3E2723] border-4 border-[#3E2723] shadow-[4px_4px_0_#3E2723] text-lg px-6 py-6 font-bold">
                  START YOUR QUEST
                </Button>
              </Link>
              <Link href="/about" passHref>
                <Button variant="outline" className="bg-transparent hover:bg-[#795548] hover:text-[#FFD54F] text-[#3E2723] border-4 border-[#3E2723] shadow-[4px_4px_0_#3E2723] text-lg px-6 py-6">
                  LEARN MORE
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-72 h-72 md:w-96 md:h-96 border-8 border-[#3E2723] bg-[#795548] shadow-[8px_8px_0_#3E2723]">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                {[...Array(64)].map((_, i) => (
                  <div key={i} className="border border-[#3E2723] opacity-20" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={fithome}
                  alt="Pixel Fitness Character"
                  width={300}
                  height={300}
                  className="object-contain"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20 bg-[#795548]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-[#FFD54F] mb-16 tracking-wide">
            BUILD YOUR FITNESS ADVENTURE
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="POSTURE ANALYSIS"
              icon={<Dumbbell size={48} className="text-[#FFD54F]" />}
              description="Real-time posture feedback and exercise form correction using our advanced AI technology."
            />
            <FeatureCard
              title="DIET PLANNING"
              icon={<Salad size={48} className="text-[#FFD54F]" />}
              description="Customized nutrition plans to fuel your fitness journey and maximize your results."
            />
            <FeatureCard
              title="AI MENTORSHIP"
              icon={<UserCircle2 size={48} className="text-[#FFD54F]" />}
              description="Personal AI trainer that adapts to your progress and provides motivation when you need it."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 bg-[#F9ECCC]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-[#3E2723] mb-6 tracking-wide">
              READY TO EMBARK ON YOUR FITNESS QUEST?
            </h2>
            <p className="text-xl text-[#5D4037] mb-8">
              Join thousands of players who have transformed their health stats with DevineFit.
            </p>
            <Link href="/register" passHref>
              <Button className="bg-[#FF6D00] hover:bg-[#F57C00] text-[#3E2723] border-4 border-[#3E2723] shadow-[4px_4px_0_#3E2723] text-lg px-10 py-7 font-bold">
                CREATE YOUR CHARACTER <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#3E2723] px-6 py-10 border-t-4 border-[#5D4037]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <BicepsFlexed className="h-8 w-8 text-[#FFD54F]" />
              <span className="text-2xl font-bold text-[#FFD54F]">DevineFit</span>
            </div>

            <div className="flex gap-6">
              <Link href="#" className="text-[#FFD54F] hover:text-[#FFECB3]">
                Privacy
              </Link>
              <Link href="#" className="text-[#FFD54F] hover:text-[#FFECB3]">
                Terms
              </Link>
              <Link href="#" className="text-[#FFD54F] hover:text-[#FFECB3]">
                Support
              </Link>
            </div>
          </div>

          <Separator className="my-6 bg-[#5D4037]" />

          <div className="text-center text-[#FFD54F]">
            © 2025 DevineFit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, icon, description }) {
  return (
    <Card className="border-4 border-[#3E2723] bg-[#F9ECCC] shadow-[4px_4px_0_#3E2723] p-6 transition-transform hover:-translate-y-1">
      <div className="flex flex-col items-center text-center">
        <div className="bg-[#3E2723] p-4 rounded mb-4 border-2 border-[#5D4037]">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-[#3E2723] mb-3 tracking-wide">
          {title}
        </h3>
        <p className="text-[#5D4037]">
          {description}
        </p>
      </div>
    </Card>
  );
}