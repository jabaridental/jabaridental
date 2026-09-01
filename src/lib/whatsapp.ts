// WhatsApp deep-link helpers

export function buildWhatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Centralised contact-link builder. Every component that needs tel / WhatsApp /
 * maps URLs should call this so the formatting stays consistent and a future
 * change (e.g. switching to a different deep-link format) only touches one place.
 */
export interface ContactLinks {
  tel: string;
  waHref: string;
  maps: string;
  emailHref: string;
  phoneDisplay: string;
}

export function getContactLinks(
  phone: string,
  whatsapp: string,
  mapsUrl: string,
  email: string,
  defaultMessage = "Hello JABARI DENTAL, I would like to enquire about an appointment."
): ContactLinks {
  const cleanWa = whatsapp.replace(/[^0-9]/g, "");
  return {
    tel: `tel:+${phone}`,
    waHref: buildWhatsappUrl(cleanWa, defaultMessage),
    maps: mapsUrl,
    emailHref: email ? `mailto:${email}` : "",
    phoneDisplay: `+${phone}`,
  };
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
