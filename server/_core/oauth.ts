import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getOrigin(req: Request): string {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google", async (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(500).json({ error: "Google OAuth client ID is not configured" });
      return;
    }

    const origin = getOrigin(req);
    const redirectUri = ENV.googleRedirectUri || `${origin}/api/oauth/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie("google_oauth_state", state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
    });

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", ENV.googleClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "select_account consent");
    authUrl.searchParams.set("state", state);

    res.redirect(authUrl.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const storedState = cookies.google_oauth_state;

    if (!code || !state || !storedState || storedState !== state) {
      res.status(400).json({ error: "Invalid OAuth callback state" });
      return;
    }

    try {
      const origin = getOrigin(req);
      const redirectUri = ENV.googleRedirectUri || `${origin}/api/oauth/callback`;
      const tokenResponse = await sdk.exchangeCodeForToken(code, redirectUri);
      const userInfo = await sdk.getUserInfo(tokenResponse.access_token);

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.clearCookie("google_oauth_state", { ...cookieOptions, maxAge: -1 });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
