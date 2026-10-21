// The few glyphs the components draw themselves (checkmarks, chevrons, close), so the library needs no icon package.
// 24×24, stroke = currentColor, sized by the parent ([&_svg]:size-*) or by className.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, strokeWidth = 2.25, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const MinusIcon = (p: IconProps) => <Icon {...p}><path d="M6 12h12" /></Icon>;
export const XIcon = (p: IconProps) => <Icon {...p}><path d="M7 7l10 10M17 7L7 17" /></Icon>;
export const ChevronDownIcon = (p: IconProps) => <Icon {...p}><path d="M6.5 9.5L12 15l5.5-5.5" /></Icon>;
export const ChevronUpIcon = (p: IconProps) => <Icon {...p}><path d="M6.5 14.5L12 9l5.5 5.5" /></Icon>;
export const ChevronRightIcon = (p: IconProps) => <Icon {...p}><path d="M9.5 6.5L15 12l-5.5 5.5" /></Icon>;
export const ChevronUpDownIcon = (p: IconProps) => <Icon {...p}><path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" /></Icon>;
