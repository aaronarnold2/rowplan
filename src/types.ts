export type Intensity = 'UT2' | 'UT1' | 'AT' | 'TR' | 'AN';

export interface TrainingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  distribution: Record<Intensity, number>;
}

export interface WorkoutPlan {
  periods: TrainingPeriod[];
}

export interface GeneratedWorkout {
  date: string;
  intensity: Intensity;
  description: string;
  durationMinutes: number;
}
