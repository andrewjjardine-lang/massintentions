import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    parishId: string | null;
    parishName: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      parishId: string | null;
      parishName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    parishId: string | null;
    parishName: string | null;
  }
}
