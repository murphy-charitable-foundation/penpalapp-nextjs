import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import Image from "next/image";

const ImageViewer = ({ imageSources, styleClass }) => {
  return (
    <PhotoProvider>
      {imageSources.map((imageSource, index) => (
        <PhotoView src={imageSource} key={index}>
          <Image
            height={100}
            width={100}
            className={`${styleClass} cursor-pointer mr-1`}
            src={imageSource}
            alt="image"
          />
        </PhotoView>
      ))}
    </PhotoProvider>
  );
};

export default ImageViewer;
