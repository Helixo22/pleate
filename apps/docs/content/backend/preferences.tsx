import { C, Code, Endpoints, Errors, H2, LI, P, Settings, UL } from "@/components/backend/prose";

export default function Preferences() {
  return (
    <>
      <P>
        <C>/api/auth/me/preferences</C> keeps the UI choices of the signed in user on the account, so the theme, the
        palette and the bottom bar follow them to every device. The values are stored in <C>User.preferences</C>, next to
        any free form keys a project writes through <C>PATCH /auth/me</C>.
      </P>

      <H2>Endpoints</H2>
      <Endpoints
        rows={[
          ["GET", "/auth/me/preferences", <>Every key, with defaults for the ones never set. Works with an API key.</>],
          ["PATCH", "/auth/me/preferences", <>Partial: only the keys sent change. Needs a session (<C>api_key_not_allowed</C> with a key).</>],
        ]}
      />
      <Code lang="json" title="GET /api/auth/me/preferences">{`
{
  "theme": "dark",
  "palette": "#0d9488",
  "motion": "system",
  "bottom_bar": ["home", "files", "chat", "settings/profile"]
}
`}</Code>

      <H2>Validation</H2>
      <UL>
        <LI><C>theme</C>: <C>light</C>, <C>dark</C> or <C>system</C> (default).</LI>
        <LI><C>palette</C>: a name from <C>{`PLEATE["PREFERENCES"]["PALETTES"]`}</C> (the pleate presets), a <C>#rrggbb</C> color (stored lower case) or <C>null</C> for the site default.</LI>
        <LI><C>motion</C>: <C>system</C> (default) or <C>off</C>.</LI>
        <LI><C>bottom_bar</C>: up to 4 unique nav ids in order, each 1 to 64 characters of <C>a-z 0-9 - _ /</C>.</LI>
        <LI>Any other key is refused, so the object stays small.</LI>
      </UL>

      <H2>From React</H2>
      <Code lang="tsx">{`
import { usePreferences } from "pleate-client/react";

const { preferences, update } = usePreferences();
update.mutate({ theme: "dark" });          // optimistic, rolled back if the server refuses
`}</Code>

      <H2>Settings</H2>
      <Settings rows={[["PREFERENCES.PALETTES", "the 11 pleate presets", "Palette names a user may pick. Add the ones your own CSS defines."]]} />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["validation_error", "400", <>Field codes: <C>invalid_choice</C>, <C>invalid_palette</C>, <C>max_length</C>, <C>invalid</C>, <C>duplicate_item</C>, <C>unknown_field</C>.</>],
          ["api_key_not_allowed", "403", "PATCH with an API key."],
        ]}
      />
    </>
  );
}
