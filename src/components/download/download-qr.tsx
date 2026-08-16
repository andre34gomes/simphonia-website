import { QrCode } from "lucide-react";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/data/nav";
import { generateQrDataUrl } from "@/lib/qr";

export async function DownloadQr() {
  const [appStoreQr, playStoreQr] = await Promise.all([
    generateQrDataUrl(APP_STORE_URL),
    generateQrDataUrl(PLAY_STORE_URL),
  ]);

  const codes = [
    { label: "iOS", store: "App Store", src: appStoreQr },
    { label: "Android", store: "Google Play", src: playStoreQr },
  ];

  return (
    <section className="border-y border-border/60 bg-card/30 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <QrCode className="size-5 text-primary" />
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Scan to download
          </h2>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            Point your phone&apos;s camera at the matching code to jump
            straight to the right store.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          {codes.map((code) => (
            <div
              key={code.label}
              className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-8 text-center transition-colors hover:border-primary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data URL, not an optimizable asset */}
              <img
                src={code.src}
                alt={`QR code to download Simphonia on ${code.store}`}
                width={180}
                height={180}
                className="rounded-lg bg-white p-2"
              />
              <div>
                <p className="font-semibold text-foreground">{code.label}</p>
                <p className="text-sm text-muted-foreground">{code.store}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
