import type { InvitationData } from "../../types";

import { Page } from "./Page";
import { ProgramIcon } from "./ProgramIcon";

/** Day-1 timeline. */
export function ProgrammeSection({
  data,
  side,
}: {
  data: InvitationData;
  side: "left" | "right";
}) {
  const dayOne = (data.schedule ?? []).filter((entry) => entry.day === 1);
  if (dayOne.length === 0) return null;

  return (
    <Page className="soft-floral-paper programme-page" side={side}>
      <p className="script">Le programme</p>
      <h2>
        Une journée
        <br />
        inoubliable
      </h2>
      <div className="timeline">
        {dayOne.map((entry) => (
          <div className="event" key={`${entry.time}-${entry.title}`}>
            <span className="event-icon">
              <ProgramIcon type={entry.icon} />
            </span>
            <time>{entry.time}</time>
            <h3>{entry.title}</h3>
          </div>
        ))}
      </div>
    </Page>
  );
}
