import { DomEffect } from "./types";
import { updateDomProps, insertInstance, removeInstance } from "./dom";

export const commitMutations = (mutations: DomEffect[]) => {
  for (const mutation of mutations) {
    switch (mutation.type) {
      case "INSERT":
        insertInstance(mutation.parentDOM, mutation.instance, mutation.anchor);
        break;
      case "REMOVE":
        removeInstance(mutation.parentDOM, mutation.instance);
        break;
      case "UPDATE_PROPS":
        updateDomProps(mutation.dom, mutation.prevProps, mutation.nextProps);
        break;
      case "UPDATE_TEXT":
        mutation.dom.nodeValue = mutation.nextText;
        break;
    }
  }
};
