import QRCode from "qrcode";

/**
 * Generates a scan-ready QR code as a PNG data URL, server-side, so no
 * client JS or third-party script is needed to render it.
 */
export async function generateQrDataUrl(value: string, size = 240) {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: size,
    color: { dark: "#1a1a1c", light: "#00000000" },
  });
}
