import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  Plane,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  TrendingDown,
  Globe2,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cheap-flights")({
  head: () => ({
    meta: [
      { title: "Cheap Flights — Compare & Book Low-Cost Airfare | Jaqtryp AI" },
      {
        name: "description",
        content:
          "Find cheap flights worldwide with AI-powered search. Compare hundreds of airlines, get fare alerts, and book the lowest airfare in EUR with Brazilian or international cards.",
      },
      {
        name: "keywords",
        content:
          "cheap flights, low-cost airfare, flight deals, compare flights, cheap airline tickets, last minute flights, international flights",
      },
      { property: "og:title", content: "Cheap Flights — Compare & Book Low-Cost Airfare" },
      {
        property: "og:description",
        content:
          "AI-powered search across hundreds of airlines. Find and book the cheapest flights in EUR.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/cheap-flights" },
    ],
    links: [{ rel: "canonical", href: "/cheap-flights" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do I find the cheapest flights?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Use Jaqtryp AI to compare hundreds of airlines instantly. Our AI scans live fares, suggests flexible dates, and alerts you when prices drop.",
              },
            },
            {
              "@type": "Question",
              name: "When is the best time to book cheap flights?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "On average 4–8 weeks before domestic flights and 2–6 months before international flights. Tuesdays and Wednesdays usually offer the lowest fares.",
              },
            },
            {
              "@type": "Question",
              name: "Can I pay in EUR with a Brazilian card?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Jaqtryp AI processes payments securely in EUR and accepts both Brazilian and international cards.",
              },
            },
            {
              "@type": "Question",
              name: "Are last-minute flights cheaper?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Sometimes — airlines occasionally drop last-minute fares to fill seats. Set a fare alert and let our AI watch the route for you.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: CheapFlightsLanding,
});

