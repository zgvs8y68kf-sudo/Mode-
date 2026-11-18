"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Configuration publique Firebase (ces valeurs ne sont pas secrètes : la sécurité
// repose sur les règles Firestore, voir firestore.rules).
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
function fbApp() {
  if (!firebaseEnabled) throw new Error("Firebase non configuré");
  app ??= getApps().length ? getApp() : initializeApp(config);
  return app;
}

export const auth = (): Auth => getAuth(fbApp());
export const db = (): Firestore => getFirestore(fbApp());
