import Markdown, { type Components } from "react-markdown";

// A note is inline markdown only: bold, italic, code, and links. Anything else shows as its text.
const ALLOWED = ["p", "strong", "em", "code", "a"];

const inline: Components = {
  p: ({ children }) => <>{children}</>,
  a: ({ children, href }) => (
    <a href={href} className="text-link underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 font-mono text-[0.9em]">{children}</code>,
};

/** A short note in inline markdown, drawn inside the text around it. Raw HTML is dropped, never drawn. */
export function InlineMarkdown({ text }: { text: string }) {
  return (
    <Markdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={inline}>
      {text}
    </Markdown>
  );
}
