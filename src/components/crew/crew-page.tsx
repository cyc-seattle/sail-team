import type { ReactNode } from "react";
import { SectionPage } from "@/components/section-page";

const pages = [
  { key: "members", name: "Crew members", to: "/crew" },
  { key: "positions", name: "Positions", to: "/crew/positions" },
];

/** One page of Crew. */
export function CrewPage({ current, children }: { current: "members" | "positions"; children: ReactNode }) {
  return (
    <SectionPage title="Crew" pages={pages} current={current}>
      {children}
    </SectionPage>
  );
}
