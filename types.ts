export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
  password?: string;
}

export interface Submission {
  id: string;
  participantName: string; // Real name, hidden during voting
  userId: string;
  textContent: string; // text content
  imageUrl?: string; // url to the image
  timestamp: number;
}

export interface Vote {
  userId: string;
  submissionId: string;
  ratings: { [criterionId: string]: number };
}

export interface RatingCriterion {
  id: string;
  label: string;
}

export enum ContestPhase {
  SUBMISSION = 'SUBMISSION',
  VOTING = 'VOTING',
  REVEALED = 'REVEALED',
}

export interface ContestState {
  phase: ContestPhase;
  ratingCriteria: RatingCriterion[];
  challengeTitle: string;
}
