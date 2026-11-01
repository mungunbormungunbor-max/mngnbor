"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppMenu } from "@/components/app-menu";
import { useI18n } from "@/lib/i18n/provider";
import type { PlanEditorDraft, PlanEditorItem } from "./types";
import {
  cleanPlanEditorDraft,
  dismissPlanEditorCarry,
  findPlanEditorTimeConflicts,
  isPlanEditorCarryDismissed,
  loadPlanEditorItems,
  loadRecentPlanEditorTitles,
  loadUnfinishedFromPreviousDay,
  newPlanEditorId,
  nextPlanEditorSortOrder,
  parsePlanEditorDateKey,
  planEditorDateFromKey,
  savePlanEditorItems,
  shiftPlanEditorDateKey,
  splitPlanEditorItems,
  toPlanEditorDateKey,
} from "./plan-editor-data";
import { PlanEditorForm } from "./plan-editor-form";
import { PlanEditorItemRow } from "./plan-editor-item-row";
import { usePlanEditorFlip } from "./use-plan-editor-flip";
import "./plan-editor.css";

const UNDO_MS = 5000;

type Loaded = { dateKey: string; isToday: boolean; items: PlanEditorItem[] };

type UndoAction =
  | { kind: "delete"; item: PlanEditorItem }
  | { kind: "tomorrow"; item: PlanEditorItem; tomorrowKey: string; copyId: string }
  | { kind: "clear"; items: PlanEditorItem[] };

type Undo = { message: string; action: UndoAction; n: number };

