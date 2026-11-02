import { Link } from "@tanstack/react-router";
import { ChevronLeftIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Where the back link above the title goes, and what it says. */
  back?: { to: string; label: string };
  /** Buttons for the page, on the right. */
  actions?: ReactNode;
}

/** The top of a page: a back link, the title, a line about it, and its actions on the right. */
export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <header className="grid gap-1 pb-card">
      {back && (
        <Link to={back.to} className="inline-flex items-center gap-1 text-sm text-link hover:underline">
          <ChevronLeftIcon className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </header>
  );
}
