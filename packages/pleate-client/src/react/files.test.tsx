import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { BASE, createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { fileKey, useUpload } from "./files.ts";

const { db, server } = createTestBackend();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => db.reset());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const makeFile = (name: string, text = "Plate menu draft") => new File([text], name, { type: "text/plain", lastModified: 1 });

describe("useUpload", () => {
  it("uploads picked files with progress, then exposes the stored file", async () => {
    expect(typeof XMLHttpRequest).toBe("function");
    const { Wrapper } = wrapper();
    const onUploaded = vi.fn();
    const progress: number[] = [];
    const { result } = renderHook(
      () => {
        const upload = useUpload({ purpose: "attachment", onUploaded });
        const state = Object.values(upload.uploads)[0];
        if (state?.status === "uploading" && state.progress !== undefined) progress.push(state.progress);
        return upload;
      },
      { wrapper: Wrapper },
    );
    const file = makeFile("menu.txt");
    act(() => result.current.fileUploadProps.onValueChange([file]));
    expect(result.current.files).toEqual([file]);
    expect(result.current.uploads[fileKey(file)]).toEqual({ status: "uploading", progress: 0 });
    expect(result.current.busy).toBe(true);
    await waitFor(() => expect(result.current.uploads[fileKey(file)]?.status).toBe("done"));
    expect(result.current.uploads[fileKey(file)]).toEqual({ status: "done", progress: 1 });
    expect(result.current.busy).toBe(false);
    expect(progress[0]).toBe(0);
    expect(progress.every((p, i) => i === 0 || p >= progress[i - 1])).toBe(true);
    expect(result.current.uploaded).toHaveLength(1);
    expect(result.current.uploaded[0]).toMatchObject({ name: "menu.txt", purpose: "attachment", size: 16 });
    expect(onUploaded).toHaveBeenCalledWith(result.current.uploaded[0]);
    expect(db.files.some((f) => f.id === result.current.uploaded[0].id)).toBe(true);
    expect(result.current.fileUploadProps).toMatchObject({ value: [file], uploads: result.current.uploads });
  });

  it("does not upload the same file twice", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useUpload(), { wrapper: Wrapper });
    const file = makeFile("a.txt");
    act(() => result.current.add([file]));
    act(() => result.current.add([file]));
    await waitFor(() => expect(result.current.uploaded).toHaveLength(1));
    expect(result.current.files).toHaveLength(1);
    expect(db.files.filter((f) => f.name === "a.txt")).toHaveLength(1);
  });

  it("uploads once under StrictMode (state updaters run twice there)", async () => {
    const { Wrapper } = wrapper();
    const posts = vi.fn();
    server.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/files")) posts();
    });
    const { result } = renderHook(() => useUpload(), {
      wrapper: ({ children }) => (
        <StrictMode>
          <Wrapper>{children}</Wrapper>
        </StrictMode>
      ),
    });
    act(() => result.current.add([makeFile("strict.txt")]));
    await waitFor(() => expect(result.current.uploaded).toHaveLength(1));
    expect(posts).toHaveBeenCalledTimes(1);
    expect(db.files.filter((f) => f.name === "strict.txt")).toHaveLength(1);
    server.events.removeAllListeners();
  });

  it("marks failed uploads with the backend message and retries them", async () => {
    server.use(
      http.post(`${BASE}/files`, () =>
        HttpResponse.json(
          { error: { status: 415, code: "file_type_not_allowed", message: "This type of file is not allowed." } },
          { status: 415 },
        ),
      ),
    );
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useUpload(), { wrapper: Wrapper });
    const file = makeFile("virus.exe");
    act(() => result.current.add([file]));
    await waitFor(() => expect(result.current.uploads[fileKey(file)]?.status).toBe("error"));
    expect(result.current.uploads[fileKey(file)]).toEqual({ status: "error", error: "This type of file is not allowed." });
    expect(result.current.uploaded).toEqual([]);
    server.resetHandlers();
    act(() => result.current.fileUploadProps.onRetry(file));
    await waitFor(() => expect(result.current.uploads[fileKey(file)]?.status).toBe("done"));
    expect(result.current.uploaded).toHaveLength(1);
  });

  it("removes a file and deletes it on the server", async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useUpload(), { wrapper: Wrapper });
    const keep = makeFile("keep.txt");
    const drop = makeFile("drop.txt", "something else");
    act(() => result.current.add([keep, drop]));
    await waitFor(() => expect(result.current.uploaded).toHaveLength(2));
    const dropped = result.current.uploaded.find((f) => f.name === "drop.txt")!;
    act(() => result.current.fileUploadProps.onValueChange([keep]));
    expect(result.current.files).toEqual([keep]);
    expect(result.current.uploads[fileKey(drop)]).toBeUndefined();
    expect(result.current.uploaded.map((f) => f.name)).toEqual(["keep.txt"]);
    await waitFor(() => expect(db.files.some((f) => f.id === dropped.id)).toBe(false));
    act(() => result.current.clear());
    expect(result.current.files).toEqual([]);
    expect(result.current.uploads).toEqual({});
  });
});
