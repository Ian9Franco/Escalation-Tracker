'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/utils/calculations';

interface AnimatedCurrencyProps {
    value: number;
    duration?: number;
    className?: string;
}

/**
 * Animated currency counter.
 * - First render: shows the value immediately (no animation from 0)
 * - Subsequent changes: smoothly animates to the new value
 */
export function AnimatedCurrency({ value, duration = 600, className = '' }: AnimatedCurrencyProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const isFirstRender = useRef(true);
    const previousValue = useRef(value);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        // On first render, just set the value instantly
        if (isFirstRender.current) {
            isFirstRender.current = false;
            setDisplayValue(value);
            previousValue.current = value;
            return;
        }

        // Don't animate if value hasn't changed
        if (value === previousValue.current) return;

        const startValue = previousValue.current;
        previousValue.current = value;

        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (value - startValue) * eased;
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {formatCurrency(displayValue)}
        </span>
    );
}
