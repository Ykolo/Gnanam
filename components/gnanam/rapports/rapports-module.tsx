"use client";

import { useGnanamStore } from "@/lib/gnanam/store";
import { api, LIVE } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/client";
import { REPORT_TABS, GAP_STYLES, CONTROL_STYLES, TREND_COLORS } from "@/lib/gnanam/reports";

type Report = RouterOutputs["rapports"]["summary"];

/** Format compact de l'axe des barres : 4820 → « 4,8k ». */
function shortValue(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(1).replace(".", ",") + "k" : String(v);
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]">
      <div className="text-[14.5px] font-bold">{title}</div>
      <div className="mt-0.5 text-[12.5px] text-[var(--gnanam-gray-400)]">{sub}</div>
      {children}
    </div>
  );
}

function RevenueChart({ report }: { report: Report }) {
  const max = Math.max(1, ...report.bars.map((b) => b.value));
  return (
    <Card title="Chiffre d'affaires HT" sub={report.chartSub}>
      {report.bars.length > 0 ? (
        <div className="mt-4.5 flex h-[170px] items-end gap-2">
          {report.bars.map((b) => (
            <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <div className="text-[10.5px] font-bold text-[var(--gnanam-gray-600)]">{shortValue(b.value)}</div>
              <div
                className="w-full rounded-t-[7px] rounded-b-[3px] transition-[height]"
                style={{
                  height: `${Math.max(6, Math.round((b.value / max) * 100))}%`,
                  background: b.value === max ? "var(--gnanam-teal-900)" : "#7FA3A9",
                }}
              />
              <div className="text-[11px] font-semibold text-[var(--gnanam-gray-400)]">{b.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4.5 py-8 text-center text-[13.5px] text-[var(--gnanam-gray-400)]">
          Aucune commande sur la période.
        </div>
      )}
    </Card>
  );
}

function TopProducts({ report }: { report: Report }) {
  const max = Math.max(1, ...report.top.map((t) => t.value));
  return (
    <Card title="Top produits" sub="Volumes préparés sur la période">
      {report.top.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2.75">
          {report.top.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between gap-2.5 text-[13.5px]">
                <span className="font-semibold">{p.name}</span>
                <span className="font-extrabold whitespace-nowrap text-[var(--gnanam-teal-900)]">{p.qty}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F1ECE0]">
                <div
                  className="h-full rounded-full bg-[var(--gnanam-gold)]"
                  style={{ width: `${Math.round((p.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 py-8 text-center text-[13.5px] text-[var(--gnanam-gray-400)]">
          Aucune ligne préparée sur la période.
        </div>
      )}
    </Card>
  );
}

export function RapportsModule() {
  const { state, dispatch } = useGnanamStore();
  const { data: report } = api.rapports.summary.useQuery({ period: state.repPeriod }, LIVE);

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-28">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="text-[23px] font-extrabold tracking-tight">Rapports</div>
          <div className="mt-0.5 text-[13.5px] text-[var(--gnanam-gray-600)]">{report?.rangeLabel ?? "…"}</div>
        </div>
        <div className="flex gap-1 rounded-xl border-[1.5px] border-[var(--gnanam-border-strong)] bg-white p-1">
          {REPORT_TABS.map((t) => {
            const active = state.repPeriod === t.period;
            return (
              <button
                key={t.period}
                onClick={() => dispatch({ type: "SET_REP_PERIOD", period: t.period })}
                aria-pressed={active}
                className={`min-h-[42px] rounded-[9px] px-3.5 text-[13.5px] font-bold transition-colors ${
                  active
                    ? "bg-[var(--gnanam-teal-900)] text-[var(--gnanam-cream-text)]"
                    : "bg-transparent text-[var(--gnanam-gray-600)]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {report && (
        <>
          <div className="mt-4.5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
            {report.kpis.map((k) => (
              <div
                key={k.label}
                data-testid={`kpi-${k.label}`}
                className="rounded-2xl bg-white p-4 px-4.5 shadow-[0_2px_10px_rgba(14,58,66,.05)]"
              >
                <div className="text-[11.5px] font-extrabold tracking-wide uppercase text-[var(--gnanam-gray-400)]">
                  {k.label}
                </div>
                <div className="mt-1.5 text-[26px] font-extrabold tracking-tight">{k.value}</div>
                <div className="mt-1 text-[12.5px] font-bold" style={{ color: TREND_COLORS[k.direction] }}>
                  {k.trend}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3.5 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            <RevenueChart report={report} />
            <TopProducts report={report} />
          </div>

          <div className="mt-3.5 grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
            <Card title="Écarts de préparation" sub="Ruptures et quantités partielles signalées">
              <div className="mt-3.5 flex flex-col gap-2">
                {report.gaps.map((g) => (
                  <div
                    key={g.name + g.type}
                    className="flex items-center gap-3 rounded-xl border border-[var(--gnanam-border-softer)] px-3.25 py-2.75"
                  >
                    <span className="min-w-0 flex-1 text-[13.5px] font-semibold">{g.name}</span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold whitespace-nowrap"
                      style={{ background: GAP_STYLES[g.type].bg, color: GAP_STYLES[g.type].fg }}
                    >
                      {g.type}
                    </span>
                    <span className="text-[13.5px] font-extrabold whitespace-nowrap text-[var(--gnanam-teal-900)]">
                      ×{g.count}
                    </span>
                  </div>
                ))}
                {report.gaps.length === 0 && (
                  <div className="py-6 text-center text-[13.5px] text-[var(--gnanam-gray-400)]">
                    Aucun écart sur la période.
                  </div>
                )}
              </div>
            </Card>

            <Card title="Contrôles sortie" sub="Validations au poste sécurité">
              <div className="mt-3.5 flex flex-col gap-2">
                {report.controls.map((c, i) => (
                  <div
                    key={c.time + c.client + i}
                    className="flex items-center gap-3 rounded-xl border border-[var(--gnanam-border-softer)] px-3.25 py-2.75"
                  >
                    <span className="text-xs font-extrabold whitespace-nowrap text-[var(--gnanam-gray-400)]">
                      {c.time}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{c.client}</span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-extrabold whitespace-nowrap"
                      style={{ background: CONTROL_STYLES[c.result].bg, color: CONTROL_STYLES[c.result].fg }}
                    >
                      {c.result}
                    </span>
                  </div>
                ))}
                {report.controls.length === 0 && (
                  <div className="py-6 text-center text-[13.5px] text-[var(--gnanam-gray-400)]">
                    Aucun contrôle sur la période.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
