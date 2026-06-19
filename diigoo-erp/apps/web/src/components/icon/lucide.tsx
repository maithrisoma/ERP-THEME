"use client";
import * as React from "react";
import { Icon, addCollection } from "@iconify/react";
import data from "./freehand-all.json";

// Drop-in replacement for lucide-react: every icon renders its Streamline
// Freehand (mono) equivalent. Mono => inherits currentColor, so icons work on
// buttons, the navy sidebar, light cards and dark mode alike. Generated map.
addCollection(data as never);

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "ref"> {
  size?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
}
export type LucideIcon = React.FC<IconProps>;

const MAP: Record<string, string> = {
  "AlarmClockOff": "alert-alarm-clock",
  "AlertTriangle": "alerts-warning-triangle",
  "AlignLeft": "text-formating-align-bottom",
  "ArrowDownLeft": "resize-expand-arrow",
  "ArrowLeft": "resize-expand-arrow",
  "ArrowLeftRight": "cloud-phone-exchange",
  "ArrowRight": "resize-expand-arrow",
  "ArrowUpRight": "resize-expand-arrow",
  "Award": "disability-down-syndrome-ribbon",
  "BadgeCheck": "cloud-check",
  "Banknote": "money-cash-bill",
  "BarChart3": "trading-graph",
  "Bell": "alert-alarm-bell",
  "Boxes": "module-three-boxes",
  "Briefcase": "job-briefcase-document",
  "Building2": "office-building-outdoors",
  "Cake": "donation-charity-donate-heart-flower",
  "Calendar": "calendar-date",
  "CalendarCheck": "calendar-date",
  "CalendarClock": "calendar-date",
  "CalendarDays": "calendar-date",
  "CalendarPlus": "calendar-date",
  "CalendarX": "calendar-date",
  "Check": "cloud-check",
  "CheckCheck": "form-validation-check-double",
  "CheckCircle2": "cloud-check",
  "CheckSquare": "cloud-check",
  "ChevronDown": "resize-expand-arrow",
  "ChevronRight": "flip-right",
  "ChevronUp": "resize-expand-arrow",
  "ChevronsDownUp": "resize-expand-arrow",
  "ChevronsUpDown": "resize-expand-arrow",
  "ClipboardCheck": "task-clipboard-check",
  "ClipboardList": "task-list-clipboard-check",
  "Clock": "time-clock-circle",
  "Coins": "money-coin-cash",
  "Contact": "phone-book",
  "Copy": "copy-paste-clipboard",
  "CreditCard": "credit-card-1",
  "Crown": "human-resources-employee-crown-woman",
  "DollarSign": "currency-dollar-chip",
  "Download": "drawer-download",
  "ExternalLink": "crop-expand",
  "Eye": "view-eye-1",
  "FileCheck": "file-code",
  "FileClock": "file-code",
  "FileText": "office-file-text",
  "FileWarning": "file-code-warning-1",
  "FileX": "file-code",
  "Filter": "filter",
  "Flag": "learning-programming-flag",
  "Fuel": "power-supply-plug",
  "Gauge": "dashboard-browser-gauge",
  "Gift": "donation-charity-donate-heart-flower",
  "GitBranch": "pathfinder-merge",
  "Globe": "crypto-currency-bitcoin-network-globe",
  "Globe2": "crypto-currency-bitcoin-network-globe",
  "GraduationCap": "design-process-drawing-board-education",
  "Hash": "text-formating-hash",
  "HeartPulse": "smiley-kiss-heart",
  "KeyRound": "lock-key-1",
  "Landmark": "office-building-outdoors",
  "Laptop": "wifi-laptop",
  "Layers": "layers-stacked-1",
  "LayoutDashboard": "dashboard-layout",
  "LayoutGrid": "grid-ruler",
  "LifeBuoy": "help-question-circle",
  "ListChecks": "task-list-pen",
  "Loader2": "cloud-loading",
  "Lock": "lock-key-1",
  "LogIn": "login-rectangle",
  "LogOut": "login-logout-key",
  "Mail": "drawer-envelope",
  "MapPin": "worldwide-web-location-pin",
  "Megaphone": "share-megaphone",
  "Menu": "menu-navigation-2",
  "MessageSquare": "currency-dollar-euro-chat-bubble",
  "Minus": "remove-delete-sign-bold",
  "Moon": "light-mode-night-architecture",
  "Network": "network-monitor-hierarchy",
  "Package": "archive-box",
  "PackageCheck": "archive-box",
  "Palette": "color-palette",
  "Palmtree": "locker-room-suitcase-umbrella",
  "Pause": "alerts-stop-sign",
  "Percent": "discount-percent-thin",
  "Phone": "phone-off",
  "PhoneIncoming": "phone-off",
  "PhoneOutgoing": "phone-off",
  "PieChart": "analytics-graph-pie",
  "PiggyBank": "saving-piggy-bank",
  "Play": "video-edit-play",
  "Plug": "power-supply-plug",
  "Plus": "add-sign-bold",
  "Receipt": "receipt",
  "RefreshCw": "data-transfer-sync",
  "Rocket": "product-launch-go-sign",
  "RotateCcw": "rotate-smartphone",
  "Save": "floppy-disk",
  "Scale": "business-cash-scale-balance",
  "Search": "search-magnifier",
  "SearchX": "search-magnifier",
  "Send": "send-email-fly",
  "ServerCog": "server-api-cloud",
  "Settings2": "settings-cog",
  "Share2": "share-radar",
  "Shield": "apps-laptop-shield",
  "ShieldAlert": "apps-laptop-shield",
  "ShieldCheck": "apps-laptop-shield",
  "ShoppingCart": "archive-box",
  "SlidersHorizontal": "filter",
  "Smile": "smiley-happy",
  "Sparkles": "loading-star-1",
  "Star": "loading-star-1",
  "Sun": "light-mode-brightness-half",
  "Tag": "tag-hot-price",
  "Tags": "tags-double",
  "Target": "iris-scan-target",
  "Ticket": "mask-diamond",
  "Timer": "timer-countdown-ten",
  "ToggleRight": "controls-slider-toggle-right",
  "Trash2": "delete-bin-2",
  "TrendingDown": "trading-graph",
  "TrendingUp": "crypto-currency-bitcoin-graph-increase",
  "Trophy": "iris-scan-target",
  "Truck": "archive-box",
  "Upload": "upload-menu",
  "UploadCloud": "upload-menu",
  "User": "face-id-user",
  "UserCheck": "face-id-user",
  "UserCog": "face-id-user",
  "UserPlus": "face-id-user",
  "UserX": "face-id-user",
  "Users": "programming-team-chat",
  "Video": "video-file-camera",
  "Wallet": "money-wallet",
  "Webhook": "server-api-cloud",
  "Wifi": "wifi-on",
  "Workflow": "workflow-collaborate",
  "X": "remove-delete-sign-bold",
  "Zap": "connect-flash"
};

