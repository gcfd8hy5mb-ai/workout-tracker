/* Separate guest and account photo databases without altering existing guest photos. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.PRISMPhotoScope = api;
})(globalThis, function () {
  'use strict';
  const LEGACY = new Set(['workoutTrackerPhotosV1', 'prismProgressPhotosDB']);
  function databaseName(legacyName, userId) {
    if (!LEGACY.has(legacyName)) throw Error('Unknown photo database');
    if (userId === null) return legacyName;
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(userId))
      throw Error('Verified account ID required for photos');
    return 'prismAccountPhotosV1:' + userId + ':' + legacyName;
  }
  return Object.freeze({ databaseName });
});
