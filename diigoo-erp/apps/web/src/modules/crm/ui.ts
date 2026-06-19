import type { Tone } from "@/components/ui/primitives";
import type {
  DealStage, ContactStatus, CampaignStatus, Channel,
  LeadStatus, AccountType, QuoteStatus, TaskPriority, TaskStatus, TaskType, CaseStatus, CasePriority,
} from "./data";

export const DEAL_STAGES: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
export const ADVANCEABLE: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won"];

export const STAGE_LABEL: Record<DealStage, string> = {
  lead: "Lead", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", won: "Won", lost: "Lost",
};
export const STAGE_TONE: Record<DealStage, Tone> = {
  lead: "gray", qualified: "blue", proposal: "purple", negotiation: "amber", won: "green", lost: "coral",
};
export const CONTACT_TONE: Record<ContactStatus, Tone> = { lead: "amber", active: "green", churned: "coral" };
export const CAMPAIGN_TONE: Record<CampaignStatus, Tone> = { draft: "gray", active: "green", completed: "blue", paused: "amber" };
export const CHANNEL_LABEL: Record<Channel, string> = { email: "Email", sms: "SMS", social: "Social", whatsapp: "WhatsApp" };
export const CHANNEL_TONE: Record<Channel, Tone> = { email: "blue", sms: "teal", social: "purple", whatsapp: "green" };

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = { new: "New", contacted: "Contacted", qualified: "Qualified", unqualified: "Unqualified" };
export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = { new: "blue", contacted: "amber", qualified: "green", unqualified: "gray" };

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = { prospect: "Prospect", customer: "Customer", partner: "Partner" };
export const ACCOUNT_TYPE_TONE: Record<AccountType, Tone> = { prospect: "amber", customer: "green", partner: "purple" };

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = { draft: "Draft", sent: "Sent", accepted: "Accepted", declined: "Declined" };
export const QUOTE_STATUS_TONE: Record<QuoteStatus, Tone> = { draft: "gray", sent: "blue", accepted: "green", declined: "coral" };

export const PRIORITY_LABEL: Record<TaskPriority, string> = { low: "Low", medium: "Medium", high: "High" };
export const PRIORITY_TONE: Record<TaskPriority, Tone> = { low: "gray", medium: "blue", high: "amber" };

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: "To do", in_progress: "In progress", done: "Completed" };
export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = { todo: "gray", in_progress: "blue", done: "green" };
export const TASK_TYPE_LABEL: Record<TaskType, string> = { call: "Call", email: "Email", follow_up: "Follow-up", meeting: "Meeting", todo: "To-do" };

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" };
export const CASE_STATUS_TONE: Record<CaseStatus, Tone> = { open: "amber", in_progress: "blue", resolved: "green", closed: "gray" };
export const CASE_PRIORITY_TONE: Record<CasePriority, Tone> = { low: "gray", medium: "blue", high: "amber", urgent: "coral" };
