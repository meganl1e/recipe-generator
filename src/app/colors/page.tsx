import Link from "next/link";

const swatches = [
  { name: "Background", token: "background", class: "bg-background text-foreground border border-black/10" },
  { name: "Foreground", token: "foreground", class: "bg-foreground text-background" },
  { name: "Primary", token: "primary", class: "bg-primary text-foreground" },
  { name: "Primary accent", token: "primary-accent", class: "bg-primary-accent text-foreground" },
  { name: "Secondary", token: "secondary", class: "bg-secondary text-white" },
  { name: "Foreground accent", token: "foreground-accent", class: "bg-foreground-accent text-background" },
  { name: "Hero background", token: "hero-background", class: "bg-hero-background text-foreground border border-black/10" },
];

export default function ColorsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <Link href="/" className="inline-block text-secondary hover:underline mb-8 font-medium">
        ← Back home
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-2">Color palette</h1>
      <p className="text-foreground-accent mb-10">Sample of your theme colors from globals.css</p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {swatches.map(({ name, token, class: className }) => (
          <div key={token} className="rounded-xl overflow-hidden border border-black/10 shadow-sm">
            <div className={`h-28 ${className} flex items-center justify-center font-medium`}>
              {name}
            </div>
            <div className="bg-white/80 dark:bg-black/10 px-4 py-2 text-sm text-foreground-accent font-mono">
              {token}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Quick preview</h2>
        <p className="text-foreground-accent">
          Body text uses foreground. This line uses foreground-accent.{" "}
          <span className="text-primary">Primary for links/highlights.</span>{" "}
          <span className="text-secondary">Secondary accent.</span>
        </p>
        <button type="button" className="bg-primary hover:bg-primary-accent text-foreground px-5 py-2 rounded-full font-medium transition-colors">
          Primary button
        </button>
        <div className="h-24 rounded-xl bg-hero-background border border-black/10 flex items-center justify-center text-foreground">
          Hero-style block
        </div>
      </div>
    </div>
  );
}
