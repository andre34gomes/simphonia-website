import { generateQrDataUrl } from "@/lib/qr";

interface DeeplinkQrCodeProps {
  data: string;
  label: string;
  size?: number;
}

/**
 * Server-rendered QR code for the deep-link pages. Generated locally via
 * the `qrcode` package instead of the previous site's dependency on the
 * external api.qrserver.com service, so the code always renders even if
 * a third party is unreachable.
 */
export async function DeeplinkQrCode({
  data,
  label,
  size = 200,
}: DeeplinkQrCodeProps) {
  const qrDataUrl = await generateQrDataUrl(data, size);

  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data URL, not an optimizable static asset */}
      <img
        src={qrDataUrl}
        alt={`QR code linking to ${data}`}
        width={size}
        height={size}
        className="rounded-lg bg-white p-2"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
