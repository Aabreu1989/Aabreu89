import { supabase } from '../lib/supabase';
import { Course } from '../types';

export const courseService = {
    async fetchCourses(): Promise<Course[]> {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return [];
        }

        return (data || []).map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            type: row.type || 'Híbrido/Online',
            duration: row.duration || 'Variável',
            image: row.image_url || row.image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=50',
            isIefpSynced: row.is_iefp_synced || false,
            link: row.link || row.source_url
        }));
    },

    async upsertCourses(courses: Course[]): Promise<boolean> {
        
        const mapped = courses.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            category: c.category,
            type: c.type,
            duration: c.duration,
            image_url: c.image,
            is_iefp_synced: c.isIefpSynced || true,
            link: c.link
        }));

        const { error } = await supabase
            .from('courses')
            .upsert(mapped, { onConflict: 'id' });

        if (error) {
            return false;
        }

        return true;
    }
};
