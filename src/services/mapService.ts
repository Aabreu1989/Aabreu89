import { supabase } from '../lib/supabase';

export const mapService = {
    async submitReview(serviceId: string, userId: string, rating: number, comment: string) {
        const { data, error } = await supabase
            .from('service_reviews')
            .insert([
                {
                    service_id: serviceId,
                    user_id: userId,
                    rating,
                    comment
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error submitting review:', error);
            throw error;
        }

        return data;
    },

    async fetchReviewsForService(serviceId: string) {
        const { data, error } = await supabase
            .from('service_reviews')
            .select(`
        *,
        profiles (name, avatar_url)
      `)
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reviews:', error);
            throw error;
        }

        return data;
    }
};
