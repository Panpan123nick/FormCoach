import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './home/Home.jsx';
import { I18nProvider } from './i18n/I18nProvider.jsx';
import BootScreen from './intro/BootScreen.jsx';
import TitleScreen from './intro/TitleScreen.jsx';
import { loadData, saveData } from './storage/storage.js';
import CameraCheck from './setup/CameraCheck.jsx';
import SetupDirections from './setup/SetupDirections.jsx';
import { QUESTIONS } from './survey/questions.js';
import Survey from './survey/Survey.jsx';
import { sanitizeAnswers } from './survey/surveyLogic.js';
import WorkoutPage from './workout/WorkoutPage.jsx';

export default function App() {
  // All app data lives here and is copied to localStorage whenever it changes.
  // Passing a function means it only runs on the first render. Old saved answers
  // are cleaned up in case the survey changed since they were saved.
  const [data, setData] = useState(() => {
    const saved = loadData();
    return { ...saved, survey: { ...saved.survey, answers: sanitizeAnswers(QUESTIONS, saved.survey.answers) } };
  });

  // The boot animation covers the screen at launch. Once it starts fading
  // (`booted`), the real screens render underneath; once it's gone, we remove it.
  const [booted, setBooted] = useState(false);
  const [bootGone, setBootGone] = useState(false);
  const handleBootLeave = useCallback(() => setBooted(true), []);
  const handleBootDone = useCallback(() => setBootGone(true), []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // These use the "updater" form setData(prev => ...) so two quick changes
  // in a row can't overwrite each other with stale data.
  // `answer` can be a value, or a function that gets the latest saved answer
  // and returns the new one (used when one tap changes part of an answer).
  const setAnswer = useCallback((questionId, answer) => {
    setData((prev) => {
      const answers = prev.survey.answers;
      const value = typeof answer === 'function' ? answer(answers[questionId]) : answer;
      return { ...prev, survey: { ...prev.survey, answers: { ...answers, [questionId]: value } } };
    });
  }, []);

  const updateSurvey = useCallback((changes) => {
    setData((prev) => ({ ...prev, survey: { ...prev.survey, ...changes } }));
  }, []);

  return (
    <I18nProvider language={data.settings.language}>
      {/* HashRouter puts the page in the URL after a "#" (e.g. /#/survey), so the
          app works on any simple static host without special server setup. */}
      {booted && (
        <HashRouter>
          <Routes>
            <Route path="/" element={<TitleScreen surveyDone={data.survey.completed} />} />
            <Route
              path="/survey"
              element={
                <Survey survey={data.survey} setAnswer={setAnswer} updateSurvey={updateSurvey} />
              }
            />
            <Route path="/home" element={<Home survey={data.survey} />} />
            <Route path="/setup" element={<SetupDirections />} />
            <Route path="/setup/camera" element={<CameraCheck />} />
            <Route
              path="/workout"
              element={<WorkoutPage survey={data.survey} settings={data.settings} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      )}
      {!bootGone && <BootScreen onLeave={handleBootLeave} onDone={handleBootDone} />}
    </I18nProvider>
  );
}
