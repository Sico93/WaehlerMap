/**
 * Betriebsrats-Berechnungen nach BetrVG
 */

/**
 * Calculate Betriebsrat size based on employee count (§9 BetrVG)
 */
export const calculateCouncilSize = (employeeCount: number): number => {
  if (employeeCount < 5) return 0;
  if (employeeCount <= 20) return 1;
  if (employeeCount <= 50) return 3;
  if (employeeCount <= 100) return 5;
  if (employeeCount <= 200) return 7;
  if (employeeCount <= 400) return 9;
  if (employeeCount <= 700) return 11;
  if (employeeCount <= 1000) return 13;
  if (employeeCount <= 1500) return 15;

  // Above 1500: +2 for every additional 500
  const above1500 = employeeCount - 1500;
  const additionalMembers = Math.floor(above1500 / 500) * 2;
  return 15 + additionalMembers;
};

/**
 * Election deadline according to BetrVG and Wahlordnung (WO)
 */
export interface ElectionDeadline {
  date: Date;
  label: string;
  description: string;
  legal: string; // Legal reference
  type: 'milestone' | 'deadline' | 'period-start' | 'period-end';
}

/**
 * Calculate all election deadlines based on election date and posting date
 * @param electionDate Date of the election
 * @param postingDate Date when Wahlausschreiben is posted
 * @returns Array of all relevant deadlines
 */
export const calculateElectionDeadlines = (
  electionDate: Date,
  postingDate: Date
): ElectionDeadline[] => {
  const deadlines: ElectionDeadline[] = [];

  // Helper to add days (negative for past dates)
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // 1. Wahlvorstand bestellen (10 weeks = 70 days before posting)
  deadlines.push({
    date: addDays(postingDate, -70),
    label: 'Wahlvorstand bestellen',
    description: 'Spätestens: Wahlvorstand muss vom Betriebsrat oder per Betriebsversammlung bestellt werden',
    legal: '§16 Abs. 1 BetrVG, §1 WO',
    type: 'milestone'
  });

  // 2. Posting of Wahlausschreiben (reference date)
  deadlines.push({
    date: postingDate,
    label: 'Wahlausschreiben aushängen',
    description: '6 Wochen vor der Wahl: Wahlausschreiben muss ausgehängt werden',
    legal: '§3 Abs. 1 WO',
    type: 'milestone'
  });

  // 3. Wählerliste auslegen (with Wahlausschreiben)
  deadlines.push({
    date: postingDate,
    label: 'Wählerliste auslegen',
    description: 'Gleichzeitig mit Wahlausschreiben: Wählerliste muss zur Einsicht ausliegen',
    legal: '§2 Abs. 4 WO',
    type: 'milestone'
  });

  // 4. Wahlvorschläge einreichen - START (from posting)
  deadlines.push({
    date: postingDate,
    label: 'Wahlvorschläge einreichen (Beginn)',
    description: 'Ab jetzt: Wahlvorschläge können eingereicht werden',
    legal: '§6 Abs. 1 WO',
    type: 'period-start'
  });

  // 5. Wahlvorschläge einreichen - END (2 weeks = 14 days before election)
  deadlines.push({
    date: addDays(electionDate, -14),
    label: 'Wahlvorschläge einreichen (Ende)',
    description: 'Spätestens: Wahlvorschläge müssen beim Wahlvorstand eingereicht sein',
    legal: '§6 Abs. 1 WO',
    type: 'deadline'
  });

  // 6. Wahlvorschläge bekannt machen (1 week = 7 days before election)
  deadlines.push({
    date: addDays(electionDate, -7),
    label: 'Wahlvorschläge bekannt machen',
    description: 'Spätestens 1 Woche vor der Wahl: Wahlvorschläge müssen ausgehängt werden',
    legal: '§7 Abs. 2 WO',
    type: 'deadline'
  });

  // 7. Einsprüche gegen Wählerliste (3 days before election)
  deadlines.push({
    date: addDays(electionDate, -3),
    label: 'Einsprüche gegen Wählerliste',
    description: 'Bis spätestens: Einsprüche gegen die Wählerliste müssen eingereicht sein',
    legal: '§4 Abs. 1 WO',
    type: 'deadline'
  });

  // 8. Briefwahl beantragen (3 days before election)
  deadlines.push({
    date: addDays(electionDate, -3),
    label: 'Briefwahl beantragen',
    description: 'Bis spätestens: Wahlberechtigte können Briefwahl beantragen',
    legal: '§24 Abs. 1 WO',
    type: 'deadline'
  });

  // 9. Election Date
  deadlines.push({
    date: electionDate,
    label: 'Wahltag',
    description: 'Durchführung der Betriebsratswahl',
    legal: '§14 BetrVG',
    type: 'milestone'
  });

  // 10. Auszählung und Bekanntgabe (same day)
  deadlines.push({
    date: electionDate,
    label: 'Auszählung und Bekanntgabe',
    description: 'Unmittelbar nach Wahlschluss: Stimmen auszählen und Ergebnis bekannt geben',
    legal: '§15 WO',
    type: 'milestone'
  });

  // 11. Wahlniederschrift (within 3 days)
  deadlines.push({
    date: addDays(electionDate, 3),
    label: 'Wahlniederschrift',
    description: 'Bis spätestens: Wahlniederschrift muss erstellt und ausgehängt werden',
    legal: '§16 WO',
    type: 'deadline'
  });

  // 12. Einsprüche gegen Wahlergebnis (within 2 weeks = 14 days)
  deadlines.push({
    date: addDays(electionDate, 14),
    label: 'Einsprüche gegen Wahlergebnis',
    description: 'Bis spätestens: Anfechtung der Wahl beim Arbeitsgericht möglich',
    legal: '§19 Abs. 2 BetrVG',
    type: 'deadline'
  });

  // 13. Erste Sitzung des neuen BR (within 1 week = 7 days)
  deadlines.push({
    date: addDays(electionDate, 7),
    label: 'Konstituierende Sitzung',
    description: 'Bis spätestens: Erste Sitzung des neuen Betriebsrats (Wahl des Vorsitzenden)',
    legal: '§26 Abs. 1 BetrVG',
    type: 'deadline'
  });

  // Sort by date
  return deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Format date as German locale string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if posting date is valid (6 weeks before election)
 */
export const isValidPostingDate = (electionDate: Date, postingDate: Date): boolean => {
  const daysDiff = daysBetween(postingDate, electionDate);
  // Should be 42 days (6 weeks), but allow some tolerance
  return daysDiff >= 41 && daysDiff <= 43;
};
