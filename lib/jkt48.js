function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function key(value) {
  return text(value).toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

