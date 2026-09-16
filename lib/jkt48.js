function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function key(value) {
  return text(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const WAITING_ROOM_COOKIE_NAME = "__cfwaitingroom_q7VnL4xM2pK8dR5sT1wY9cB6hJ3uF0zA7eG2mN5Q8";

export function buildJkt48Cookie(value) {
  const input = text(value);
  if (!input) return "";
  const separator = input.indexOf("=");
  const hasCookieName = input.startsWith("__cfwaitingroom") && separator > 0;
  const name = hasCookieName ? input.slice(0, separator) : WAITING_ROOM_COOKIE_NAME;
  const cookieValue = hasCookieName ? input.slice(separator + 1) : input;
  if (!cookieValue || /[\r\n;]/.test(`${name}${cookieValue}`)) throw new Error("Cookie Waiting Room tidak valid.");
  return `${name}=${cookieValue}`;
}

export function jkt48RequestHeaders(cookie = "") {
  return {
    Accept: "application/json",
    Referer: "https://jkt48.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

export function parseBonusPayload(payload) {
  if (!payload || !Array.isArray(payload.data)) throw new Error("Format API JKT48 tidak dikenali.");

  const slots = new Map();
  for (const session of payload.data) {
    const sessionLabel = text(session?.label);
    if (!sessionLabel || !Array.isArray(session?.session_members)) continue;

    for (const member of session.session_members) {
      const memberName = text(member?.member_name);
      if (!memberName) continue;
      const laneLabel = text(member?.label);
      const sourceKey = text(member?.id ?? member?.member_id) || `${key(sessionLabel)}:${key(memberName)}`;
      slots.set(sourceKey, {
        source_key: sourceKey,
        session_label: sessionLabel,
        member_name: memberName,
        lane_label: laneLabel || null,
      });
    }
  }
  return [...slots.values()];
}
