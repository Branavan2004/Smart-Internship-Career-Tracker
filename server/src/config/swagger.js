import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Smart Internship & Career Tracker API",
      version: "1.0.0",
      description:
        "OpenAPI documentation for authentication, refresh-token sessions, and RBAC-protected APIs."
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67f1c43a4ebf8d1c2e7b1234" },
            name: { type: "string", example: "Jane Student" },
            email: { type: "string", format: "email", example: "student@test.com" },
            role: {
              type: "string",
              enum: ["student", "admin", "reviewer"],
              example: "student"
            },
            googleId: { type: "string", example: "117200998877665544332" },
            profilePicture: {
              type: "string",
              example: "https://lh3.googleusercontent.com/a/profile-photo"
            },
            phone: { type: "string", example: "+94 77 123 4567" },
            skills: {
              type: "array",
              items: { type: "string" },
              example: ["React", "Node.js"]
            },
            resumeUrl: {
              type: "string",
              example: "https://drive.google.com/file/d/resume"
            },
            resumeFilename: { type: "string", example: "resume.pdf" },
            weeklyDigestEnabled: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        AuthSuccess: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token"
            },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token"
            }
          }
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Jane Student" },
            email: { type: "string", format: "email", example: "student@test.com" },
            password: { type: "string", example: "Password123!" },
            role: {
              type: "string",
              enum: ["student", "admin", "reviewer"],
              example: "student"
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@test.com" },
            password: { type: "string", example: "Password123!" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Forbidden. You do not have permission to access this resource."
            }
          }
        },
        LogoutResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Logged out successfully." }
          }
        },
        AdminDashboardResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Admin dashboard data loaded successfully."
            },
            stats: {
              type: "object",
              properties: {
                totalUsers: { type: "integer", example: 12 },
                totalApplications: { type: "integer", example: 42 },
                reviewerCount: { type: "integer", example: 2 },
                adminCount: { type: "integer", example: 1 }
              }
            }
          }
        },
        Application: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67f1c52f4ebf8d1c2e7b5678" },
            companyName: { type: "string", example: "Acme Labs" },
            role: { type: "string", example: "Intern Engineer" },
            roleType: { type: "string", example: "SE" },
            appliedDate: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["Pending", "Interviewed", "Accepted", "Rejected", "Offer"],
              example: "Pending"
            },
            notes: { type: "string", example: "Reached out through LinkedIn." }
          }
        },
        ApplicationsResponse: {
          type: "object",
          properties: {
            applications: {
              type: "array",
              items: { $ref: "#/components/schemas/Application" }
            }
          }
        },
        ReviewQueueResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Reviewer queue loaded successfully."
            },
            applications: {
              type: "array",
              items: { $ref: "#/components/schemas/Application" }
            }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
});
