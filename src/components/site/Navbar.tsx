import { Link } from "@tanstack/react-router";
import { Globe2, Menu, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-border/50" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <span className="text-sm font-black text-primary-foreground">J</span>
          </div>
          <span className="text-lg font-bold tracking-tight">
            Jaqtryp <span className="text-gradient">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
            {t("nav.features")}
          </a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
            {t("nav.howitworks")}
          </a>
          <a href="#plans" className="text-sm text-muted-foreground hover:text-foreground">
            {t("nav.plans")}
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-label="Toggle language"
          >
            <Globe2 className="h-4 w-4" />
            {lang.toUpperCase()}
          </button>
          {user ? (
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
              <Link to="/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary shadow-glow">
                <Link to="/signup">{t("nav.signup")}</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="glass border-t border-border/50 md:hidden">
          <div className="space-y-3 px-4 py-4">
            <a href="#features" className="block text-sm" onClick={() => setOpen(false)}>
              {t("nav.features")}
            </a>
            <a href="#plans" className="block text-sm" onClick={() => setOpen(false)}>
              {t("nav.plans")}
            </a>
            <button
              onClick={() => setLang(lang === "pt" ? "en" : "pt")}
              className="flex items-center gap-2 text-sm"
            >
              <Globe2 className="h-4 w-4" /> {lang.toUpperCase()}
            </button>
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button asChild size="sm" className="flex-1 bg-gradient-primary">
                  <Link to="/dashboard">{t("nav.dashboard")}</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 bg-gradient-primary">
                    <Link to="/signup">{t("nav.signup")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
