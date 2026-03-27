import { body } from "express-validator";

export const registerValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Email must be valid."),
  body("password").notEmpty().withMessage("Password is required.")
];

export const loginValidationRules = [
  body("email").trim().notEmpty().withMessage("Email is required.").isEmail().withMessage("Email must be valid."),
  body("password").notEmpty().withMessage("Password is required.")
];
