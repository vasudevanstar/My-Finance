"use client";

import * as React from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);

  React.useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("PWA Service Worker registration failed:", err);
          });
      });
    }

    // 2. Detect Android / Chrome install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed banner recently
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = (window.navigator as any).standalone;
    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("pwa_install_dismissed", "true");
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 rounded-2xl border border-blue-200 bg-white p-4 shadow-xl shadow-slate-900/10 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm">
            MF
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Install My Finance
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Add to your home screen for quick access like a native app.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        {isIos ? (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
            <Share className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong></span>
          </div>
        ) : (
          <>
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9"
            >
              <Download className="h-4 w-4" />
              Add to Home Screen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-slate-600 h-9"
            >
              Maybe Later
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
