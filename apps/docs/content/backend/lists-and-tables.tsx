import { readFileSync } from "node:fs";
import path from "node:path";
import { C, Callout, Code, H2, H3, LI, P, Table, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import ProductsDemo from "@/demos/backend/products";

// The real files of the example project, read at build time.
const demoFile = (file: string) =>
  readFileSync(path.join(process.cwd(), "..", "backend-demo", "demo", "catalog", file), "utf8").trim();

export default function ListsAndTables() {
  return (
    <>
      <P>
        Most screens of an app are lists. pleate-backend makes every list endpoint speak the same query language, and{" "}
        <C>useList</C> turns that language into the props of <C>DataTable</C>, <C>Table</C>, <C>SearchBar</C> and{" "}
        <C>Pagination</C>. Adding a resource of your own takes a model, a plain DRF ViewSet and a route.
      </P>

      <LiveDemo
        file="products"
        title="Products, server side"
        description="Search, sort by a column, filter by status or low stock, change page: each change is one request to /api/catalog/products."
        signIn
        hint={<>120 products in the mock catalog</>}
      >
        <ProductsDemo />
      </LiveDemo>

      <H2>The backend</H2>
      <P>
        This is the <C>catalog</C> app of <C>apps/backend-demo</C>, unchanged. The model extends <C>TimestampedModel</C>{" "}
        (ObjectId key, <C>created_at</C>, <C>updated_at</C>):
      </P>
      <Code lang="python" title="demo/catalog/models.py">{demoFile("models.py")}</Code>
      <P>
        The view only declares what is allowed. Pagination (<C>PagePagination</C>), <C>search</C>, <C>ordering</C> and
        field filters come from the defaults in <C>REST_FRAMEWORK</C>; reads need a session or key, writes need{" "}
        <C>catalog.change_product</C>.
      </P>
      <Code lang="python" title="demo/catalog/views.py">{demoFile("views.py")}</Code>
      <Code lang="python" title="demo/catalog/urls.py">{demoFile("urls.py")}</Code>
      <Code lang="python" title="demo/urls.py">{`
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("pleate_backend.urls")),
    path("api/catalog/", include("demo.catalog.urls")),
]
`}</Code>
      <P>The resulting API:</P>
      <Table
        head={["Request", "Effect"]}
        mono={[0]}
        rows={[
          ["GET /api/catalog/products", "First 20 products, newest first."],
          ["?search=oat", "name, sku or category contains oat."],
          ["?ordering=-price,name", "Most expensive first, then by name."],
          ["?status=active&category=Pantry", "Exact filters from the FilterSet Meta."],
          ["?min_price=5&max_price=20", "Range filters declared on the FilterSet."],
          ["?low_stock=true", "A method filter: stock below 10."],
          ["?ordering=sku", <>400 <C>invalid_ordering</C>: sku is not in ordering_fields.</>],
        ]}
      />

      <H2>The frontend</H2>
      <P>
        <C>useList(path, options)</C> keeps page, page size, search, ordering and filters in state, fetches with TanStack
        Query (the previous page stays on screen while the next loads) and returns ready made props:
      </P>
      <Table
        head={["Returned", "For"]}
        mono={[0]}
        rows={[
          ["tableProps", "<DataTable>: rows, loading, sort, search, page, pageCount, total, pageSize and their handlers."],
          ["paginationProps", "<Pagination>"],
          ["searchProps", "<SearchBar>, debounced by searchDebounceMs (300 ms)."],
          ["sortProps(key)", "A sortable <TableHead> of the plain Table."],
          ["rows, total, page, pageCount, filters, params", "The current state, to render anything else."],
          ["setPage, setPageSize, setSearch, setSort, setFilter", "Change the query from your own controls. All but setPage go back to page 1."],
        ]}
      />
      <H3>Options</H3>
      <Table
        head={["Option", "Default", "Meaning"]}
        mono={[0, 1]}
        rows={[
          ["pageSize", "20", "Items per page."],
          ["ordering", "none", <>Initial ordering, e.g. <C>-created_at</C>.</>],
          ["filters", "{}", "Initial filters."],
          ["syncUrl", "false", "Mirror page, search, ordering and filters in the address bar, so a list survives reload and can be shared."],
          ["searchDebounceMs", "300", "Debounce of searchProps (DataTable debounces on its own)."],
          ["enabled", "true", "Hold the request, e.g. until a parent id is known."],
        ]}
      />
      <P>
        The first argument can also be a function <C>{"(params) => Promise<Page<T>>"}</C> when the endpoint needs extra
        parameters; <C>useConversations</C> is built this way.
      </P>
      <Code lang="tsx" title="With Table, SearchBar and Pagination">{`
const list = useList<Product>("/catalog/products", { syncUrl: true });

<SearchBar {...list.searchProps} placeholder="Search products" />
<Table>
  <TableHeader>
    <TableRow>
      <TableHead {...list.sortProps("name")}>Name</TableHead>
      <TableHead {...list.sortProps("price")}>Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {list.rows.map((p) => (
      <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{p.price}</TableCell></TableRow>
    ))}
  </TableBody>
</Table>
<Pagination {...list.paginationProps} />
`}</Code>

      <H2>Feeds</H2>
      <P>
        For lists that grow at the top (notifications, activity, chat), use <C>CursorPagination</C> on the view and{" "}
        <C>useCursorList</C> on the client. It returns TanStack&apos;s infinite query plus <C>items</C>, the pages
        flattened:
      </P>
      <Code lang="python">{`
from pleate_backend.core.pagination import CursorPagination

class OrderFeed(generics.ListAPIView):
    pagination_class = CursorPagination        # newest first by created_at
    serializer_class = OrderSerializer
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
`}</Code>
      <Code lang="tsx">{`
const client = usePleateClient();
const feed = useCursorList(["orders"], (p) => client.http.get<CursorPage<Order>>("/orders", p), { pageSize: 30 });

<List>{feed.items.map((o) => <ListItem key={o.id}>{o.number}</ListItem>)}</List>
{feed.hasNextPage && <Button onClick={() => feed.fetchNextPage()}>Load more</Button>}
`}</Code>

      <H2>Good practice</H2>
      <UL>
        <LI>Index what you filter and sort on (<C>db_index=True</C>), as the catalog does for <C>category</C> and <C>status</C>.</LI>
        <LI>Expose ids as strings: <C>id = serializers.CharField(read_only=True)</C>.</LI>
        <LI>Scope querysets to the user in <C>get_queryset</C> for private data; a foreign object should be a 404, not a 403.</LI>
        <LI>Keep list serializers flat and use <C>select_related</C>; there is no <C>prefetch_related</C> on MongoDB.</LI>
        <LI>Annotate with <C>extend_schema</C> so generated types stay precise.</LI>
      </UL>
      <Callout tone="tip">
        The mock behind the demo implements the same parameters as the ViewSet, so the code in the Code tab works unchanged
        against the real Django project.
      </Callout>
    </>
  );
}
