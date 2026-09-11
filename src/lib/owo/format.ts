export const rupiah = (n: number) =>
  "Rp " + Math.round(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export const numeric = (v: string) => {
  const parsed = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const longDate = (key: string) => {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {

    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
