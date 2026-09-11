import { CupSoda, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rupiah, numeric } from "@/lib/owo/format";
import { Panel } from "./Panel";

type Props = {
  cups: number;
  pricePerCup: number;
  revenue: number;
  onChange: (patch: { cups?: number; pricePerCup?: number; revenue?: number }) => void;
};

export function RevenuePanel({ cups, pricePerCup, revenue, onChange }: Props) {
  const calculated = cups * pricePerCup;

  return (
    <Panel
      icon={CupSoda}
      title="Hasil Penjualan"
      description="Omzet harian OWO TEA di CFD Margonda"
      action={<span className="text-sm font-semibold tabular-nums">{rupiah(revenue)}</span>}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cups">Jumlah Cup Terjual</Label>
          <Input
            id="cups"
            inputMode="numeric"
            value={cups || ""}
            placeholder="0"
            onChange={(e) => onChange({ cups: numeric(e.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price-cup">Harga Jual per Cup</Label>
          <Input
            id="price-cup"
            inputMode="numeric"
            value={pricePerCup || ""}
            placeholder="0"
            onChange={(e) => onChange({ pricePerCup: numeric(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Hasil Kalkulator</p>
          <p className="truncate text-base font-semibold tabular-nums">{rupiah(calculated)}</p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => onChange({ revenue: calculated })}
        >
          <Calculator />
          Terapkan ke Pendapatan
        </Button>
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="revenue">Total Pendapatan Kotor</Label>
        <Input
          id="revenue"
          inputMode="numeric"
          value={revenue || ""}
          placeholder="0"
          onChange={(e) => onChange({ revenue: numeric(e.target.value) })}
        />
      </div>
    </Panel>
  );
}
