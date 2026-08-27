// WhatsApp deep-link helpers

export function buildWhatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export interface BookingFields {
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  message: string;
  clinicName?: string;
}

export function buildBookingMessage(f: BookingFields): string {
  const lines = [
    `Hello ${f.clinicName || "JABARI DENTAL"},`,
    "",
    "I would like to request an appointment.",
    "",
    `Service:\n${f.service || "—"}`,
    `Preferred date:\n${f.date || "—"}`,
    `Preferred time:\n${f.time || "—"}`,
    `Name:\n${f.name || "—"}`,
    `Phone:\n${f.phone || "—"}`,
    `Additional message:\n${f.message || "—"}`,
    "",
    "Thank you.",
  ];
  return lines.join("\n");
}
