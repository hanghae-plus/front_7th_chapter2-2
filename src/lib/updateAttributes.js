import { addEvent, removeEvent } from "./eventManager";

export function updateAttributes(target, originNewProps = {}, originOldProps = {}) {
  // 최적화: props가 둘 다 비어있으면 아무것도 안 함
  const newKeys = Object.keys(originNewProps);
  const oldKeys = Object.keys(originOldProps);

  if (newKeys.length === 0 && oldKeys.length === 0) {
    return;
  }

  // 1. 이전 속성 제거 (newProps에 없는 것들)
  oldKeys.forEach((key) => {
    // children과 key는 속성이 아니므로 스킵
    if (key === "children" || key === "key") {
      return;
    }
    if (!(key in originNewProps)) {
      // 이벤트 제거
      if (key.startsWith("on")) {
        const eventType = key.slice(2).toLowerCase();
        removeEvent(target, eventType, originOldProps[key]);
        return;
      }

      // className 제거
      if (key === "className") {
        target.removeAttribute("class");
        return;
      }

      // Boolean 속성 제거
      if (key === "checked" || key === "disabled" || key === "selected" || key === "readOnly") {
        target[key] = false;
        return;
      }

      // 그 외 일반 속성
      target.removeAttribute(key);
    }
  });
  // 2. 새 속성 추가/업데이트
  Object.entries(originNewProps).forEach(([key, value]) => {
    // children과 key는 속성이 아니므로 스킵
    if (key === "children" || key === "key") {
      return;
    }

    // 값이 변경되지 않았으면 스킵 (최적화)
    if (originOldProps[key] === value) {
      return;
    }

    // 이벤트 핸들러 업데이트
    if (key.startsWith("on")) {
      const eventType = key.slice(2).toLowerCase();
      // 이전 핸들러 제거
      if (originOldProps[key]) {
        removeEvent(target, eventType, originOldProps[key]);
      }
      // 새 핸들러 추가
      addEvent(target, eventType, value);
      return;
    }

    // className 업데이트
    if (key === "className") {
      target.setAttribute("class", value);
      return;
    }

    // Boolean 속성 업데이트
    if (key === "checked" || key === "disabled" || key === "selected" || key === "readOnly") {
      target[key] = value;
      return;
    }

    // 일반 속성 업데이트
    target.setAttribute(key, value);
  });
}
