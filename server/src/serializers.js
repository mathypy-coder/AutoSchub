import { distanceKm, etaMinutes } from './geo.js';

const parseList = (value) => {
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const centsToEuros = (cents) => Math.round(cents) / 100;

export function rating(row) {
  return row.rating_count ? Math.round((row.rating_sum / row.rating_count) * 10) / 10 : null;
}

export function serializeUser(user) {
  return {
    id: user.id,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    city: user.city,
  };
}

export function serializeInstructor(row, from) {
  const result = {
    id: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    city: row.city,
    bio: row.bio,
    schoolName: row.school_name,
    approvalNumber: row.approval_number,
    categories: parseList(row.categories),
    languages: parseList(row.languages),
    transmission: row.transmission,
    vehicle: row.vehicle,
    hourlyRate: centsToEuros(row.hourly_rate_cents),
    lat: row.lat,
    lng: row.lng,
    isOnline: Boolean(row.is_online),
    rating: rating(row),
    ratingCount: row.rating_count,
  };
  if (from && row.lat != null && row.lng != null) {
    const km = distanceKm(from.lat, from.lng, row.lat, row.lng);
    result.distanceKm = Math.round(km * 10) / 10;
    result.etaMin = etaMinutes(km);
  }
  return result;
}

export function serializeBooking(row, viewerRole) {
  const booking = {
    id: row.id,
    category: row.category,
    startAt: row.start_at,
    durationMin: row.duration_min,
    isInstant: Boolean(row.is_instant),
    pickupAddress: row.pickup_address,
    pickupLat: row.pickup_lat,
    pickupLng: row.pickup_lng,
    status: row.status,
    price: centsToEuros(row.price_cents),
    studentRating: row.student_rating,
    studentComment: row.student_comment,
    instructorFeedback: row.instructor_feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (viewerRole === 'student') {
    booking.instructor = {
      id: row.instructor_id,
      firstName: row.i_first_name,
      lastName: row.i_last_name,
      phone: ['accepted', 'en_route', 'in_progress'].includes(row.status) ? row.i_phone : null,
      vehicle: row.i_vehicle,
      transmission: row.i_transmission,
      lat: row.i_lat,
      lng: row.i_lng,
    };
    if (row.status === 'en_route' && row.i_lat != null && row.pickup_lat != null) {
      booking.instructor.etaMin = etaMinutes(
        distanceKm(row.i_lat, row.i_lng, row.pickup_lat, row.pickup_lng),
      );
    }
  } else {
    booking.student = {
      id: row.student_id,
      firstName: row.s_first_name,
      lastName: row.s_last_name,
      phone: ['accepted', 'en_route', 'in_progress'].includes(row.status) ? row.s_phone : null,
    };
  }
  return booking;
}
