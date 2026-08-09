-- Persist email verification state for password and OTP login flows.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
