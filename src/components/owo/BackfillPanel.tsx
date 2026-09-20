import { useState } from "react";
import { CalendarPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { rupiah, numeric, longDate } from "@/lib/owo/format";
import { readDay, writeDay, operationalSundayKey, shiftWeeks } from "@/lib/owo/supabase-storage";

type Props = {
  weeks?: number;
  onSaved: () => void;
};

export function BackfillPanel({ weeks = 8, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [pricePerCup, setPricePerCup] = useState(5000);
  const [rows, setRows] = useState<Record<string, { cups: number; revenue: number }>>({});

  const current = operationalSundayKey();
  const keys = Array.from({ length: weeks }, (_, i) => shiftWeeks(current, -(i + 1)));

  const load = async () => {
    const next: Record<string, { cups: number; revenue: number }> = {};
    for (const k of keys) {
      const d = await readDay(k);
      next[k] = { cups: d.cups, revenue: d.revenue };
    }
    setRows(next);
    setOpen(true);
  };

  const setRow = (key: string, patch: Partial<{ cups: number; revenue: number }>) =>
    setRows((prev) => {
      const row = { cups: 0, revenue: 0, ...prev[key], ...patch };
      if (patch.cups !== undefined) row.revenue = patch.cups * pricePerCup;
      return { ...prev, [key]: row };
    });

  const save = async () => {
    let saved = 0;
    for (const k of keys) {
      const row = rows[k];
      if (!row || (row.cups === 0 && row.revenue === 0)) return;
      const day = await readDay(k);
      await writeDay(k, { ...day, cups: row.cups, pricePerCup, revenue: row.revenue });
      saved++;
    }
    setOpen(false);
    onSaved();
    toast.success(saved > 0 ? `${saved} pekan tersimpan` : "Tidak ada data untuk disimpan");
  };

  const total = keys.reduce((s, k) => s + (rows[k]?.revenue ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" onClick={load}>
          <CalendarPlus />
          Isi Cepat Riwayat Pekan Lalu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Isi Riwayat Penjualan Pekan Lalu</DialogTitle>
          <DialogDescription>
            Masukkan jumlah cup atau langsung total pendapatan tiap Minggu. Kosongkan pekan yang
            tidak berjualan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="backfill-price">Harga Jual per Cup</Label>
          <Input
            id="backfill-price"
            inputMode="numeric"
            value={pricePerCup || ""}
            placeholder="5000"
            onChange={(e) => setPricePerCup(numeric(e.target.value))}
          />
        </div>

        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k} className="rounded-lg border border-border p-3">
              <p className="truncate text-sm font-medium">{longDate(k)}</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`cups-${k}`}>Cup Terjual</Label>
                  <Input
                    id={`cups-${k}`}
                    inputMode="numeric"
                    value={rows[k]?.cups || ""}
                    placeholder="0"
                    onChange={(e) => setRow(k, { cups: numeric(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`rev-${k}`}>Total Pendapatan</Label>
                  <Input
                    id={`rev-${k}`}
                    inputMode="numeric"
                    value={rows[k]?.revenue || ""}
                    placeholder="0"
                    onChange={(e) => setRow(k, { revenue: numeric(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Total omzet: <span className="font-semibold tabular-nums">{rupiah(total)}</span>
          </span>
          <Button onClick={save}>
            <Save />
            Simpan Riwayat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
