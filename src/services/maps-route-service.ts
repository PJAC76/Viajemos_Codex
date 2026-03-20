import { env } from "../lib/env";
import type { ItineraryItem, RouteSnapshotDraft, RouteTravelMode } from "../modules/itinerary/domain/types";

type GoogleMapsTravelMode = "DRIVING" | "WALKING" | "TRANSIT";

interface GoogleMapsWaypoint {
  location: string;
  stopover: boolean;
}

interface GoogleMapsDirectionsRequest {
  origin: string;
  destination: string;
  waypoints?: GoogleMapsWaypoint[];
  optimizeWaypoints?: boolean;
  travelMode: GoogleMapsTravelMode;
}

interface GoogleMapsDistanceDuration {
  value?: number;
}

interface GoogleMapsRouteLeg {
  distance?: GoogleMapsDistanceDuration;
  duration?: GoogleMapsDistanceDuration;
}

interface GoogleMapsDirectionsRoute {
  legs?: GoogleMapsRouteLeg[];
}

interface GoogleMapsDirectionsResult {
  routes?: GoogleMapsDirectionsRoute[];
}

interface GoogleMapsNamespace {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
    DirectionsService: new () => {
      route: (
        request: GoogleMapsDirectionsRequest,
        callback: (result: GoogleMapsDirectionsResult | null, status: string) => void
      ) => void;
    };
    DirectionsRenderer: new (options: Record<string, unknown>) => {
      setMap: (map: unknown | null) => void;
      setDirections: (result: GoogleMapsDirectionsResult) => void;
    };
    TravelMode: Record<GoogleMapsTravelMode, GoogleMapsTravelMode>;
  };
}

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "viajemos-google-maps";
let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null;

function getTravelMode(travelMode: RouteTravelMode): GoogleMapsTravelMode {
  if (travelMode === "walking") {
    return "WALKING";
  }

  if (travelMode === "transit") {
    return "TRANSIT";
  }

  return "DRIVING";
}

function getRoutableItems(items: ItineraryItem[]) {
  return items.filter((item) => item.address.trim().length > 0).sort((left, right) => left.order - right.order);
}

async function loadGoogleMaps() {
  if (window.google?.maps) {
    return window.google;
  }

  if (!env.googleMapsApiKey) {
    throw new Error("Configura VITE_GOOGLE_MAPS_API_KEY para calcular rutas reales.");
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<GoogleMapsNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) {
          resolve(window.google);
          return;
        }

        reject(new Error("Google Maps no se ha cargado correctamente."));
      });
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(env.googleMapsApiKey)}&loading=async`;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }

      reject(new Error("Google Maps no se ha inicializado."));
    };
    script.onerror = () => reject(new Error("No se pudo descargar Google Maps."));
    document.head.appendChild(script);
  }).catch((error) => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}

function requestDirections(google: GoogleMapsNamespace, request: GoogleMapsDirectionsRequest) {
  return new Promise<GoogleMapsDirectionsResult>((resolve, reject) => {
    const service = new google.maps.DirectionsService();
    service.route(request, (result, status) => {
      if (!result || status !== "OK") {
        reject(new Error("Google Maps no ha podido calcular esta ruta. Revisa las direcciones del dia."));
        return;
      }

      resolve(result);
    });
  });
}

export const mapsRouteService = {
  canCalculateRoute(items: ItineraryItem[]) {
    return getRoutableItems(items).length >= 2;
  },

  buildGoogleMapsDirectionsUrl(items: ItineraryItem[], travelMode: RouteTravelMode = "driving") {
    const routeItems = getRoutableItems(items);

    if (routeItems.length === 0) {
      return null;
    }

    if (routeItems.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(routeItems[0].address)}`;
    }

    const origin = routeItems[0].address;
    const destination = routeItems[routeItems.length - 1].address;
    const waypoints = routeItems.slice(1, -1).map((item) => item.address).filter(Boolean);
    const normalizedTravelMode = travelMode === "walking" ? "walking" : travelMode === "transit" ? "transit" : "driving";
    const params = new URLSearchParams({
      api: "1",
      origin,
      destination,
      travelmode: normalizedTravelMode
    });

    if (waypoints.length > 0) {
      params.set("waypoints", waypoints.join("|"));
    }

    return `https://www.google.com/maps/dir/?${params.toString()}`;
  },

  async calculateAndRenderDayRoute({
    container,
    items,
    travelMode = "driving"
  }: {
    container: HTMLElement;
    items: ItineraryItem[];
    travelMode?: RouteTravelMode;
  }): Promise<RouteSnapshotDraft> {
    const google = await loadGoogleMaps();
    const routeItems = getRoutableItems(items);

    if (routeItems.length < 2) {
      throw new Error("Necesitas al menos dos paradas con direccion para calcular la ruta.");
    }

    const map = new google.maps.Map(container, {
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true
    });

    const renderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: "#2b7cee",
        strokeOpacity: 0.9,
        strokeWeight: 6
      }
    });

    const request: GoogleMapsDirectionsRequest = {
      origin: routeItems[0].address,
      destination: routeItems[routeItems.length - 1].address,
      waypoints: routeItems.slice(1, -1).map((item) => ({
        location: item.address,
        stopover: true
      })),
      optimizeWaypoints: false,
      travelMode: google.maps.TravelMode[getTravelMode(travelMode)]
    };

    const result = await requestDirections(google, request);
    renderer.setDirections(result);

    const legs = result.routes?.[0]?.legs ?? [];
    const totalDistanceKm = Number(
      legs.reduce((total, leg) => total + ((leg.distance?.value ?? 0) / 1000), 0).toFixed(1)
    );
    const totalDurationMinutes = Math.round(legs.reduce((total, leg) => total + ((leg.duration?.value ?? 0) / 60), 0));

    return {
      tripId: routeItems[0].tripId,
      dayId: routeItems[0].dayId,
      totalDistanceKm,
      totalDurationMinutes,
      travelMode,
      segments: legs.map((leg, index) => ({
        from: routeItems[index]?.title ?? routeItems[index]?.address ?? "Origen",
        to: routeItems[index + 1]?.title ?? routeItems[index + 1]?.address ?? "Destino",
        distanceKm: Number(((leg.distance?.value ?? 0) / 1000).toFixed(1)),
        durationMinutes: Math.round((leg.duration?.value ?? 0) / 60)
      }))
    };
  }
};
