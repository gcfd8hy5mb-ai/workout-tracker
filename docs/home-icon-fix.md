# Home and iOS icon fix

This change makes presentation-module loading deterministic so the approved photo-free `liftova-home.js` renderer runs after the legacy reference layer. It also switches the iOS Home Screen touch-icon metadata to the dedicated 180×180 PNG with a versioned URL, avoiding the SVG icon path that produced the corrupted installed icon.
