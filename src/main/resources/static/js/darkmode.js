// darkmode.js
(function () {
    'use strict';

    const STORAGE_KEY = 'darkMode'; // values: 'true' | 'false' | 'auto' | null
    const toggle = document.getElementById('darkmode-toggle');
    const video = document.getElementById('dark-video');
    const body = document.body;
    const prefersDarkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    // Apply or remove the CSS class and sync UI/video
    function applyDarkClass(isDark) {
        if (isDark) {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }

        // Keep checkbox in sync (if exists)
        if (toggle) toggle.checked = isDark;

        // Play/pause video to save CPU when not in dark mode
        if (video) {
            try {
                if (isDark) {
                    // attempt to play (muted loop should allow autoplay on most browsers)
                    const p = video.play();
                    if (p && p.catch) p.catch(() => { /* autoplay blocked — ignore */ });
                } else {
                    // pause and rewind a bit to avoid audio glitches on some browsers
                    video.pause();
                    try { video.currentTime = 0; } catch (e) { /* some formats disallow setting currentTime */ }
                }
            } catch (e) {
                // ignore playback errors
                // console.warn('Video play/pause failed', e);
            }
        }
    }

    // Read preference from localStorage (safe)
    function readStoredPreference() {
        try {
            return localStorage.getItem(STORAGE_KEY); // may be null
        } catch (e) {
            return null;
        }
    }

    // Write preference to localStorage (safe)
    function writeStoredPreference(value) {
        try {
            if (value === null) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            // ignore (e.g. privacy mode)
        }
    }

    // Decide and apply theme based on stored value or system
    function applyInitialTheme() {
        const stored = readStoredPreference();
        if (stored === 'true') {
            applyDarkClass(true);
        } else if (stored === 'false') {
            applyDarkClass(false);
        } else if (stored === 'auto') {
            const sysDark = prefersDarkMQ ? prefersDarkMQ.matches : false;
            applyDarkClass(sysDark);
        } else {
            // no stored preference -> follow system if available, otherwise light
            const sysDark = prefersDarkMQ ? prefersDarkMQ.matches : false;
            applyDarkClass(sysDark);
        }
    }

    // Respond to toggle changes (user interaction)
    function onToggleChange() {
        if (!toggle) return;
        const enabled = !!toggle.checked;
        // Save explicit user choice
        writeStoredPreference(enabled ? 'true' : 'false');
        // Apply immediately
        applyDarkClass(enabled);
    }

    // React to system color-scheme changes (only when preference is 'auto' or not set)
    function onSystemPrefChange(e) {
        try {
            const stored = readStoredPreference();
            if (stored === 'auto' || stored === null) {
                applyDarkClass(e.matches);
            }
        } catch (err) {
            // ignore
        }
    }

    // Public API for other scripts
    const api = {
        enable() { writeStoredPreference('true'); applyDarkClass(true); },
        disable() { writeStoredPreference('false'); applyDarkClass(false); },
        auto() { writeStoredPreference('auto'); const sys = prefersDarkMQ ? prefersDarkMQ.matches : false; applyDarkClass(sys); },
        toggle() { const isDark = body.classList.contains('dark-theme'); this.disable(); if (!isDark) this.enable(); },
        // read current effective state
        isEnabled() { return body.classList.contains('dark-theme'); }
    };
    window.darkMode = api;

    // Hook up events
    if (toggle) {
        toggle.addEventListener('change', onToggleChange, { passive: true });
    }

    if (prefersDarkMQ) {
        // modern browsers: addEventListener('change'), fallback to addListener for old ones
        if (typeof prefersDarkMQ.addEventListener === 'function') {
            prefersDarkMQ.addEventListener('change', onSystemPrefChange);
        } else if (typeof prefersDarkMQ.addListener === 'function') {
            prefersDarkMQ.addListener(onSystemPrefChange);
        }
    }

    // Initialize immediately
    applyInitialTheme();

    // small safety: ensure UI sync in case something changed after load
    window.addEventListener('load', () => {
        // re-sync checkbox/video after full load
        if (toggle) toggle.checked = body.classList.contains('dark-theme');
        if (body.classList.contains('dark-theme')) {
            if (video) {
                try { video.play().catch(() => {}); } catch (e) {}
            }
        } else {
            if (video) {
                try { video.pause(); } catch (e) {}
            }
        }
    });
})();
