import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleUserInfo = {
  sub: string;
  name?: string;
  email?: string;
};

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = createOAuthHttpClient();
  }

  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<GoogleTokenResponse> {
    if (!isNonEmptyString(ENV.googleClientId) || !isNonEmptyString(ENV.googleClientSecret)) {
      throw new Error("Google OAuth client credentials are not configured.");
    }

    const body = new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const { data } = await this.client.post<GoogleTokenResponse>(
      "https://oauth2.googleapis.com/token",
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return data;
  }

  async getUserInfo(accessToken: string): Promise<{ openId: string; name: string; email?: string }> {
    if (!isNonEmptyString(accessToken)) {
      throw new Error("Missing Google access token.");
    }

    const { data } = await this.client.get<GoogleUserInfo>(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!data || !isNonEmptyString(data.sub)) {
      throw new Error("Invalid Google user info response.");
    }

    return {
      openId: data.sub,
      name: data.name ?? "",
      email: data.email,
    };
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    if (!isNonEmptyString(ENV.cookieSecret)) {
      throw new Error("JWT secret is not configured.");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const payload: SessionPayload = {
      openId,
      appId: ENV.appId,
      name: options.name ?? "",
    };
    return this.signSession(payload, options);
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(`${Math.floor(expiresInMs / 1000)}s`)
      .sign(this.getSessionSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        return null;
      }

      return {
        openId,
        appId,
        name,
      } as SessionPayload;
    } catch {
      return null;
    }
  }

  private async getUserInfoWithJwt(jwtToken: string) {
    const session = await this.verifySession(jwtToken);
    if (!session) {
      throw new Error("Invalid JWT session token.");
    }

    return {
      openId: session.openId,
      name: session.name,
      email: undefined,
      taskUid: undefined,
    };
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw new ForbiddenError();
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "google",
        lastSignedIn: signedInAt,
      });
      user = await db.getUserByOpenId(userInfo.openId);
    }

    if (!user) {
      throw new ForbiddenError();
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export type AuthenticatedUser = User;

export const sdk = new SDKServer();
