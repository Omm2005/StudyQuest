import "next-auth"
import "@auth/core/jwt"

declare module "next-auth" {
  interface Session {
    provider?: "google"
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    provider?: "google"
  }
}