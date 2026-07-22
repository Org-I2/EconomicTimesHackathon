/** useDebouncedValue — debounce a value with configurable delay */
import { useState, useEffect } from 'react';

/** Returns a debounced version of the provided value */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
