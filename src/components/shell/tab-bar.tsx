import { Link } from "@tanstack/react-router";
import { EllipsisIcon } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import type { NavItem } from "@/model/nav";
import { PageIcon } from "./page-icon.tsx";

const tab =
  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs [&_svg]:size-5 data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold";

/** The phone's way around: the first four pages, then More, which opens the sidebar with everything else. */
export function TabBar({ pages }: { pages: NavItem[] }) {
  const { openMobile, setOpenMobile } = useSidebar();
  return (
    <nav
      aria-label="Pages"
      className="fixed inset-x-0 bottom-0 z-20 bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground md:hidden"
    >
      <ul className="flex">
        {pages.slice(0, 4).map((page) => (
          <li key={page.to} className="flex-1">
            <Link to={page.to} activeOptions={{ exact: page.to === "/" }} className={tab}>
              <PageIcon to={page.to} />
              {page.label}
            </Link>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(true)}
            className={tab}
          >
            <EllipsisIcon aria-hidden />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}
