import { SelectHTMLAttributes } from "react";
export default function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-black focus:ring-1 focus:ring-black ${props.className||""}`} />;
}
