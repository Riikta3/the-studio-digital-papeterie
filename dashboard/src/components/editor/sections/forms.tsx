"use client";

import type { EditorSectionId } from "@shared/data/invitation-sections";
import type { ComponentType } from "react";

import { CountdownForm } from "./CountdownForm";
import { DressCodeForm } from "./DressCodeForm";
import { FaqForm } from "./FaqForm";
import { FooterForm } from "./FooterForm";
import { GalleryForm } from "./GalleryForm";
import { GiftListForm } from "./GiftListForm";
import { GuestbookForm } from "./GuestbookForm";
import { HeroForm } from "./HeroForm";
import { IntroVideoForm } from "./IntroVideoForm";
import { MenuForm } from "./MenuForm";
import { PlaylistForm } from "./PlaylistForm";
import { RsvpForm } from "./RsvpForm";
import { StaysForm } from "./StaysForm";
import { TimelineForm } from "./TimelineForm";
import { TransportForm } from "./TransportForm";
import { VenueForm } from "./VenueForm";

/** One form per tab — every section a couple can own. */
export const SECTION_FORMS: Record<EditorSectionId, ComponentType> = {
  hero: HeroForm,
  countdown: CountdownForm,
  "intro-video": IntroVideoForm,
  timeline: TimelineForm,
  "dress-code": DressCodeForm,
  rsvp: RsvpForm,
  map: VenueForm,
  accommodation: StaysForm,
  transport: TransportForm,
  menu: MenuForm,
  gallery: GalleryForm,
  "gift-list": GiftListForm,
  playlist: PlaylistForm,
  guestbook: () => <GuestbookForm moduleId="guestbook" />,
  "video-guestbook": () => <GuestbookForm moduleId="video-guestbook" />,
  faq: FaqForm,
  footer: FooterForm,
};
