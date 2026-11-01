# sail-team: the built app, served by Caddy, non-root on a read-only root.

# Runs on the build host's own architecture; the built files are architecture-neutral.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && npm install -g corepack@latest
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

COPY index.html vite.config.ts tsconfig.json components.json ./
COPY public/ public/
COPY src/ src/
RUN pnpm exec vite build

FROM caddy:2-alpine

# Without capabilities, the kernel refuses to run a binary that carries file capabilities.
RUN apk add --no-cache libcap && setcap -r /usr/bin/caddy && apk del libcap

COPY Caddyfile /etc/caddy/Caddyfile
RUN DIRECTUS_ORIGIN=https://directus.example.org caddy validate --adapter caddyfile --config /etc/caddy/Caddyfile
COPY --from=build /usr/src/app/dist /srv

# The pod mounts emptyDirs at XDG_DATA_HOME (/data) and XDG_CONFIG_HOME (/config).
USER 65532:65532
EXPOSE 8080
