
import { NextResponse } from 'next/server';
import { getTestimonials, saveTestimonial } from '@/lib/googleSheets';

export const revalidate = 60; // 1 minute revalidation

export async function GET() {
    try {
        const testimonials = await getTestimonials();
        return NextResponse.json({ success: true, count: testimonials.length, data: testimonials });
    } catch (error) {
        console.error('API Error: Failed to fetch testimonials', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch testimonials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, rating, message } = body;

        // Validation
        if (!name || !rating || !message) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 });
        }

        console.log('[API] Saving testimonial:', { name, rating });
        const success = await saveTestimonial({ name, rating, message });

        if (success) {
            console.log('[API] Testimonial saved successfully');
            return NextResponse.json({ success: true, message: 'Testimonial submitted for approval' });
        } else {
            console.error('[API] Failed to save testimonial (saveTestimonial returned false)');
            return NextResponse.json({ success: false, error: 'Failed to save to sheet' }, { status: 500 });
        }

    } catch (error) {
        console.error('[API] Error in POST handler:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
