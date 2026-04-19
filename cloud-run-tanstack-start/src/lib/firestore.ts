import { Firestore as GCFirestore } from "@google-cloud/firestore";

export const firestore = new GCFirestore({
	projectId: process.env.PROJECT,
	ignoreUndefinedProperties: true,
});
