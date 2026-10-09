import type { Action, Store } from "./model";
export class ConnectionError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function response(res: Response): Promise<Store> {
  const result = await res.json();
  if (!res.ok)
    throw new ConnectionError(
      res.status,
      result.error ?? "The workspace could not be loaded.",
    );
  return result.workspace;
}
export const readWorkspace = () =>
  fetch("/api/workspace", { cache: "no-store" }).then(response);
export const enrollCommittee = () =>
  fetch("/api/committee/enroll", { method: "POST" }).then(response);
export async function updateWorkspace(action: Action) {
  if (action.type === "evidence") {
    const form = new FormData();
    const encoded = action.evidence.data.split(",")[1];
    if (!encoded) throw new Error("Choose a new photo to upload.");
    const binary = atob(encoded),
      bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    form.set("claimId", action.claimId);
    form.set("phase", action.phase);
    form.set(
      "photo",
      new Blob([bytes], { type: "image/jpeg" }),
      action.evidence.name.replace(/\.[^.]+$/, "") + ".jpg",
    );
    return fetch("/api/evidence", { method: "POST", body: form }).then(
      response,
    );
  }
  return fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  }).then(response);
}
export async function signOut() {
  const res = await fetch("/api/auth/signout", { method: "POST" });
  if (!res.ok) throw new Error("Sign-out could not finish. Please try again.");
  window.location.assign("/");
}
