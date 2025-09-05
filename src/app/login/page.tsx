'use client'

import { useTransition } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36 16.8 36 11 30.2 11 23S16.8 10 24 10c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 4.6 29.5 2.7 24 2.7 12 2.7 2.7 12 2.7 24S12 45.3 24 45.3c12 0 21.3-9.3 21.3-21.3 0-1.5-.2-3-.7-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16 19.1 13.3 24 13.3c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.5 4.6 29.5 2.7 24 2.7 16 2.7 9.1 7.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45.3c5.2 0 10-2 13.5-5.3l-6.2-5.1C29.5 36.6 26.9 37.3 24 37.3c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5.1C9 41.2 15.9 45.3 24 45.3z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.2 5.3-6 6.6l6.2 5.1c-.4.3 8.8-5.1 8.8-15.7 0-1.5-.2-3-.7-3.5z"/>
    </svg>
  )
}

export default function Page() {
  const [isPending, startTransition] = useTransition()

  const onGoogle = () =>
    startTransition(() => {
      void signIn("google", { callbackUrl: "/" })
    })

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/10),transparent_60%)]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to continue to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full h-11 gap-3"
            onClick={onGoogle}
            disabled={isPending}
          >
            <GoogleIcon className="size-5" />
            {isPending ? "Connecting..." : "Continue with Google"}
          </Button>
        </CardContent>
        <CardFooter className="flex-col gap-1">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms and acknowledge our Privacy Policy.
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}