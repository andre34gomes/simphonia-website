import Image from "next/image";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Realistic device frame used to present raw app screenshots consistently
 * across the site. Screenshots are 1280x2763-2856 (9:19.5-ish) captures
 * from the actual running app, not stock imagery.
 */
export function PhoneMockup({ src, alt, className, priority, sizes }: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto aspect-[9/19.5] w-full max-w-[300px]", className)}>
      {/* Frame */}
      <div className="absolute inset-0 rounded-[2.6rem] bg-gradient-to-b from-[#3a3a3d] to-[#1a1a1c] p-[3px] shadow-2xl shadow-black/50">
        <div className="h-full w-full rounded-[2.5rem] bg-black p-2">
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-black">
            <Image
              src={src}
              alt={alt}
              fill
              priority={priority}
              sizes={sizes ?? "(max-width: 768px) 60vw, 300px"}
              className="object-cover object-top"
            />
            {/* Dynamic-island style notch */}
            <div className="absolute top-2 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          </div>
        </div>
      </div>
      {/* Side buttons */}
      <div className="absolute top-24 -left-[3px] h-8 w-[3px] rounded-l-sm bg-[#2a2a2d]" />
      <div className="absolute top-36 -left-[3px] h-14 w-[3px] rounded-l-sm bg-[#2a2a2d]" />
      <div className="absolute top-28 -right-[3px] h-16 w-[3px] rounded-r-sm bg-[#2a2a2d]" />
    </div>
  );
}
