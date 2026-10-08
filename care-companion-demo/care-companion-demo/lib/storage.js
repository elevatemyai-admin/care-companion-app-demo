import { buildSeed } from "./demoData";

// Demo storage: nothing is sent to a server or saved anywhere.
// Sample data loads fresh every time the page is opened.
let store = null;

function getStore() {
  if (!store) store = buildSeed();
  return store;
}

export async function loadKey(key, fallback) {
  const value = getStore()[key];
  return value === undefined ? fallback : value;
}

export async function saveKey(key, value) {
  getStore()[key] = value;
  return true;
}
