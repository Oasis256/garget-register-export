import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield, QrCode, Bell, MapPin, Users, Lock,
  CheckCircle2, ArrowRight, Smartphone, Car, Laptop,
  Building2, Scale, Star, ChevronRight, Globe, Zap
} from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS = {
  CLEAN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  STOLEN: "bg-red-100 text-red-800 border-red-200",
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  UNVERIFIED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-foreground">Garget Register</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Uganda</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#integrations" className="hover:text-foreground transition-colors">Integrations</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Get Started Free
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-emerald-800 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="container relative py-20 lg:py-28">
          <div className="max-w-4xl">
            <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/25 text-sm px-3 py-1">
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Uganda's National Asset Registry
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Protect What You Own.{" "}
              <span className="text-amber-300">Verify Before You Buy.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mb-8 leading-relaxed">
              Uganda's most trusted digital asset registry. Register your gadgets, vehicles, and valuables. 
              Instantly verify ownership before any purchase. Stop stolen property resale at the point of sale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold px-8 w-full sm:w-auto">
                  Register Your Assets Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <Link href="/verify">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8 w-full sm:w-auto bg-transparent">
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan & Verify an Item
                </Button>
              </Link>
            </div>
            {/* Status Pills */}
            <div className="flex flex-wrap gap-2">
              {(["CLEAN", "STOLEN", "PENDING", "UNVERIFIED"] as const).map((s) => (
                <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[s]}`}>
                  <span className={`w-2 h-2 rounded-full ${s === "CLEAN" ? "bg-emerald-500" : s === "STOLEN" ? "bg-red-500" : s === "PENDING" ? "bg-amber-500" : "bg-slate-400"}`} />
                  {s}
                </span>
              ))}
              <span className="text-white/60 text-xs self-center ml-1">— Instant verification results</span>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "7,330+", label: "Phone thefts reported in Uganda (2024)", icon: Smartphone },
              { value: "UGX 6.79B", label: "Annual loss from gadget theft", icon: Shield },
              { value: "18M+", label: "Smartphone users in Uganda", icon: Users },
              { value: "Real-time", label: "UPF & UCC integration", icon: Zap },
            ].map((stat) => (
              <Card key={stat.label} className="text-center p-6 border-border">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-snug">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Platform Features</Badge>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Everything You Need to Stay Protected
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From registration to recovery — a complete lifecycle solution for asset ownership in Uganda.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: QrCode,
                title: "QR Code Registration",
                desc: "Register any asset with a unique QR code. Scan to instantly verify ownership status before buying.",
                color: "text-primary bg-primary/10",
              },
              {
                icon: Shield,
                title: "Stolen Item Reporting",
                desc: "Report stolen items with police case numbers. Automatic UPF crime report submission and UCC IMEI blacklisting.",
                color: "text-red-600 bg-red-50",
              },
              {
                icon: Bell,
                title: "Real-time Alerts",
                desc: "Instant push notifications and SMS alerts when your asset is scanned, transferred, or flagged as stolen.",
                color: "text-amber-600 bg-amber-50",
              },
              {
                icon: MapPin,
                title: "GPS Location Tracking",
                desc: "Track last-known location of stolen assets on an interactive map. Location updates pushed to UPF for active cases.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: Users,
                title: "Ownership Transfer",
                desc: "Secure digital ownership transfer with NIN verification. Complete chain-of-custody history for every asset.",
                color: "text-purple-600 bg-purple-50",
              },
              {
                icon: Scale,
                title: "Law Enforcement Portal",
                desc: "Dedicated portal for Uganda Police Force with warrant-based asset lookup and evidence export packages.",
                color: "text-slate-600 bg-slate-100",
              },
            ].map((f) => (
              <Card key={f.title} className="p-6 border-border hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Simple. Secure. Instant.
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Owner Flow */}
            <div>
              <h3 className="font-display font-bold text-xl text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">O</div>
                For Asset Owners
              </h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Register with NIN", desc: "Verify your identity using your Uganda National ID Number (NIN) via NIRA integration." },
                  { step: "2", title: "Register Your Assets", desc: "Add your phone, laptop, vehicle, or any valuable item with serial number, IMEI, or photos." },
                  { step: "3", title: "Get Your QR Code", desc: "Each asset gets a unique QR code. Affix it to your item for instant verification." },
                  { step: "4", title: "Approve Verifications", desc: "When a buyer scans your item, approve or reject with one tap. Get SMS alerts instantly." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{s.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Buyer Flow */}
            <div>
              <h3 className="font-display font-bold text-xl text-foreground mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">B</div>
                For Buyers
              </h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Scan Before You Buy", desc: "Scan the QR code or enter the IMEI/serial number of any second-hand item." },
                  { step: "2", title: "Request Verification", desc: "A verification request is sent to the registered owner in real-time." },
                  { step: "3", title: "Get Instant Result", desc: "Receive a CLEAN, STOLEN, PENDING, or UNVERIFIED result with a signed digital receipt." },
                  { step: "4", title: "Buy with Confidence", desc: "A CLEAN result with owner approval means the item is safe to purchase." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{s.step}</div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{s.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Asset Categories ── */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-bold text-foreground">Register Any Asset</h2>
            <p className="text-muted-foreground mt-2">From smartphones to vehicles — protect everything you own.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: Smartphone, label: "Smartphones" },
              { icon: Laptop, label: "Laptops & Tablets" },
              { icon: Car, label: "Vehicles" },
              { icon: Building2, label: "Business Equipment" },
              { icon: QrCode, label: "Cameras & Electronics" },
              { icon: Shield, label: "High-Value Items" },
            ].map((cat) => (
              <div key={cat.label} className="flex items-center gap-2 bg-white border border-border rounded-full px-5 py-2.5 shadow-sm">
                <cat.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section id="integrations" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Trusted Integrations</Badge>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Connected to Uganda's National Infrastructure
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Garget Register integrates directly with government systems to provide real enforcement power.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Uganda Police Force", abbr: "UPF", desc: "Automatic crime report submission and real-time stolen item alerts to law enforcement.", color: "bg-blue-50 border-blue-200 text-blue-800" },
              { name: "UCC Simu Klear", abbr: "CEIR", desc: "Instant IMEI blacklisting on all Ugandan mobile networks when a phone is reported stolen.", color: "bg-red-50 border-red-200 text-red-800" },
              { name: "NIRA", abbr: "NIN", desc: "National ID verification through NIRA ensures every registered user is a verified Ugandan citizen.", color: "bg-green-50 border-green-200 text-green-800" },
              { name: "MTN & Airtel", abbr: "MoMo", desc: "Pay for premium plans using MTN Mobile Money or Airtel Money — Uganda's preferred payment methods.", color: "bg-amber-50 border-amber-200 text-amber-800" },
            ].map((intg) => (
              <Card key={intg.name} className="p-6 border-border">
                <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border mb-4 ${intg.color}`}>
                  {intg.abbr}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{intg.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{intg.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
              Affordable Protection for Every Ugandan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade when you need more. All prices in Uganda Shillings.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Free",
                price: "UGX 0",
                period: "forever",
                desc: "Get started protecting your most important items.",
                features: ["Register up to 2 items", "Basic scan verification", "QR code generation", "Email support"],
                cta: "Start Free",
                highlight: false,
              },
              {
                name: "Premium",
                price: "UGX 10,000",
                period: "per year",
                desc: "Full protection for individuals with multiple assets.",
                features: ["Unlimited asset registration", "Theft alerts & SMS notifications", "GPS tracking history", "IMEI blacklisting", "Ownership transfer", "Priority support"],
                cta: "Get Premium",
                highlight: true,
              },
              {
                name: "Business",
                price: "UGX 50,000",
                period: "per year",
                desc: "Fleet and team management for businesses.",
                features: ["Everything in Premium", "Up to 10 team members", "Fleet management dashboard", "API access", "Dedicated account manager", "Custom reporting"],
                cta: "Contact Us",
                highlight: false,
              },
            ].map((plan) => (
              <Card key={plan.name} className={`relative p-6 ${plan.highlight ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={getLoginUrl()}>
                  <Button
                    className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90" : "variant-outline border-border"}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Pay with MTN Mobile Money or Airtel Money. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Roles CTA ── */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Built for Everyone</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: "Asset Owner", icon: Shield, desc: "Register, protect, and manage all your valuable assets.", color: "bg-primary text-primary-foreground" },
              { role: "Buyer", icon: QrCode, desc: "Verify ownership before purchasing any second-hand item.", color: "bg-amber-500 text-white" },
              { role: "Law Enforcement", icon: Scale, desc: "Access warrant-based asset lookup and evidence export tools.", color: "bg-blue-700 text-white" },
              { role: "Business / Fleet", icon: Building2, desc: "Manage company assets, employee access, and fleet tracking.", color: "bg-slate-700 text-white" },
            ].map((r) => (
              <Card key={r.role} className="p-6 border-border hover:shadow-md transition-shadow text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${r.color}`}>
                  <r.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{r.role}</h3>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            Start Protecting Your Assets Today
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of Ugandans who trust Garget Register to protect their property. 
            Free to start — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold px-10">
                Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 px-10 bg-transparent">
                <QrCode className="w-5 h-5 mr-2" />
                Try Verification Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-background/70 py-12">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-background">Garget Register</span>
              </div>
              <p className="text-xs leading-relaxed">Uganda's national asset ownership verification platform. Powered by The N-Line Project Ltd.</p>
            </div>
            <div>
              <h4 className="font-semibold text-background mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-xs">
                {["Asset Registration", "Ownership Verification", "Stolen Reporting", "Law Enforcement"].map(l => (
                  <li key={l}><a href="#" className="hover:text-background transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-background mb-3 text-sm">Integrations</h4>
              <ul className="space-y-2 text-xs">
                {["Uganda Police Force (UPF)", "UCC Simu Klear (CEIR)", "NIRA Identity Verification", "MTN & Airtel Mobile Money"].map(l => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-background mb-3 text-sm">Support</h4>
              <ul className="space-y-2 text-xs">
                {["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"].map(l => (
                  <li key={l}><a href="#" className="hover:text-background transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <Separator className="bg-background/10 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p>© {new Date().getFullYear()} Garget Register. All rights reserved. The N-Line Project Ltd, Uganda.</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL Secured</span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> SHA-256 Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