function mk(name: string): LucideIcon {
  const Comp: LucideIcon = ({ size = 24, strokeWidth: _sw, absoluteStrokeWidth: _asw, ...rest }) => {
    const id = MAP[name];
    if (!id) return null;
    return <Icon {...(rest as React.ComponentProps<typeof Icon>)} icon={`streamline-freehand:${id}`} width={size} height={size} />;
  };
  Comp.displayName = name;
  return Comp;
}

export const AlarmClockOff = mk("AlarmClockOff");
export const AlertTriangle = mk("AlertTriangle");
export const AlignLeft = mk("AlignLeft");
export const ArrowDownLeft = mk("ArrowDownLeft");
export const ArrowLeft = mk("ArrowLeft");
export const ArrowLeftRight = mk("ArrowLeftRight");
export const ArrowRight = mk("ArrowRight");
export const ArrowUpRight = mk("ArrowUpRight");
export const Award = mk("Award");
export const BadgeCheck = mk("BadgeCheck");
export const Banknote = mk("Banknote");
export const BarChart3 = mk("BarChart3");
export const Bell = mk("Bell");
export const Boxes = mk("Boxes");
export const Briefcase = mk("Briefcase");
export const Building2 = mk("Building2");
export const Cake = mk("Cake");
export const Calendar = mk("Calendar");
export const CalendarCheck = mk("CalendarCheck");
export const CalendarClock = mk("CalendarClock");
export const CalendarDays = mk("CalendarDays");
export const CalendarPlus = mk("CalendarPlus");
export const CalendarX = mk("CalendarX");
export const Check = mk("Check");
export const CheckCheck = mk("CheckCheck");
export const CheckCircle2 = mk("CheckCircle2");
export const CheckSquare = mk("CheckSquare");
export const ChevronDown = mk("ChevronDown");
export const ChevronRight = mk("ChevronRight");
export const ChevronUp = mk("ChevronUp");
export const ChevronsDownUp = mk("ChevronsDownUp");
export const ChevronsUpDown = mk("ChevronsUpDown");
export const ClipboardCheck = mk("ClipboardCheck");
export const ClipboardList = mk("ClipboardList");
export const Clock = mk("Clock");
export const Coins = mk("Coins");
export const Contact = mk("Contact");
export const Copy = mk("Copy");
export const CreditCard = mk("CreditCard");
export const Crown = mk("Crown");
export const DollarSign = mk("DollarSign");
export const Download = mk("Download");
export const ExternalLink = mk("ExternalLink");
export const Eye = mk("Eye");
export const FileCheck = mk("FileCheck");
export const FileClock = mk("FileClock");
export const FileText = mk("FileText");
export const FileWarning = mk("FileWarning");
export const FileX = mk("FileX");
export const Filter = mk("Filter");
export const Flag = mk("Flag");
export const Fuel = mk("Fuel");
export const Gauge = mk("Gauge");
export const Gift = mk("Gift");
export const GitBranch = mk("GitBranch");
export const Globe = mk("Globe");
export const Globe2 = mk("Globe2");
export const GraduationCap = mk("GraduationCap");
export const Hash = mk("Hash");
export const HeartPulse = mk("HeartPulse");
export const KeyRound = mk("KeyRound");
export const Landmark = mk("Landmark");
export const Laptop = mk("Laptop");
export const Layers = mk("Layers");
export const LayoutDashboard = mk("LayoutDashboard");
export const LayoutGrid = mk("LayoutGrid");
export const LifeBuoy = mk("LifeBuoy");
export const ListChecks = mk("ListChecks");
export const Loader2 = mk("Loader2");
export const Lock = mk("Lock");
export const LogIn = mk("LogIn");
export const LogOut = mk("LogOut");
export const Mail = mk("Mail");
export const MapPin = mk("MapPin");
export const Megaphone = mk("Megaphone");
export const Menu = mk("Menu");
export const MessageSquare = mk("MessageSquare");
export const Minus = mk("Minus");
export const Moon = mk("Moon");
export const Network = mk("Network");
export const Package = mk("Package");
export const PackageCheck = mk("PackageCheck");
export const Palette = mk("Palette");
export const Palmtree = mk("Palmtree");
export const Pause = mk("Pause");
export const Percent = mk("Percent");
export const Phone = mk("Phone");
export const PhoneIncoming = mk("PhoneIncoming");
export const PhoneOutgoing = mk("PhoneOutgoing");
export const PieChart = mk("PieChart");
export const PiggyBank = mk("PiggyBank");
export const Play = mk("Play");
export const Plug = mk("Plug");
export const Plus = mk("Plus");
export const Receipt = mk("Receipt");
export const RefreshCw = mk("RefreshCw");
export const Rocket = mk("Rocket");
export const RotateCcw = mk("RotateCcw");
export const Save = mk("Save");
export const Scale = mk("Scale");
export const Search = mk("Search");
export const SearchX = mk("SearchX");
export const Send = mk("Send");
export const ServerCog = mk("ServerCog");
export const Settings2 = mk("Settings2");
export const Share2 = mk("Share2");
export const Shield = mk("Shield");
export const ShieldAlert = mk("ShieldAlert");
export const ShieldCheck = mk("ShieldCheck");
export const ShoppingCart = mk("ShoppingCart");
export const SlidersHorizontal = mk("SlidersHorizontal");
export const Smile = mk("Smile");
export const Sparkles = mk("Sparkles");
export const Star = mk("Star");
export const Sun = mk("Sun");
export const Tag = mk("Tag");
export const Tags = mk("Tags");
export const Target = mk("Target");
export const Ticket = mk("Ticket");
export const Timer = mk("Timer");
export const ToggleRight = mk("ToggleRight");
export const Trash2 = mk("Trash2");
export const TrendingDown = mk("TrendingDown");
export const TrendingUp = mk("TrendingUp");
export const Trophy = mk("Trophy");
export const Truck = mk("Truck");
export const Upload = mk("Upload");
export const UploadCloud = mk("UploadCloud");
export const User = mk("User");
export const UserCheck = mk("UserCheck");
export const UserCog = mk("UserCog");
export const UserPlus = mk("UserPlus");
export const UserX = mk("UserX");
export const Users = mk("Users");
export const Video = mk("Video");
export const Wallet = mk("Wallet");
export const Webhook = mk("Webhook");
export const Wifi = mk("Wifi");
export const Workflow = mk("Workflow");
export const X = mk("X");
export const Zap = mk("Zap");
