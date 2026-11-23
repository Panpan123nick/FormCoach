// The printed-paper background for the survey and home screens:
// a patch of halftone dots in the corner and paper grain over everything.
// It's decoration only, so it's hidden from screen readers.
export default function Paper() {
  return (
    <>
      <div className="paper-dots" aria-hidden="true" />
      <div className="paper-grain" aria-hidden="true" />
    </>
  );
}
