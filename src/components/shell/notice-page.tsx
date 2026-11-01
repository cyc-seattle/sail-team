import type { ReactNode } from "react";

/** A whole-page message in place of content: no access, sign-in trouble, an error. */
export function NoticePage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="mx-auto grid max-w-md gap-2 px-card py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="text-sm text-muted-foreground">{children}</div>}
    </main>
  );
}
