export function formatBytes(n: bigint | number | string): string {
  const v = typeof n === "bigint" ? Number(n) : typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v) || v <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let x = v;
  let i = 0;
  while (x >= 1024 && i < u.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x < 10 && i > 0 ? x.toFixed(1) : Math.round(x)} ${u[i]}`;
}

export function formatMegabytes(mb: number): string {
  return formatBytes(mb * 1024 * 1024);
}
