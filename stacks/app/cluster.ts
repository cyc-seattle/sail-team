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
 * The app's image, by digest. Dev builds it from this commit and pushes it to the environment's registry, tagged with
 * the commit. Prod looks it up by that tag, so prod runs exactly what dev ran.
 */
export function deployedImage({ platform }: Cluster, name: string, context: string): pulumi.Output<string> {
  const tag = `${platform.registry}/${name}:${commitSha()}`;
  if (isDev) {
    return new docker.Image(name, {
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
    }).ref;
  }
  const [host = "", project = "", repositoryId = ""] = platform.registry.split("/");
  const image = gcp.artifactregistry
    .getDockerImage({
      location: host.replace(/-docker\.pkg\.dev$/, ""),
      project,
      repositoryId,
      imageName: `${name}:${commitSha()}`,
    })
    .catch((error: unknown) => {
      throw new Error(`Can't find ${tag}. Dev builds it: deploy this commit to dev first. (${String(error)})`);
    });
  return pulumi.output(image).apply((found) => found.selfLink);
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
