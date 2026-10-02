/**
 * A section title as the designer sets it: `h2.motion-title` — the class his
 * script added to every `.section h2` — with the first line in the ink colour and
 * the rest, after a break, in the italic accent (`<em>`). A one-line title is
 * just the line.
 *
 * `text` may hold line breaks (a catalogue default is two messages joined by
 * one; a couple's rewrite is a single value that may contain one).
 */
export function Title({ text }: { text: string }) {
  const { first, rest } = twoLines(text);
  return (
    <h2 className="motion-title">
      {first}
      {rest ? (
        <>
          <br />
          <em>{rest}</em>
        </>
      ) : null}
    </h2>
  );
}

/** A title on two lines: the first, and everything after it as one. */
export function twoLines(text: string): { first: string; rest: string } {
  const [first = "", ...others] = text.split("\n");
  return { first: first.trim(), rest: others.join(" ").trim() };
}
