"use client";
export const dynamic = "force-dynamic"
import { useEffect } from "react";
import { useOnboardingCtaStore } from "@/lib/stores/onboarding-cta-store";
import OnboardingClient from "@/components/onboarding/onboarding-client";

export default function HostOnboardingPage() {
	const setCtaText = useOnboardingCtaStore((state) => state.setCtaText);
	useEffect(() => {
		setCtaText("Host Onboarding");
		return () => setCtaText("");
	}, [setCtaText]);
	return <OnboardingClient />;
}

