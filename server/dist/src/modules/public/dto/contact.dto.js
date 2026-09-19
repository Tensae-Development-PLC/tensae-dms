import { z } from "zod";
const serviceInterestLabels = {
    "secure-storage": "Secure Document Storage",
    "search-organization": "Search & Organization",
    workflows: "Workflow Automation",
    compliance: "Compliance & Audit",
    sharing: "Sharing & Collaboration",
    other: "Other",
};
export const contactInquirySchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    company: z.string().trim().max(200).optional().or(z.literal("")),
    service: z.string().trim().max(64).optional().or(z.literal("")),
    message: z.string().trim().min(10).max(5000),
});
export function formatServiceInterest(value) {
    if (!value)
        return undefined;
    return serviceInterestLabels[value] ?? value;
}
