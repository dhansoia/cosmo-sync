/**
 * Shared types for the onboarding wizard.
 */

export interface GeoResult {
  id:    number;
  label: string;
  lat:   number;
  lng:   number;
}

export interface OnboardingFormState {
  /** "YYYY-MM-DD" */
  birthDate: string;
  /** "HH:MM" 24-hour, or empty string if unknown */
  birthTime: string;
  isTimeApproximate: boolean;
  latitude:  number | null;
  longitude: number | null;
  /** Human-readable label shown in the confirmation step */
  cityLabel: string;
}

export const INITIAL_FORM: OnboardingFormState = {
  birthDate:         '',
  birthTime:         '',
  isTimeApproximate: false,
  latitude:          null,
  longitude:         null,
  cityLabel:         '',
};
