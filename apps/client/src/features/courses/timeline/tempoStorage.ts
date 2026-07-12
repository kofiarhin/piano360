const keyFor = (courseSlug: string, lessonSlug: string) =>
  `piano360.tempo.${courseSlug}/${lessonSlug}`;

export const loadTempoPercent = (courseSlug: string, lessonSlug: string) => {
  try {
    const value = Number(window.localStorage.getItem(keyFor(courseSlug, lessonSlug)));
    return [50, 60, 70, 80, 90, 100].includes(value) ? value : 60;
  } catch {
    return 60;
  }
};

export const saveTempoPercent = (courseSlug: string, lessonSlug: string, percent: number) => {
  try {
    window.localStorage.setItem(keyFor(courseSlug, lessonSlug), String(percent));
  } catch {
    // Practice remains usable when storage is blocked.
  }
};
