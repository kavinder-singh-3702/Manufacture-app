"use client";

import Link from "next/link";
import type { ReactNode, MouseEventHandler } from "react";
import type { AdDestination } from "../adView";

type AdLinkProps = {
  destination: AdDestination;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  "aria-label"?: string;
  children: ReactNode;
};

// A real anchor for the destination, so external ads keep middle-click/
// open-in-new-tab semantics instead of forcing a click handler + router.push.
// Internal ads stay on next/link for prefetching.
export const AdLink = ({ destination, className, onClick, children, ...rest }: AdLinkProps) => {
  if (destination.kind === "external") {
    return (
      <a href={destination.url} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={destination.href} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
};
