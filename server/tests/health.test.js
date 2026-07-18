import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
describe("health endpoint", () => {
    it("returns ok", async () => {
        const response = await request(app).get("/health");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});
