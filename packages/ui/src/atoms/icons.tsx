/**
 * Codernic UI — Minimalist Icon System
 * All icons: stroke-based, no fill, rounded caps/joins.
 * Matches the Lucide icon aesthetic used on codernic.dev
 */

import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
  'data-testid'?: string;
}

const base = (size: number, color: string, sw: number, children: React.ReactNode, rest: Partial<IconProps>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={rest.style}
    className={rest.className}
    data-testid={rest['data-testid']}
  >
    {children}
  </svg>
);

const mk = (children: React.ReactNode) =>
  ({ size = 14, color = 'currentColor', strokeWidth = 1.5, ...rest }: IconProps) =>
    base(size, color, strokeWidth, children, rest);

// ── Navigation & Layout ─────────────────────────────────────
export const IconChevronRight = mk(<><polyline points="9 18 15 12 9 6" /></>);
export const IconChevronDown  = mk(<><polyline points="6 9 12 15 18 9" /></>);
export const IconChevronUp    = mk(<><polyline points="18 15 12 9 6 15" /></>);
export const IconChevronLeft  = mk(<><polyline points="15 18 9 12 15 6" /></>);
export const IconMaximize     = mk(<><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></>);
export const IconMinimize     = mk(<><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></>);
export const IconPanelLeft    = mk(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>);
export const IconPanelRight   = mk(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></>);
export const IconMenu         = mk(<><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>);

// ── Sessions & Files ─────────────────────────────────────────
export const IconFile         = mk(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>);
export const IconFileText     = mk(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>);
export const IconFolder       = mk(<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>);
export const IconSession      = mk(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></>);

