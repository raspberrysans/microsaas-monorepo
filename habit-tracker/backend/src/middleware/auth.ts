/** @format */

import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
	user?: {
		uid: string;
		email?: string;
	};
}

export const authMiddleware = async (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'No token provided' });
		}

		const token = authHeader.substring(7);

		try {
			const decodedToken = await admin.auth().verifyIdToken(token);
			req.user = {
				uid: decodedToken.uid,
				email: decodedToken.email,
			};
			next();
		} catch (error) {
			console.error('Token verification failed:', error);
			return res.status(401).json({ error: 'Invalid token' });
		}
	} catch (error) {
		console.error('Auth middleware error:', error);
		return res.status(500).json({ error: 'Authentication error' });
	}
};
