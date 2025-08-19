export const generateRandomSequence = (length: number = 5): number[] => {
  return Array.from({ length }, () => {
    const value = Math.floor(Math.random() * 20) + 1;
    return Math.random() < 0.5 ? value : -value;
  });
};

export const calculateSum = (numbers: number[]): number => {
  return numbers.reduce((sum, num) => sum + num, 0);
};

export const formatNumber = (num: number): string => {
  return num > 0 ? `+${num}` : num.toString();
};