import { ReactNode } from "react";

export function Card({ children, className="" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="px-6 py-4 border-b flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      {actions}
    </div>
  );
}
export function CardBody({ children, className="" }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
