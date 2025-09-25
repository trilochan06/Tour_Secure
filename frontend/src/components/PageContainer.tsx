import { ReactNode } from "react";
export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="max-w-6xl mx-auto p-6 space-y-8">{children}</div>;
}
