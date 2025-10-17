import { ReactNode, SVGProps } from 'react';

const baseProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  viewBox: '0 0 24 24',
};

const Icon = ({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) => (
  <svg {...baseProps} {...props}>
    {children}
  </svg>
);

export const AppLogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <defs>
      <linearGradient id="app-logo-gradient" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#app-logo-gradient)" stroke="none" />
    <path
      d="M8.5 9.5c1.1-1.2 2.8-2 4.5-2 2.9 0 5 1.9 5 4.5s-2.1 4.5-5 4.5c-1.7 0-3.4-.8-4.5-2"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
    <path d="M6 12h6" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </Icon>
);

export const ScenarioIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    <path d="M8 7v10M16 7v10" strokeLinecap="round" />
  </Icon>
);

export const AddIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
  </Icon>
);

export const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path
      d="M7 10v-.5A5.5 5.5 0 0 1 12.5 4 5.5 5.5 0 0 1 17 9.5V11"
      strokeLinecap="round"
    />
    <path d="M17 10.5 19 8m-2 2.5-2-2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M17 14v.5A5.5 5.5 0 0 1 11.5 20 5.5 5.5 0 0 1 7 14.5V13"
      strokeLinecap="round"
    />
    <path d="M7 13.5 5 16m2-2.5 2 2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
);

export const ResetIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 4v6h6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 5a8.5 8.5 0 0 0-12 0l-3 3m0 8 3 3a8.5 8.5 0 0 0 12 0" strokeLinecap="round" />
  </Icon>
);

export const ClipboardIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M9 4h6a2 2 0 0 1 2 2v13H7V6a2 2 0 0 1 2-2Z" />
    <path d="M9 7h6" strokeLinecap="round" />
    <path d="M9 11h6M9 15h6" strokeLinecap="round" />
  </Icon>
);

export const PercentIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="m6 18 12-12" strokeLinecap="round" />
    <circle cx="8.5" cy="8.5" r="2.5" />
    <circle cx="15.5" cy="15.5" r="2.5" />
  </Icon>
);

export const DatasetIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 7c0-1.1 2.7-2 6-2s6 .9 6 2-2.7 2-6 2-6-.9-6-2Z" />
    <path d="M16 7v10c0 1.1-2.7 2-6 2s-6-.9-6-2V7" />
    <path d="M4 12c0 1.1 2.7 2 6 2s6-.9 6-2" />
  </Icon>
);

export const ReportIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M6 4h8l4 4v12H6z" />
    <path d="M14 4v4h4" strokeLinejoin="round" />
    <path d="M9 13h6M9 17h4" strokeLinecap="round" />
  </Icon>
);

export const SparklineIcon = (props: SVGProps<SVGSVGElement>) => (
  <Icon {...props}>
    <path d="M4 16 9.5 9 13 14l4-6 3 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 19h16" strokeLinecap="round" />
  </Icon>
);

export default AppLogoIcon;
