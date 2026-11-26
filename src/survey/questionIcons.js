// Icons for the survey, kept separate from questions.js so the question
// list stays plain data. Icons come from lucide-react and are bundled with
// the app (no downloads at runtime).
import {
  Backpack,
  Cake,
  CalendarDays,
  Dumbbell,
  Footprints,
  Heart,
  HeartHandshake,
  Sprout,
  Stethoscope,
  Target,
  Timer,
  Trophy,
  Waves,
  Zap,
} from 'lucide-react';

// One icon per question, shown in a badge above the title and in the summary.
export const QUESTION_ICONS = {
  ageRange: Cake,
  safety: Stethoscope,
  easyAreas: HeartHandshake,
  experience: Sprout,
  activityDays: CalendarDays,
  goals: Target,
  equipment: Backpack,
  workoutLength: Timer,
};

// Some options get their own small icon too.
export const OPTION_ICONS = {
  goals: {
    stronger: Dumbbell,
    moreActive: Footprints,
    endurance: Zap,
    flexibility: Waves,
    healthy: Heart,
    sports: Trophy,
  },
};
