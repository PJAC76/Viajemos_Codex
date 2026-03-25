import { useEffect } from "react";
import { Button } from "../ui/button";

function isImageMimeType(mimeType?: string, fileName?: string) {
  if (mimeType?.startsWith("image/")) {
    return true;
  }

  const normalizedFileName = fileName?.toLowerCase() ?? "";
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some((extension) => normalizedFileName.endsWith(extension));
}

function isPdfMimeType(mimeType?: string, fileName?: string) {
  if (mimeType?.includes("pdf")) {
    return true;
  }

  return fileName?.toLowerCase().endsWith(".pdf") ?? false;
}

export function FilePreviewDialog({
  open,
  title,
  fileName,
  mimeType,
  objectUrl,
  onClose,
  onDownload
}: {
  open: boolean;
  title: string;
  fileName: string;
  mimeType?: string;
  objectUrl?: string | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const isImage = isImageMimeType(mimeType, fileName);
  const isPdf = isPdfMimeType(mimeType, fileName);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-slate-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{title}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{fileName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onDownload}>
              Descargar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>

        <div className="min-h-[320px] flex-1 overflow-auto bg-slate-100 p-4 dark:bg-slate-900">
          {!objectUrl ? (
            <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              No se pudo cargar una vista previa de este archivo.
            </div>
          ) : isImage ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <img src={objectUrl} alt={fileName} className="max-h-[72vh] w-auto max-w-full rounded-2xl object-contain shadow-soft" />
            </div>
          ) : isPdf ? (
            <iframe title={fileName} src={objectUrl} className="h-[72vh] w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800" />
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="text-base font-semibold text-slate-900 dark:text-white">Vista previa no disponible</p>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Este tipo de archivo no se puede previsualizar dentro de la app. Descargalo para abrirlo con la aplicacion adecuada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
