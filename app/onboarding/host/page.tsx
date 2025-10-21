"use client";
export const dynamic = "force-dynamic"
import { useEffect } from "react";
import { useOnboardingCtaStore } from "@/lib/stores/onboarding-cta-store";
import HostOnboardingClient from "@/components/onboarding/host-onboarding-client";

export default function HostOnboardingPage() {
	const setCtaText = useOnboardingCtaStore((state) => state.setCtaText);
	useEffect(() => {
		setCtaText("Host Onboarding");
		return () => setCtaText("");
	}, [setCtaText]);
	return <HostOnboardingClient />;
}
