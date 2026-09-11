import { Wallet, TrendingUp, Users, PiggyBank, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { rupiah } from "@/lib/owo/format";

type Metric = {
  label: string;
  hint: string;
  value: number;
  icon: LucideIcon;
  tone?: "neutral" | "auto";
};

export function MetricCards({
  capital,
  revenue,
  payroll,
  profit,
  fundBalance,
}: {
  capital: number;
  revenue: number;
  payroll: number;
  profit: number;
  fundBalance?: number | undefined;
}) {
  const showFund = typeof fundBalance === "number";
  const metrics: Metric[] = [
    {
      label: showFund ? "Kas Modal Terkumpul" : "Total Modal",
      hint: showFund ? `Belanja pekan ini ${rupiah(capital)}` : "Bahan baku pekan ini",
      value: showFund ? fundBalance : capital,
      icon: Wallet,
      tone: showFund ? "auto" : "neutral",
    },
    { label: "Pendapatan Kotor", hint: "Omzet penjualan cup", value: revenue, icon: TrendingUp },
    { label: "Pengeluaran Gaji", hint: "Payroll tim", value: payroll, icon: Users },
    { label: "Keuntungan Bersih", hint: "Omzet - modal - gaji", value: profit, icon: PiggyBank, tone: "auto" },
  ];


  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        const auto = m.tone === "auto";
        const positive = m.value >= 0;
        return (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-xl font-semibold tabular-nums sm:text-2xl",
                    auto && (positive ? "text-success" : "text-danger"),
                  )}
                >
                  {rupiah(m.value)}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{m.hint}</p>
              </div>
              <div
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  auto
                    ? positive
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                <Icon className="size-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
