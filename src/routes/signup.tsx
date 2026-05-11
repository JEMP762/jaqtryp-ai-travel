import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  validateSearch: (search: Record<string, unknown>) => ({
    intent: typeof search.intent === "string" ? search.intent : undefined,
  }),
});

function SignupPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) nav({ to: "/dashboard" });
  }, [user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      nav({ to: "/login" });
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <AuthShell
      title={t("auth.signup.title")}
      footer={
        <>
          {t("auth.have")}{" "}
          <Link to="/login" className="text-primary hover:underline">
            {t("auth.signin")}
          </Link>
        </>
      }
    >
      <Button onClick={onGoogle} variant="outline" className="w-full">
        {t("auth.google")}
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> {t("auth.or")}
        <div className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.fullname")}</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-primary shadow-glow"
        >
          {loading ? t("common.loading") : t("auth.signup")}
        </Button>
      </form>
    </AuthShell>
  );
}
