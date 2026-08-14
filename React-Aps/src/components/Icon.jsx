// Minimal stroke-icon set (24×24, currentColor) used across the app.
function Base({ size = 18, strokeWidth = 1.75, children, ...rest }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Clock = (props) => <Base {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></Base>;
export const Zap = (props) => <Base {...props}><path d="M12 2 4 14h6l-1 8 9-13h-6l1-7Z" /></Base>;
export const ClipboardList = (props) => <Base {...props}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9zM8 10h8M8 14h8M8 18h5" /></Base>;
export const HelpCircle = (props) => <Base {...props}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 1.7-2.5 3.7" /><path d="M12 17h.01" /></Base>;
export const Check = (props) => <Base {...props}><path d="M4 12.5 9.5 18 20 6" /></Base>;
export const CheckCircle = (props) => <Base {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9" /></Base>;
export const AlertTriangle = (props) => <Base {...props}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></Base>;
export const Inbox = (props) => <Base {...props}><path d="M4 12h4l2 3h4l2-3h4" /><path d="M5.5 5h13L21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6L5.5 5Z" /></Base>;
export const Trophy = (props) => <Base {...props}><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /><path d="M12 14v3M9 21h6M9.5 21v-2.5a2.5 2.5 0 0 1 5 0V21" /></Base>;
export const Award = (props) => <Base {...props}><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" /></Base>;
export const FileText = (props) => <Base {...props}><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></Base>;
export const GraduationCap = (props) => <Base {...props}><path d="M2 9 12 4l10 5-10 5L2 9Z" /><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" /></Base>;
export const BookOpen = (props) => <Base {...props}><path d="M12 6c-1.5-1.5-4-2-7-2v13c3 0 5.5.5 7 2 1.5-1.5 4-2 7-2V4c-3 0-5.5.5-7 2Z" /><path d="M12 6v13" /></Base>;
export const ArrowLeft = (props) => <Base {...props}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>;
export const ArrowRight = (props) => <Base {...props}><path d="M5 12h14M13 6l6 6-6 6" /></Base>;
export const PlayCircle = (props) => <Base {...props}><circle cx="12" cy="12" r="9" /><path d="M10 8.5v7l6-3.5-6-3.5Z" /></Base>;
export const RefreshCw = (props) => <Base {...props}><path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.6M4 13a8 8 0 0 0 13.7 4.7L20 15.4" /><path d="M4 4v4.6h4.6M20 20v-4.6h-4.6" /></Base>;
export const RotateCcw = (props) => <Base {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></Base>;
export const Lightbulb = (props) => <Base {...props}><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2 1 2h5c.1-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></Base>;
export const X = (props) => <Base {...props}><path d="M6 6l12 12M18 6 6 18" /></Base>;
export const Calendar = (props) => <Base {...props}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></Base>;
export const Download = (props) => <Base {...props}><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 18v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" /></Base>;
export const Hourglass = (props) => <Base {...props}><path d="M7 3h10M7 21h10" /><path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" /></Base>;
export const Medal = (props) => <Base {...props}><circle cx="12" cy="15" r="5" /><path d="M12 12v6" /><path d="M8.5 3h7l-3 8h-1l-3-8Z" /></Base>;
export const Target = (props) => <Base {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Base>;
export const Trash = (props) => <Base {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /><path d="M10 11v6M14 11v6" /></Base>;
export const Eye = (props) => <Base {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Base>;
export const EyeOff = (props) => <Base {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" /></Base>;
export const ListIcon = (props) => <Base {...props}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></Base>;
export const Video = (props) => <Base {...props}><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10.5 22 7v10l-6-3.5Z" /></Base>;
export const Users = (props) => <Base {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Base>;
export const UserCheck = (props) => <Base {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" /></Base>;
export const UserX = (props) => <Base {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="17" y1="8" x2="22" y2="13" /><line x1="22" y1="8" x2="17" y2="13" /></Base>;
export const UserMinus = (props) => <Base {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="22" y1="11" x2="16" y2="11" /></Base>;
export const ShieldCheck = (props) => <Base {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></Base>;
export const ShieldAlert = (props) => <Base {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></Base>;
export const Lock = (props) => <Base {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Base>;
export const Mail = (props) => <Base {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Base>;
export const Search = (props) => <Base {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Base>;
export const Flag = (props) => <Base {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></Base>;
export const Star = (props) => <Base {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Base>;
export const Printer = (props) => <Base {...props}><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></Base>;
export const Sparkles = (props) => <Base {...props}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" /></Base>;
export const Sliders = (props) => <Base {...props}><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></Base>;
export const TrendingUp = (props) => <Base {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Base>;
export const Briefcase = (props) => <Base {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></Base>;
