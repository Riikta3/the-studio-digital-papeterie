import { Lines } from "../../text";

/**
 * A title set the designer's way: the first line in the display face, the rest in
 * the italic or script flourish (`<em>`).
 *
 * The catalogue stores a two-line title as two messages and a couple writes it as
 * one value with a line break; both arrive here as one string. A value with no
 * line break stays plain, so a couple who writes a single line gets a single line.
 *
 * `inline` keeps the flourish on the same line, separated by a space, for the
 * titles the designer left to wrap on their own ("Un lieu, notre histoire").
 */
export function TitleLines({ text, inline = false }: { text: string; inline?: boolean }) {
  const [first = "", ...rest] = text.split("\n");
  if (rest.length === 0) return <>{first}</>;

  return (
    <>
      {first}
      {inline ? " " : <br />}
      <em>
        <Lines text={rest.join("\n")} />
      </em>
    </>
  );
}
