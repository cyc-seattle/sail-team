// Made-up links and announcements, for local work and tests.

/** A site's preview image, drawn here so nothing loads from outside. */
const preview = (from: string, to: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 382 200"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="382" height="200" fill="url(#g)"/><path d="M191 40 L191 150 L120 150 Z" fill="#fff" opacity=".9"/><path d="M198 60 L198 150 L250 150 Z" fill="#fff" opacity=".7"/><path d="M100 160 H282 L262 175 H120 Z" fill="#fff" opacity=".9"/></svg>`,
  )}`;

export const homeTables: Record<string, Record<string, unknown>[]> = {
  links: [
    {
      id: "00000000-0000-4000-8000-000000000901",
      sort: 1,
      title: "CSC website (draft)",
      url: "https://csc-website.web.app",
      note: "The new public website, still a draft.",
      preview_title: "Community Sailing Center",
      preview_description: "Learn to sail on Shilshole Bay.",
      preview_image: preview("#1f2a5c", "#3b6fb6"),
    },
    {
      id: "00000000-0000-4000-8000-000000000902",
      sort: 2,
      title: "Google Calendar",
      url: "https://calendar.google.com",
      note: null,
      preview_title: "Google Calendar",
      preview_description: "Plan your days, and see what's coming up.",
      preview_image: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000903",
      sort: 3,
      title: "Coaches' handbook",
      url: "https://docs.example.org/coaches-handbook",
      note: "Drills, safety checks, and the plan for each week.",
      preview_title: null,
      preview_description: null,
      preview_image: preview("#c8102e", "#1f2a5c"),
    },
  ],
  announcements: [
    {
      id: "00000000-0000-4000-8000-000000000953",
      title: "The bottom line, at a glance",
      body: "The list of plans shows each one's operating revenue, expenses, and net. Boat rates now go by **boat class**.",
      published_on: "2026-11-14",
    },
    {
      id: "00000000-0000-4000-8000-000000000952",
      title: "Planning reports",
      body: "Each financial plan now has:\n\n- an Overview\n- a report for each program area\n- a Calendar of every program, by week and by day\n- Fundraising and Capital",
      published_on: "2026-11-12",
    },
    {
      id: "00000000-0000-4000-8000-000000000951",
      title: "Team rosters",
      body: "Rosters lists the sailors and guardians on your team. Each adult chooses whether their email and phone show there.",
      published_on: "2026-11-04",
    },
  ],
};
