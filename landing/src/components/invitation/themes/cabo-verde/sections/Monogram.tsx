/**
 * The footer's monogram, as the designer set it: the two letters large and the
 * separator between them in an `<i>` the stylesheet colours and shrinks. A
 * monogram written without a separator ("PR") is printed whole.
 */
export function Monogram({ text }: { text: string }) {
  const split = /^(.+?)\s*([&·+])\s*(.+)$/.exec(text);
  if (!split) return <div className="monogram">{text}</div>;

  const [, left, separator, right] = split;
  return (
    <div className="monogram">
      {left} <i>{separator}</i> {right}
    </div>
  );
}
