# Ballerina Interview Workflow Microservice

This standalone microservice is responsible for sending automated interview preparation checklists. It triggers when the core Node.js backend detects an application status change to "Interviewed".

## Why This Service Exists

While sending an email can be done in Node.js, we offload this to a dedicated Ballerina microservice to demonstrate distributed architecture and proper separation of concerns.

### Ballerina vs. Node.js Comparison

| Feature | Ballerina | Node.js |
| :--- | :--- | :--- |
| **Network Primitives** | Native (`http:Caller`, `email:SmtpClient` are built-in) | Requires third-party packages (e.g., `nodemailer`, `express`) |
| **Error Handling** | Explicit (`check`, `error?` types force handling) | Implicit (`try/catch` easily forgotten, leading to unhandled rejections) |
| **Concurrency** | Strands (lightweight, transparent concurrency) | Event loop (callbacks/Promises) |
| **Data Binding** | Powerful structural typing and native JSON integration | TypeScript needed for strong typing |

## WSO2 Architecture Context

This microservice is a critical part of the Smart Internship Tracker's enterprise architecture:

1. **WSO2 Asgardeo**: Handles user authentication and provides JWTs.
2. **React Frontend**: User updates application status via the UI.
3. **WSO2 API Manager**: Routes and governs the frontend request to the backend.
4. **Node.js Backend**: Updates MongoDB and fires an async, non-blocking webhook to this service.
5. **Ballerina Workflow Service**: Receives the webhook, parses the JSON payload, connects to Gmail via SMTP with TLS, and securely delivers the preparation email.

## Prerequisites

- **Ballerina Swan Lake 2201.13.3** installed on your system.
- A **Gmail App Password** (Google no longer supports less secure apps; you must generate an App Password in your Google Account security settings).

## Setup & Configuration

1. Copy the configuration template:
   ```bash
   cp Config.toml.example Config.toml
   ```
2. Open `Config.toml` and fill in your Gmail credentials and sender name.

## Running Locally

Run the service using the Ballerina CLI:

```bash
bal run
```

The service will start on port `9091`.

## Testing with cURL

Test the health endpoint:
```bash
curl http://localhost:9091/health
```

Trigger an interview preparation email:
```bash
curl -X POST http://localhost:9091/api/interview-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "applicantEmail": "your-email@gmail.com",
    "companyName": "Google",
    "role": "SWE Intern",
    "interviewDate": "2026-05-15"
  }'
```

## Deployment on WSO2 Choreo

This service is designed to be deployed alongside the `ballerina-digest` service on WSO2 Choreo.
- Push the code to GitHub.
- Create a new component in Choreo, pointing to the `ballerina-workflow/` directory.
- Choreo will automatically detect the `Ballerina.toml`.
- Provide the `Config.toml` values as environment variables in the Choreo console.

## Interview Talking Points

If WSO2 engineers review this code, emphasize the following decisions:
- **Resilient Webhook Design**: The Node.js backend uses a "fire-and-forget" pattern. If this Ballerina service is temporarily down, the main application state (MongoDB) still successfully saves, ensuring high availability of the core system.
- **Explicit Error Handling**: Notice the extensive use of `check`, `json|error`, and type narrowing (`if payload.applicantEmail is string`). Ballerina forces us to handle edge cases where the Node.js payload might be malformed, preventing crashes.
- **Native Network Libraries**: We didn't need to install any external dependencies (like `nodemailer` in Node). The `ballerina/http` and `ballerina/email` standard libraries provide enterprise-grade features (like `START_TLS_AUTO`) out of the box.
