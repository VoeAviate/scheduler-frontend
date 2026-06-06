// Vitest test setup file
// Node 22+ introduces a native experimental globalThis.localStorage which returns undefined and warns
// that "--localstorage-file was not provided", overriding JSDOM's window.localStorage.
// We explicitly bind globalThis.localStorage to JSDOM's window.localStorage.

if (typeof window !== 'undefined') {
  const domLocalStorage = (window as any).localStorage;
  
  if (domLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', {
      value: domLocalStorage,
      configurable: true,
      writable: true,
    });
  } else {
    // Fallback simple memory store if window.localStorage is not available
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() { return store.size; },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
    };
    
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  }
}
