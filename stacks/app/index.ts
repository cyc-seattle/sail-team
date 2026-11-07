import * as pulumi from "@pulumi/pulumi";
import { WebService } from "@cyc-seattle/platform";
import { deployedImage, loadCluster } from "./cluster.ts";

// sail-team takes the environment's whole domain from isthmia's portal (sail-team#1). Until the portal's route is
// gone, the Gateway gives "/" to the older of the two routes, the portal's, while the longer prefixes here win
// outright. A PathPrefix matches whole path segments, so "/roster" doesn't catch "/rosters", which redirects old links.
const paths = ["/", "/plans", "/roster", "/rosters", "/_app"];

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

export const url = app.url;
