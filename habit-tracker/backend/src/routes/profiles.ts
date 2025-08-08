/** @format */

import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Get public profile by username
router.get('/:username', async (req, res) => {
	try {
		const { username } = req.params;

		const { data: profile, error: profileError } = await supabase
			.from('profiles')
			.select('*')
			.eq('username', username)
			.single();

		if (profileError) {
			if (profileError.code === 'PGRST116') {
				return res.status(404).json({ error: 'Profile not found' });
			}
			throw profileError;
		}

		// Get public habits for this user
		const { data: categories, error: categoriesError } = await supabase
			.from('habit_categories')
			.select(
				`
        *,
        habits!habits_category_id_fkey(*)
      `
			)
			.eq('user_id', profile.user_id);

		if (categoriesError) throw categoriesError;

		// Filter to only include categories with public habits
		const publicCategories =
			categories
				?.map((category) => ({
					...category,
					habits:
						category.habits?.filter((habit: any) => habit.is_public) || [],
				}))
				.filter((category) => category.habits.length > 0) || [];

		res.json({
			profile,
			categories: publicCategories,
		});
	} catch (error) {
		console.error('Error fetching public profile:', error);
		res.status(500).json({ error: 'Failed to fetch profile' });
	}
});

// Get user's own profile (authenticated)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
	try {
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('user_id', req.user!.uid)
			.single();

		if (error && error.code !== 'PGRST116') {
			throw error;
		}

		res.json(data || null);
	} catch (error) {
		console.error('Error fetching user profile:', error);
		res.status(500).json({ error: 'Failed to fetch profile' });
	}
});

// Create or update profile (authenticated)
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
	try {
		const { username, display_name, bio, public_url } = req.body;

		if (!username || !display_name) {
			return res
				.status(400)
				.json({ error: 'Username and display name are required' });
		}

		// Check if username is already taken by another user
		const { data: existingProfile, error: checkError } = await supabase
			.from('profiles')
			.select('user_id')
			.eq('username', username)
			.neq('user_id', req.user!.uid)
			.single();

		if (checkError && checkError.code !== 'PGRST116') {
			throw checkError;
		}

		if (existingProfile) {
			return res.status(400).json({ error: 'Username already taken' });
		}

		// Check if public_url is already taken by another user
		if (public_url) {
			const { data: existingUrl, error: urlCheckError } = await supabase
				.from('profiles')
				.select('user_id')
				.eq('public_url', public_url)
				.neq('user_id', req.user!.uid)
				.single();

			if (urlCheckError && urlCheckError.code !== 'PGRST116') {
				throw urlCheckError;
			}

			if (existingUrl) {
				return res.status(400).json({ error: 'Public URL already taken' });
			}
		}

		const profileData = {
			user_id: req.user!.uid,
			username,
			display_name,
			bio: bio || null,
			public_url: public_url || null,
		};

		// Try to update first, then insert if doesn't exist
		const { data: updatedProfile, error: updateError } = await supabase
			.from('profiles')
			.update(profileData)
			.eq('user_id', req.user!.uid)
			.select()
			.single();

		if (updateError && updateError.code === 'PGRST116') {
			// Profile doesn't exist, create it
			const { data: newProfile, error: insertError } = await supabase
				.from('profiles')
				.insert(profileData)
				.select()
				.single();

			if (insertError) throw insertError;
			return res.status(201).json(newProfile);
		}

		if (updateError) throw updateError;

		res.json(updatedProfile);
	} catch (error) {
		console.error('Error creating/updating profile:', error);
		res.status(500).json({ error: 'Failed to save profile' });
	}
});

export default router;
