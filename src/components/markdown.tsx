import Markdown, { type Components } from "react-markdown";

const link: Components["a"] = ({ children, href }) => (
  <a href={href} className="text-link underline">
    {children}
  </a>
);

const code: Components["code"] = ({ children }) => (
  <code className="rounded bg-muted px-1 font-mono text-xs">{children}</code>
);

const inlineElements = ["p", "strong", "em", "code", "a"];
const inline: Components = {
  // A note sits inside a sentence's worth of space, so its one paragraph is never a block.
  p: ({ children }) => <>{children}</>,
  a: link,
  code,
};

/** A note's inline Markdown: bold, italic, code, and links. Anything else shows as its text. Raw HTML is dropped. */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <Markdown skipHtml allowedElements={inlineElements} unwrapDisallowed components={inline}>
      {children}
    </Markdown>
  );
}
