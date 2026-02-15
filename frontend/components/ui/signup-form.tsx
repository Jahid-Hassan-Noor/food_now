"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import ErrorModal from "@/components/modals/error-modal"
import InfoModal from "@/components/modals/info-modal"
import SuccessModal from "@/components/modals/success-modal"
import WarningModal from "@/components/modals/warning-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { registerRequest } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [aiuId, setAiuId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [errorMessage, setErrorMessage] = useState("")
  const [isErrorOpen, setIsErrorOpen] = useState(false)

  const [infoMessage, setInfoMessage] = useState("")
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const [warningMessage, setWarningMessage] = useState("")
  const [isWarningOpen, setIsWarningOpen] = useState(false)

  const [isSuccessOpen, setIsSuccessOpen] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setWarningMessage("Please complete all required fields.")
      setIsWarningOpen(true)
      return
    }

    if (password.length < 8) {
      setWarningMessage("Password must be at least 8 characters long.")
      setIsWarningOpen(true)
      return
    }

    if (password !== confirmPassword) {
      setWarningMessage("Password and confirm password do not match.")
      setIsWarningOpen(true)
      return
    }

    const [firstName = "", ...rest] = fullName.trim().split(/\s+/)
    const lastName = rest.join(" ")

    try {
      setIsSubmitting(true)
      await registerRequest({
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: firstName,
        last_name: lastName,
      })
      setIsSuccessOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create account"
      setErrorMessage(message)
      setIsErrorOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden border-slate-200/70 bg-white/90 p-0 backdrop-blur dark:border-slate-700 dark:bg-slate-950/75">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="font-display text-2xl font-semibold">Create account</h1>
                  <p className="text-muted-foreground text-balance">
                    Join Food Now and start ordering or selling homemade meals.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="username">Username</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Select a username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="id">ID</FieldLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setInfoMessage(
                          "Chef and admin access are assigned by administrators after account verification."
                        )
                        setIsInfoOpen(true)
                      }}
                      className="text-xs underline-offset-2 hover:underline"
                    >
                      Why this is needed?
                    </button>
                  </div>
                  <Input
                    id="id"
                    type="text"
                    placeholder="Your student or staff ID"
                    value={aiuId}
                    onChange={(event) => setAiuId(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Official Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@x.aiu.edu.my"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm_password">Confirm password</FieldLabel>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    {isSubmitting ? "Creating account..." : "Create account"}
                  </Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Or continue with
                </FieldSeparator>
                <Field className="justify-center">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setInfoMessage("Social signup will be available soon.")
                      setIsInfoOpen(true)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="sr-only">Continue with Google</span>
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Login</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
            <div className="bg-muted relative hidden md:block">
              <Image
                src="/images/login_image.jpg"
                alt="Campus"
                fill
                sizes="(max-width: 768px) 0px, 50vw"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
          and <a href="#">Privacy Policy</a>.
        </FieldDescription>
      </div>

      <ErrorModal
        open={isErrorOpen}
        onOpenChange={setIsErrorOpen}
        message={errorMessage || "Unable to create account."}
      />

      <InfoModal
        open={isInfoOpen}
        onOpenChange={setIsInfoOpen}
        message={infoMessage || "Information"}
      />

      <WarningModal
        open={isWarningOpen}
        onOpenChange={setIsWarningOpen}
        message={warningMessage || "Please review your input."}
      />

      <SuccessModal
        open={isSuccessOpen}
        onOpenChange={setIsSuccessOpen}
        title="Account created"
        message="Your account has been created as a user role. Login to continue."
        actionLabel="Go to login"
        onAction={() => {
          router.replace("/login")
        }}
      />
    </>
  )
}
