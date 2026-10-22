export const TITLE_MAX = 40;
export const BODY_MIN = 20;
export const BODY_MAX = 1000;

// Characters a phone keyboard can't type back (or types differently), mapped
// to what the user would actually type. Pasted text is full of these.
const REPLACEMENTS: [RegExp, string][] = [
  [/\r\n?/g, "\n"],
  [/\t/g, "  "],
  [/[“”]/g, '"'], // “ ”
  [/[‘’]/g, "'"], // ‘ ’
  [/[–—]/g, "-"], // – —
  [/…/g, "..."], // …
  [/ /g, " "], // non-breaking space
];

// Makes a body typeable. Also used on load, so older rows get the same treatment.
export function normalizeText(body: string): string {
  let text = body;
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  // Leading or trailing whitespace would be invisible characters to type.
  return text.trim();
}

export type TextErrors = { title?: string; body?: string };

// Returns an error message per invalid field; an empty object means valid.
export function validateText({
  title,
  body,
}: {
  title: string;
  body: string;
}): TextErrors {
  const errors: TextErrors = {};

  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) errors.title = "Add a title";
  else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = `At most ${TITLE_MAX} characters`;
  }

  const normalizedBody = normalizeText(body);
  if (normalizedBody.length < BODY_MIN) {
    errors.body = `At least ${BODY_MIN} characters`;
  } else if (normalizedBody.length > BODY_MAX) {
    errors.body = `At most ${BODY_MAX} characters`;
  }

  return errors;
}
