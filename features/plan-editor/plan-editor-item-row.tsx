"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { PlanEditorDraft, PlanEditorItem } from "./types";
import { PlanEditorForm } from "./plan-editor-form";
import { PlanEditorTimePill } from "./plan-editor-time-pill";

type Props = {
  item: PlanEditorItem;
  isEditing: boolean;
  /** Changes when the row should flash (just added / moved / re-timed). */
  flashKey: number;
  /** Title of another item at the same time, if any. */
  conflictWith?: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (draft: PlanEditorDraft) => void;
  onTimeChange: (startTime: string | null) => void;
  onDuplicate: () => void;
  onMoveToTomorrow: () => void;
  onDelete: () => void;
  /** Present only for "anytime" items, which can be reordered by hand. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

const iconButton =
  "flex size-10 items-center justify-center rounded-full text-black/60 transition-colors active:bg-black/5 disabled:opacity-25 dark:text-white/65 dark:active:bg-white/10";

const menuItem =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-base font-medium active:bg-black/5 dark:active:bg-white/10";

export function PlanEditorItemRow({
  item,
  isEditing,
  flashKey,
  conflictWith,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTimeChange,
  onDuplicate,
  onMoveToTomorrow,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  function run(action: () => void) {
    setMenuOpen(false);
    action();
  }

  if (isEditing) {
    return (
      <li data-flip-id={item.id} className="plan-editor-enter rounded-2xl border border-emerald-600/40 p-3">
        <PlanEditorForm
          autoFocus
          submitLabel={t("editor.save")}
          initial={{ title: item.title, startTime: item.startTime ?? "", note: item.note ?? "" }}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }

  return (
    <li data-flip-id={item.id} className={`plan-editor-enter relative ${menuOpen ? "z-30" : ""}`}>
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
          {conflictWith && (
            <span className="block truncate text-sm font-semibold text-amber-600 dark:text-amber-400">
              {t("editor.sameTime", { title: conflictWith })}
            </span>
          )}
        </button>

        <PlanEditorTimePill
          value={item.startTime}
          onChange={onTimeChange}
          label={t("editor.timeFor", { title: item.title })}
          clearLabel={t("editor.clearTime", { title: item.title })}
        />

        {(onMoveUp || onMoveDown) && (
          <span className="flex flex-col">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={t("editor.moveUp", { title: item.title })}
              className={`${iconButton} size-7 text-sm`}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={t("editor.moveDown", { title: item.title })}
              className={`${iconButton} size-7 text-sm`}
            >
              ▼
            </button>
          </span>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t("editor.moreActions", { title: item.title })}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={iconButton}
        >
          <span aria-hidden className="text-xl leading-none font-bold">
            ⋯
          </span>
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label={t("editor.closeMenu")}
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            className="plan-editor-menu absolute top-full right-1 z-20 mt-1 w-56 overflow-hidden rounded-2xl border border-black/10 bg-background shadow-xl dark:border-white/15"
          >
            <button type="button" role="menuitem" onClick={() => run(onDuplicate)} className={menuItem}>
              <span aria-hidden>⧉</span> {t("editor.duplicate")}
            </button>
            <button type="button" role="menuitem" onClick={() => run(onMoveToTomorrow)} className={menuItem}>
              <span aria-hidden>→</span> {t("editor.moveToTomorrow")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => run(onDelete)}
              className={`${menuItem} text-red-600 dark:text-red-400`}
            >
              <span aria-hidden>🗑</span> {t("editor.delete")}
            </button>
          </div>
        </>
      )}
    </li>
  );
}
