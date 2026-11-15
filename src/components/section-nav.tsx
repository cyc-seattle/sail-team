import { Link, useNavigate } from "@tanstack/react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** One page of a section, and where it is. */
export interface SectionPage {
  key: string;
  name: string;
  to: string;
  params?: Record<string, string>;
}

/**
 * The pages of a section, such as a Financial Plan's reports: underlined tabs on a laptop, and a menu on a phone, where
 * many tabs don't fit. `label` names both, such as "Reports".
 */
export function SectionNav({ label, pages, current }: { label: string; pages: SectionPage[]; current: string }) {
  const navigate = useNavigate();
  const linkOf = (key: string) => {
    const { to, params } = pages.find((p) => p.key === key)!;
    return { to, params: params ?? {} };
  };
  return (
    <>
      <nav aria-label={label} className="hidden overflow-x-auto border-b md:block">
        <ul className="flex">
          {pages.map((p) => (
            <li key={p.key}>
              <Link
                {...linkOf(p.key)}
                aria-current={p.key === current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex border-b-2 border-transparent px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground",
                  p.key === current && "border-foreground text-foreground",
                )}
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="md:hidden">
        <Select
          items={pages.map((p) => ({ value: p.key, label: p.name }))}
          value={current}
          onValueChange={(key) => void navigate(linkOf(String(key)))}
        >
          <SelectTrigger aria-label={label.replace(/s$/, "")} className="w-full data-[size=default]:h-tap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