export function PlanEditorScreen({ dateParam }: { dateParam: string | null }) {
  const { t, locale } = useI18n();
  const [plan, setPlan] = useState<Loaded | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; n: number }>({ id: "", n: 0 });
  const [undo, setUndo] = useState<Undo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [carry, setCarry] = useState<PlanEditorItem[]>([]);
  const undoCounter = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  // The date (and "today") depends on the phone's clock, so resolve it on the client.
  useEffect(() => {
    const todayKey = toPlanEditorDateKey(new Date());
    const dateKey = parsePlanEditorDateKey(dateParam) ?? todayKey;
    /* eslint-disable react-hooks/set-state-in-effect -- client-only date/localStorage reads */
    setPlan({ dateKey, isToday: dateKey === todayKey, items: loadPlanEditorItems(dateKey) });
    setSuggestions(loadRecentPlanEditorTitles(dateKey));
    setCarry(
      dateKey >= todayKey && !isPlanEditorCarryDismissed(dateKey) ? loadUnfinishedFromPreviousDay(dateKey) : [],
    );
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [dateParam]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  function commit(items: PlanEditorItem[], flashId?: string) {
    if (!plan) return;
    savePlanEditorItems(plan.dateKey, items);
    setPlan({ ...plan, items });
    if (flashId) setFlash((f) => ({ id: flashId, n: f.n + 1 }));
  }

  function offerUndo(message: string, action: UndoAction) {
    undoCounter.current += 1;
    setUndo({ message, action, n: undoCounter.current });
  }

  function addItem(draft: PlanEditorDraft) {
    if (!plan) return;
    const clean = cleanPlanEditorDraft(draft);
    if (!clean) return;
    const item: PlanEditorItem = {
      id: newPlanEditorId(),
      ...clean,
      isDone: false,
      sortOrder: nextPlanEditorSortOrder(plan.items),
    };
    navigator.vibrate?.(10);
    commit([...plan.items, item], item.id);
  }

  function saveItem(id: string, draft: PlanEditorDraft) {
    if (!plan) return;
    const clean = cleanPlanEditorDraft(draft);
    if (!clean) return;
    commit(
      plan.items.map((it) => (it.id === id ? { ...it, ...clean } : it)),
      id,
    );
    setEditingId(null);
  }

  function changeTime(id: string, startTime: string | null) {
    if (!plan) return;
    commit(
      plan.items.map((it) =>
        it.id !== id
          ? it
          : // Items moved into "anytime" go to the bottom of that list.
            { ...it, startTime, sortOrder: startTime ? it.sortOrder : nextPlanEditorSortOrder(plan.items) },
      ),
      id,
    );
  }

  function duplicateItem(id: string) {
    if (!plan) return;
    const item = plan.items.find((it) => it.id === id);
    if (!item) return;
    const copy: PlanEditorItem = {
      ...item,
      id: newPlanEditorId(),
      isDone: false,
      sortOrder: nextPlanEditorSortOrder(plan.items),
    };
    navigator.vibrate?.(10);
    commit([...plan.items, copy], copy.id);
  }

  function deleteItem(id: string) {
    if (!plan) return;
    const item = plan.items.find((it) => it.id === id);
    if (!item) return;
    navigator.vibrate?.(15);
    commit(plan.items.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    offerUndo(t("editor.deleted", { title: item.title }), { kind: "delete", item });
  }

  function moveToTomorrow(id: string) {
    if (!plan) return;
    const item = plan.items.find((it) => it.id === id);
    if (!item) return;
    const tomorrowKey = shiftPlanEditorDateKey(plan.dateKey, 1);
    const tomorrowItems = loadPlanEditorItems(tomorrowKey);
    const copy: PlanEditorItem = {
      ...item,
      id: newPlanEditorId(),
      isDone: false,
      sortOrder: nextPlanEditorSortOrder(tomorrowItems),
    };
    savePlanEditorItems(tomorrowKey, [...tomorrowItems, copy]);
    navigator.vibrate?.(15);
    commit(plan.items.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    offerUndo(t("editor.movedTomorrow", { title: item.title }), { kind: "tomorrow", item, tomorrowKey, copyId: copy.id });
  }

  function clearDone() {
    if (!plan) return;
    const done = plan.items.filter((it) => it.isDone);
    if (done.length === 0) return;
    navigator.vibrate?.(15);
    commit(plan.items.filter((it) => !it.isDone));
    offerUndo(t(done.length === 1 ? "editor.clearedOne" : "editor.clearedMany", { n: done.length }), {
      kind: "clear",
      items: done,
    });
  }

  function runUndo() {
    if (!plan || !undo) return;
    const a = undo.action;
    if (a.kind === "delete") {
      commit([...plan.items, a.item], a.item.id);
    } else if (a.kind === "tomorrow") {
      const tomorrow = loadPlanEditorItems(a.tomorrowKey).filter((it) => it.id !== a.copyId);
      savePlanEditorItems(a.tomorrowKey, tomorrow);
      commit([...plan.items, a.item], a.item.id);
    } else {
      commit([...plan.items, ...a.items]);
    }
    setUndo(null);
  }

  function bringOverUnfinished() {
    if (!plan || carry.length === 0) return;
    let order = nextPlanEditorSortOrder(plan.items);
    const copies = carry.map((it) => ({ ...it, id: newPlanEditorId(), isDone: false, sortOrder: order++ }));
    navigator.vibrate?.(10);
    dismissPlanEditorCarry(plan.dateKey);
    setCarry([]);
    commit([...plan.items, ...copies], copies[0].id);
  }

  function dismissCarry() {
    if (!plan) return;
    dismissPlanEditorCarry(plan.dateKey);
    setCarry([]);
  }

  /** Swap an "anytime" item with its neighbour. */
  function move(anytime: PlanEditorItem[], index: number, delta: -1 | 1) {
    if (!plan) return;
    const a = anytime[index];
    const b = anytime[index + delta];
    if (!a || !b) return;
    commit(
      plan.items.map((it) =>
        it.id === a.id ? { ...it, sortOrder: b.sortOrder } : it.id === b.id ? { ...it, sortOrder: a.sortOrder } : it,
      ),
      a.id,
    );
  }

  const items = plan?.items ?? [];
  const { scheduled, anytime } = splitPlanEditorItems(items);
  const conflicts = findPlanEditorTimeConflicts(items);
  const doneCount = items.filter((it) => it.isDone).length;
  const existingTitles = new Set(items.map((it) => it.title.trim().toLowerCase()));
  const formSuggestions = suggestions.filter((s) => !existingTitles.has(s.toLowerCase()));

  usePlanEditorFlip(listRef, [...scheduled, ...anytime].map((it) => `${it.id}:${it.startTime}:${it.sortOrder}`).join("|"));

  const dateLabel = plan
    ? planEditorDateFromKey(plan.dateKey).toLocaleDateString(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : " ";

  function renderRow(item: PlanEditorItem, reorder?: { index: number; list: PlanEditorItem[] }) {
    return (
      <PlanEditorItemRow
        key={item.id}
        item={item}
        isEditing={editingId === item.id}
        flashKey={flash.id === item.id ? flash.n : 0}
        conflictWith={conflicts.get(item.id)}
        onStartEdit={() => setEditingId(item.id)}
        onCancelEdit={() => setEditingId(null)}
        onSave={(draft) => saveItem(item.id, draft)}
        onTimeChange={(t) => changeTime(item.id, t)}
        onDuplicate={() => duplicateItem(item.id)}
        onMoveToTomorrow={() => moveToTomorrow(item.id)}
        onDelete={() => deleteItem(item.id)}
        onMoveUp={reorder && reorder.index > 0 ? () => move(reorder.list, reorder.index, -1) : undefined}
        onMoveDown={
          reorder && reorder.index < reorder.list.length - 1
            ? () => move(reorder.list, reorder.index, 1)
            : undefined
        }
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))]">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/today-view"
          aria-label={t("today.backToToday")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-xl active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-wide text-black/55 uppercase dark:text-white/55">
            {plan ? (plan.isToday ? t("editor.titleToday") : t("editor.titleOther")) : " "}
          </p>
          <h1 className="truncate text-2xl font-bold">{dateLabel}</h1>
        </div>
        <AppMenu className="shrink-0" />
      </header>

      {carry.length > 0 && (
        <div
          role="region"
          aria-label={t("editor.carryLabel")}
          className="plan-editor-banner mb-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3"
        >
          <span aria-hidden className="text-2xl">
            📋
          </span>
          <p className="min-w-0 flex-1 text-base font-medium">
            {t("editor.carryText", { n: carry.length })}
          </p>
          <button
            type="button"
            onClick={bringOverUnfinished}
            className="shrink-0 rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-white active:opacity-80"
          >
            {t("editor.bringOver")}
          </button>
          <button
            type="button"
            onClick={dismissCarry}
            aria-label={t("editor.dismiss")}
            className="shrink-0 rounded-full px-2 text-xl leading-none text-black/50 active:bg-black/5 dark:text-white/55"
          >
            ×
          </button>
        </div>
      )}

      <section aria-label={t("editor.addSection")} className="mb-6 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.06]">
        <PlanEditorForm submitLabel={t("editor.add")} onSubmit={addItem} resetOnSubmit smart suggestions={formSuggestions} />
      </section>

      {plan && items.length === 0 && (
        <p className="plan-editor-enter py-8 text-center text-lg text-black/55 dark:text-white/55">
          {t("editor.empty")}
        </p>
      )}

      <div ref={listRef}>
        {scheduled.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-1 px-3 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
              {t("editor.scheduled")}
            </h2>
            <ul className="flex flex-col">{scheduled.map((item) => renderRow(item))}</ul>
          </section>
        )}

        {anytime.length > 0 && (
          <section>
            <h2 className="mb-1 px-3 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
              {t("editor.anytime")}
            </h2>
            <ul className="flex flex-col">
              {anytime.map((item, index) => renderRow(item, { index, list: anytime }))}
            </ul>
          </section>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3 px-3">
          <p className="text-sm text-black/45 dark:text-white/45">{t("editor.hint")}</p>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={clearDone}
              className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-sm font-semibold active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
            >
              {t("editor.clearDone", { n: doneCount })}
            </button>
          )}
        </div>
      )}

      {undo && (
        <div
          key={undo.n}
          role="status"
          className="plan-editor-toast fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-2xl bg-brand-700 py-2 pr-2 pl-4 text-white shadow-lg"
        >
          <span className="truncate">{undo.message}</span>
          <button
            type="button"
            onClick={runUndo}
            className="shrink-0 rounded-xl px-4 py-2 font-bold text-amber-200 active:bg-white/10"
          >
            {t("editor.undo")}
          </button>
        </div>
      )}
    </main>
  );
}
