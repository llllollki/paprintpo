// Shared display-formatting utilities.

/** Converts a group_name key to a human-readable label. E.g. "paper-size" → "Paper size" */
export function toLabel(groupName: string): string {
  return groupName.charAt(0).toUpperCase() + groupName.slice(1).replace(/-/g, " ");
}
