import { sendMail } from "../../../common/email/mailer.js";
import { contactInquiryTemplate } from "../../../common/email/templates.js";
import { AppError } from "../../../common/utils/app-error.js";
import { env } from "../../../config/env.js";
import { formatServiceInterest } from "../dto/contact.dto.js";
export const contactService = {
    async submitInquiry(dto) {
        const service = formatServiceInterest(dto.service || undefined);
        const company = dto.company?.trim() || undefined;
        const mail = contactInquiryTemplate({
            name: dto.name,
            email: dto.email,
            company,
            service,
            message: dto.message,
        });
        try {
            await sendMail({
                to: env.CONTACT_INQUIRY_TO,
                replyTo: dto.email,
                ...mail,
            });
        }
        catch (error) {
            throw new AppError(503, error instanceof Error && error.message === "SMTP is not configured"
                ? "Email service is not configured"
                : "Unable to send your message right now. Please try again later.");
        }
        return { ok: true };
    },
};
