import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
describe("health endpoint", () => {
    it("returns status and dependency checks", async () => {
        const response = await request(app).get("/health");
        expect([200, 503]).toContain(response.statusCode);
        expect(response.body).toHaveProperty("status");
        expect(response.body).toHaveProperty("checks");
        expect(response.body.checks).toHaveProperty("postgresql");
        expect(response.body.checks).toHaveProperty("redis");
    });
});
