/**
 * The database rows a couple's invitation is built from.
 *
 * This is the wire format between the dashboard's editor and the landing's
 * preview. The editor posts the couple's draft in exactly the shape the public
 * invitation route reads from Supabase, and the preview runs it through the
 * same `assembleInvitationPage()` → `toInvitationData()` chain as that route.
 * What the couple previews is therefore what their guests will get, by
 * construction rather than by keeping two renderers in step.
 *
 * Snake_case because these ARE the rows: each field is a column, named as the
 * column is. Anything the public route does not read (disabled events,
 * unpublished questions) is left out by whoever builds the value.
 */
export type InvitationRows = {
  /** `resolve_public_slug`: the site and its per-wedding settings. */
  site: {
    theme_id: string | null;
    modules: string[] | null;
    adults_only: boolean | null;
    languages: string[] | null;
    hero_kicker: string | null;
    announcement: string | null;
    closing_words: string | null;
    couple_photo_url: string | null;
    /** jsonb — narrowed by `normaliseTexts` on read. */
    invitation_texts: unknown;
  };

  /** `get_couple_display_names`. */
  names: { first_name: string | null; partner_name: string | null } | null;

  /** `public_wedding_events`: enabled events only, in display order. */
  events: Array<{
    id: string;
    key: string;
    name: string;
    date: string | null;
    time: string | null;
    address: string | null;
    description: string | null;
    dress_code: string | null;
    position: number | null;
  }>;

  schedule: Array<{
    id: string;
    event_id: string;
    time: string;
    title: string;
    description: string | null;
    position: number | null;
    icon: string | null;
    image_url: string | null;
  }>;

  venue: {
    name: string;
    address: string | null;
    city: string | null;
    maps_url: string | null;
    waze_url: string | null;
    parking_info: string | null;
    access_info: string | null;
    transport_info: string | null;
    photo_url: string | null;
  } | null;

  accommodations: Array<{
    id: string;
    name: string;
    city: string | null;
    distance: string | null;
    phone: string | null;
    booking_url: string | null;
    offer: string | null;
    photo_url: string | null;
    address: string | null;
    secondary: boolean | null;
  }>;

  /** Published questions only. */
  faq: Array<{
    id: string;
    question: string;
    answer: string;
    position: number | null;
  }>;

  /** `public_module_configs`. */
  moduleConfigs: Array<{
    module_id: string;
    position: number | null;
    config: unknown;
  }>;
};
