"use client";

import { motion } from "framer-motion";
import { useGnanamStore } from "@/lib/gnanam/store";
import { ROLES, ROLE_IDS } from "@/lib/gnanam/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthScreen() {
  const { state, dispatch } = useGnanamStore();

  const set = (field: "authEmail" | "authPass" | "regName" | "regSiret" | "regEmail" | "regPass") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({ type: "SET_FIELD", field, value: e.target.value });

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
            <Button
              type="button"
              onClick={() => dispatch({ type: "SET_AUTH_TAB", tab: "login" })}
              className={`h-11 flex-1 rounded-[9px] text-sm font-bold ${
                state.authTab === "login"
                  ? "bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-900)]"
                  : "bg-transparent text-[var(--gnanam-gray-600)] hover:bg-transparent"
              }`}
            >
              Connexion
            </Button>
            <Button
              type="button"
              onClick={() => dispatch({ type: "SET_AUTH_TAB", tab: "register" })}
              className={`h-11 flex-1 rounded-[9px] text-sm font-bold ${
                state.authTab === "register"
                  ? "bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-900)]"
                  : "bg-transparent text-[var(--gnanam-gray-600)] hover:bg-transparent"
              }`}
            >
              Créer un compte
            </Button>
          </div>

          {state.authTab === "login" ? (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({ type: "LOGIN" });
                }}
              >
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Profil
                  </Label>
                  <div className="grid grid-cols-2 gap-[7px]">
                    {ROLE_IDS.map((id) => {
                      const active = state.role === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => dispatch({ type: "SET_ROLE", role: id })}
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
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Adresse e-mail professionnelle
                  </Label>
                  <Input
                    value={state.authEmail}
                    onChange={set("authEmail")}
                    type="email"
                    placeholder="contact@monepicerie.fr"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Mot de passe
                  </Label>
                  <Input
                    value={state.authPass}
                    onChange={set("authPass")}
                    type="password"
                    placeholder="••••••••"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                {state.authError && (
                  <div className="rounded-[10px] bg-[var(--gnanam-error-bg)] px-3 py-2.5 text-[13px] font-semibold text-[var(--gnanam-error)]">
                    {state.authError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="mt-1 h-[50px] rounded-xl bg-[var(--gnanam-teal-900)] text-[15.5px] font-bold text-[var(--gnanam-cream-text)] hover:bg-[var(--gnanam-teal-700)]"
                >
                  Se connecter
                </Button>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-center text-[13px] font-semibold text-[var(--gnanam-amber)] no-underline"
                >
                  Mot de passe oublié ?
                </a>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  dispatch({ type: "REGISTER" });
                }}
              >
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Nom de l&apos;établissement
                  </Label>
                  <Input
                    value={state.regName}
                    onChange={set("regName")}
                    type="text"
                    placeholder="Épicerie Mont Kailash"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">SIRET</Label>
                  <Input
                    value={state.regSiret}
                    onChange={set("regSiret")}
                    type="text"
                    placeholder="123 456 789 00012"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Adresse e-mail professionnelle
                  </Label>
                  <Input
                    value={state.regEmail}
                    onChange={set("regEmail")}
                    type="email"
                    placeholder="contact@monepicerie.fr"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-[12.5px] font-bold text-[var(--gnanam-gray-600)]">
                    Mot de passe
                  </Label>
                  <Input
                    value={state.regPass}
                    onChange={set("regPass")}
                    type="password"
                    placeholder="8 caractères minimum"
                    className="h-[46px] rounded-[11px] border-[1.5px] border-[var(--gnanam-border)] bg-[var(--gnanam-cream-card)] px-3.5 text-[14.5px] focus-visible:border-[var(--gnanam-gold)] focus-visible:bg-white focus-visible:ring-0"
                  />
                </div>
                {state.authError && (
                  <div className="rounded-[10px] bg-[var(--gnanam-error-bg)] px-3 py-2.5 text-[13px] font-semibold text-[var(--gnanam-error)]">
                    {state.authError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="mt-1 h-[50px] rounded-xl bg-[var(--gnanam-gold)] text-[15.5px] font-bold text-[var(--gnanam-teal-900)] hover:bg-[var(--gnanam-gold-light)]"
                >
                  Créer mon compte pro
                </Button>
                <div className="text-center text-[12.5px] leading-relaxed text-[var(--gnanam-gray-400)]">
                  Votre compte sera validé par l&apos;équipe GNANAM EXO sous 24h.
                </div>
              </motion.form>
            )}
        </div>
      </motion.div>
    </div>
  );
}
