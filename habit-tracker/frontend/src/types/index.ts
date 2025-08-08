/** @format */

export interface Profile {
	id: string;
	user_id: string;
	username: string;
	display_name: string;
	bio?: string;
	avatar_url?: string;
	public_url?: string;
	created_at: string;
	updated_at: string;
}

export interface HabitCategory {
	id: string;
	user_id: string;
	name: string;
	description?: string;
	color: string;
	icon?: string;
	created_at: string;
	updated_at: string;
	habits?: Habit[];
}

export interface Habit {
	id: string;
	user_id: string;
	category_id: string;
	name: string;
	description?: string;
	priority: 'low' | 'medium' | 'high';
	is_non_negotiable: boolean;
	target_frequency: number;
	frequency_unit: 'daily' | 'weekly' | 'monthly';
	is_public: boolean;
	created_at: string;
	updated_at: string;
	category?: HabitCategory;
	recent_logs?: HabitLog[];
}

export interface HabitLog {
	id: string;
	habit_id: string;
	user_id: string;
	completed_at: string;
	notes?: string;
	created_at: string;
}

export interface CreateHabitCategoryInput {
	name: string;
	description?: string;
	color: string;
	icon?: string;
}

export interface UpdateHabitCategoryInput {
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
}

export interface CreateHabitInput {
	category_id: string;
	name: string;
	description?: string;
	priority: 'low' | 'medium' | 'high';
	is_non_negotiable?: boolean;
	target_frequency: number;
	frequency_unit: 'daily' | 'weekly' | 'monthly';
	is_public?: boolean;
}

export interface UpdateHabitInput {
	name?: string;
	description?: string;
	priority?: 'low' | 'medium' | 'high';
	is_non_negotiable?: boolean;
	target_frequency?: number;
	frequency_unit?: 'daily' | 'weekly' | 'monthly';
	is_public?: boolean;
	category_id?: string;
}

export interface CreateHabitLogInput {
	habit_id: string;
	completed_at?: string;
	notes?: string;
}
