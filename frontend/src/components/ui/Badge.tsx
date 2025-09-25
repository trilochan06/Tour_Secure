export default function Badge({ children, tone="neutral" }: { children: React.ReactNode; tone?: "neutral"|"success"|"warning"|"danger" }) {
  const map = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-800",
    danger:  "bg-red-100 text-red-700",
  } as const;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
}
