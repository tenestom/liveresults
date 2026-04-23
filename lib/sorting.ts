export type Discipline = 'jump' | 'trick' | 'slalom';

export interface SlalomResult {
  speed: number;
  line: number;
  buoys: number;
}

export type ResultValue = number | SlalomResult;

export interface Athlete {
  id: string;
  name: string;
  club: string;
  class: string;
  discipline: Discipline;
  result_1: any;
  result_2: any;
}

// Slalom comparison: Higher speed, then lower line, then higher buoys
export const compareSlalom = (a: SlalomResult, b: SlalomResult): number => {
  if (!a || !b) return 0;
  if (a.speed !== b.speed) return b.speed - a.speed; // Higher is better
  if (a.line !== b.line) return a.line - b.line; // Lower is better (shorter rope)
  return b.buoys - a.buoys; // Higher is better
};

export const getBestResult = (discipline: Discipline, r1: any, r2: any): any => {
  if (discipline === 'slalom') {
    const res1 = r1 as SlalomResult;
    const res2 = r2 as SlalomResult;
    if (!res1.speed && !res2.speed) return res1;
    if (!res1.speed) return res2;
    if (!res2.speed) return res1;
    return compareSlalom(res1, res2) <= 0 ? res1 : res2;
  }
  // Jump/Trick: Higher is better
  const v1 = Number(r1?.value || 0);
  const v2 = Number(r2?.value || 0);
  return v1 > v2 ? r1 : r2;
};

export const sortAthletes = (athletes: Athlete[]): Athlete[] => {
  return [...athletes].sort((a, b) => {
    // Sort by Class first
    if (a.class !== b.class) return a.class.localeCompare(b.class);
    
    // Then by Discipline
    if (a.discipline !== b.discipline) return a.discipline.localeCompare(b.discipline);

    // Then by Best Result
    const bestA = getBestResult(a.discipline, a.result_1, a.result_2);
    const bestB = getBestResult(b.discipline, b.result_1, b.result_2);

    if (a.discipline === 'slalom') {
       return compareSlalom(bestA as SlalomResult, bestB as SlalomResult);
    }
    
    const valA = Number(bestA?.value || 0);
    const valB = Number(bestB?.value || 0);
    return valB - valA; // Higher is better
  });
};
