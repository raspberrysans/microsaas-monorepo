/** @format */

import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all habits for authenticated user
router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		const { data: categories, error: categoriesError } = await supabase
			.from('habit_categories')
			.select('*, habits(*)')
			.eq('user_id', req.user!.uid)
			.order('created_at', { ascending: true });

		if (categoriesError) throw categoriesError;

		res.json(categories);
	} catch (error) {
		console.error('Error fetching habits:', error);
		res.status(500).json({ error: 'Failed to fetch habits' });
	}
});

// Create new habit category
router.post('/categories', async (req: AuthenticatedRequest, res) => {
	try {
		const { name, description, color, icon } = req.body;

		if (!name || !color) {
			return res.status(400).json({ error: 'Name and color are required' });
		}

		const { data, error } = await supabase
			.from('habit_categories')
			.insert({
				user_id: req.user!.uid,
				name,
				description,
				color,
				icon,
			})
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(data);
	} catch (error) {
		console.error('Error creating category:', error);
		res.status(500).json({ error: 'Failed to create category' });
	}
});

// Update habit category
router.put('/categories/:id', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, icon } = req.body;

		const { data, error } = await supabase
			.from('habit_categories')
			.update({ name, description, color, icon })
			.eq('id', id)
			.eq('user_id', req.user!.uid)
			.select()
			.single();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ error: 'Category not found' });
		}

		res.json(data);
	} catch (error) {
		console.error('Error updating category:', error);
		res.status(500).json({ error: 'Failed to update category' });
	}
});

// Delete habit category
router.delete('/categories/:id', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase
			.from('habit_categories')
			.delete()
			.eq('id', id)
			.eq('user_id', req.user!.uid);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting category:', error);
		res.status(500).json({ error: 'Failed to delete category' });
	}
});

// Create new habit
router.post('/', async (req: AuthenticatedRequest, res) => {
	try {
		const {
			category_id,
			name,
			description,
			priority,
			is_non_negotiable,
			target_frequency,
			frequency_unit,
			is_public,
		} = req.body;

		if (
			!category_id ||
			!name ||
			!priority ||
			!target_frequency ||
			!frequency_unit
		) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const { data, error } = await supabase
			.from('habits')
			.insert({
				user_id: req.user!.uid,
				category_id,
				name,
				description,
				priority,
				is_non_negotiable: is_non_negotiable || false,
				target_frequency,
				frequency_unit,
				is_public: is_public || false,
			})
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(data);
	} catch (error) {
		console.error('Error creating habit:', error);
		res.status(500).json({ error: 'Failed to create habit' });
	}
});

// Update habit
router.put('/:id', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const { data, error } = await supabase
			.from('habits')
			.update(updates)
			.eq('id', id)
			.eq('user_id', req.user!.uid)
			.select()
			.single();

		if (error) throw error;

		if (!data) {
			return res.status(404).json({ error: 'Habit not found' });
		}

		res.json(data);
	} catch (error) {
		console.error('Error updating habit:', error);
		res.status(500).json({ error: 'Failed to update habit' });
	}
});

// Delete habit
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;

		const { error } = await supabase
			.from('habits')
			.delete()
			.eq('id', id)
			.eq('user_id', req.user!.uid);

		if (error) throw error;

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting habit:', error);
		res.status(500).json({ error: 'Failed to delete habit' });
	}
});

// Log habit completion
router.post('/:id/logs', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;
		const { completed_at, notes } = req.body;

		// Verify habit belongs to user
		const { data: habit, error: habitError } = await supabase
			.from('habits')
			.select('id')
			.eq('id', id)
			.eq('user_id', req.user!.uid)
			.single();

		if (habitError || !habit) {
			return res.status(404).json({ error: 'Habit not found' });
		}

		const { data, error } = await supabase
			.from('habit_logs')
			.insert({
				habit_id: id,
				user_id: req.user!.uid,
				completed_at: completed_at || new Date().toISOString(),
				notes,
			})
			.select()
			.single();

		if (error) throw error;

		res.status(201).json(data);
	} catch (error) {
		console.error('Error logging habit:', error);
		res.status(500).json({ error: 'Failed to log habit' });
	}
});

// Get habit logs
router.get('/:id/logs', async (req: AuthenticatedRequest, res) => {
	try {
		const { id } = req.params;
		const { start_date, end_date } = req.query;

		let query = supabase
			.from('habit_logs')
			.select('*')
			.eq('habit_id', id)
			.eq('user_id', req.user!.uid)
			.order('completed_at', { ascending: false });

		if (start_date) {
			query = query.gte('completed_at', start_date as string);
		}
		if (end_date) {
			query = query.lte('completed_at', end_date as string);
		}

		const { data, error } = await query;

		if (error) throw error;

		res.json(data);
	} catch (error) {
		console.error('Error fetching habit logs:', error);
		res.status(500).json({ error: 'Failed to fetch habit logs' });
	}
});

export default router;
