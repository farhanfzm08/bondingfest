import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
    ...opts,
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function getStatusColor(status: string) {
  switch (status) {
    case "UPCOMING":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case "ONGOING":
    case "REGISTRATION":
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case "COMPLETED":
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    case "CANCELLED":
      return "text-red-400 bg-red-400/10 border-red-400/20";
    default:
      return "text-purple-400 bg-purple-400/10 border-purple-400/20";
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    UPCOMING: "Akan Datang",
    ONGOING: "Berlangsung",
    REGISTRATION: "Pendaftaran",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
    SCHEDULED: "Terjadwal",
    ACTIVE: "Aktif",
  };
  return labels[status] || status;
}

export function getMedalEmoji(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return `#${position}`;
}

export function getPositionLabel(position: number) {
  if (position === 1) return "Juara 1";
  if (position === 2) return "Juara 2";
  if (position === 3) return "Juara 3";
  return `Posisi ${position}`;
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.substring(0, length) + "..." : str;
}
