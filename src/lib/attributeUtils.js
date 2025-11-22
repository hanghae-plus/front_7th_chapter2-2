const PROPERTY_ONLY_ATTRIBUTES = new Set(["checked", "selected"]);

export function setAttribute(element, key, value) {
  if (key === "className") {
    element.className = value;
    element.setAttribute("class", value);
    return;
  }

  if (key.startsWith("data-")) {
    element.setAttribute(key, value);
    return;
  }

  if (typeof value === "boolean") {
    if (PROPERTY_ONLY_ATTRIBUTES.has(key)) {
      element[key] = value;
    } else {
      element[key] = value;
      if (value) {
        element.setAttribute(key, "");
      } else {
        element.removeAttribute(key);
      }
    }
    return;
  }

  element.setAttribute(key, value);
  if (key in element) {
    element[key] = value;
  }
}

export function removeAttribute(element, key) {
  if (key === "className") {
    element.className = "";
    element.removeAttribute("class");
    return;
  }

  if (key in element) {
    element[key] = "";
  }
  element.removeAttribute(key);
}

export function updateAttributes(element, newProps, oldProps) {
  const allProps = new Set([
    ...(newProps ? Object.keys(newProps) : []),
    ...(oldProps ? Object.keys(oldProps) : []),
  ]);

  allProps.forEach((key) => {
    if (key.startsWith("on")) return;

    const hasNewValue = newProps && key in newProps;
    const hasOldValue = oldProps && key in oldProps;
    const newValue = hasNewValue ? newProps[key] : undefined;
    const oldValue = hasOldValue ? oldProps[key] : undefined;

    if (!hasNewValue && !hasOldValue) return;
    if (hasNewValue && hasOldValue && newValue === oldValue) return;

    if (!hasNewValue || newValue === null || newValue === undefined) {
      if (hasOldValue) {
        removeAttribute(element, key);
      }
      return;
    }

    setAttribute(element, key, newValue);
  });
}

export function extractEventHandlers(props) {
  const eventHandlers = [];
  if (!props) return eventHandlers;

  Object.keys(props).forEach((key) => {
    if (key.startsWith("on") && typeof props[key] === "function") {
      const eventType = key.slice(2).toLowerCase();
      eventHandlers.push({ eventType, handler: props[key] });
    }
  });

  return eventHandlers;
}
