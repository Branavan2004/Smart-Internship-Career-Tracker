import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart Internship & Career Tracker Gateway API",
      version: "1.0.0",
      description: "Gateway documentation for the enterprise-style career tracker platform."
    },
    servers: [{ url: "http://localhost:5001/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});
