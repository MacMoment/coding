import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Code2,
  Rocket,
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ForgeCraft AI</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/community" className="text-sm font-medium hover:text-primary">
              Community
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary">
              Docs
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-24 md:py-32">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              AI-Powered Development Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Build Minecraft Plugins &<br />
              <span className="text-primary">Discord Bots</span> with AI
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
              Generate production-ready code, edit in a web IDE, deploy instantly.
              ForgeCraft AI transforms your ideas into working projects in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8">
                  Start Building Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/community">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Browse Gallery
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container py-24 bg-muted/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need to Build
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools for Minecraft and Discord development
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Sparkles className="h-10 w-10" />}
              title="AI Code Generation"
              description="Describe what you want and get production-ready code instantly. Supports multiple AI models."
            />
            <FeatureCard
              icon={<Code2 className="h-10 w-10" />}
              title="Web IDE"
              description="Full-featured code editor with syntax highlighting, file management, and live preview."
            />
            <FeatureCard
              icon={<Rocket className="h-10 w-10" />}
              title="One-Click Deploy"
              description="Deploy Discord bots instantly to our cloud infrastructure. No server setup required."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10" />}
              title="Version Checkpoints"
              description="Save and restore project states. Never lose your work with automatic checkpoints."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Community Gallery"
              description="Share your creations and discover projects from other developers."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10" />}
              title="Smart Docs"
              description="AI-powered documentation search. Get relevant API info injected into your prompts."
            />
          </div>
        </section>

        {/* Platforms Section */}
        <section className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Supported Platforms
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-lg border bg-card p-8">
              <h3 className="text-2xl font-bold mb-4">Minecraft</h3>
              <ul className="space-y-3">
                <PlatformItem>Spigot Plugins (Java)</PlatformItem>
                <PlatformItem>Paper Plugins (Java/Kotlin)</PlatformItem>
                <PlatformItem>Fabric Mods</PlatformItem>
                <PlatformItem>Forge Mods</PlatformItem>
              </ul>
            </div>
            <div className="rounded-lg border bg-card p-8">
              <h3 className="text-2xl font-bold mb-4">Discord</h3>
              <ul className="space-y-3">
                <PlatformItem>Discord.js Bots (TypeScript)</PlatformItem>
                <PlatformItem>discord.py Bots (Python)</PlatformItem>
                <PlatformItem>One-Click Deployment</PlatformItem>
                <PlatformItem>Environment Secrets</PlatformItem>
              </ul>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="container py-24 bg-muted/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, upgrade as you grow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              features={['100 tokens/month', '1 private project', 'Basic models', 'Community support']}
            />
            <PricingCard
              name="Starter"
              price="$9.99"
              features={['1,000 tokens/month', '5 private projects', 'Standard models', 'Email support']}
            />
            <PricingCard
              name="Pro"
              price="$29.99"
              features={['5,000 tokens/month', '25 private projects', 'All standard models', 'Priority support']}
              highlighted
            />
            <PricingCard
              name="Elite"
              price="$99.99"
              features={['25,000 tokens/month', 'Unlimited projects', 'All models', 'Dedicated support']}
            />
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Full Pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container py-24">
          <div className="rounded-lg border bg-gradient-to-r from-primary/10 to-primary/5 p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Start Building?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-[600px] mx-auto">
              Join thousands of developers using AI to build amazing Minecraft plugins and Discord bots.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="mt-8 text-lg px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ForgeCraft AI</span>
          </div>
          <div className="flex space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/docs" className="hover:text-foreground">Documentation</Link>
            <Link href="/support" className="hover:text-foreground">Support</Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            © 2024 ForgeCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 transition-colors hover:bg-accent/50">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function PlatformItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center">
      <CheckCircle className="h-5 w-5 text-primary mr-2" />
      {children}
    </li>
  );
}

function PricingCard({
  name,
  price,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        highlighted ? 'border-primary bg-primary/5' : 'bg-card'
      }`}
    >
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-3xl font-bold mt-2">
        {price}
        <span className="text-sm font-normal text-muted-foreground">/mo</span>
      </p>
      <ul className="mt-6 space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-primary mr-2" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
