import User from "../models/User.js";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { logUnauthorizedAttempt } from "../utils/accessLogger.js";
import { verifyAccessToken } from "../utils/tokenService.js";

// ── Asgardeo JWKS client ──────────────────────────────────────────────────────
// Fallback to "org900gq" which was found in your client/.env
const ASGARDEO_ORG = process.env.ASGARDEO_ORG_NAME || "org900gq"; 

console.log("=== ASGARDEO INIT ===");
console.log("process.env.ASGARDEO_ORG_NAME loaded as:", process.env.ASGARDEO_ORG_NAME);
console.log("Actual ASGARDEO_ORG being used:", ASGARDEO_ORG);
console.log("JWKS URI:", `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`);
console.log("=====================");

const asgardeoJwksClient = jwksClient({
  jwksUri: `https://api.asgardeo.io/t/${ASGARDEO_ORG}/oauth2/jwks`,
  cache: true,
  cacheMaxAge: 600000, // 10 mins
  rateLimit: true,
});

function getAsgardeoSigningKey(header) {
  return new Promise((resolve, reject) => {
    asgardeoJwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}

async function verifyAsgardeoToken(token) {
  const header = jwt.decode(token, { complete: true })?.header;
  if (!header?.kid) throw new Error("Token has no 'kid' header — not a valid Asgardeo token.");

  const publicKey = await getAsgardeoSigningKey(header);

  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
  });
}

async function findOrCreateAsgardeoUser(decoded) {
  const sub = decoded.sub;
  let user = await User.findOne({ asgardeoId: sub });

  const email = decoded.email ?? `${sub}@asgardeo.local`;
  const name  = decoded.name  ?? decoded.username ?? "Smart Intern User";
  const groups = decoded.groups || [];

  let role = "student";
  if (groups.includes("admin") || groups.includes("Admin")) {
    role = "admin";
  } else if (groups.includes("reviewer") || groups.includes("Reviewer")) {
    role = "reviewer";
  }

  if (user) {
    user.role = role;
    user.groups = groups;
    await user.save();
    return user;
  }

  return User.create({ name, email, asgardeoId: sub, role, groups });
}

// ── Main middleware ───────────────────────────────────────────────────────────
export const verifyJWT = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    const error = new Error("Not authorized. Missing bearer token.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  const token = header.split(" ")[1];

  // ── Path 1: Try your own JWT_SECRET first (local login) ──────────────────
  try {
    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      const error = new Error("User not found for this token.");
      error.statusCode = 401;
      logUnauthorizedAttempt(req, error.statusCode, error.message);
      return next(error);
    }

    return next(); // ✅ local token — done
  } catch {
    // Not a local token. Fall through to Asgardeo path.
  }

  // ── Path 2: Try Asgardeo JWKS verification ───────────────────────────────
  try {
    const decoded = await verifyAsgardeoToken(token);
    const user    = await findOrCreateAsgardeoUser(decoded);

    req.user = user;
    req.auth = { userId: user._id, role: user.role };
    return next(); // ✅ valid Asgardeo token — done
  } catch (asgardeoError) {
    // Token failed BOTH verifications — reject it
    const error = new Error("Token is invalid or expired.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    const error = new Error("Not authorized. User context is missing.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  if (!allowedRoles.includes(req.user.role)) {
    const error = new Error("Forbidden. You do not have permission to access this resource.");
    error.statusCode = 403;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  next();
};

export const requireAsgardeoGroup = (groupName) => (req, res, next) => {
  if (!req.user) {
    const error = new Error("Not authorized. User context is missing.");
    error.statusCode = 401;
    return next(error);
  }

  // The role maps directly to the Asgardeo group for admin/reviewer logic,
  // or we can check req.user.groups directly if they logged in via Asgardeo
  const mappedRole = groupName.toLowerCase();
  
  if (req.user.role !== mappedRole && !req.user.groups.includes(groupName)) {
    const error = new Error(`Forbidden. Requires Asgardeo group: ${groupName}`);
    error.statusCode = 403;
    return next(error);
  }

  next();
};

export const protect = verifyJWT;
