// BMdcMtbCnmRuaya4oxqaYAyedxmQ500QSyWtqNTFn8cbxpUehFRfSH0e3KGprVm-/////////5Vx_SJYkfU3c98xk1NFXXa0

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { envVar } from "./envVar";

const serviceAccountPath = envVar.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");
}

// Resolve path safely (Windows + Linux)
const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

console.log("Firebase apps:", admin.apps.length);
export const fcm = admin.messaging();
