"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PlanEditorDraft, PlanEditorItem } from "./types";
import {
  cleanPlanEditorDraft,
  loadPlanEditorItems,
  newPlanEditorId,
  nextPlanEditorSortOrder,
  parsePlanEditorDateKey,
  planEditorDateFromKey,
  savePlanEditorItems,
  splitPlanEditorItems,
  toPlanEditorDateKey,
} from "./plan-editor-data";
import { PlanEditorForm } from "./plan-editor-form";
import { PlanEditorItemRow } from "./plan-editor-item-row";
import "./plan-editor.css";

const UNDO_MS = 5000;

type Loaded = { dateKey: string; isToday: boolean; items: PlanEditorItem[] };
type Undo = { item: PlanEditorItem; n: number };

export function PlanEditorScreen({ dateParam }: { dateParam: string | null }) {
  const [plan, setPlan] = useState<Loaded | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; n: number }>({ id: "", n: 0 });
  const [undo, setUndo] = useState<Undo | null>(null);
  const undoCounter = useRef(0);

  // The date (and "today") depends on the phone's clock, so resolve it on the client.
  useEffect(() => {
    const todayKey = toPlanEditorDateKey(new Date());
    const dateKey = parsePlanEditorDateKey(dateParam) ?? todayKey;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date/localStorage read
    setPlan({ dateKey, isToday: dateKey === todayKey, items: loadPlanEditorItems(dateKey) });
  }, [dateParam]);

  useEffect(() => {
    if (!undo) return;
    const t = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(t);
  }, [undo]);

  function commit(items: PlanEditorItem[], flashId?: string) {
    if (!plan) return;
    savePlanEditorItems(plan.dateKey, items);
    setPlan({ ...plan, items });
    if (flashId) setFlash((f) => ({ id: flashId, n: f.n + 1 }));
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

  function deleteItem(id: string) {
    if (!plan) return;
    const item = plan.items.find((it) => it.id === id);
    if (!item) return;
    commit(plan.items.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
    undoCounter.current += 1;
    setUndo({ item, n: undoCounter.current });
  }

  function undoDelete() {
    if (!plan || !undo) return;
    commit([...plan.items, undo.item], undo.item.id);
    setUndo(null);
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

  const { scheduled, anytime } = plan ? splitPlanEditorItems(plan.items) : { scheduled: [], anytime: [] };
  const dateLabel = plan
    ? planEditorDateFromKey(plan.dateKey).toLocaleDateString(undefined, {
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
        onStartEdit={() => setEditingId(item.id)}
        onCancelEdit={() => setEditingId(null)}
        onSave={(draft) => saveItem(item.id, draft)}
        onTimeChange={(t) => changeTime(item.id, t)}
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
          aria-label="Back to today"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-xl active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
        >
          ←
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium tracking-wide text-black/55 uppercase dark:text-white/55">
            {plan ? (plan.isToday ? "Edit today's plan" : "Edit plan") : " "}
          </p>
          <h1 className="truncate text-2xl font-bold">{dateLabel}</h1>
        </div>
      </header>

      <section aria-label="Add an item" className="mb-6 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.06]">
        <PlanEditorForm submitLabel="Add to plan" onSubmit={addItem} resetOnSubmit />
      </section>

      {plan && plan.items.length === 0 && (
        <p className="plan-editor-enter py-8 text-center text-lg text-black/55 dark:text-white/55">
          No items yet. Add your first one above.
        </p>
      )}

      {scheduled.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-1 px-3 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
            Scheduled
          </h2>
          <ul className="flex flex-col">{scheduled.map((item) => renderRow(item))}</ul>
        </section>
      )}

      {anytime.length > 0 && (
        <section>
          <h2 className="mb-1 px-3 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
            Anytime
          </h2>
          <ul className="flex flex-col">
            {anytime.map((item, index) => renderRow(item, { index, list: anytime }))}
          </ul>
        </section>
      )}

      {plan && plan.items.length > 0 && (
        <p className="mt-6 px-3 text-sm text-black/45 dark:text-white/45">
          Tap an item to edit it. Tap a time to change it.
        </p>
      )}

      {undo && (
        <div
          key={undo.n}
          role="status"
          className="plan-editor-toast fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-3 rounded-2xl bg-foreground py-2 pr-2 pl-4 text-background shadow-lg"
        >
          <span className="truncate">Deleted “{undo.item.title}”</span>
          <button
            type="button"
            onClick={undoDelete}
            className="shrink-0 rounded-xl px-4 py-2 font-bold text-emerald-400 active:bg-white/10 dark:text-emerald-700 dark:active:bg-black/10"
          >
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
