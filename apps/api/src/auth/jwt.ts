import { sign, verify } from 'hono/jwt';

const ALGORITHM = 'HS256';
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

export interface AuthTokenPayload {
  [key: string]: unknown;
  sub: string;
  iat: number;
  exp: number;
}

export async function signAuthToken(
  userId: string,
  secret: string,
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: AuthTokenPayload = {
    sub: userId,
    iat,
    exp: iat + SEVEN_DAYS_IN_SECONDS,
  };

  return sign(payload, secret, ALGORITHM);
}

export async function verifyAuthToken(
  token: string,
  secret: string,
): Promise<AuthTokenPayload> {
  const payload = await verify(token, secret, ALGORITHM);
  return payload as unknown as AuthTokenPayload;
}
