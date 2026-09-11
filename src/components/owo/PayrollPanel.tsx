import { useState } from "react";
import { UserPlus, UserMinus, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { rupiah, numeric } from "@/lib/owo/format";
import {
  memberPay,
  payrollTotal,
  salaryPool,
  capitalPool,
  PERFORMANCE_OPTIONS,
  isActive,
  memberRemaining,
  type DayData,
  type Member,
} from "@/lib/owo/types";
import { Panel } from "./Panel";

type Props = {
  day: DayData;
  onChange: (patch: Partial<DayData>) => void;
  /** Saldo gaji kumulatif per anggota lintas pekan. */
  balances?: Record<string, number>;
  /** Saldo gaji awal per anggota dari pekan-pekan lama. */
  openingPayroll?: Record<string, number>;
  onOpeningPayrollChange?: (map: Record<string, number>) => void;
};

export function PayrollPanel({
  day,
  onChange,
  balances = {},
  openingPayroll = {},
  onOpeningPayrollChange,
}: Props) {
  const [openSaldo, setOpenSaldo] = useState(false);
  const members = day.members;
  const total = payrollTotal(day);
  const totalMode = day.payrollMode === "total";
  const share = day.payrollMode === "share" || totalMode;
  const pool = salaryPool(day);
  const weights = members.reduce((s, m) => s + (isActive(m) ? m.multiplier || 0 : 0), 0);

  const patch = (id: string, values: Partial<Member>) =>
    onChange({ members: members.map((m) => (m.id === id ? { ...m, ...values } : m)) });

  const add = () =>
    onChange({
      members: [
        ...members,
        {
          id: crypto.randomUUID(),
          name: "",
          baseSalary: 0,
          multiplier: 1,
          bonus: 0,
          active: true,
          withdrawn: 0,
        },
      ],
    });

  return (
    <Panel
      icon={Users}
      title="Payroll & Performa Tim"
      description="Anggota tersimpan otomatis, atur keikutsertaan tiap pekan"
      action={<span className="text-sm font-semibold tabular-nums">{rupiah(total)}</span>}
    >
      <div className="space-y-3">
        <Dialog open={openSaldo} onOpenChange={setOpenSaldo}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Wallet />
              Saldo Gaji Pekan Lalu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Saldo Gaji Terkumpul</DialogTitle>
              <DialogDescription>
                Isi gaji yang sudah terkumpul dari pekan-pekan lama. Angka ini terpisah dari
                perhitungan keuntungan pekan ini dan tetap ditambah gaji pekan berjalan.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {members.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada anggota tim.</p>
              )}
              {members.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <Label htmlFor={`opening-${m.id}`}>{m.name || "Tanpa nama"}</Label>
                  <Input
                    id={`opening-${m.id}`}
                    inputMode="numeric"
                    placeholder="0"
                    value={openingPayroll[m.id] || ""}
                    onChange={(e) =>
                      onOpeningPayrollChange?.({
                        ...openingPayroll,
                        [m.id]: numeric(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Saldo total sekarang: {rupiah(balances[m.id] ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Metode Gaji</Label>
              <Select
                value={day.payrollMode}
                onValueChange={(v) => onChange({ payrollMode: v as DayData["payrollMode"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="share">Bagi hasil dari omzet</SelectItem>
                  <SelectItem value="total">Isi total gaji manual</SelectItem>
                  <SelectItem value="manual">Isi gaji per orang manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {totalMode ? (
              <div className="space-y-1.5">
                <Label htmlFor="manual-pool">Total Gaji Pekan Ini</Label>
                <Input
                  id="manual-pool"
                  inputMode="numeric"
                  value={day.manualPayroll || ""}
                  placeholder="0"
                  onChange={(e) => onChange({ manualPayroll: numeric(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Dibagi otomatis ke anggota aktif sesuai performa.
                </p>
              </div>
            ) : share ? (
              <div className="space-y-1.5">
                <Label htmlFor="share-pct">Porsi Gaji dari Omzet (%)</Label>
                <Input
                  id="share-pct"
                  inputMode="numeric"
                  value={day.salarySharePct || ""}
                  placeholder="50"
                  onChange={(e) =>
                    onChange({ salarySharePct: Math.min(100, Math.max(0, numeric(e.target.value))) })
                  }
                />
              </div>
            ) : null}
          </div>

          {share && (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Porsi Modal</p>
                <p className="font-semibold tabular-nums">{rupiah(capitalPool(day))}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Porsi Gaji</p>
                <p className="font-semibold tabular-nums">{rupiah(pool)}</p>
              </div>
            </div>
          )}
        </div>

        {members.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
            Belum ada anggota tim pada tanggal ini.
          </p>
        )}

        {members.map((m, i) => (
          <div key={m.id} className="rounded-lg border border-border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Anggota {i + 1}
              </p>
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${m.id}`} className="cursor-pointer text-xs font-normal text-muted-foreground">
                  {isActive(m) ? "Ikut pekan ini" : "Tidak ikut"}
                </Label>
                <Switch
                  id={`active-${m.id}`}
                  checked={isActive(m)}
                  onCheckedChange={(v) => patch(m.id, { active: v })}
                />
              <Button
                size="icon"
                variant="ghost"
                className="text-danger hover:text-danger"
                onClick={() => onChange({ members: members.filter((x) => x.id !== m.id) })}
              >
                <UserMinus />
              </Button>
              </div>
            </div>

            <div
              className={cn(
                "mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2",
                share ? "lg:grid-cols-4" : "lg:grid-cols-5",
                !isActive(m) && "opacity-60",
              )}
            >
              <div className="space-y-1.5">
                <Label htmlFor={`name-${m.id}`}>Nama Anggota</Label>
                <Input
                  id={`name-${m.id}`}
                  value={m.name}
                  placeholder="Nama"
                  onChange={(e) => patch(m.id, { name: e.target.value })}
                />
              </div>
              {!share && (
                <div className="space-y-1.5">
                  <Label htmlFor={`base-${m.id}`}>Nominal Gaji</Label>
                  <Input
                    id={`base-${m.id}`}
                    inputMode="numeric"
                    value={m.baseSalary || ""}
                    placeholder="0"
                    onChange={(e) => patch(m.id, { baseSalary: numeric(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dipakai apa adanya, tidak dipotong performa.
                  </p>
                </div>
              )}
              {share && (
                <div className="space-y-1.5">
                  <Label>Performa / Kontribusi</Label>
                  <Select
                    value={String(m.multiplier)}
                    onValueChange={(v) => patch(m.id, { multiplier: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFORMANCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor={`bonus-${m.id}`}>Bonus Manual</Label>
                <Input
                  id={`bonus-${m.id}`}
                  inputMode="numeric"
                  value={m.bonus || ""}
                  placeholder="0"
                  onChange={(e) => patch(m.id, { bonus: numeric(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`taken-${m.id}`}>Gaji Sudah Diambil</Label>
                <Input
                  id={`taken-${m.id}`}
                  inputMode="numeric"
                  value={m.withdrawn || ""}
                  placeholder="0"
                  onChange={(e) => patch(m.id, { withdrawn: numeric(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {!isActive(m)
                    ? "Tidak dihitung"
                    : share && weights > 0
                      ? `Porsi ${Math.round(((m.multiplier || 0) / weights) * 100)}%`
                      : "Hak gaji"}
                </p>
                <p className="text-sm font-semibold tabular-nums">{rupiah(memberPay(day, m))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Diambil</p>
                <p className="text-sm font-semibold tabular-nums">{rupiah(m.withdrawn || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sisa pekan ini</p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    memberRemaining(day, m) > 0 ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {rupiah(memberRemaining(day, m))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo total</p>
                <p className="text-sm font-semibold tabular-nums">{rupiah(balances[m.id] ?? 0)}</p>
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={add} className="w-full">
          <UserPlus />
          Tambah Anggota
        </Button>

        {members.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Nama</th>
                  <th className="px-3 py-2 font-medium">Performa</th>
                  <th className="px-3 py-2 text-right font-medium">Total Gaji</th>
                  <th className="px-3 py-2 text-right font-medium">Diambil</th>
                  <th className="px-3 py-2 text-right font-medium">Sisa</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo Awal</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo Total</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{m.name || "Tanpa nama"}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {!isActive(m) ? "Tidak ikut" : share ? `${m.multiplier}x` : "Manual"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {rupiah(memberPay(day, m))}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {rupiah(m.withdrawn || 0)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {rupiah(memberRemaining(day, m))}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {rupiah(openingPayroll[m.id] || 0)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">
                      {rupiah(balances[m.id] ?? 0)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border bg-muted/40">
                  <td className="px-3 py-2 font-semibold" colSpan={2}>
                    Total Payroll
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(total)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(members.reduce((s, m) => s + (m.withdrawn || 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(members.reduce((s, m) => s + memberRemaining(day, m), 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(members.reduce((s, m) => s + (openingPayroll[m.id] || 0), 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {rupiah(members.reduce((s, m) => s + (balances[m.id] ?? 0), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
