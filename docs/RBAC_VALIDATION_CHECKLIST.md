# RBAC Validation Checklist

## Seed and setup

- Confirm `JWT_SECRET` and `MONGODB_URI` are set in `server/.env`.
- Run `npm install --prefix server`.
- Run `npm install --prefix client`.
- Seed test users with `npm run seed-test-users --prefix server`.

## API validation

- Login as `student@test.com` and confirm `GET /api/admin/dashboard` returns `403`.
- Login as `admin@test.com` and confirm `GET /api/admin/dashboard` returns `200`.
- Login as `reviewer@test.com` and confirm `GET /api/review` returns `200`.
- Login as `student@test.com` and confirm `GET /api/review` returns `403`.
- Call any protected route without a token and confirm `401`.
- Call any protected route with an invalid token and confirm `401`.

## JWT and role validation

- Decode a valid token and confirm `userId` and `role` exist in the payload.
- Change a user role in MongoDB after login and confirm access reflects the database role, not the stale token role.
- Delete a user from MongoDB and confirm old tokens stop working with `401`.

## Frontend validation

- Student user should not see `Admin` or `Reviewer` navigation.
- Admin user should see `Admin` and reach `/admin`.
- Reviewer user should see `Reviewer` and reach `/review`.
- Non-admin users should be redirected away from `/admin`.
- Non-reviewer users should be redirected away from `/review`.

## Security edge cases

- Test an expired token and confirm `401`.
- Test a tampered token and confirm `401`.
- Test a user record with an unexpected role and confirm access is denied with `403`.

## Logging

- Trigger a `401` with no token and confirm a warning log is emitted.
- Trigger a `403` with the wrong role and confirm the log includes timestamp, route, and user ID.
