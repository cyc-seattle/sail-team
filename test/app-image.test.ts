import * as pulumi from "@pulumi/pulumi";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { Cluster } from "../stacks/app/cluster.ts";

// The app's image on prod, which builds it when the registry doesn't have its commit's tag yet.

const registry = "us-west1-docker.pkg.dev/test-project/images";

interface Registered {
  type: string;
  name: string;
  inputs: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const resources: Registered[] = [];

// Each image's options, which the mocks don't see.
const imageOptions = vi.hoisted(() => new Map<string, { retainOnDelete?: boolean } | undefined>());
vi.mock("@pulumi/docker-build", async (importOriginal) => {
  const original = await importOriginal<typeof import("@pulumi/docker-build")>();
  class Image extends original.Image {
    constructor(...args: ConstructorParameters<typeof original.Image>) {
      super(...args);
      imageOptions.set(args[0], args[2]);
    }
  }
  return { ...original, Image };
});
/** The image names the mock registry holds. */
const inRegistry = new Set<string>();

pulumi.runtime.setMocks(
  {
    newResource: ({ type, name, inputs }) => {
      resources.push({ type, name, inputs });
      const state =
        type === "docker-build:index:Image" ? { ...inputs, ref: `${inputs["tags"][0]}@sha256:built` } : inputs;
      return { id: `${name}-id`, state };
    },
    call: ({ token, inputs }) => {
      if (token === "gcp:artifactregistry/getDockerImage:getDockerImage") {
        const name = String(inputs["imageName"]).split(":")[0]!;
        if (!inRegistry.has(name)) throw new Error("not found");
        return { ...inputs, selfLink: `${registry}/${name}@sha256:found` };
      }
      if (token === "gcp:organizations/getClientConfig:getClientConfig") {
        return { ...inputs, accessToken: "token" };
      }
      return inputs;
    },
  },
  "app",
  "prod",
  false,
);

let deployedImage: typeof import("../stacks/app/cluster.ts").deployedImage;
let commitSha: string;
const cluster = { platform: { registry } } as Cluster;

const value = <T>(output: pulumi.Output<T>) => new Promise<T>((resolve) => output.apply(resolve));

beforeAll(async () => {
  // Imported after setMocks, since the module reads the stack name when it loads.
  const module = await import("../stacks/app/cluster.ts");
  deployedImage = module.deployedImage;
  commitSha = module.commitSha();
});

describe("The app's image on prod", () => {
  it("is built and pushed, tagged with the commit, when the registry doesn't have it", async () => {
    const image = await value(await deployedImage(cluster, "built", "../.."));
    expect(image).toBe(`${registry}/built:${commitSha}@sha256:built`);
    expect(resources.find((r) => r.name === "built")).toMatchObject({
      type: "docker-build:index:Image",
      inputs: { tags: [`${registry}/built:${commitSha}`], push: true },
    });
  });

  it("keeps its tag in the registry when a later deploy drops the build", () => {
    expect(imageOptions.get("built")?.retainOnDelete).toBe(true);
  });

  it("is run as the registry has it, building nothing, once the tag is there", async () => {
    inRegistry.add("found");
    const image = await value(await deployedImage(cluster, "found", "../.."));
    expect(image).toBe(`${registry}/found@sha256:found`);
    expect(resources.find((r) => r.name === "found")).toBeUndefined();
    expect(imageOptions.has("found")).toBe(false);
  });
});
