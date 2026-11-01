import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/plans/")({
  component: Plans,
});

function Plans() {
  return <h1>Plans</h1>;
}
