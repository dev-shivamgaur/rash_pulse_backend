import { Role } from "../enums/role.enum";

export type JwtPayload = {
    sub: string;
    phoneNumber?: string;
    roles: Role[]; 
    deviceId: string;
  }

