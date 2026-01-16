/**
 * Calculates the distance between two points in kilometers using the Haversine formula.
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const ELISA_BASE_COORDS = {
    lat: 45.9023929269181,
    lon: 6.124958650165817,
    address: "37 Rue Carnot, 74000 Annecy, France"
};

export const MAX_SERVICE_RADIUS_KM = 7.5;
