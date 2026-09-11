import { useState } from "react";
import { Package, Plus, Trash2, Pencil, Check, X, CopyPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { rupiah, numeric } from "@/lib/owo/format";
import { materialTotal, type Material } from "@/lib/owo/types";
import { Panel } from "./Panel";

type Props = {
  materials: Material[];
  onChange: (next: Material[]) => void;
  onCopyPrevWeek?: () => void;
  capitalMode?: "detail" | "manual" | undefined;
  manualCapital?: number | undefined;
  onCapitalModeChange?: (mode: "detail" | "manual") => void;
  onManualCapitalChange?: (value: number) => void;
  fund?: { opening: number; inflow: number; spent: number; balance: number } | undefined;
  openingCapital?: number | undefined;
  onOpeningCapitalChange?: (value: number) => void;
};


const blank = { name: "", qty: "", unit: "", price: "" };

export function MaterialsPanel({
  materials,
  onChange,
  onCopyPrevWeek,
  capitalMode = "detail",
  manualCapital = 0,
  onCapitalModeChange,
  onManualCapitalChange,
  fund,
  openingCapital = 0,
  onOpeningCapitalChange,
}: Props) {

  const manual = capitalMode === "manual";
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);

  const detailTotal = materials.reduce((s, m) => s + materialTotal(m), 0);
  const total = manual ? manualCapital : detailTotal;


  const submit = () => {
    if (!form.name.trim()) return;
    onChange([
      ...materials,
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        qty: numeric(form.qty),
        unit: form.unit.trim() || "pcs",
        price: numeric(form.price),
      },
    ]);
    setForm(blank);
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setDraft({ name: m.name, qty: String(m.qty), unit: m.unit, price: String(m.price) });
  };

  const saveEdit = () => {
    onChange(
      materials.map((m) =>
        m.id === editingId
          ? {
              ...m,
              name: draft.name.trim() || m.name,
              qty: numeric(draft.qty),
              unit: draft.unit.trim() || m.unit,
              price: numeric(draft.price),
            }
          : m,
      ),
    );
    setEditingId(null);
  };

  return (
    <Panel
      icon={Package}
      title="Bahan Baku & Beban Modal"
      description="Belanja bahan dicatat terpisah untuk setiap pekan"
      action={
        <div className="flex items-center gap-2">
          {onCopyPrevWeek && !manual && (
            <Button size="sm" variant="outline" onClick={onCopyPrevWeek}>
              <CopyPlus />
              <span className="hidden sm:inline">Salin Pekan Lalu</span>
            </Button>
          )}
          <span className="text-sm font-semibold tabular-nums">{rupiah(total)}</span>
        </div>
      }
    >
      {fund && (
        <div className="mb-4 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Kas Modal Terkumpul</p>
              <p className="text-xs text-muted-foreground">
                Sisa modal siap dipakai belanja pekan depan
              </p>
            </div>
            <span
              className={`text-base font-semibold tabular-nums ${
                fund.balance >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {rupiah(fund.balance)}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-md border border-dashed border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label htmlFor="opening-capital" className="text-xs">
                Modal awal terkumpul (pekan-pekan lama)
              </Label>
              <p className="text-xs text-muted-foreground">
                Isi sekali saja. Angka ini menambah kas, bukan belanja.
              </p>
            </div>
            <Input
              id="opening-capital"
              inputMode="numeric"
              className="sm:w-44"
              placeholder="0"
              value={openingCapital || ""}
              onChange={(e) => onOpeningCapitalChange?.(numeric(e.target.value))}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">Modal awal</p>
              <p className="font-medium tabular-nums">{rupiah(fund.opening)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">Masuk dari omzet</p>
              <p className="font-medium tabular-nums">{rupiah(fund.inflow - fund.opening)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">Terpakai belanja</p>
              <p className="font-medium tabular-nums">{rupiah(fund.spent)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Switch
            id="capital-manual"
            checked={manual}
            onCheckedChange={(v) => onCapitalModeChange?.(v ? "manual" : "detail")}
          />
          <Label htmlFor="capital-manual" className="cursor-pointer">
            Isi total belanja pekan ini secara manual
          </Label>
        </div>
        {manual && (
          <Input
            inputMode="numeric"
            className="sm:w-48"
            placeholder="Total belanja pekan ini"
            value={manualCapital || ""}
            onChange={(e) => onManualCapitalChange?.(numeric(e.target.value))}
          />
        )}

      </div>

      {manual ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          Mode manual aktif. Total modal pekan ini memakai angka yang kamu isi di atas.
        </p>
      ) : (
      <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.4fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="mat-name">Nama Bahan</Label>
          <Input
            id="mat-name"
            placeholder="Teh melati"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mat-qty">Qty</Label>
          <Input
            id="mat-qty"
            inputMode="decimal"
            placeholder="0"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mat-unit">Satuan</Label>
          <Input
            id="mat-unit"
            placeholder="kg"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mat-price">Harga / Satuan</Label>
          <Input
            id="mat-price"
            inputMode="numeric"
            placeholder="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <Button onClick={submit} className="w-full lg:w-auto">
          <Plus />
          Tambah
        </Button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Bahan</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Satuan</th>
              <th className="px-3 py-2 text-right font-medium">Harga</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Belum ada bahan baku pada tanggal ini.
                </td>
              </tr>
            )}
            {materials.map((m) =>
              editingId === m.id ? (
                <tr key={m.id} className="border-t border-border bg-accent/40">
                  <td className="px-3 py-2">
                    <Input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={draft.qty}
                      inputMode="decimal"
                      onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={draft.price}
                      inputMode="numeric"
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      className="h-8 w-28"
                    />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {rupiah(numeric(draft.qty) * numeric(draft.price))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={saveEdit}>
                        <Check />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 tabular-nums">{m.qty}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.unit}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{rupiah(m.price)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(materialTotal(m))}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(m)}>
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-danger hover:text-danger"
                        onClick={() => onChange(materials.filter((x) => x.id !== m.id))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </Panel>
  );
}
