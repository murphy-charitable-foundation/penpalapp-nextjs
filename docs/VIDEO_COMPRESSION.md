# Media compression and validation

The public entry point remains `compressMedia(file, onProgress, customOptions, onStage)` in `app/utils/compressMedia/index.js`. Video processing copies compatible encoded AAC audio instead of capturing sound from a playing HTML video. The preferred native codec path decodes and encodes frames without waiting for real-time playback. Codec support must pass runtime capability checks; browser branding alone does not establish support.

`compressMedia` owns the shared profile selection, bounded/monotonic progress, original-file fallback, and smaller-output check for images, audio, and video. Each format's compressor is loaded only when needed. Images retain `browser-image-compression` with workers and existing quality/size options; compression errors now preserve the original image, and custom image progress callbacks cannot disable upload progress. Small audio/video files skip before loading their codec modules. The existing video diagnostic callback contract is unchanged.

All compression code lives in `app/utils/compressMedia/`: `index.js` is the public entry point, `image.js` and `audio.js` implement those formats, `videoTranscoder.js` handles native video decoding/encoding, and `videoContainer.js` reads MOV/MP4 tracks and packages the compressed video with original AAC audio. Existing app imports of `./compressMedia` resolve to this folder's entry point. The audio recorder has no leftover video drawing code and releases media/graph resources after processing, with finite metadata/context setup timeouts. All application and test files use `.js`; no project-wide module-type change is needed. No FFmpeg runtime is shipped to users.

## Eligibility and fallback

The native path accepts one SDR H.264 (`avc1`) or 8-bit HEVC Main (`hvc1`/`hev1`, 4:2:0) video track and zero or one mono/stereo AAC-LC track in MOV/MP4, with square pixels and a supported quarter-turn rotation. HEVC input is decoded only when the browser supports its exact configuration, then encoded as H.264. Decoder configuration bytes are read directly from the source; MP4Box's HEVC configuration writer changes reserved bits, so it is not used for this step. Simple trim/priming edits and a leading empty edit (intentional track delay) are retained. The decoder receives samples in decoding order with their original presentation timestamps. Encoding reduces frame rate without changing the media clock; the MP4 retains audio samples, timestamps, codec configuration, and edit lists.

Every other case returns the original `File`, including missing native decoder/H.264 encoder support, HDR/Dolby Vision/10-bit HEVC, WebM, spatial/multiple/unsupported audio tracks, complex edits, corrupt data, timeouts, changed encoder configuration, dropped/reordered output, and a result that is not smaller. Both container color metadata and decoded frames are checked for HDR; tone mapping is not implemented. This deliberately replaces the video's real-time recorder fallback. Recording playback against a separate clock can introduce drift during stalls; Web Audio track presence also cannot establish that original sound survived. Standalone audio still uses its existing Web Audio/MediaRecorder approach. No playback permission or extra user action is needed for video compression.

H.264 encoding probes Baseline and constrained Baseline with hardware preference first, then the browser's default. Level 3.1 is also tried when the output dimensions, frame rate, and bitrate fit its limits. All probes retain quality mode and profiles without B-frames, keeping the original presentation timeline valid. The existing codec-check timeout bounds the entire probe sequence.

