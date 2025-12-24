import { OnboardingForm } from "@/components/onboarding-form"

export default function OnboardingPage() {
  return (
    <div className="min-h-svh flex flex-col">
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xs md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
          <OnboardingForm />
        </div>
      </div>
    </div>
  )
}

