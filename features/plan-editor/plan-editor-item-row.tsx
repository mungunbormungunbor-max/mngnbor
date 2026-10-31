"use client";

import type { PlanEditorDraft, PlanEditorItem } from "./types";
import { PlanEditorForm } from "./plan-editor-form";
import { PlanEditorTimePill } from "./plan-editor-time-pill";

type Props = {
  item: PlanEditorItem;
  isEditing: boolean;
  /** Changes when the row should flash (just added / moved / re-timed). */
  flashKey: number;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: PlanEditorDraft) => void;
  onTimeChange: (startTime: string | null) => void;
  onDelete: () => void;
  /** Present only for "anytime" items, which can be reordered by hand. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

const iconButton =
  "flex size-10 items-center justify-center rounded-full text-black/60 transition-colors active:bg-black/5 disabled:opacity-25 dark:text-white/65 dark:active:bg-white/10";

export function PlanEditorItemRow({
  item,
  isEditing,
  flashKey,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTimeChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  if (isEditing) {
    return (
      <li className="plan-editor-enter rounded-2xl border border-emerald-600/40 p-3">
        <PlanEditorForm
          autoFocus
          submitLabel="Save"
          initial={{ title: item.title, startTime: item.startTime ?? "", note: item.note ?? "" }}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li className="plan-editor-enter">
      <div
        key={flashKey}
        className={`flex items-center gap-2 rounded-2xl py-2 pr-1 pl-3 ${flashKey ? "plan-editor-flash" : ""}`}
      >
        <button type="button" onClick={onStartEdit} className="min-w-0 flex-1 py-1 text-left">
          <span
            className={`block truncate text-lg font-semibold ${
              item.isDone ? "text-black/40 line-through dark:text-white/40" : ""
            }`}
          >
            {item.title}
          </span>
          {item.note && (
            <span className="block truncate text-sm text-black/55 dark:text-white/55">{item.note}</span>
          )}
        </button>

        <PlanEditorTimePill value={item.startTime} onChange={onTimeChange} label={`Time for ${item.title}`} />

        {(onMoveUp || onMoveDown) && (
          <span className="flex flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={`Move ${item.title} up`}
              className={`${iconButton} size-7 text-sm`}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={`Move ${item.title} down`}
              className={`${iconButton} size-7 text-sm`}
            >
              ▼
            </button>
          </span>
        )}

        <button type="button" onClick={onDelete} aria-label={`Delete ${item.title}`} className={iconButton}>
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M4 6h12M8 6V4h4v2m-6 0l.7 10h6.6L14 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </li>
  );
}
