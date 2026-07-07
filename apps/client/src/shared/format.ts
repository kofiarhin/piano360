export const formatCategory = (value: string) => value.replace(/-/g, " ");

export const percent = (completed: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};
