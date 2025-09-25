import { TextareaHTMLAttributes } from "react";
export default function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-lg border border-neutral-300 px-3 py-2 shadow-sm focus:border-black focus:ring-1 focus:ring-black ${props.className||""}`} />;
}
