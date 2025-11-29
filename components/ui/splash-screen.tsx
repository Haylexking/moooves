import Image from "next/image";

interface SplashScreenProps {
  progress?: number;
}

export function SplashScreen({ progress = 0 }: SplashScreenProps) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/background.png"
        alt="Splash Background"
        fill
        style={{ objectFit: "cover", zIndex: 0 }}
        priority
      />
      {/* Logo image */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-[-10vh]">
        <Image
          src="/images/moooves logo.png"
          alt="MOOOVES Logo"
          width={500}
          height={160}
          className="w-[60vw] max-w-[500px] h-auto"
          priority
        />
      </div>
      {/* Loading text and bar */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-12">
        <span className="text-white text-lg mb-2">Loading...</span>
        <div className="w-[320px] max-w-[80vw] h-3 bg-green-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all duration-200"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
