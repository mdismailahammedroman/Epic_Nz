// import admin from "firebase-admin";
// import fs from "fs";
// import path from "path";
// import { envVar } from "./envVar";

// let initialized = false;

// export const initFirebase = () => {
//   if (initialized) return;
//   if (admin.apps.length) {
//     initialized = true;
//     return;
//   }

//   const p = envVar.FIREBASE_SERVICE_ACCOUNT_PATH;
//   if (!p) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_PATH");

//   const resolved = path.resolve(process.cwd(), p);
//   if (!fs.existsSync(resolved)) {
//     throw new Error(`Firebase service account not found: ${resolved}`);
//   }

//   const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8"));

//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });

//   initialized = true;
// };

// export const fcmMessaging = () => {
//   initFirebase();
//   return admin.messaging();
// };
import admin, { ServiceAccount } from "firebase-admin";
import { envVar } from "./envVar"; // your env loader
let initialized = false;

export const initFirebase = () => {
  if (initialized) return;
  if (admin.apps.length) {
    initialized = true;
    return;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    envVar;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing Firebase environment variables");
  }

  const serviceAccount: ServiceAccount = {
    projectId: envVar.FIREBASE_PROJECT_ID,
    clientEmail: envVar.FIREBASE_CLIENT_EMAIL,
    privateKey: envVar.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
};

export const fcmMessaging = () => {
  initFirebase();
  return admin.messaging();
};
