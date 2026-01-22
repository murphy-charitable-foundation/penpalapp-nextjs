"use client";
import {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import Cropper from "react-easy-crop";

const AvatarCropper = forwardRef(({ type = "gallery", onComplete }, ref) => {
  const inputRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const cropImage = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) return;

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas 2D context not available");
      return;
    }
    const { x, y, width, height } = croppedAreaPixels;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const base64 = canvas.toDataURL("image/jpeg");

    setShowCropper(false);
    setImageSrc(null);
    onComplete?.(base64);
  }, [croppedAreaPixels, imageSrc, onComplete]);

  useImperativeHandle(ref, () => ({
    pickPicture: () => inputRef.current?.click(),
  }));

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture={type === "camera" ? "user" : undefined}
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div className="relative flex-1 p-5">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              minZoom={0.5}
              maxZoom={5}
              aspect={1}
              cropShape="round"
              cropSize={{ width: 360, height: 360 }}
              objectFit="horizontal-cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="p-4 flex justify-between bg-black text-white">
            <button
              onClick={() => setShowCropper(false)}
              className="bg-gray-600 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={cropImage}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              Select
            </button>
          </div>
        </div>
      )}
    </>
  );
});

AvatarCropper.displayName = "AvatarCropper";
export default AvatarCropper;
