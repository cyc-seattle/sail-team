import { useBlocker } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { FormField } from "@/components/form-field";
import { LabeledSwitch } from "@/components/labeled-switch";
import { ReportSection } from "@/components/plans/reports/report-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WebsiteProfile as Profile } from "@/model/crew";
import { SaveFailed } from "./row-menu";
import { runSave, type SaveState } from "./save";

export interface ProfileActions {
  onSave: (profile: Profile) => Promise<void>;
  /** Uploads a photo into the Website folder, and resolves to its id. */
  onUpload: (file: File) => Promise<string>;
}

/**
 * What the public website shows of a crew member: whether it shows them at all, their name, bio, and photo. A Crew
 * Writer changes it here, with Save and Discard; anyone else reads it.
 */
export function WebsiteProfile({
  profile,
  photoUrl,
  actions,
}: {
  profile: Profile;
  /** Where a photo is shown from. */
  photoUrl: (id: string) => string;
  /** None for someone who can't change it. */
  actions?: ProfileActions | undefined;
}) {
  const [draft, setDraft] = useState(profile);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [uploading, setUploading] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const dirty =
    (draft.website_name ?? "") !== (profile.website_name ?? "") ||
    (draft.website_bio ?? "") !== (profile.website_bio ?? "") ||
    draft.website_photo !== profile.website_photo ||
    draft.on_website !== profile.on_website;
  useBlocker({
    shouldBlockFn: () => !window.confirm("Leave without saving the website profile?"),
    enableBeforeUnload: dirty,
    disabled: !dirty,
  });
  const set = (changes: Partial<Profile>) => setDraft({ ...draft, ...changes });
  const readOnly = !actions;
  const noName = draft.on_website && !draft.website_name?.trim();

  return (
    <ReportSection id="website" title="Website">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runSave(
            () =>
              actions!.onSave({
                ...draft,
                website_name: draft.website_name?.trim() || null,
                website_bio: draft.website_bio?.trim() || null,
              }),
            setState,
            () => setState({ kind: "idle" }),
          );
        }}
      >
        <fieldset disabled={readOnly} className="grid gap-4">
          <LabeledSwitch label="On the website" checked={draft.on_website} onChange={(on) => set({ on_website: on })} />
          <div className="grid gap-4 md:grid-cols-[10rem_1fr]">
            <div className="grid content-start gap-2">
              {draft.website_photo ? (
                <img
                  src={photoUrl(draft.website_photo)}
                  alt="Photo on the website"
                  className="aspect-square w-40 rounded-lg object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex aspect-square w-40 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ImageIcon aria-hidden />
                  <span className="sr-only">No photo</span>
                </div>
              )}
              {actions && (
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={file}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label="Photo"
                    tabIndex={-1}
                    onChange={async (e) => {
                      const picked = e.target.files?.[0];
                      e.target.value = "";
                      if (!picked) {
                        return;
                      }
                      setUploading(true);
                      try {
                        set({ website_photo: await actions.onUpload(picked) });
                        setState({ kind: "idle" });
                      } catch {
                        setState({ kind: "failed", reason: "The photo didn't upload. Try again." });
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => file.current?.click()}
                  >
                    {uploading ? "Uploading…" : draft.website_photo ? "Replace photo" : "Upload photo"}
                  </Button>
                  {draft.website_photo && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set({ website_photo: null })}>
                      Remove photo
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="grid content-start gap-4">
              <FormField
                label="Name on the website"
                hint={
                  noName ? (
                    <p role="alert" className="text-sm text-destructive">
                      Add a name to show them on the website.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">For anyone under 18, first name only.</p>
                  )
                }
              >
                {(id) => (
                  <Input
                    id={id}
                    value={draft.website_name ?? ""}
                    onChange={(e) => set({ website_name: e.target.value })}
                    aria-invalid={noName || undefined}
                  />
                )}
              </FormField>
              <FormField label="Bio">
                {(id) => (
                  <Textarea
                    id={id}
                    rows={5}
                    value={draft.website_bio ?? ""}
                    onChange={(e) => set({ website_bio: e.target.value })}
                  />
                )}
              </FormField>
            </div>
          </div>
        </fieldset>
        <SaveFailed state={state} />
        {actions && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!dirty || state.kind === "saving"}
              onClick={() => {
                setDraft(profile);
                setState({ kind: "idle" });
              }}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!dirty || state.kind === "saving" || uploading}>
              {state.kind === "saving" ? "Working…" : "Save"}
            </Button>
          </div>
        )}
      </form>
    </ReportSection>
  );
}