// ── Agents & DAGs ────────────────────────────────────────────
export const IconAgent        = mk(<><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></>);
export const IconDag          = mk(<><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8"/><path d="M7 8l4 8"/><path d="M17 8l-4 8"/></>);
export const IconTech         = mk(<><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>);
export const IconBot          = mk(<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></>);

// ── Actions ──────────────────────────────────────────────────
export const IconPlus         = mk(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>);
export const IconX            = mk(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>);
export const IconTrash        = mk(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>);
export const IconEdit         = mk(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>);
export const IconRefresh      = mk(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></>);
export const IconSearch       = mk(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>);
export const IconDownload     = mk(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>);
export const IconArrowLeft    = mk(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>);
export const IconArrowRight   = mk(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>);
export const IconCopy         = mk(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>);
export const IconCode         = mk(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>);
export const IconStop         = mk(<><rect x="3" y="3" width="18" height="18" rx="2"/></>);
export const IconZoomIn       = mk(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>);
export const IconZoomOut      = mk(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></>);
export const IconEye          = mk(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>);
export const IconEyeOff       = mk(<><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>);
export const IconLockOpen     = mk(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></>);
export const IconSandbox      = mk(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>);

// ── Status & Monitoring ──────────────────────────────────────
export const IconShield       = mk(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>);
export const IconSave         = mk(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>);
export const IconActivity     = mk(<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>);
export const IconCpu          = mk(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>);
export const IconZap          = mk(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>);
export const IconCheck        = mk(<><polyline points="20 6 9 17 4 12"/></>);
export const IconCheckCircle  = mk(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>);
export const IconAlertTriangle= mk(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>);
export const IconCircle       = mk(<><circle cx="12" cy="12" r="10"/></>);
export const IconDot          = mk(<><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></>);
export const IconLoader       = mk(<><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>);

// ── System & Settings ────────────────────────────────────────
export const IconSettings     = mk(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>);
export const IconTerminal     = mk(<><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>);
export const IconDatabase     = mk(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>);
export const IconLock         = mk(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>);
export const IconGlobe        = mk(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>);
export const IconBookOpen     = mk(<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>);
export const IconInfo         = mk(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>);

// ── Model Hub specific ───────────────────────────────────────
export const IconHeart        = mk(<><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>);
export const IconCloud        = mk(<><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></>);
export const IconPackage      = mk(<><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>);

// ── Introspection / Timeline ─────────────────────────────────
export const IconThought      = mk(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>);
export const IconTool         = mk(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>);
export const IconPlay         = mk(<><polygon points="5 3 19 12 5 21 5 3"/></>);
export const IconRepeat       = mk(<><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>);

// ── Erathos / Canvas ─────────────────────────────────────────
export const IconShare2       = mk(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>);
export const IconLandmark     = mk(<><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 11l9-7 9 7"/></>);

// ── Context window ───────────────────────────────────────────
export const IconLayers       = mk(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>);
export const IconCoins        = mk(<><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></>);

// ── Corporate Brand ──────────────────────────────────────────
export const IconCodernic = ({ size = 14, style, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 204.8 206.9"
    style={style}
    className={className}
  >
    <path fill="var(--amber-400)" d="M150,58.9c-4.4-7.9-8.7-15.4-13.6-23.9c9,0,17-0.2,25,0.2c1.2,0.1,2.6,2.2,3.5,3.7c5.1,8.6,10.1,17.4,15.1,26.1
      c1.5,2.6,2.1,4.7,0.2,8c-15.2,25.8-30.1,51.8-45.1,77.7c-3.5,6-6.9,12-10.2,18c-1.3,2.5-3,3.4-5.9,3.3c-13-0.2-26,0-39-0.2
      c-1.5,0-3.7-0.8-4.4-1.9c-4-6.2-7.6-12.7-11.9-20c6.4,0,11.7,0,17.1,0c8.2,0,16.3-0.2,24.5,0.1c3.1,0.1,5-0.9,6.4-3.4
      c10.5-18.4,21-36.9,31.6-55.3c2.9-5.1,5.9-10.3,9.1-15.3c2.6-4,4.5-7.9,0.7-12.3C151.8,62.5,151,60.8,150,58.9z" />
    <path fill="currentColor" d="M205.4,47.7c-6.8,0.3-13.7,0-20.5,0.5c-4.4,0.3-6.3-1.7-8.1-5.1c-3.2-6-6.7-11.8-10.3-17.5
      c-0.8-1.2-2.7-2.4-4.1-2.4c-29-0.1-58-0.2-87,0c-1.7,0-4.1,1.8-5.1,3.4C56.7,49.8,43.2,73.1,29.7,96.4c-1.2,2.1-2.4,4.2-3.4,6.4
      c-0.2,0.5,0,1.3,0.2,1.8c5.2,8.9,10.5,17.8,15.6,26.7c7,12.2,13.8,24.4,20.7,36.6c2.5,4.5,4.9,9.1,7.8,13.4c1,1.4,3.4,2.5,5.3,2.6
      c5.6,0.3,11.3,0.1,17,0.2c1.4,0,3.5,0.2,4,1.1c4,6.9,7.8,14,11.6,21.5c-16,0.4-32,0.4-48.6,0c-4.7-7.4-8.8-14.5-12.9-21.6
      c-9.6-16.6-19.1-33.2-28.8-49.7C12,124.8,5.7,114.4-0.6,104c0,0,0-0.5,0.3-0.8c1.4-2.1,2.5-3.9,3.6-5.7C11.5,83,19.5,68.5,27.8,54.2
      C38.3,36.1,48.9,18,59.4,0C98.8,0,138.1,0,178,0.3c3.2,4.9,5.8,9.5,8.5,14c6.3,10.6,12.6,21.1,18.9,31.6
      C205.4,46.4,205.4,46.9,205.4,47.7z" />
    <path fill="currentColor" d="M49.7,97.3C61.4,77,72.8,57,84.5,37.1c0.9-1.6,3.5-2.9,5.4-3c9.3-0.3,18.7-0.3,28,0c1.8,0.1,4.1,1.6,5.1,3.2
      c2.7,3.9,4.8,8.2,7.3,12.7c-10.2,0-19.8,0.2-29.5-0.1c-3.1-0.1-4.9,1.1-6.2,3.5c-9.3,16.2-18.2,32.7-28,48.6
      c-3.9,6.3-4.1,10.8,0.4,16.7c3.9,5,6.4,11.1,9.9,17.4c-6.4,0-12,0.2-17.5-0.1c-1.4-0.1-3.1-1.6-4-2.9c-4.1-6.7-8.1-13.6-11.9-20.5
      c-0.7-1.3-0.4-3.7,0.3-5.2C45.4,103.9,47.6,100.8,49.7,97.3z" />
  </svg>
);
