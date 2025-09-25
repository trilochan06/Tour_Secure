import { ButtonHTMLAttributes } from "react";
type Variant = "primary" | "outline" | "ghost";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export default function Button({ variant="primary", className="", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
  const styles: Record<Variant,string> = {
    primary: "bg-black text-white hover:bg-neutral-900 focus:ring-black",
    outline: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-300",
    ghost:   "text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
