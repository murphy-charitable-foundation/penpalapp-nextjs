# Testing on a phone

Use an HTTPS URL to test microphone recording and service workers on an iPhone.
An HTTP LAN URL such as `http://192.168.1.10:3000` can load the app, but it is not
a secure context. Allowing microphone access in browser settings does not remove
that restriction. The localhost exception on your computer does not extend to a
phone visiting your computer’s LAN address.

## Run the app through an HTTPS tunnel

1. Install and configure [ngrok](https://ngrok.com/docs/getting-started/).
2. Start the app:

   ```sh
   npm run dev
   ```

3. In another terminal, forward the port printed by Next.js:

   ```sh
   ngrok http http://localhost:3000
   ```

4. Add your tunnel’s exact hostname to the development-only `allowedDevOrigins`
   list in `next.config.js`, alongside the existing LAN pattern, then restart
   Next.js. Keep the `NODE_ENV === "development"` condition. For example:

   ```js
   allowedDevOrigins: ["192.168.*.*", "your-hostname.ngrok-free.app"],
   ```

5. Open the **HTTPS** forwarding URL on the phone. With a tunnel, the phone does
   not need to be on the same network as the computer. If Firebase Auth rejects
   the new domain during sign-in, add that hostname to the development Firebase
   project’s authorized domains.

Stop the tunnel when finished. A local HTTPS server with a certificate trusted
by the iPhone is another option; an untrusted self-signed certificate is not a
reliable substitute.

[`allowedDevOrigins`](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)
permits access to Next.js development assets. It does not enable HTTPS or grant
microphone permissions. Use hostnames without a scheme or port in this setting.

## Check recording

On both Safari and Chrome, sign in, record a short message, stop it, play the
preview, and send it. Also try sending directly while recording and cancelling
a recording. The microphone indicator should turn off after stopping, cancelling,
or closing the recorder.

If recording fails, the app now distinguishes an insecure connection, blocked
permissions, missing or unavailable microphones, and recorder failures. In the
browser console, `window.isSecureContext` should be `true` and
`typeof navigator.mediaDevices?.getUserMedia` should be `"function"`.
Tapping Record requests microphone permission through the browser when capture
is available. There is no permission prompt that can enable capture on an HTTP
LAN address. On the development computer itself, `http://localhost:3000` is a
trusted exception and can be used for recording tests.

## Development error indicators

The Next.js error indicator is part of development mode and is not included in
the production app. A production build does not automatically fix browser API
restrictions or suppress application console errors. Unsupported service workers
and push notifications are skipped quietly; actual setup failures remain visible.

If the old "Service Workers are not supported by this browser" error still
appears after updating the code, restart `npm run dev` and reload the phone's
page. If it persists, stop the dev server, remove the generated `.next/dev`
directory, and restart it to rebuild stale development bundles.

To check production behavior locally, stop the dev server, run `npm run build`,
then `npm start`, and open it through the same HTTPS tunnel.
