function makeRequestParts(parts) {
  if (parts.tag) {
    return parts.tag;
  }
  if (parts.id) {
    return `#${parts.id}`;
  }
  if (parts.class) {
    return parts.class;
  }
  return parts;
}

exports.module = {
  makeRequestParts,
};
