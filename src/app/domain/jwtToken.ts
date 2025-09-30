export interface JwtToken {
  sub: string;
  given_name: string;
  family_name: string;
  email: string;
  role: string;
  jti: string;
  exp: number;
  iss: string;
  aud: string;
}