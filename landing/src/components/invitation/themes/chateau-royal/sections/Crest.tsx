import { splitMonogram } from "../monogram-parts";

/**
 * A monogram set the designer's way: the two halves in the display face and the
 * separator in the script face between them. A monogram with no separator is
 * printed whole. The crest is a circle with `white-space: nowrap`, so a longer
 * monogram ("MC · JB") is flagged with `data-long` and set smaller by the
 * stylesheet.
 */
export function Crest({ text }: { text: string }) {
  const parts = splitMonogram(text);

  return (
    <strong data-long={text.length > 5 ? "" : undefined}>
      {parts ? (
        <>
          {parts.left} <i>{parts.separator}</i> {parts.right}
        </>
      ) : (
        text
      )}
    </strong>
  );
}
