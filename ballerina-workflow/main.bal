import ballerina/http;
import ballerina/email;
import ballerina/log;

// ============================================================================
// CONFIGURATION VARIABLES
// These are loaded from Config.toml (or environment variables in Choreo).
// ============================================================================
configurable string smtpHost = ?;
configurable int smtpPort = ?;
configurable string smtpUsername = ?;
configurable string smtpPassword = ?;
configurable string senderName = ?;

// ============================================================================
// HTTP SERVICE: interview-workflow
// Listens on port 9091 and exposes health check and trigger endpoints.
// ============================================================================
service / on new http:Listener(9091) {

    // Initialize the SMTP client when the service starts
    private final email:SmtpClient smtpClient;

    function init() returns error? {
        // We use START_TLS_AUTO as required by modern SMTP configurations
        // and specifically compatible with Swan Lake 2201.13.3
        self.smtpClient = check new (
            smtpHost, 
            smtpUsername, 
            smtpPassword, 
            port = smtpPort,
            security = email:START_TLS_AUTO
        );
        log:printInfo("SMTP Client initialized successfully", host = smtpHost);
    }

    // ------------------------------------------------------------------------
    // GET /health
    // Simple health check endpoint used by WSO2 Choreo to verify service uptime.
    // ------------------------------------------------------------------------
    resource function get health() returns json {
        log:printInfo("Health check requested");
        // We must quote "service" because 'service' is a Ballerina keyword.
        return {"status": "ok", "service": "interview-workflow"};
    }

    // ------------------------------------------------------------------------
    // POST /api/interview-trigger
    // Triggered by the Node.js backend when an application status changes to 
    // "Interviewed". It parses the payload and sends a preparation checklist.
    // ------------------------------------------------------------------------
    resource function post apiInterviewTrigger(http:Caller caller, http:Request req) returns error? {
        log:printInfo("Received interview trigger request");

        // We use the Caller to send explicit HTTP responses instead of relying on
        // implicit returns, so we can carefully control error status codes.
        http:Response res = new;

        // 1. Parse JSON Payload
        json|error payloadResult = req.getJsonPayload();
        if payloadResult is error {
            log:printError("Failed to parse JSON payload", err = payloadResult.message());
            res.statusCode = 400;
            res.setJsonPayload({"status": "error", "message": "Invalid request body"});
            check caller->respond(res);
            return;
        }

        json payload = payloadResult;

        // 2. Extract required fields
        string applicantEmail;
        string companyName;
        string role;

        json|error emailVal = payload.applicantEmail;
        if emailVal is string {
            applicantEmail = emailVal;
        } else {
            res.statusCode = 400;
            res.setJsonPayload({"status": "error", "message": "Missing or invalid applicantEmail"});
            check caller->respond(res);
            return;
        }

        json|error companyVal = payload.companyName;
        if companyVal is string {
            companyName = companyVal;
        } else {
            res.statusCode = 400;
            res.setJsonPayload({"status": "error", "message": "Missing or invalid companyName"});
            check caller->respond(res);
            return;
        }

        json|error roleVal = payload.role;
        if roleVal is string {
            role = roleVal;
        } else {
            res.statusCode = 400;
            res.setJsonPayload({"status": "error", "message": "Missing or invalid role"});
            check caller->respond(res);
            return;
        }

        // 3. Extract optional field
        json|error dateVal = payload.interviewDate;
        string? interviewDate = dateVal is string ? dateVal : ();

        log:printInfo("Processing interview workflow", company = companyName, role = role);

        // 4. Construct Email Content
        string subject = string `Interview Confirmed — ${role} at ${companyName} 🎯`;
        
        string dateString = "";
        if interviewDate is string {
            dateString = string `Your interview is scheduled for ${interviewDate}.\n\n`;
        }

        string emailBody = string `Congratulations on securing an interview for the ${role} position at ${companyName}!

${dateString}Here is your interview preparation checklist:

1. Research ${companyName} thoroughly — products, mission, recent news, tech stack
2. Re-read the job description and note every required skill
3. Prepare 3-5 STAR method stories (Situation, Task, Action, Result)
4. Practice common technical questions for ${role}
5. Prepare 5 thoughtful questions to ask the interviewer
6. If video interview: test your camera, microphone, and internet connection
7. If in-person: plan your route and arrive 10 minutes early
8. Review your resume — be ready to discuss every line

You've got this! Good luck!

-- 
Powered by Smart Internship Tracker + WSO2 Choreo`;

        // 5. Construct Email Message Object
        // Note: 'from is quoted because from is a reserved keyword in Ballerina query expressions
        email:Message emailMsg = {
            'from: senderName + " <" + smtpUsername + ">",
            to: [applicantEmail],
            subject: subject,
            body: emailBody
        };

        // 6. Send the Email via SMTP
        error? sendResult = self.smtpClient->sendMessage(emailMsg);
        
        if sendResult is error {
            log:printError("Failed to send preparation email", err = sendResult.message());
            res.statusCode = 500;
            res.setJsonPayload({"status": "error", "message": "Failed to send email"});
            check caller->respond(res);
            return;
        }

        // 7. Return 200 OK on Success
        log:printInfo("Successfully sent preparation email", recipient = applicantEmail);
        res.statusCode = 200;
        res.setJsonPayload({"status": "ok"});
        check caller->respond(res);
    }
}
