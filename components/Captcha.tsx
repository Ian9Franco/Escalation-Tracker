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

  useEffect(() => {
    // Prevent multiple script loads
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderCaptcha = () => {
      if (window.turnstile && containerRef.current) {
        window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token);
          },
          theme: 'dark',
        });
      }
    };

    if (window.turnstile) {
      renderCaptcha();
    } else {
      window.onloadTurnstileCallback = renderCaptcha;
    }

    return () => {
      // Cleanup
      if (window.turnstile && containerRef.current) {
        // Turnstile doesn't always have a straightforward 'remove' for custom containers via ID
        // but we can at least clear the innerHTML if needed.
      }
    };
  }, [onVerify, siteKey]);

  return (
    <div className="flex justify-center my-4 overflow-hidden rounded-xl">
      <div ref={containerRef} id="turnstile-container"></div>
    </div>
  );
}
