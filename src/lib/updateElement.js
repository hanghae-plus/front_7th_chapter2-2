// src/lib/updateElement.js
import { addEvent, removeEvent } from "./eventManager";
import { createElement } from "./createElement.js";
import { normalizeVNode } from "./normalizeVNode.js";

function updateAttributes(target, newProps, oldProps) {
  const newPropsMap = newProps || {};
  const oldPropsMap = oldProps || {};
  const allKeys = new Set([
    ...Object.keys(newPropsMap),
    ...Object.keys(oldPropsMap),
  ]);

  for (const key of allKeys) {
    const newValue = newPropsMap[key];
    const oldValue = oldPropsMap[key];

    if (newValue === oldValue) continue;

    // 제거
    if (newValue === undefined || newValue === null) {
      if (key.startsWith("on") && typeof oldValue === "function") {
        removeEvent(target, key.slice(2).toLowerCase(), oldValue);
      } else if (key === "className") {
        target.removeAttribute("class");
      } else {
        target.removeAttribute(key);
      }
      continue;
    }

    // 추가/업데이트
    if (key.startsWith("on") && typeof newValue === "function") {
      if (typeof oldValue === "function") {
        removeEvent(target, key.slice(2).toLowerCase(), oldValue);
      }
      addEvent(target, key.slice(2).toLowerCase(), newValue);
    } else if (key === "className") {
      target.setAttribute("class", newValue || "");
    } else if (typeof newValue === "boolean") {
      if (newValue) {
        // checked와 selected는 property만 설정
        if (key !== "checked" && key !== "selected") {
          target.setAttribute(key, "");
        }
        target[key] = true;
      } else {
        target.removeAttribute(key);
        target[key] = false;
      }
    }
  }
}

export function updateElement(parentElement, newNode, oldNode, index = 0) {
  const newVNode = normalizeVNode(newNode);
  const oldVNode = normalizeVNode(oldNode);

  // oldNode 없음 → 생성
  if (!oldVNode) {
    const element = createElement(newVNode);
    const existing = parentElement.childNodes[index];
    existing
      ? parentElement.replaceChild(element, existing)
      : parentElement.appendChild(element);
    return;
  }

  // newNode 없음 → 제거
  if (!newVNode) {
    const existing = parentElement.childNodes[index];
    if (existing) parentElement.removeChild(existing);
    return;
  }

  // 텍스트 노드
  if (typeof newVNode === "string" || typeof newVNode === "number") {
    const existing = parentElement.childNodes[index];
    if (existing?.nodeType === Node.TEXT_NODE) {
      if (existing.textContent !== String(newVNode)) {
        existing.textContent = String(newVNode);
      }
    } else {
      const textNode = document.createTextNode(String(newVNode));
      existing
        ? parentElement.replaceChild(textNode, existing)
        : parentElement.appendChild(textNode);
    }
    return;
  }

  // 타입 다름 → 교체
  if (newVNode.type !== oldVNode.type) {
    const element = createElement(newVNode);
    const existing = parentElement.childNodes[index];
    existing
      ? parentElement.replaceChild(element, existing)
      : parentElement.appendChild(element);
    return;
  }

  // 같은 타입 → 업데이트
  const existing = parentElement.childNodes[index];
  updateAttributes(existing, newVNode.props, oldVNode.props);

  // children 업데이트
  const newChildren = newVNode.children || [];
  const oldChildren = oldVNode.children || [];
  const maxLen = Math.max(newChildren.length, oldChildren.length);

  for (let i = maxLen - 1; i >= 0; i--) {
    if (newChildren[i] === undefined) {
      // 새로운 자식이 없으면 제거
      const child = existing.childNodes[i];
      if (child) existing.removeChild(child);
    } else {
      // 새로운 자식이 있으면 업데이트
      updateElement(existing, newChildren[i], oldChildren[i], i);
    }
  }
}
