'use client';

import { useEffect, useRef, useCallback } from 'react';

interface CaptchaProps {
  onVerify: (token: string) => void;
  siteKey: string;
}

declare global {
  interface Window {
    onloadTurnstileCallback: () => void;
    turnstile: any;
  }
}

export function Captcha({ onVerify, siteKey }: CaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Store onVerify in a ref so changes don't trigger re-renders/re-mounts
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  useEffect(() => {
    let isMounted = true;

    const renderCaptcha = () => {
      // Only render if: mounted, container exists, turnstile loaded, and widget not already rendered
      if (!window.turnstile || !containerRef.current || !isMounted || widgetIdRef.current) {
        return;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            // Use the ref to always call the latest onVerify without it being a dependency
            onVerifyRef.current(token);
          },
          'expired-callback': () => {
            // When the token expires, reset the widget cleanly instead of destroying/recreating
            if (widgetIdRef.current) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          'error-callback': () => {
            // On error, reset instead of full re-render
            if (widgetIdRef.current) {
              window.turnstile.reset(widgetIdRef.current);
            }
          },
          theme: 'dark',
          retry: 'never', // Disable retry to see the error message
        });
        widgetIdRef.current = id;
      } catch (e) {
        console.error('Turnstile render error:', e);
      }
    };

    // Load the script only once
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    if (window.turnstile) {
      renderCaptcha();
    } else {
      window.onloadTurnstileCallback = renderCaptcha;
    }

    return () => {
      isMounted = false;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore removal errors on unmount
        }
        widgetIdRef.current = null;
      }
    };
    // siteKey is the only real dependency — onVerify is handled via ref
  }, [siteKey]);

  return (
    <div className="flex justify-center my-4 min-h-[65px] rounded-xl">
      <div ref={containerRef} id="turnstile-container"></div>
    </div>
  );
}
