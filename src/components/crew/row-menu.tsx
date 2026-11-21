import { MoreHorizontalIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refusalOf } from "@/directus/financial-plans";
import type { SaveState } from "./save";

export interface MenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

/** A row's actions, behind a ⋯ button at its end. Nothing when there are none. */
export function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-tap md:size-8" aria-label={label} />}
            />
          }
        >
          <MoreHorizontalIcon aria-hidden />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            variant={item.destructive ? "destructive" : "default"}
            onClick={item.onClick}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Asks before deleting something, and says why when Directus refuses. */
export function DeleteDialog({
  title,
  description,
  open,
  onClose,
  onDelete,
}: {
  title: string;
  description?: ReactNode;
  open: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [state, setState] = useState<{ kind: "idle" | "working" } | { kind: "failed"; reason: string }>({
    kind: "idle",
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
          setState({ kind: "idle" });
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? "This can't be undone."}</DialogDescription>
        </DialogHeader>
        {state.kind === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            {state.reason}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            disabled={state.kind === "working"}
            onClick={async () => {
              setState({ kind: "working" });
              try {
                await onDelete();
                onClose();
                setState({ kind: "idle" });
              } catch (error) {
                setState({ kind: "failed", reason: refusalOf(error) });
              }
            }}
          >
            {state.kind === "working" ? "Working…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Why a save failed, under a form. */
export function SaveFailed({ state }: { state: SaveState }) {
  return state.kind === "failed" ? (
    <p role="alert" className="text-sm text-destructive">
      {state.reason}
    </p>
  ) : null;
}
