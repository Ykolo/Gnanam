"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/trpc/client";
import { ROLES, ROLE_IDS } from "@/lib/gnanam/data";
import type { RoleId } from "@/lib/gnanam/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD =
  "h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0";
const LABEL = "mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]";

/** Comptes créés par `bun run db:seed`, proposés en un clic pour la démonstration. */
const DEMO_PASSWORD = "gnanam2026";
const demoEmail = (role: RoleId) => `${role}@gnanam.test`;

export function AuthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regSiret, setRegSiret] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  const completeRegistration = api.account.completeRegistration.useMutation();

  const switchTab = (next: "login" | "register") => {
    setTab(next);
    setError(null);
  };

  const fillDemo = (role: RoleId) => {
    setEmail(demoEmail(role));
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Veuillez saisir votre e-mail et votre mot de passe.");

    setPending(true);
    setError(null);
    const { error: authError } = await authClient.signIn.email({ email, password });
    if (authError) {
      setPending(false);
      return setError("E-mail ou mot de passe incorrect.");
    }
    router.refresh();
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName || !regSiret || !regAddress || !regEmail || !regPass) {
      return setError("Veuillez remplir tous les champs.");
    }
    if (regPass.length < 8) return setError("Le mot de passe doit faire au moins 8 caractères.");

    setPending(true);
    setError(null);

    const { error: authError } = await authClient.signUp.email({
      email: regEmail,
      password: regPass,
      name: regName,
    });
    if (authError) {
      setPending(false);
      return setError(
        authError.status === 422
          ? "Un compte existe déjà pour cette adresse."
          : "La création du compte a échoué. Réessayez."
      );
    }

    // Le compte existe et la session est ouverte : on y rattache l'établissement.
    try {
      await completeRegistration.mutateAsync({ siret: regSiret, address: regAddress });
    } catch (err) {
      setPending(false);
      return setError(err instanceof Error ? err.message : "Rattachement de l'établissement impossible.");
    }

    // La session est mise en cache dans un cookie pendant une minute : sans ce
    // rafraîchissement forcé, le `customerId` qu'on vient d'écrire resterait
    // invisible et la première commande serait refusée.
    await authClient.getSession({ query: { disableCookieCache: true } });
    router.refresh();
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center p-6"
      style={{
        background:
          "linear-gradient(160deg, var(--gnanam-teal-900) 0%, var(--gnanam-teal-800) 55%, #0B2E35 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[410px]"
      >
        <div className="mb-6 flex flex-col items-center gap-2.5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[18px] text-3xl font-extrabold text-[var(--gnanam-teal-900)] shadow-[0_10px_30px_rgba(0,0,0,.3)]"
            style={{ background: "linear-gradient(135deg, var(--gnanam-gold-light), var(--gnanam-gold-dark))" }}
          >
            G
          </div>
          <div className="text-center">
            <div className="text-[19px] font-bold tracking-[5px] text-[var(--gnanam-gold-text)]">GNANAM</div>
            <div className="mt-0.5 text-[13px] font-medium tracking-[8px] text-[var(--gnanam-muted-teal)]">EXO</div>
          </div>
          <div className="text-[13.5px] text-[var(--gnanam-muted-teal)]">
            Portail B2B — commande, préparation &amp; livraison
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-6 pb-7 shadow-[0_24px_60px_rgba(0,0,0,.35)]">
          <div className="mb-5 flex gap-1 rounded-xl bg-[var(--gnanam-cream)] p-1">
            {(["login", "register"] as const).map((id) => (
              <Button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={`h-11 flex-1 rounded-[9px] text-sm font-bold ${
                  tab === id
                    ? "bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-900)]"
                    : "bg-transparent text-[var(--gnanam-gray-600)] hover:bg-transparent"
                }`}
              >
                {id === "login" ? "Connexion" : "Créer un compte"}
              </Button>
            ))}
          </div>

          {tab === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
              onSubmit={onLogin}
            >
              <div>
                <Label className={LABEL}>Comptes de démonstration</Label>
                <div className="grid grid-cols-2 gap-[7px]">
                  {ROLE_IDS.map((id) => {
                    const active = email === demoEmail(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => fillDemo(id)}
                        aria-pressed={active}
                        className={`min-h-11 rounded-[11px] border-[1.5px] px-2.5 py-2.5 text-left text-[13px] font-bold transition-colors ${
                          active
                            ? "border-[var(--gnanam-teal-900)] bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)]"
                            : "border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] text-[var(--gnanam-gray-600)]"
                        }`}
                      >
                        {ROLES[id].label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className={LABEL} htmlFor="login-email">
                  Adresse e-mail professionnelle
                </Label>
                <Input
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="contact@monepicerie.fr"
                  className={FIELD}
                />
              </div>
              <div>
                <Label className={LABEL} htmlFor="login-password">
                  Mot de passe
                </Label>
                <Input
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={FIELD}
                />
              </div>
              {error && (
                <div className="rounded-[10px] bg-[var(--gnanam-error-bg)] px-3 py-2.5 text-[13px] font-semibold text-[var(--gnanam-error)]">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="mt-1 h-[50px] rounded-xl bg-[var(--gnanam-teal-900)] text-[15.5px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)] disabled:opacity-70"
              >
                {pending ? "Connexion…" : "Se connecter"}
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-3"
              onSubmit={onRegister}
            >
              <div>
                <Label className={LABEL} htmlFor="reg-name">
                  Nom de l&apos;établissement
                </Label>
                <Input
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  type="text"
                  placeholder="Épicerie Mont Kailash"
                  className={FIELD}
                />
              </div>
              <div>
                <Label className={LABEL} htmlFor="reg-siret">
                  SIRET
                </Label>
                <Input
                  id="reg-siret"
                  value={regSiret}
                  onChange={(e) => setRegSiret(e.target.value)}
                  type="text"
                  placeholder="123 456 789 00012"
                  className={FIELD}
                />
              </div>
              <div>
                <Label className={LABEL} htmlFor="reg-address">
                  Adresse de livraison
                </Label>
                <Input
                  id="reg-address"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  type="text"
                  placeholder="48 rue du Faubourg St-Denis, 75010 Paris"
                  className={FIELD}
                />
              </div>
              <div>
                <Label className={LABEL} htmlFor="reg-email">
                  Adresse e-mail professionnelle
                </Label>
                <Input
                  id="reg-email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="contact@monepicerie.fr"
                  className={FIELD}
                />
              </div>
              <div>
                <Label className={LABEL} htmlFor="reg-password">
                  Mot de passe
                </Label>
                <Input
                  id="reg-password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  className={FIELD}
                />
              </div>
              {error && (
                <div className="rounded-[10px] bg-[var(--gnanam-error-bg)] px-3 py-2.5 text-[13px] font-semibold text-[var(--gnanam-error)]">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={pending}
                className="mt-1 h-[50px] rounded-xl bg-[var(--gnanam-gold)] text-[15.5px] font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)] disabled:opacity-70"
              >
                {pending ? "Création…" : "Créer mon compte pro"}
              </Button>
              <div className="text-center text-[12.5px] leading-relaxed text-[var(--gnanam-gray-400)]">
                Votre compte donne accès au catalogue et au suivi de vos commandes.
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
