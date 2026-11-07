import * as pulumi from "@pulumi/pulumi";
import { WebService } from "@cyc-seattle/platform";
import { apexRecord, deployedImage, isDev, loadCluster } from "./cluster.ts";

// sail-team shares the environment's domain with isthmia's portal until it replaces it (sail-team#1). It claims
// only its own paths, and the portal keeps the rest. A PathPrefix matches whole path segments, so "/roster" doesn't
// catch "/rosters", which keeps its own entry to redirect old links.
const paths = ["/plans", "/roster", "/rosters", "/_app"];

const cluster = await loadCluster();
const { platform, provider } = cluster;

const replicas = new pulumi.Config().getNumber("replicas") ?? 1;
const app = new WebService("sail-team", {
  platform,
  provider,
  // So an Autopilot node move never takes the app down.
  replicas,
  ...(replicas > 1 && { minAvailable: 1, spreadAcrossZones: true }),
  hostname: platform.domain,
  paths,
  image: deployedImage(cluster, "sail-team", "../.."),
  port: 8080,
  env: [{ name: "DIRECTUS_ORIGIN", value: `https://directus.${platform.domain}` }],
  requests: { cpu: "50m", memory: "64Mi" },
  readinessProbe: { httpGet: { path: "/healthz", port: 8080 } },
  // Caddy's XDG_DATA_HOME and XDG_CONFIG_HOME. It writes nothing else.
  volumes: [
    { name: "data", mountPath: "/data", emptyDir: {} },
    { name: "config", mountPath: "/config", emptyDir: {} },
  ],
});

if (!isDev) {
  await apexRecord(cluster);
}

export const url = app.url;
