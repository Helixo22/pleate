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
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5.5v13M5.5 12h13" /></Icon>;
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </Icon>
);
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.4 16.4 0 0 1-2.6 3.4M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 5.4-1.7" />
    <path d="M9.9 9.9a2.75 2.75 0 0 0 4.2 4.2M4 4l16 16" />
  </Icon>
);
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V7a2.5 2.5 0 0 0-2.5-2.5H7A2.5 2.5 0 0 0 4.5 7v6A2.5 2.5 0 0 0 7 15.5h1.5" />
  </Icon>
);
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
    <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
  </Icon>
);
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </Icon>
);
export const DownloadIcon = (p: IconProps) => <Icon {...p}><path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></Icon>;
export const RetryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />
  </Icon>
);
export const KeyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="15.5" r="3.75" />
    <path d="M10.7 12.8 19 4.5M16 7.5l2.5 2.5M14 9.5l2 2" />
  </Icon>
);
export const MonitorIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M9 20h6M12 16.5V20" />
  </Icon>
);
export const PhoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="7" y="2.75" width="10" height="18.5" rx="2.5" />
    <path d="M11 18h2" />
  </Icon>
);
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6l-7-2.5Z" />
  </Icon>
);
export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Icon>
);
