import Link from "next/link";

import { FeaturedBusinesses } from "@/components/landing/FeaturedBusinesses";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    n: "01",
    title: "Describe your customer",
    body: "Pick your industry, the audience traits that describe your regulars, your price tier, and your location. Two minutes, no sales calls.",
  },
  {
    n: "02",
    title: "See ranked matches",
    body: "Partnernet scores every other business on shared audience, complementary industry, and how close they are — and shows its work.",
  },
  {
    n: "03",
    title: "Reach out and plan",
    body: "Send a partnership request with a short note. Once it's accepted, you get a private thread to work out the details.",
  },
];

const SIGNALS = [
  {
    title: "Shared audience, not shared shelf",
    body: "A cafe and a bookshop want the same customer walking in. A cafe and another cafe don't. Partnernet weights audience overlap highest and treats direct competitors as a poor match.",
  },
  {
    title: "Complementary industries",
    body: "Curated adjacencies — florist and photographer, gym and juice bar, brewery and pizzeria — surface partners you'd never find by browsing a directory.",
  },
  {
    title: "Close enough to actually collaborate",
    body: "Proximity is part of every score. Same block beats same city beats same state, using real coordinates where a business has them.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-forest-50 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-clay-100/60 blur-3xl" />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-xl">
            <span className="eyebrow">For independent businesses</span>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">
              Find the business next door that shares your customer.
            </h1>
            <p className="mt-5 text-lg text-ink-soft">
              Partnernet matches small businesses with complementary partners
              nearby — the ones you can run a joint event, a shared promotion, or
              a referral loop with. Not another directory to scroll.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register">Create your profile</ButtonLink>
              <ButtonLink href="/discover" variant="secondary">
                Browse businesses
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              Demo tip: log in with{" "}
              <code className="rounded bg-forest-50 px-1.5 py-0.5 text-forest-700">
                rowanbean@demo.partnernet.app
              </code>{" "}
              / <code className="rounded bg-forest-50 px-1.5 py-0.5 text-forest-700">partnernet-demo</code>
            </p>
          </div>

          <div className="relative">
            <div className="card p-6">
              <p className="eyebrow">Your top match</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-forest-100 font-serif text-forest-700">
                  MN
                </div>
                <div>
                  <p className="font-serif text-lg">Margin Notes Books</p>
                  <p className="text-[13px] text-ink-faint">
                    Bookshop · Portland, Oregon
                  </p>
                </div>
                <div className="ml-auto grid h-14 w-14 place-items-center rounded-full border-2 border-forest-600 font-serif text-lg text-forest-700">
                  83
                </div>
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                Shares customers who are design-led, mid-range spenders, remote
                workers; complementary industry; in the same city.
              </p>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Audience overlap", 78],
                  ["Industry fit", 70],
                  ["Proximity", 85],
                ].map(([label, val]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex justify-between text-[12px] text-ink-soft">
                      <span>{label}</span>
                      <span>{val}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-forest-400"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16 sm:py-20">
        <div className="max-w-xl">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 text-3xl">From sign-up to a real conversation in three steps.</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card p-6">
              <span className="font-serif text-2xl text-clay-400">{step.n}</span>
              <h3 className="mt-2 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Matching signals */}
      <section className="border-y border-line bg-surface">
        <div className="container-page py-16 sm:py-20">
          <div className="max-w-xl">
            <span className="eyebrow">The matching model</span>
            <h2 className="mt-3 text-3xl">
              A score you can explain to your co-founder.
            </h2>
            <p className="mt-3 text-ink-soft">
              Every match is a transparent blend of three signals. No black box,
              no “premium” gate on who you can see.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SIGNALS.map((s) => (
              <div key={s.title}>
                <h3 className="text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">On Partnernet now</span>
            <h2 className="mt-3 text-3xl">Businesses open to partnerships</h2>
          </div>
          <Link
            href="/discover"
            className="hidden text-sm font-medium text-forest-700 hover:text-forest-900 sm:block"
          >
            See all →
          </Link>
        </div>
        <div className="mt-8">
          <FeaturedBusinesses />
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-8">
        <div className="card flex flex-col items-start gap-5 bg-forest-700 p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl text-white">Ready to find your match?</h2>
            <p className="mt-2 max-w-md text-sm text-forest-100">
              Set up a profile in two minutes and see who you should be working
              with.
            </p>
          </div>
          <ButtonLink
            href="/register"
            variant="secondary"
            className="border-transparent bg-white text-forest-700 hover:bg-forest-50"
          >
            Create your profile
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