function CheapFlightsLanding() {
  const navigate = useNavigate();
  const [origin, setOrigin] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [departure, setDeparture] = React.useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const intent = [origin, destination, departure].filter(Boolean).join(" ");
    navigate({
      to: "/signup",
      search: intent ? { intent: `cheap flights ${intent}` } : { intent: "cheap flights" },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[140px]" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary-glow/20 blur-[140px]" />
        </div>
        <div className="mx-auto max-w-6xl px-4 text-center md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
            <TrendingDown className="h-3.5 w-3.5" />
            Live fares from 500+ airlines
          </div>
          <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Cheap Flights,
            <br />
            <span className="text-gradient">Smarter Search</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Compare cheap airline tickets worldwide. Our AI finds the lowest fare,
            tracks prices for you, and books in EUR with Brazilian or international cards.
          </p>

          <form
            onSubmit={onSearch}
            className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-2 rounded-2xl border border-border bg-card/60 p-2 shadow-elegant backdrop-blur md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="From (e.g. GRU)"
              className="h-12 border-0 bg-transparent focus-visible:ring-0"
              aria-label="Origin"
            />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="To (e.g. LIS)"
              className="h-12 border-0 bg-transparent focus-visible:ring-0"
              aria-label="Destination"
            />
            <Input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="h-12 border-0 bg-transparent focus-visible:ring-0"
              aria-label="Departure date"
            />
            <Button type="submit" size="lg" className="h-12 bg-gradient-primary shadow-glow">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" /> 4.9/5 from travelers
            </div>
            <div>EUR pricing</div>
            <div>Brazilian + international cards</div>
            <div>Free fare alerts</div>
          </div>
        </div>
      </section>

      {/* WHY CHEAP */}
      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
              Why our cheap flights are actually cheap
            </h2>
            <p className="mt-4 text-muted-foreground">
              No hidden upsells, no inflated base fare. Just a transparent EUR price across
              hundreds of carriers.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                t: "AI fare hunter",
                d: "We scan flexible dates, hidden city routes, and stopover combos to surface fares humans miss.",
              },
              {
                icon: TrendingDown,
                t: "Price-drop alerts",
                d: "Track any route. Get notified the moment the fare drops below your target.",
              },
              {
                icon: ShieldCheck,
                t: "Transparent checkout",
                d: "See the exact EUR price, taxes and service fee before you pay. No surprises.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.t}
                  className="rounded-2xl border border-border bg-gradient-card p-6 shadow-elegant"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
              <Link to="/signup" search={{ intent: "cheap flights" }}>
                Find cheap flights now <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            Popular cheap flight routes
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Trending searches from travelers using Jaqtryp AI this week.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { from: "São Paulo", to: "Lisbon", code: "GRU → LIS", price: "from €389" },
              { from: "Rio de Janeiro", to: "Madrid", code: "GIG → MAD", price: "from €412" },
              { from: "São Paulo", to: "Paris", code: "GRU → CDG", price: "from €445" },
              { from: "Brasília", to: "Miami", code: "BSB → MIA", price: "from €398" },
              { from: "Porto Alegre", to: "Rome", code: "POA → FCO", price: "from €478" },
              { from: "Recife", to: "London", code: "REC → LHR", price: "from €462" },
            ].map((r) => (
              <Link
                key={r.code}
                to="/signup"
                search={{ intent: `cheap flights ${r.from} to ${r.to}` }}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card/60 p-5 transition-all hover:border-primary/40 hover:shadow-glow"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Plane className="h-4 w-4" />
                    {r.code}
                  </div>
                  <div className="mt-1 font-semibold">
                    {r.from} → {r.to}
                  </div>
                  <div className="mt-1 text-sm text-primary">{r.price}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TIPS */}
      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            How to book the cheapest flights
          </h2>
          <p className="mt-4 text-muted-foreground">
            Five proven tactics our AI uses on every search — and you can use too.
          </p>
          <ol className="mt-10 space-y-6">
            {[
              {
                t: "Be flexible with dates",
                d: "Shifting departure by ±3 days can cut fares by 20–40%. Our calendar view highlights the cheapest day automatically.",
              },
              {
                t: "Book at the right time",
                d: "Domestic: 4–8 weeks out. International: 2–6 months out. Tuesdays and Wednesdays are usually the cheapest days to fly.",
              },
              {
                t: "Use price alerts",
                d: "Set a target fare and let the AI watch the route. You'll get notified the moment it drops.",
              },
              {
                t: "Consider nearby airports",
                d: "Flying into a secondary airport (e.g. CIA vs FCO, MXP vs LIN) can save €100+ per ticket.",
              },
              {
                t: "Mix airlines & stopovers",
                d: "Self-connecting on two separate tickets is sometimes drastically cheaper. Our AI surfaces this when it makes sense.",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-gradient-card p-6">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-8">
          <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
            Cheap flights FAQ
          </h2>
          <div className="mt-10 space-y-4">
            {[
              {
                q: "How do I find the cheapest flights?",
                a: "Use Jaqtryp AI to compare hundreds of airlines instantly. Our AI scans live fares, suggests flexible dates, and alerts you when prices drop.",
              },
              {
                q: "When is the best time to book?",
                a: "On average 4–8 weeks before domestic flights and 2–6 months before international flights. Tuesdays and Wednesdays usually offer the lowest fares.",
              },
              {
                q: "Can I pay in EUR with a Brazilian card?",
                a: "Yes. Jaqtryp AI processes payments securely in EUR and accepts both Brazilian and international cards.",
              },
              {
                q: "Are last-minute flights cheaper?",
                a: "Sometimes — airlines occasionally drop last-minute fares to fill seats. Set a fare alert and let our AI watch the route for you.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-border bg-card/60 p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="rounded-3xl border border-primary/30 bg-gradient-card p-12 shadow-glow">
            <Globe2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-balance text-3xl font-bold md:text-4xl">
              Ready to fly for less?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join 50,000+ travelers booking cheaper flights with Jaqtryp AI.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
                <Link to="/signup" search={{ intent: "cheap flights" }}>
                  Search cheap flights <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <li className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> EUR pricing</li>
              <li className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> 500+ airlines</li>
              <li className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-primary" /> Free fare alerts</li>
              <li className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> 24/7 AI concierge</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground md:px-8">
          © {new Date().getFullYear()} Jaqtryp AI — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
