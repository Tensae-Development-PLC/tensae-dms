import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
describe("client route auth guard", () => {
    it("rejects unauthenticated requests", async () => {
        const response = await request(app).get("/api/v1/client/documents");
        expect(response.statusCode).toBe(401);
    });
});
