// The survey is described as DATA here, not as screens. One generic screen
// (QuestionScreen.jsx) renders any of these, so adding or reordering a question
// means editing this list, not writing a new component.
//
// The text for each question lives in i18n/en.json under questions.<id>.
//
// Question types:
//   single – pick exactly one option (answer is a string)
//   multi  – pick one or more options (answer is an array of strings)
//   yesno  – answer Yes/No to each item (answer is an object: item -> 'yes' | 'no')
//
// `exclusive` names an option (like "none") that can't be combined with others.
// `comingSoon` lists options that get a "More workouts coming soon" tag.
// `hint: true` shows the questions.<id>.hint text under the title.

export const QUESTIONS = [
  {
    id: 'ageRange',
    type: 'single',
    options: ['under13', '13to17', '18to39', '40to59', '60plus'],
  },
  {
    // Based on the kinds of questions in standard pre-exercise screening (like the PAR-Q+).
    id: 'safety',
    type: 'yesno',
    hint: true,
    items: ['heartCondition', 'chestPain', 'boneJoint', 'pregnantOrRecovering'],
  },
  {
    id: 'easyAreas',
    type: 'multi',
    options: ['knees', 'back', 'shoulders', 'wrists', 'neck', 'none'],
    exclusive: 'none',
  },
  {
    id: 'experience',
    type: 'single',
    options: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'activityDays',
    type: 'single',
    options: ['0', '1to2', '3to4', '5plus'],
  },
  {
    id: 'goals',
    type: 'multi',
    options: ['stronger', 'loseWeight', 'endurance', 'flexibility', 'healthy', 'sports'],
  },
  {
    id: 'exercises',
    type: 'multi',
    options: ['pushups', 'situps', 'squats', 'plank'],
  },
  {
    id: 'equipment',
    type: 'multi',
    options: ['none', 'dumbbells', 'pullupBar', 'bands', 'yogaMat', 'other'],
    exclusive: 'none',
    hint: true,
    comingSoon: ['other'],
  },
  {
    id: 'workoutLength',
    type: 'single',
    options: ['5to10', '15to20', '30plus'],
  },
];
