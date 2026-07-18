import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DMS Client Platform API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:4000" }],
  },
  apis: ["./src/**/*.routes.ts"],
});
