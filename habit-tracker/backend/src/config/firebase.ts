/** @format */

import * as admin from 'firebase-admin';

export const initializeFirebase = () => {
	if (!admin.apps.length) {
		const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

		if (serviceAccount) {
			admin.initializeApp({
				credential: admin.credential.cert(JSON.parse(serviceAccount)),
			});
		} else {
			// For development, you can use a service account file
			// admin.initializeApp({
			//   credential: admin.credential.cert('./path/to/serviceAccountKey.json'),
			// });
			console.warn(
				'Firebase service account not configured. Authentication will not work.'
			);
		}
	}
	return admin;
};

export { admin };
