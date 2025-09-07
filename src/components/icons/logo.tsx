import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>FaceCheck Logo</title>
      <path d="M12 2a10 10 0 1 0 10 10" stroke="hsl(var(--primary))" />
      <path d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" fill="hsl(var(--primary) / 0.2)" />
      <path d="M12 14c-2.67 0-5 1-5 3v1h10v-1c0-2-2.33-3-5-3Z" fill="hsl(var(--primary) / 0.2)" />
      <path d="m16 20 2 2 4-4" stroke="hsl(var(--accent))" strokeWidth="2.5" />
    </svg>
  );
}
