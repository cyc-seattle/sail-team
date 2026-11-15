import { asAdmin, newRunId } from "./support";

// A made-up boat class on dev, for Inventory's journeys, named so a later run can find and delete what an earlier one
// left, with the boats a scenario adds to it.

const prefix = "Journey ";

/** Deletes a class's boats and their assets, then the class. Directus refuses to delete either while it's used. */
async function deleteClass(classId: string): Promise<void> {
  const filter = encodeURIComponent(JSON.stringify({ boat_class_id: { _eq: classId } }));
  const boats: { id: string; asset_id: string }[] = await asAdmin(
    "GET",
    `/items/boats?filter=${filter}&fields=id,asset_id&limit=-1`,
  );
  for (const { id, asset_id } of boats) {
    await asAdmin("DELETE", `/items/boats/${id}`);
    await asAdmin("DELETE", `/items/assets/${asset_id}`);
  }
  await asAdmin("DELETE", `/items/boat_classes/${classId}`);
}

export class Fleet {
  readonly className = `${prefix}${newRunId()} dinghy`;
  private classId?: string;

  /** Adds the scenario's boat class, each boat taking `sqFt` of dry storage. */
  async boatClass(sqFt: number): Promise<void> {
    const { id } = await asAdmin("POST", "/items/boat_classes", {
      name: this.className,
      max_capacity: 2,
      footprint_sq_ft: String(sqFt),
    });
    this.classId = id;
  }

  async cleanUp(): Promise<void> {
    if (this.classId) {
      await deleteClass(this.classId);
    }
  }
}

/** Deletes the boat classes, and their boats, that earlier runs made and never cleaned up. */
export async function cleanUpStaleFleets(): Promise<void> {
  const filter = encodeURIComponent(JSON.stringify({ name: { _starts_with: prefix } }));
  const stale: { id: string }[] = await asAdmin("GET", `/items/boat_classes?filter=${filter}&fields=id&limit=-1`);
  for (const { id } of stale) {
    await deleteClass(id);
  }
}
