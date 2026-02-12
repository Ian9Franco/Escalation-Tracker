'use client';

import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    let isMounted = true;

    // Prevent multiple script loads
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderCaptcha = () => {
      if (window.turnstile && containerRef.current && isMounted && !widgetIdRef.current) {
        // Clear container just in case
        containerRef.current.innerHTML = '';
        
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => {
              onVerify(token);
            },
            theme: 'dark',
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.error('Turnstile render error:', e);
        }
      }
    };

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
          widgetIdRef.current = null;
        } catch (e) {
          // Ignore removal errors on unmount
        }
      }
    };
  }, [onVerify, siteKey]);

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-xl">
      <div ref={containerRef} id="turnstile-container"></div>
    </div>
  );
}
