export const PARTICIPANT_NAME_MIN = 2;
export const PARTICIPANT_NAME_MAX = 40;

export function participantNameIsValid(value) {
  const length = String(value ?? "").trim().length;
  return length >= PARTICIPANT_NAME_MIN && length <= PARTICIPANT_NAME_MAX;
}
