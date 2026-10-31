import { C, Callout, Code, Endpoints, Errors, H2, P, Table } from "@/components/backend/prose";

export default function Search() {
  return (
    <>
      <P>
        <C>pleate_backend.search</C> looks for a few characters in the titles of the signed in user&apos;s own files,
        conversations and notifications, and answers rows ready for a command palette.
      </P>

      <H2>Endpoint</H2>
      <Endpoints
        rows={[
          ["GET", "/search?q=&types=&limit=", <>Signed in, session or API key. <C>{"[{type, id, title, subtitle, url}]"}</C>.</>],
        ]}
      />
      <Table
        head={["Parameter", "Meaning"]}
        rows={[
          ["q", "2 to 100 characters, case insensitive, anywhere in the title. Taken literally, never as a pattern."],
          ["types", <>Comma separated subset of <C>files,conversations,notifications</C>. Default: every installed one.</>],
          ["limit", "1 to 10 results per type. Default 5."],
        ]}
      />
      <Code lang="json" title="GET /api/search?q=menu">{`
[
  { "type": "files", "id": "6720c9a1b2c3d4e5f6a7b8c9", "title": "spring-menu.pdf", "subtitle": "application/pdf", "url": "/files/6720c9a1b2c3d4e5f6a7b8c9" },
  { "type": "conversations", "id": "6720c9a1b2c3d4e5f6a7b8d0", "title": "Menu ideas", "subtitle": null, "url": "/chat/6720c9a1b2c3d4e5f6a7b8d0" }
]
`}</Code>
      <P>
        Results are grouped by type, newest first. <C>url</C> comes from <C>{`FRONTEND_PATHS["FILE"]`}</C> and{" "}
        <C>{`["CONVERSATION"]`}</C>; a notification keeps its own link when it is a path or an http(s) URL, else it points
        to <C>{`FRONTEND_PATHS["NOTIFICATIONS"]`}</C>.
      </P>
      <Callout>
        Every query filters on the owner first: a user never sees another user&apos;s rows. The default user throttle applies.
      </Callout>

      <H2>From React</H2>
      <Code lang="tsx">{`
import { useSearch } from "pleate-client/react";

const [query, setQuery] = useState("");
const { results } = useSearch(useDeferredValue(query), { types: ["files", "conversations"] });
`}</Code>

      <H2>Error codes</H2>
      <Errors rows={[["validation_error", "400", <>Field codes on <C>q</C> (<C>min_length</C>, <C>max_length</C>), <C>types</C> (<C>invalid_type</C>) and <C>limit</C>.</>]]} />
    </>
  );
}
