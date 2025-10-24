FROM node:22.14-bookworm-slim AS base

USER node
WORKDIR /usr/src/app

FROM base AS build

ARG APP_PATH=
COPY $APP_PATH/package*.json /usr/src/app/

RUN --mount=type=secret,mode=0644,id=npmrc,target=/usr/src/app/.npmrc \
    --mount=type=cache,target=/root/.npm \
    set -eu; \
    npm ci;

COPY --chown=node:node $APP_PATH/ /usr/src/app/

FROM base AS ci

COPY --chown=node:node --from=build /usr/src/app/ /usr/src/app/

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node -v >/dev/null 2>&1 || exit 1

CMD [ "tail", "-f", "/dev/null" ]