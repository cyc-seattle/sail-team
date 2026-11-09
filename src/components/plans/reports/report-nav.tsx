import { Link, useNavigate } from "@tanstack/react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Report {
  /** `overview`, or the rest of its address, such as a plan's id or `non-program`. */
  key: string;
  name: string;
}

function linkProps(setId: string, key: string) {
  return key === "overview"
    ? ({ to: "/plans/financial/$setId", params: { setId } } as const)
    : ({ to: "/plans/financial/$setId/$planId", params: { setId, planId: key } } as const);
}

/** A Financial Plan's reports: underlined tabs on a laptop, and a menu on a phone, where ten tabs don't fit. */
export function ReportNav({ setId, reports, current }: { setId: string; reports: Report[]; current: string }) {
  const navigate = useNavigate();
  return (
    <>
      <nav aria-label="Reports" className="hidden overflow-x-auto border-b md:block">
        <ul className="flex">
          {reports.map((r) => (
            <li key={r.key}>
              <Link
                {...linkProps(setId, r.key)}
                aria-current={r.key === current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex border-b-2 border-transparent px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground",
                  r.key === current && "border-foreground text-foreground",
                )}
              >
                {r.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="md:hidden">
        <Select
          items={reports.map((r) => ({ value: r.key, label: r.name }))}
          value={current}
          onValueChange={(key) => void navigate(linkProps(setId, String(key)))}
        >
          <SelectTrigger aria-label="Report" className="w-full data-[size=default]:h-tap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reports.map((r) => (
              <SelectItem key={r.key} value={r.key}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
