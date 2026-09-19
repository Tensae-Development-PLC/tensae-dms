import type { Request, Response } from "express";
import { contactInquirySchema } from "../dto/contact.dto.js";
import { contactService } from "../services/contact.service.js";

export const contactController = {
  async submit(req: Request, res: Response) {
    const dto = contactInquirySchema.parse(req.body);
    const result = await contactService.submitInquiry(dto);
    res.status(200).json(result);
  },
};
