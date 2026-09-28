const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('workout-experience.js', 'utf8');
const saved = [];
const buttons = (key, weight, reps) => [
  {textContent: weight, getAttribute: () => `openPicker('${key}','weight')`, dataset: {}, classList: {remove() {}}, removeAttribute() {}},
  {textContent: reps, getAttribute: () => `openPicker('${key}','reps')`, dataset: {}, classList: {remove() {}}, removeAttribute() {}}
];
const previous = {dataset: {}, querySelectorAll: selector => selector === '.picker-button' ? buttons('old-set1', '50 lb', '8 reps') : []};
const currentButtons = buttons('current-set2', 'Weight', 'Reps');
const current = {
  dataset: {},
  parentElement: {querySelectorAll: () => [previous, current]},
  querySelectorAll: selector => selector === '.picker-button' ? currentButtons : [],
  querySelector: () => null
};
const document = {
  readyState: 'loading', addEventListener() {}, getElementById: () => null,
  querySelectorAll: () => [], createElement: () => ({}), head: {appendChild() {}}
};
const window = {};
vm.runInNewContext(source, {
  window, document, setTimeout: () => {},
  saveSet: (key, type, value) => saved.push([key, type, value]),
  refreshComparison: key => saved.push(['comparison', key]),
  location: {pathname: '/'}
});
window.prismWorkoutExperience.copyPrevious(current);
assert.deepEqual(saved.slice(0, 2), [['current-set2', 'weight', 50], ['current-set2', 'reps', 8]]);
assert.equal(currentButtons[0].textContent, '50 lb');
assert.equal(currentButtons[1].textContent, '8 reps');

const html = fs.readFileSync('index.html', 'utf8');
const summary = html.match(/function showWorkoutSummary\(session\)\{[\s\S]*?\n\}\n\nfunction updateProgress/);
assert.ok(summary, 'completion renderer must be present');
const completionContent = {innerHTML: ''};
const session = {date: '2026-09-28T12:00:00Z', workoutTitle: 'QA', exercises: [{id: 'chest', name: 'Chest Press', sets: [{weight: 50, reps: 8}]}]};
const context = {
  workoutHistory: [session], showScreen() {}, setBottomNav() {},
  document: {getElementById: () => completionContent},
  progressionSuggestion: () => ({status: 'insufficient'}),
  escapeHTML: value => value, getExercise: () => null
};
vm.createContext(context);
vm.runInContext(summary[0].replace(/\n\nfunction updateProgress$/, ''), context);
context.showWorkoutSummary(session);
assert.doesNotMatch(completionContent.innerHTML, /undefined|Next:/);
context.progressionSuggestion = () => ({status: 'ready', weight: 55});
context.showWorkoutSummary(session);
assert.match(completionContent.innerHTML, /Next: 55 lb/);

const onboarding = fs.readFileSync('onboarding.js', 'utf8');
const back = onboarding.match(/function prismBack\(\)\{[^\n]+\}/);
assert.ok(back, 'onboarding back handler must exist');
const journey = {status: 'onboarding', origin: 'goals', step: 1, draft: {displayName: 'QA'}};
let destination = '';
const backContext = {
  prismJourney: journey, savePrismJourney() {}, showTrackingGoals() {destination = 'goals'},
  showPrismWelcome() {destination = 'welcome'}, renderPrismJourney() {destination = 'onboarding'}
};
vm.createContext(backContext);
vm.runInContext(back[0], backContext);
backContext.prismBack();
assert.equal(destination, 'goals', 'Back from goal creation returns to Goals');
assert.equal(journey.status, 'complete');
assert.equal(journey.origin, undefined);
console.log('LIFTOVA repeat set, completion suggestion, and goal cancel regressions: OK');
