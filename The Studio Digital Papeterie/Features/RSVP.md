# Flow RSVP

## Landing
- Formulaire: landing/src/components/invitation/RsvpModule.tsx
- Action: landing/src/actions/submit-rsvp.ts
- Table: rsvp_responses

## Champs rsvp_responses
 wedding_id, name, attendance (bool), guest_count, dietary, message, admin_note, participants (jsonb), respondent_first_name, respondent_last_name, submitted_at

## Dashboard
- Route: dashboard/src/app/[locale]/rsvp-responses/page.tsx
- Composant: RsvpResponsesTable.tsx
- Actions: rsvp-response-actions.ts