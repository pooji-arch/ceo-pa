import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../lib/utils";

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[0.64rem] font-extrabold text-[var(--muted-strong)] uppercase tracking-[0.06em] mb-1.5">
      {children}
    </label>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function TextField({
  label,
  className,
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <input className={cx("glass-input w-full px-3 py-2.5 text-[13.5px]", className)} {...rest} />
    </div>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...rest
}: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <select className={cx("glass-input w-full px-3 py-2.5 text-[13.5px]", className)} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function TextAreaField({
  label,
  className,
  ...rest
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea className={cx("glass-input w-full px-3 py-2.5 text-[13.5px]", className)} rows={2} {...rest} />
    </div>
  );
}
