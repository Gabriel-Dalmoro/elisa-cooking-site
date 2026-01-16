"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Check, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateDistance, ELISA_BASE_COORDS, MAX_SERVICE_RADIUS_KM } from '@/lib/geoUtils';
import { Input } from '@/components/ui/input';

interface AddressSuggestion {
    label: string;
    city: string;
    postcode: string;
    coordinates: [number, number]; // [lon, lat] as per GeoJSON
}

interface AddressAutocompleteProps {
    onEligibilityChange: (isEligible: boolean, addressData: { address: string; distance: number; coords: [number, number] }) => void;
    className?: string;
}

export function AddressAutocomplete({ onEligibilityChange, className }: AddressAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);
    const [status, setStatus] = useState<'idle' | 'eligible' | 'not-eligible'>('idle');
    const [distance, setDistance] = useState<number | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3 || (selectedAddress && selectedAddress.label === query)) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`;
                const response = await fetch(url);
                const data = await response.json();

                const formatted: AddressSuggestion[] = data.features.map((f: any) => ({
                    label: f.properties.label,
                    city: f.properties.city,
                    postcode: f.properties.postcode,
                    coordinates: f.geometry.coordinates
                }));

                setSuggestions(formatted);
                setShowDropdown(true);
            } catch (error) {
                console.error("Error fetching addresses:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, selectedAddress]);

    // Handle clicks outside dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = useCallback((suggestion: AddressSuggestion) => {
        setSelectedAddress(suggestion);
        setQuery(suggestion.label);
        setShowDropdown(false);
        setSuggestions([]);

        const [lon, lat] = suggestion.coordinates;
        const dist = calculateDistance(
            ELISA_BASE_COORDS.lat,
            ELISA_BASE_COORDS.lon,
            lat,
            lon
        );

        const isEligible = dist <= MAX_SERVICE_RADIUS_KM;
        setDistance(dist);
        setStatus(isEligible ? 'eligible' : 'not-eligible');
        onEligibilityChange(isEligible, {
            address: suggestion.label,
            distance: dist,
            coords: suggestion.coordinates
        });
    }, [onEligibilityChange]);

    return (
        <div className={cn("relative w-full", className)}>
            <div className="relative group">
                <div className={cn(
                    "relative flex items-center transition-all duration-300 rounded-[1.5rem] border-2 bg-white",
                    status === 'eligible' ? "border-emerald-500 shadow-lg shadow-emerald-500/10" :
                        status === 'not-eligible' ? "border-brand-rose/30 shadow-lg shadow-brand-rose/5" :
                            "border-stone-100 group-hover:border-stone-200 focus-within:border-brand-rose focus-within:shadow-xl focus-within:shadow-brand-rose/5"
                )}>
                    <div className="pl-4 text-stone-400">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-rose" /> : <MapPin className="h-5 w-5" />}
                    </div>
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (status !== 'idle') {
                                setStatus('idle');
                                setDistance(null);
                                setSelectedAddress(null);
                            }
                        }}
                        placeholder="Votre adresse complète..."
                        className="border-none focus-visible:ring-0 text-stone-900 font-medium placeholder:text-stone-300 h-14 bg-transparent"
                    />

                    <AnimatePresence>
                        {status === 'eligible' && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="pr-4"
                            >
                                <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <Check className="h-4 w-4 stroke-[3px]" />
                                </div>
                            </motion.div>
                        )}
                        {status === 'not-eligible' && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="pr-4"
                            >
                                <div className="h-7 w-7 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose">
                                    <Info className="h-4 w-4" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showDropdown && suggestions.length > 0 && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden"
                        >
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(suggestion)}
                                    className="w-full text-left p-4 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-none flex items-start gap-3 group"
                                >
                                    <MapPin className="h-4 w-4 mt-1 text-stone-300 group-hover:text-brand-rose transition-colors" />
                                    <div>
                                        <p className="text-sm font-bold text-stone-900 line-clamp-1">{suggestion.label}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{suggestion.city} • {suggestion.postcode}</p>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Validation States */}
            <AnimatePresence mode="wait">
                {status === 'eligible' && (
                    <motion.div
                        key="eligible"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3"
                    >
                        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Check className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Nous venons chez vous !</p>
                            <p className="text-xs text-emerald-600/80">Distance estimée : {distance?.toFixed(1)} km</p>
                        </div>
                    </motion.div>
                )}

                {status === 'not-eligible' && (
                    <motion.div
                        key="not-eligible"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4"
                    >
                        <div className="p-4 bg-brand-rose/5 border border-brand-rose/10 rounded-2xl flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-rose/10 flex items-center justify-center text-brand-rose">
                                <Info className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-stone-900 leading-tight">Vous êtes situé hors de ma zone habituelle (7.5km), mais tout n'est pas perdu !</p>
                                <p className="text-xs text-stone-500 mt-1">Distance : {distance?.toFixed(1)} km d'Annecy.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
