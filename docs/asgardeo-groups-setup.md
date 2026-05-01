# Asgardeo Group-Based UI and API Permissions Setup

This guide explains how to configure WSO2 Asgardeo to provide group-based authorization for the Smart Internship & Career Tracker platform.

## 1. Creating Groups in the Asgardeo Console

By default, Asgardeo assigns users to the `everyone` role. We need to create specific groups for our application.

1. Log in to the [Asgardeo Console](https://console.asgardeo.io/).
2. Navigate to **User Management** > **Groups** in the left sidebar.
3. Click **New Group**.
4. Create the following groups (names are case-insensitive in our backend, but standardizing on capitalized or lowercase is good practice):
   - `admin` or `Admin`
   - `reviewer` or `Reviewer`
   - `student` or `Student` (optional, as users fall back to `student` by default)

## 2. Assigning Users to Groups

Once the groups are created, you need to assign users to them.

1. Navigate to **User Management** > **Users**.
2. Select an existing user or create a new one.
3. In the user's profile, go to the **Groups** tab.
4. Click **Assign Groups** and select the appropriate group (e.g., `admin`).
5. Click **Save**.

## 3. Configuring the OIDC Application to Include the Groups Claim

For the backend to receive the groups, the OIDC application must be configured to return the `groups` claim in the ID token and UserInfo endpoint.

1. Navigate to **Applications** in the Asgardeo Console.
2. Select your application (e.g., "Smart Internship Tracker").
3. Go to the **User Attributes** tab.
4. Under **Mandatory Attributes** or **Requested Attributes**, click **Add Attribute**.
5. Select `groups` from the list of available attributes.
6. Make sure to **Update** or **Save** the application settings.
7. *Note*: In the **Protocol** > **OIDC** settings, ensure the `groups` scope is allowed if it's explicitly managed. Our application requests `scope: "openid profile email groups"`.

## 4. How Asgardeo Groups are Mapped to Application Roles

When a user logs in, the application exchanges the authorization code for tokens.

1. **Token Extraction**: The backend extracts the `groups` array from the UserInfo response or the ID Token claims.
2. **Role Mapping**: The application iterates through the groups.
   - If the user is in the `admin` group, their MongoDB `role` is set to `"admin"`.
   - If the user is in the `reviewer` group, their MongoDB `role` is set to `"reviewer"`.
   - Otherwise, they default to `"student"`.
3. **Database Update**: The backend updates the MongoDB `User` document, saving both the mapped `role` and the raw `groups` array. This ensures local authorization checks (like `authorizeRoles`) and the `/api/auth/my-groups` endpoint function correctly.

## 5. Testing the Implementation

To verify that groups are being passed correctly:

1. Log in to the frontend application using the **Continue with Asgardeo** button.
2. Observe the role badge in the bottom-left sidebar.
   - **Red Badge (`admin`)**: If you assigned the user to the `admin` group. You will also see the "Admin" link in the navigation and the API Capacity meter.
   - **Blue Badge (`reviewer`)**: If you assigned the user to the `reviewer` group. You will see the "Reviewer" link.
   - **Green Badge (`student`)**: If you assigned the user to no groups or the `student` group.
3. You can also inspect the network request to `GET /api/auth/my-groups` to see the raw JSON response containing the mapped role and the `groups` array from Asgardeo.
