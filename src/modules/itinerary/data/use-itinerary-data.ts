import { useEffect, useMemo, useState } from "react";
import { useSession } from "../../../app/providers/session-provider";
import type { ItineraryDay, ItineraryItem, ItineraryItemUpsertInput } from "../domain/types";
import { itineraryQueries } from "./itinerary-queries";

export function useItinerary(tripId?: string, startDate?: string, endDate?: string) {
  const { user } = useSession();
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!tripId) {
      setDays([]);
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [nextDays, nextItems] = await Promise.all([
        itineraryQueries.listDays(tripId, startDate, endDate),
        itineraryQueries.listItems(tripId)
      ]);
      setDays(nextDays);
      setItems(nextItems);
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : "No se pudo cargar el itinerario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [tripId, startDate, endDate]);

  async function createItem(input: ItineraryItemUpsertInput) {
    if (!tripId || !user) {
      throw new Error("Necesitas una sesion activa dentro del viaje para crear un evento.");
    }

    const dayItems = items.filter((item) => item.dayId === input.dayId);
    const nextOrder = dayItems.length + 1;
    const createdItem = await itineraryQueries.createItem(tripId, user.id, input, nextOrder);
    setItems((currentItems) =>
      [...currentItems, createdItem].sort((left, right) => {
        if (left.dayId === right.dayId) {
          return left.order - right.order;
        }

        return left.dayId.localeCompare(right.dayId);
      })
    );
    return createdItem;
  }

  async function updateItem(itemId: string, input: ItineraryItemUpsertInput) {
    const updatedItem = await itineraryQueries.updateItem(itemId, input);

    if (!updatedItem) {
      return null;
    }

    setItems((currentItems) =>
      currentItems
        .map((item) => (item.id === itemId ? updatedItem : item))
        .sort((left, right) => {
          if (left.dayId === right.dayId) {
            return left.order - right.order;
          }

          return left.dayId.localeCompare(right.dayId);
        })
    );

    return updatedItem;
  }

  async function deleteItem(itemId: string) {
    await itineraryQueries.deleteItem(itemId);
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  async function moveItem(dayId: string, itemId: string, direction: "up" | "down") {
    const dayItems = items.filter((item) => item.dayId === dayId).sort((left, right) => left.order - right.order);
    const index = dayItems.findIndex((item) => item.id === itemId);

    if (index < 0) {
      return;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (nextIndex < 0 || nextIndex >= dayItems.length) {
      return;
    }

    const reordered = [...dayItems];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, movedItem);
    const reorderedWithOrder = reordered.map((item, orderIndex) => ({
      ...item,
      order: orderIndex + 1
    }));

    await itineraryQueries.saveItemOrder(dayId, reorderedWithOrder);

    setItems((currentItems) =>
      currentItems
        .map((item) => {
          const reorderedItem = reorderedWithOrder.find((candidate) => candidate.id === item.id);
          return reorderedItem ?? item;
        })
        .sort((left, right) => {
          if (left.dayId === right.dayId) {
            return left.order - right.order;
          }

          return left.dayId.localeCompare(right.dayId);
        })
    );
  }

  async function saveOptimizedOrder(dayId: string, orderedItemIds: string[]) {
    const dayItems = items.filter((item) => item.dayId === dayId);
    const optimizedIds = new Set(orderedItemIds);
    const orderedItems = [
      ...orderedItemIds
        .map((itemId, index) => {
          const item = dayItems.find((entry) => entry.id === itemId);

          if (!item) {
            return null;
          }

          return {
            ...item,
            order: index + 1
          };
        })
        .filter(Boolean),
      ...dayItems
        .filter((item) => !optimizedIds.has(item.id))
        .sort((left, right) => left.order - right.order)
    ]
      .map((item, index) => ({
        ...item,
        order: index + 1
      }))
      .filter(Boolean) as ItineraryItem[];

    if (orderedItems.length === 0) {
      return;
    }

    await itineraryQueries.saveItemOrder(dayId, orderedItems);

    setItems((currentItems) =>
      currentItems
        .map((item) => {
          const reorderedItem = orderedItems.find((candidate) => candidate.id === item.id);
          return reorderedItem ?? item;
        })
        .sort((left, right) => {
          if (left.dayId === right.dayId) {
            return left.order - right.order;
          }

          return left.dayId.localeCompare(right.dayId);
        })
    );
  }

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();

    for (const day of days) {
      map.set(day.id, items.filter((item) => item.dayId === day.id).sort((left, right) => left.order - right.order));
    }

    return map;
  }, [days, items]);

  return {
    days,
    items,
    itemsByDay,
    loading,
    error,
    reload,
    createItem,
    updateItem,
    deleteItem,
    moveItem,
    saveOptimizedOrder
  };
}
