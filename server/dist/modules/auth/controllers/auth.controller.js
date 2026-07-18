import { loginSchema, registerSchema } from "../dto/auth.dto.js";
import { authService } from "../services/auth.service.js";
export const authController = {
    async register(req, res) {
        const dto = registerSchema.parse(req.body);
        const data = await authService.register(dto);
        res.status(201).json(data);
    },
    async login(req, res) {
        const dto = loginSchema.parse(req.body);
        const tokens = await authService.login(dto);
        res.status(200).json(tokens);
    },
};
