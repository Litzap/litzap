// Ask the server to top up `address` with sponsored gas. Throws with a
// user-facing message when it can't — callers show it instead of letting the
// next on-chain write fail with an opaque "insufficient funds".
export async function sponsorGas(address: string, getAccessToken: () => Promise<string | null>) {
  const token = await getAccessToken();
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ address }),
  });
  if (res.ok) return;
  const { error } = await res.json().catch(() => ({ error: undefined }));
  throw new Error(error || "Couldn't top up gas — try again in a moment.");
}
