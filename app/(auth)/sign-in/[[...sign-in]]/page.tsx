import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: "bg-primary text-primary-foreground hover:opacity-90 transition-all",
            card: "bg-card border-border shadow-2xl rounded-2xl",
          },
        }}
        forceRedirectUrl="/builder"
      />
    </div>
  );
}
