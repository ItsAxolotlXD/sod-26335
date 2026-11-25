import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { getSpotlightWallpapers } from "./lib/spotlight-wallpapers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const LOVABLE_ASSET_ORIGIN = "https://s27m1-b26330.lovable.app";
const ASSET_ROUTE_RE = /^\/__l5e\/assets-v1\/[^/]+\/[^/]+$/;

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/__l5e/")) {
        if (
          ASSET_ROUTE_RE.test(url.pathname) &&
          (request.method === "GET" || request.method === "HEAD")
        ) {
          try {
            const upstreamUrl = new URL(url.pathname + url.search, LOVABLE_ASSET_ORIGIN);
            const forwardHeaders = new Headers();
            const range = request.headers.get("range");
            if (range) forwardHeaders.set("range", range);
            const upstreamRes = await fetch(upstreamUrl.toString(), {
              method: request.method,
              headers: forwardHeaders,
            });
            const responseHeaders = new Headers();
            const copyHeaders = [
              "content-type",
              "content-range",
              "accept-ranges",
              "cache-control",
              "etag",
            ];
            if (!upstreamRes.headers.get("content-encoding")) {
              copyHeaders.push("content-length");
            }
            for (const key of copyHeaders) {
              const val = upstreamRes.headers.get(key);
              if (val) responseHeaders.set(key, val);
            }
            return new Response(upstreamRes.body, {
              status: upstreamRes.status,
              headers: responseHeaders,
            });
          } catch {
            return new Response("Asset Unavailable", { status: 502 });
          }
        }
        return new Response("Not Found", { status: 404 });
      }
      if (url.pathname === "/api/spotlight-wallpapers") {
        const forceRefresh = url.searchParams.get("refresh") === "1";
        const payload = await getSpotlightWallpapers(forceRefresh);
        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
