import { Link } from "@tanstack/react-router";

export function AuthShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-hero px-4 py-10">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[140px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-primary-glow/20 blur-[140px]" />
      </div>
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <span className="text-sm font-black text-primary-foreground">J</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Jaqtryp <span className="text-gradient">AI</span>
          </span>
        </Link>
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-elegant backdrop-blur-xl">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
