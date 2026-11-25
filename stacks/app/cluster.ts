import childProcess from "node:child_process";
import * as docker from "@pulumi/docker-build";
import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { clusterProvider, readPlatformOutputs, type PlatformOutputs } from "@cyc-seattle/platform";

// The cluster and image helpers every app on the platform uses, as in platform's own src/app/cluster.ts, which its
// package doesn't export.

export const isDev = pulumi.getStack() === "dev";

export interface Cluster {
  platform: PlatformOutputs;
  provider: k8s.Provider;
}

/** The environment's platform values and cluster provider. */
export async function loadCluster(): Promise<Cluster> {
  const platform = await readPlatformOutputs();
  return { platform, provider: clusterProvider(platform) };
}

/** The commit being deployed. Images are tagged with it. */
export function commitSha(): string {
  return childProcess.execFileSync("git", ["rev-parse", "HEAD"], { cwd: import.meta.dirname, encoding: "utf8" }).trim();
}

/**
 * The app's image, by digest, tagged with the commit. Each tag is pushed once: if it's in the environment's registry,
 * the deploy runs it as it is. Otherwise the deploy builds and pushes it (cyc-seattle/platform#171).
 */
export async function deployedImage(
  { platform }: Cluster,
  name: string,
  context: string,
): Promise<pulumi.Output<string>> {
  const tag = `${platform.registry}/${name}:${commitSha()}`;
  const [host = "", project = "", repositoryId = ""] = platform.registry.split("/");
  const found = await gcp.artifactregistry
    .getDockerImage({
      location: host.replace(/-docker\.pkg\.dev$/, ""),
      project,
      repositoryId,
      imageName: `${name}:${commitSha()}`,
    })
    .then(
      (image) => image.selfLink,
      () => undefined,
    );
  if (found !== undefined) {
    return pulumi.output(found);
  }
  return new docker.Image(
    name,
    {
      tags: [tag],
      context: { location: context },
      platforms: ["linux/amd64"],
      push: true,
      // Otherwise every preview builds the image.
      buildOnPreview: false,
      registries: [
        {
          address: platform.registry.split("/")[0] ?? platform.registry,
          username: "oauth2accesstoken",
          password: gcp.organizations.getClientConfigOutput({}).accessToken,
        },
      ],
    },
    // The provider deletes an image's tags with it. The next deploy finds the tag and drops the resource, and the
    // pods still run that tag (cyc-seattle/platform#72).
    { retainOnDelete: true },
  ).ref;
}

/**
 * The A record for the environment's apex, `platform.domain`, which prod's Cloud DNS holds and dev's wildcard covers.
 * It was isthmia's portal's, and is adopted here as it stands (sail-team#1).
 */
export async function apexRecord({ platform }: Cluster): Promise<gcp.dns.RecordSet> {
  const infra = new pulumi.StackReference(`organization/infra/${pulumi.getStack()}`);
  const zone = (await infra.getOutputDetails("internalZoneName")).value as string;
  const name = `${platform.domain}.`;
  return new gcp.dns.RecordSet(
    "apex-a",
    { name, type: "A", ttl: 300, managedZone: zone, rrdatas: [platform.gatewayAddress] },
    { import: `projects/${platform.project}/managedZones/${zone}/rrsets/${name}/A` },
  );
}
