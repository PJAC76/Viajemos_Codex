import { itineraryDays, itineraryItems } from "../../../mocks/db";
import { getInsforgeClient } from "../../../lib/insforge/client";
import type { ItineraryDay, ItineraryItem, ItineraryItemType, ItineraryItemUpsertInput } from "../domain/types";

function buildTripDayRange(startDate: string, endDate: string) {
  const days: Array<{ date: string; label: string; position: number }> = [];

  if (!startDate || !endDate) {
    return days;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  let cursor = new Date(start);
  let position = 1;

  while (cursor <= end) {
    days.push({
      date: cursor.toISOString().slice(0, 10),
      label: `Dia ${position}`,
      position
    });
    cursor.setDate(cursor.getDate() + 1);
    position += 1;
  }

  return days;
}

function normalizeItineraryDay(row: Record<string, unknown>): ItineraryDay {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    date: typeof row.date === "string" ? row.date : "",
    label: typeof row.label === "string" ? row.label : "Dia",
    position: typeof row.position === "number" ? row.position : 1
  };
}

function normalizeItemType(value: unknown): ItineraryItemType {
  return value === "linked_place" || value === "manual" ? value : "manual";
}

function normalizeTime(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.slice(0, 5);
}

function inferItemIcon(type: ItineraryItemType, icon?: string, title?: string) {
  if (icon) {
    return icon;
  }

  if (type === "linked_place") {
    return "place";
  }

  const lowerTitle = (title ?? "").toLowerCase();

  if (lowerTitle.includes("hotel")) {
    return "hotel";
  }

  if (lowerTitle.includes("cena") || lowerTitle.includes("restaurante")) {
    return "restaurant";
  }

  return "place";
}

function normalizeItineraryItem(row: Record<string, unknown>): ItineraryItem {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    dayId: String(row.day_id),
    type: normalizeItemType(row.type),
    title: typeof row.title === "string" ? row.title : "Evento",
    startTime: normalizeTime(row.start_time),
    endTime: typeof row.end_time === "string" ? normalizeTime(row.end_time) : undefined,
    address: typeof row.address === "string" ? row.address : "",
    notes: typeof row.notes === "string" ? row.notes : "",
    placeId: typeof row.place_id === "string" ? row.place_id : undefined,
    order: typeof row.order_index === "number" ? row.order_index : 1,
    createdBy: typeof row.created_by === "string" ? row.created_by : "",
    icon: inferItemIcon(normalizeItemType(row.type), typeof row.icon === "string" ? row.icon : undefined, typeof row.title === "string" ? row.title : undefined)
  };
}

async function ensureTripDays(tripId: string, startDate?: string, endDate?: string) {
  const insforge = getInsforgeClient();

  if (!insforge || !startDate || !endDate) {
    return;
  }

  const desiredDays = buildTripDayRange(startDate, endDate);

  if (desiredDays.length === 0) {
    return;
  }

  const { data, error } = await insforge.database
    .from("itinerary_days")
    .select("id, date")
    .eq("trip_id", tripId);

  if (error) {
    throw new Error(error.message ?? "No se pudieron comprobar los dias del itinerario.");
  }

  const existingDates = new Set(((data as Array<Record<string, unknown>> | null) ?? []).map((row) => String(row.date)));
  const missingDays = desiredDays
    .filter((day) => !existingDates.has(day.date))
    .map((day) => ({
      trip_id: tripId,
      date: day.date,
      label: day.label,
      position: day.position
    }));

  if (missingDays.length === 0) {
    return;
  }

  const insertResult = await insforge.database.from("itinerary_days").insert(missingDays);

  if (insertResult.error) {
    throw new Error(insertResult.error.message ?? "No se pudieron crear los dias del itinerario.");
  }
}

export const itineraryQueries = {
  async listDays(tripId: string, startDate?: string, endDate?: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return itineraryDays.filter((day) => day.tripId === tripId).sort((left, right) => left.position - right.position);
    }

    await ensureTripDays(tripId, startDate, endDate);

    const { data, error } = await insforge.database
      .from("itinerary_days")
      .select("*")
      .eq("trip_id", tripId)
      .order("position", { ascending: true });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar los dias del itinerario.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeItineraryDay);
  },

  async listItems(tripId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      return itineraryItems
        .filter((item) => item.tripId === tripId)
        .sort((left, right) => left.order - right.order || left.startTime.localeCompare(right.startTime));
    }

    const { data, error } = await insforge.database
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message ?? "No se pudieron cargar los eventos del itinerario.");
    }

    return ((data as Array<Record<string, unknown>> | null) ?? []).map(normalizeItineraryItem);
  },

  async createItem(tripId: string, userId: string, input: ItineraryItemUpsertInput, nextOrder: number) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const item: ItineraryItem = {
        id: `item-${crypto.randomUUID()}`,
        tripId,
        dayId: input.dayId,
        type: input.type,
        title: input.title,
        startTime: input.startTime,
        endTime: input.endTime,
        address: input.address,
        notes: input.notes,
        placeId: input.placeId,
        order: nextOrder,
        createdBy: userId,
        icon: inferItemIcon(input.type, input.icon, input.title)
      };

      itineraryItems.push(item);
      return item;
    }

    const { data, error } = await insforge.database
      .from("itinerary_items")
      .insert([
        {
          trip_id: tripId,
          day_id: input.dayId,
          type: input.type,
          title: input.title.trim(),
          start_time: input.startTime,
          end_time: input.endTime || null,
          address: input.address.trim(),
          notes: input.notes.trim(),
          place_id: input.placeId || null,
          order_index: nextOrder,
          icon: input.icon || null,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo crear el evento del itinerario.");
    }

    return normalizeItineraryItem(data as Record<string, unknown>);
  },

  async updateItem(itemId: string, input: ItineraryItemUpsertInput) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const item = itineraryItems.find((entry) => entry.id === itemId);

      if (!item) {
        return null;
      }

      Object.assign(item, {
        ...input,
        icon: inferItemIcon(input.type, input.icon, input.title)
      });
      return item;
    }

    const { data, error } = await insforge.database
      .from("itinerary_items")
      .update({
        day_id: input.dayId,
        type: input.type,
        title: input.title.trim(),
        start_time: input.startTime,
        end_time: input.endTime || null,
        address: input.address.trim(),
        notes: input.notes.trim(),
        place_id: input.placeId || null,
        icon: input.icon || null
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message ?? "No se pudo actualizar el evento del itinerario.");
    }

    return normalizeItineraryItem(data as Record<string, unknown>);
  },

  async deleteItem(itemId: string) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      const itemIndex = itineraryItems.findIndex((entry) => entry.id === itemId);

      if (itemIndex >= 0) {
        itineraryItems.splice(itemIndex, 1);
      }

      return;
    }

    const { error } = await insforge.database.from("itinerary_items").delete().eq("id", itemId);

    if (error) {
      throw new Error(error.message ?? "No se pudo borrar el evento del itinerario.");
    }
  },

  async saveItemOrder(dayId: string, orderedItems: ItineraryItem[]) {
    const insforge = getInsforgeClient();

    if (!insforge) {
      for (const [index, item] of orderedItems.entries()) {
        const target = itineraryItems.find((entry) => entry.id === item.id);

        if (target) {
          target.order = index + 1;
        }
      }

      return;
    }

    const { error } = await insforge.database.rpc("reorder_itinerary_items", {
      target_day_id: dayId,
      ordered_item_ids: orderedItems.map((item) => item.id)
    });

    if (error) {
      throw new Error(error.message ?? "No se pudo reordenar el itinerario.");
    }
  }
};
