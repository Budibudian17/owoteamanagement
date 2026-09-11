import { useState } from "react";
import { ClipboardCopy, RotateCcw, Check, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { rupiah, longDate } from "@/lib/owo/format";
import { materialTotal, memberPay, memberRemaining, isActive, type DayData } from "@/lib/owo/types";
import { readHoliday } from "@/lib/owo/storage";

type Props = {
  dateKeyValue: string;
  data: DayData;
  summary: { capital: number; revenue: number; payroll: number; profit: number };
  onReset: () => void;
  isHoliday?: boolean;
};

function buildReport(dateKeyValue: string, data: DayData, s: Props["summary"], isHoliday?: boolean) {
  const lines: string[] = [];
  lines.push("LAPORAN HARIAN OWO TEA");
  lines.push("CFD Margonda, Depok");
  lines.push(longDate(dateKeyValue));

  if (isHoliday) {
    lines.push("");
    lines.push("STATUS: HARI LIBUR");
    lines.push("Tidak ada operasional CFD pada minggu ini.");
    return lines.join("\n");
  }

  lines.push("");
  lines.push("PENJUALAN");
  lines.push(`- Cup terjual: ${data.cups} cup`);
  lines.push(`- Harga per cup: ${rupiah(data.pricePerCup)}`);
  lines.push(`- Pendapatan kotor: ${rupiah(s.revenue)}`);
  lines.push("");
  lines.push("MODAL BAHAN BAKU");
  if (data.capitalMode === "manual") lines.push("- Total manual");
  else if (data.materials.length === 0) lines.push("- Tidak ada");
  else {
    data.materials.forEach((m) =>
      lines.push(`- ${m.name} ${m.qty} ${m.unit} x ${rupiah(m.price)} = ${rupiah(materialTotal(m))}`),
    );
  }
  lines.push(`Total modal: ${rupiah(s.capital)}`);
  lines.push("");
  lines.push("GAJI TIM");
  if (data.payrollMode === "total") lines.push(`- Total gaji diisi manual: ${rupiah(data.manualPayroll || 0)}`);
  if (data.members.length === 0) lines.push("- Tidak ada");
  data.members.forEach((m) =>
    lines.push(
      isActive(m)
        ? `- ${m.name || "Tanpa nama"} (${m.multiplier}x): ${rupiah(memberPay(data, m))} | diambil ${rupiah(m.withdrawn || 0)} | sisa ${rupiah(memberRemaining(data, m))}`
        : `- ${m.name || "Tanpa nama"}: tidak ikut pekan ini`,
    ),
  );
  lines.push(`Total gaji: ${rupiah(s.payroll)}`);
  lines.push("");
  lines.push(`KEUNTUNGAN BERSIH: ${rupiah(s.profit)} (${s.profit >= 0 ? "UNTUNG" : "RUGI"})`);
  return lines.join("\n");
}

export function UtilityBar({ dateKeyValue, data, summary, onReset, isHoliday }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = buildReport(dateKeyValue, data, summary, isHoliday);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Laporan disalin ke clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin laporan");
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button variant="default" onClick={copy} className="flex-1 text-xs sm:text-sm">
        {copied ? <Check className="size-4" /> : <ClipboardCopy className="size-4" />}
        <span className="hidden sm:inline">Salin Teks Laporan</span>
        <span className="sm:hidden">Salin Laporan</span>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="flex-1 text-danger hover:text-danger text-xs sm:text-sm">
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset Data Tanggal Ini</span>
            <span className="sm:hidden">Reset Data</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset data {dateKeyValue}?</AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh bahan baku, omzet, dan payroll pada tanggal ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onReset();
                toast.success("Data tanggal ini direset");
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
