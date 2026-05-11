import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "UGX 0",
    period: "forever",
    description: "Perfect for individuals protecting a few personal items.",
    badge: null,
    features: [
      "Up to 5 registered assets",
      "QR code generation",
      "Basic ownership verification",
      "Stolen item reporting",
      "Email notifications",
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "UGX 15,000",
    period: "per month",
    description: "For individuals and families with multiple valuable assets.",
    badge: "Most Popular",
    features: [
      "Up to 50 registered assets",
      "QR code generation",
      "Priority verification",
      "SMS alerts (MTN & Airtel)",
      "Ownership transfer history",
      "Evidence document storage",
      "IMEI blacklisting (UCC)",
      "Parent-child asset hierarchy",
    ],
    cta: "Start Premium",
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    price: "UGX 50,000",
    period: "per month",
    description: "For businesses, dealers, and high-volume asset management.",
    badge: null,
    features: [
      "Unlimited registered assets",
      "All Premium features",
      "API access",
      "Bulk asset registration",
      "Advanced analytics dashboard",
      "Dedicated account manager",
      "UPF direct integration",
      "Custom branding on QR codes",
      "Priority law enforcement support",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-foreground">Garget Register</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect your assets with Uganda's most trusted ownership registry. 
            Start free and upgrade as your needs grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 relative ${plan.highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-3 py-1">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isAuthenticated ? (
                  <Button
                    className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => {
                      if (plan.id === "business") {
                        toast.info("Contact us at info@gargetregister.ug for Business pricing.");
                      } else {
                        toast.info("Billing integration coming soon! You'll be notified when available.");
                      }
                    }}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <a href={getLoginUrl()}>
                    <Button
                      className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90" : ""}`}
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-display font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "What is NIN verification?", a: "Your National Identification Number (NIN) issued by NIRA is required to verify your identity and enable theft reporting and ownership transfers." },
              { q: "How does IMEI blacklisting work?", a: "When you report a phone stolen, we automatically submit the IMEI to UCC's Simu Klear system, which blocks the device on all Ugandan networks." },
              { q: "Can I transfer ownership to anyone?", a: "You can transfer to any verified Garget Register user with a valid NIN. Both parties must confirm the transfer." },
              { q: "What happens when I scan a stolen item?", a: "The scan returns STOLEN status immediately, and the original owner is notified via SMS and push notification." },
            ].map(({ q, a }) => (
              <div key={q} className="p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold text-foreground mb-2">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
