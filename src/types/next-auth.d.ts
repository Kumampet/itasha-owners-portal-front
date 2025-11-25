import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string; // "USER" | "ADMIN" | "ORGANIZER"
      isBanned: boolean;
      customProfileUrl?: string | null;
      mustChangePassword?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    role: string; // "USER" | "ADMIN" | "ORGANIZER"
    isBanned: boolean;
    customProfileUrl?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // "USER" | "ADMIN" | "ORGANIZER"
    isBanned: boolean;
  }
}

