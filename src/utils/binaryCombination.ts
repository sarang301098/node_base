// https://stackoverflow.com/a/26610870
export const combinations = (n: string[]): string[] => {
  const combinations = [];
  for (let i = 0; i < 1 << n.length; i++) {
    const currentCombinations = [];
    for (let j = 0; j < n.length; j++) {
      currentCombinations.push(i & (1 << j) ? `${n[j]}=true` : `${n[j]}=false`);
    }
    combinations.push(currentCombinations.join(':'));
  }
  return combinations;
};
