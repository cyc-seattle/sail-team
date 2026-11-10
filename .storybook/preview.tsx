import type { Decorator, Preview } from "@storybook/react-vite";
import "../src/styles/index.css";

// Applies the toolbar's theme the way public/_app/theme.js does in the app.
const withTheme: Decorator = (Story, { globals }) => {
  document.documentElement.classList.toggle("dark", globals["theme"] === "dark");
  return (
    <div className="bg-background p-4 text-foreground">
      <Story />
    </div>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Light or dark",
      toolbar: { icon: "contrast", items: ["light", "dark"], dynamicTitle: true },
    },
  },
  // vite.config.ts runs the stories once per theme.
  initialGlobals: { theme: import.meta.env["VITE_STORY_THEME"] ?? "light" },
  parameters: {
    // A violation fails the story's test, in CI too.
    a11y: { test: "error" },
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" },
        laptop: { name: "Laptop", styles: { width: "1440px", height: "900px" }, type: "desktop" },
      },
    },
  },
};

export default preview;
