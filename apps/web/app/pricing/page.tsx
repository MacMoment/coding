import Link from 'next/link';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out the platform',
    features: [
      '100 tokens/month',
      '10 daily claim tokens',
      '1 private project',
      'Basic models only',
      'Community support',
    ],
    buttonText: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 9.99,
    description: 'For hobbyist developers',
    features: [
      '1,000 tokens/month',
      '25 daily claim tokens',
      '5 private projects',
      'Standard models',
      'Email support',
    ],
    buttonText: 'Subscribe',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 29.99,
    description: 'For serious developers',
    features: [
      '5,000 tokens/month',
      '50 daily claim tokens',
      '25 private projects',
      'All standard models',
      'Priority queue',
      'Priority support',
    ],
    buttonText: 'Subscribe',
    highlighted: true,
  },
  {
    name: 'Elite',
    price: 99.99,
    description: 'For teams and power users',
    features: [
      '25,000 tokens/month',
      '100 daily claim tokens',
      'Unlimited private projects',
      'All models including Opus',
      'Priority queue',
      'Dedicated support',
      'Custom integrations',
    ],
    buttonText: 'Subscribe',
    highlighted: false,
  },
];

const tokenPacks = [
  { name: 'Small Pack', tokens: 500, price: 4.99 },
  { name: 'Medium Pack', tokens: 2000, bonus: 200, price: 14.99 },
  { name: 'Large Pack', tokens: 5000, bonus: 750, price: 29.99 },
  { name: 'Mega Pack', tokens: 15000, bonus: 3000, price: 79.99 },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ForgeCraft AI</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
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

      <main className="container py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-[600px] mx-auto">
            Start free and upgrade as you grow. All plans include access to our AI-powered code generation.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col ${plan.highlighted ? 'border-primary shadow-lg' : ''}`}
            >
              <CardHeader>
                {plan.highlighted && (
                  <div className="text-xs font-medium text-primary mb-2">MOST POPULAR</div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/signup" className="w-full">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Token Packs */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tighter">Need More Tokens?</h2>
            <p className="mt-4 text-muted-foreground">
              Buy token packs anytime. Tokens never expire!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {tokenPacks.map((pack) => (
              <Card key={pack.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{pack.tokens.toLocaleString()}</span>
                    <span className="text-muted-foreground"> tokens</span>
                  </div>
                  {pack.bonus && (
                    <div className="text-sm text-primary">+{pack.bonus} bonus!</div>
                  )}
                </CardHeader>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    ${pack.price}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQ
              question="What are tokens?"
              answer="Tokens are the currency used for AI code generation. Each generation costs tokens based on the model used and the output size. You receive tokens monthly with your subscription and can also claim free tokens daily."
            />
            <FAQ
              question="Do tokens expire?"
              answer="No, tokens never expire! Once you receive tokens, they stay in your account until you use them."
            />
            <FAQ
              question="Can I change my plan?"
              answer="Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll receive the new token allocation immediately. When downgrading, the change takes effect at the end of your billing cycle."
            />
            <FAQ
              question="What's the difference between models?"
              answer="Different AI models have different capabilities and costs. Basic models are fast and cost-effective, while advanced models like Claude Opus provide higher quality output for complex projects."
            />
            <FAQ
              question="Can I get a refund?"
              answer="We offer a 7-day money-back guarantee for first-time subscribers. If you're not satisfied, contact our support team for a full refund."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 mt-16">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ForgeCraft AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ForgeCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}
