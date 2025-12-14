export interface JwtPayload {
  phoneNumber: string;
  sub: string; // This is the userId (UUID)
}