Source presentation timestamps remain canonical throughout decoding, frame construction, and encoding. Each native timestamp is checked against the expected frame with a maximum two-microsecond rounding allowance, and the original timestamp/duration is written to the MP4. This handles [WebKit's documented one-microsecond VideoFrame timestamp mutation](https://bugs.webkit.org/show_bug.cgi?id=321880), which otherwise breaks exact timestamp-key lookups. Baseline outputs must still arrive in order; missing, duplicate, reordered, and substantially retimed frames reject. Logs include `timestampCorrections` and `maxTimestampCorrectionUs`, or `timestampMismatch` with the actual/expected times when outside the allowance.

Video attempts print two JSON console records prefixed `[media-compression] start` and `[media-compression] result`. The result includes input/output bytes, elapsed milliseconds, available APIs, processing phase, source/output codecs when known, and the fallback reason. `below-size-threshold`, `native-codecs-unavailable`, `decoder-unsupported`, `encoder-unsupported`, `outside-compression-budget`, and `no-smaller-output` distinguish normal skips. Exceptions use `compression-error` with the specific message. These details are also available in the existing `compression-output` callback's additive `diagnostics` field. File contents and names are not logged. For an unchanged iPhone upload, copy the result line and any accompanying warning; if only the start line appears, report that too.

The three existing profiles and size thresholds are unchanged. The 25% minimum *estimated* saving includes actual original AAC bytes and MP4 overhead. Final output must still be smaller. Limits default to 600 seconds, 100,000 samples, 16 MiB of metadata, and 64 MiB of output. `videoMaxDurationSeconds` (hard cap 3,600), `videoMaxSamples` (hard cap 100,000), `videoMaxOutputBytes`, and `videoCodecTimeoutMs` (default 15,000 per codec wait) can be supplied through existing custom options. Files beyond these budgets upload unchanged. Metadata/sample counts are checked before sample-table expansion; source payloads use bounded read-ahead; AAC is assembled from Blob slices; decoder and encoder queues are limited and every VideoFrame is closed. This bounds application-owned buffers, not browser/GPU memory.

MP4Box is pinned to 2.4.1 because this implementation uses its sample-table and fragment APIs. Re-run the container and browser suites before upgrading it. See the [WebCodecs specification](https://www.w3.org/TR/webcodecs/), [AVC configuration/framing requirements](https://www.w3.org/TR/webcodecs-avc-codec-registration/), [HEVC configuration/framing requirements](https://www.w3.org/TR/webcodecs-hevc-codec-registration/), and [MP4Box project](https://github.com/gpac/mp4box.js) for the underlying API contracts. A browser version is never used as a substitute for runtime codec capability checks.

Normal attachment uploads transfer only the chosen result to Firebase. Extra raw/compressed/uploaded diagnostic snapshots are disabled by default. To investigate stored bytes, explicitly set `NEXT_PUBLIC_VIDEO_UPLOAD_DIAGNOSTICS=true` before starting the dev server or building the app. This adds the original plus two extra output transfers and increases storage use. Console diagnostics remain available without enabling snapshots. The flag is documented in `.env.local.example`.

## Automated resource and container checks

```sh
npm run test:media
```

The 66 Node tests cover shared progress and fallback, console diagnostics, lazy imports, image options, audio cleanup/timeouts, frame ordering/reduction, timestamp rounding without drift, codec negotiation/failures, output budgets, HEVC configuration forwarding, HDR rejection, AAC preservation, edit lists, rotation, sparse metadata reads, and malformed sample counts. Upload integration tests mock Firebase calls and verify that normal uploads send one result while explicitly enabled diagnostics retain their snapshots.

The unit tests need application dependencies, but no browser or FFmpeg. Use Node 22.7 or newer: [Node detects ES module syntax](https://nodejs.org/api/packages.html#syntax-detection) in `.js` source and tests while the Next.js configuration remains CommonJS. Node may print a module-type detection warning. `npm run test:video` runs only the codec/container tests. `.github/workflows/media-tests.yml` runs the full unit suite on Node 22 for pushes and PRs, independently of the deployment workflow. Real codec interoperability is checked separately below.

## Reproducible desktop browser integration test

Install application dependencies, then run with Node 22.7 or newer, a local Chromium browser, FFmpeg, and FFprobe:

```sh
npm run test:video:browser
```

The script uses Chromium's DevTools Protocol directly and requires no Playwright or Puppeteer dependency. It serves the actual source modules from a temporary localhost server, generates synthetic media with system FFmpeg, runs the public compression API in the browser, and writes inputs, outputs, and `results.json` to a temporary directory printed in the terminal. FFmpeg is only a development test dependency. Chrome uses a new temporary profile, without accessing an existing browser profile.

Optional environment variables:

```sh
CHROME_PATH=/path/to/chromium VIDEO_TEST_OUTPUT=/tmp/penpal-video npm run test:video:browser
VIDEO_TEST_DURATION=60 VIDEO_TEST_CASE=bframes npm run test:video:browser
VIDEO_TEST_DURATION=12 VIDEO_TEST_WIDTH=720 VIDEO_TEST_HEIGHT=1280 VIDEO_TEST_TARGET_WIDTH=640 VIDEO_TEST_TARGET_BITRATE=650000 VIDEO_TEST_CASE=iphone-like npm run test:video:browser
```

Tests use a six-second 960×540 H.264 source with B-frames and stereo 44.1 kHz AAC, then derive MOV, rotated MOV, silent-AAC, video-only, delayed-audio, multiple-audio-track, unsupported-PCM, tiny, already-compressed, and corrupt fixtures. Additional HEVC MOV fixtures exercise SDR compression and 10-bit HLG fallback. A timestamp regression injects one-microsecond changes into constructed VideoFrames and actual native encoded chunks, then compares every output video packet's timestamp/duration against an unmodified control. A host without HEVC decoding explicitly reports that limitation and verifies original fallback only for the SDR fixture. Most tests lower the size threshold to exercise processing quickly; the tiny-file test uses the real low-end threshold. These are generated regression fixtures, not recordings from a physical iPhone.

The checks cover:

- Smaller output and unchanged bytes when the original is returned.
- Full output decoding with FFmpeg, plus loading and starting playback in Chrome.
- H.264 output, expected dimensions/FPS/duration, and preserved portrait display orientation.
- Original audio-track count, byte-for-byte AAC packet hashes (including intentionally silent AAC), and the relative audio/video start offset.
- Progress callbacks bounded between zero and one, monotonically increasing, and ending at one.
- Measured wall-clock time and throughput relative to source duration.

The full suite also includes two image checks: a generated JPEG is resized/compressed through the image worker loaded from the local installed dependency, and a corrupt JPEG retains its original bytes. Both passed in the latest browser run.

The JavaScript heap reading after a run is reported only as an observation. It is **not** peak memory and excludes codec/GPU/native allocations. Headless desktop results do not predict iPhone speed, thermal behavior, power use, or background-tab behavior.

## Physical-device verification

| Device/browser | Input | Verify | Status |
| --- | --- | --- | --- |
| iPhone Safari with native decoder and H.264 encoder support | Actual H.264/AAC portrait MOV comparable to `IMG_6385.MOV` | Audible audio, portrait playback, sync at start/middle/end, size, elapsed time | Pending physical device |
| iPhone 13 Chrome | Actual 13,475,006-byte H.264 portrait MOV, 720×1280, 29.33 s | Regression for the formerly unchanged upload | User confirmed pass on 2026-10-11 after timestamp fix; output size/time not supplied |
| iPhone Safari/Chrome with native HEVC decoder support | Actual SDR HEVC/AAC MOV | Smaller H.264 output, preserved audio/sync/orientation | Pending physical device |
| iPhone Safari without a supported native encoder | Same MOV | Safe compatibility behavior, original retained if processing cannot preserve audio | Pending physical device |
| iPhone Safari | Multiple audio tracks, spatial/unsupported audio | Every original track retained through original-file fallback | Pending physical device |
| Android Chrome | Actual phone-recorded MP4 | Playback, audio, sync, dimensions, size, elapsed time | Pending physical device |
| Desktop Chrome | Generated H.264/AAC MP4 and MOV with B-frames | Automated checks above | See recorded run below |
| Supported desktop and mobile browsers | Video without audio and intentionally silent AAC | Silent sources remain valid; AAC silence remains an audio track | Desktop automation; mobile pending |
| Supported desktop and mobile browsers | Tiny video and highly compressed video | Immediate unchanged-original result | Desktop automation; mobile pending |
| iPhone Safari and Android Chrome | Long recording, repeated consecutive uploads | Memory growth, thermal throttling, responsiveness, end-of-file sync | Pending physical devices |
| Any supported browser | Corrupt/truncated input or native codec failure | Original upload remains usable; no silent replacement | Desktop automation; mobile pending |

For each physical-device run record browser/OS/device version, source duration and bytes, result bytes and MIME type, wall-clock seconds, source-duration/processing-time ratio, dimensions/FPS, audio/video codecs, whether fallback ran, and sync observations at the beginning, middle, and end. Compare audio from the source and output by listening. Check uploads through `attachments.js` and downloaded Firebase files, including their filename extensions. No real iPhone/Android or Firebase upload validation is implied by the generated desktop test.

## Recorded local run

All 15 video and two image browser cases passed in desktop Chrome on macOS. Compressed videos fully decoded in FFmpeg, loaded/started playback in Chrome, preserved original AAC packet hashes, and retained the relative audio/video start offset within 30 ms. Intentional AAC silence remained an audio track. These are synthetic fixtures, not physical-phone measurements.

| Input | Duration | Original → output | Compression time | Throughput |
| --- | --- | --- | --- | --- |
| H.264/AAC MP4, 960×540 | 6 s | 3.43 MB → 0.27 MB | 1.61 s | 3.7× real time |
| Equivalent MOV | 6 s | 3.43 MB → 0.27 MB | 0.91 s | 6.6× real time |
| H.264/AAC MP4, 960×540 | 60 s | 34.66 MB → 2.70 MB | 6.82 s | 8.8× real time |
| H.264/AAC portrait MOV, 720×1280 | 12 s | 12.78 MB → 1.14 MB | 2.14 s | 5.6× real time |
| SDR HEVC/AAC MOV, 960×540 | 6 s | 5.90 MB → 0.27 MB | 1.16 s | 5.2× real time |

MB here is decimal. The first three runs target 480px width, 15 FPS and 450 kbps before pixel adjustment. The portrait run uses balanced-profile 640px width, 15 FPS and 650 kbps; output is 640×1136. The six compressed short cases saved 87.5–94.2%. The long run preserved all 2,585 AAC packets. Measured JavaScript heap after the long run was about 45.3 MB; **peak/native/GPU memory was not measured**. Fragmented MP4 players may report a duration including original composition/priming offsets (about 67 ms on these B-frame fixtures); audio sample timing itself remains unchanged.

The timestamp regression corrected 180 injected one-microsecond changes while preserving the original first CTS (66,667 microseconds), every output video packet timestamp/duration relative to an unmodified native control, and all 260 AAC packet hashes. The 10-bit HLG HEVC fixture retained its exact original bytes. The image worker resized/compressed a 4.67 MB JPEG to 245 KB at 1024×640.

The iPhone 13 Chrome retest passed after this timestamp fix, as confirmed by the user. No physical-device size or timing benchmark was supplied. Broader Safari/Android, HEVC/HDR, long-session thermal/memory, and downloaded-Firebase-file acceptance remain separate device checks.

Unit tests and lint pass. The full build reports existing warnings in AudioRecorder and ImageUploader. A local production build passes with `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` pointing to a temporary font fixture because external Google Fonts DNS is unavailable in the development sandbox; no production font configuration is changed.
