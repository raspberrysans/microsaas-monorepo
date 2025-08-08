/** @format */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					user_id: string;
					username: string;
					display_name: string;
					bio: string | null;
					avatar_url: string | null;
					public_url: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					username: string;
					display_name: string;
					bio?: string | null;
					avatar_url?: string | null;
					public_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					username?: string;
					display_name?: string;
					bio?: string | null;
					avatar_url?: string | null;
					public_url?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			habit_categories: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					description: string | null;
					color: string;
					icon: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					description?: string | null;
					color: string;
					icon?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					description?: string | null;
					color?: string;
					icon?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			habits: {
				Row: {
					id: string;
					user_id: string;
					category_id: string;
					name: string;
					description: string | null;
					priority: 'low' | 'medium' | 'high';
					is_non_negotiable: boolean;
					target_frequency: number;
					frequency_unit: 'daily' | 'weekly' | 'monthly';
					is_public: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					category_id: string;
					name: string;
					description?: string | null;
					priority: 'low' | 'medium' | 'high';
					is_non_negotiable?: boolean;
					target_frequency: number;
					frequency_unit: 'daily' | 'weekly' | 'monthly';
					is_public?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					category_id?: string;
					name?: string;
					description?: string | null;
					priority?: 'low' | 'medium' | 'high';
					is_non_negotiable?: boolean;
					target_frequency?: number;
					frequency_unit?: 'daily' | 'weekly' | 'monthly';
					is_public?: boolean;
					created_at?: string;
					updated_at?: string;
				};
			};
			habit_logs: {
				Row: {
					id: string;
					habit_id: string;
					user_id: string;
					completed_at: string;
					notes: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					habit_id: string;
					user_id: string;
					completed_at?: string;
					notes?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					habit_id?: string;
					user_id?: string;
					completed_at?: string;
					notes?: string | null;
					created_at?: string;
				};
			};
		};
	};
};
