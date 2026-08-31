import { Firestore as GCFirestore } from "@google-cloud/firestore";

const projectId =
	process.env.PROJECT ||
	process.env.GOOGLE_CLOUD_PROJECT ||
	process.env.GCLOUD_PROJECT;

export const firestore = new GCFirestore({
	...(projectId ? { projectId } : {}),
	ignoreUndefinedProperties: true,
});
