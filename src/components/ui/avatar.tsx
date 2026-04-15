"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import NextImage from "next/image";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

interface AvatarImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

// Uses next/image with fill so remote patterns (Steam CDN) are respected
// and the image is reliably displayed after SSR hydration.
// The fallback div is a static sibling; the absolute-positioned image
// naturally paints on top of it once loaded.
const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt = "", className }, ref) => {
    const [failed, setFailed] = React.useState(false);

    React.useEffect(() => {
      setFailed(false);
    }, [src]);

    if (!src || failed) return null;

    return (
      <NextImage
        ref={ref}
        src={src}
        alt={alt}
        fill
        sizes="64px"
        className={cn("object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }
);
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--muted-foreground)]",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
