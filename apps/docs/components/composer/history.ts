// Undo / redo for the composer: a capped past/present/future stack. Edits with the same `merge` key in a row (typing
// in one field) collapse into one step, so undo goes back a word, not a keystroke.

export const HISTORY_LIMIT = 100;

export type History<T> = { past: T[]; present: T; future: T[]; mergeKey: string | null };

export type HistoryAction<T> =
  | { type: "set"; value: T; merge?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; value: T };

export const initHistory = <T>(value: T): History<T> => ({ past: [], present: value, future: [], mergeKey: null });

export function historyReducer<T>(state: History<T>, action: HistoryAction<T>): History<T> {
  switch (action.type) {
    case "set": {
      if (action.value === state.present) return state;
      if (action.merge && action.merge === state.mergeKey) return { ...state, present: action.value, future: [] };
      return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: action.value, future: [], mergeKey: action.merge ?? null };
    }
    case "undo": {
      if (state.past.length === 0) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future], mergeKey: null };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1), mergeKey: null };
    }
    case "reset":
      return initHistory(action.value);
  }
}
