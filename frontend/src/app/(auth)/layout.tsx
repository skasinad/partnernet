import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-sm">{children}</div>

      <div className="hidden rounded-card border border-line bg-forest-700 p-10 text-white lg:block">
        <Logo href="/" className="[&_span:last-child]:text-white" />
        <blockquote className="mt-10 font-serif text-2xl leading-snug">
          “We found a bakery three blocks away that sends us their morning
          crowd. We send them our afternoon one. It took one message.”
        </blockquote>
        <p className="mt-4 text-sm text-forest-100">
          — the kind of partnership Partnernet is built for
        </p>
        <div className="mt-10 border-t border-forest-600 pt-6 text-sm text-forest-100">
          <p>Already using Partnernet on another device?</p>
          <Link href="/login" className="font-medium text-white underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
