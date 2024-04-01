import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import Dropzone from 'react-dropzone';
import 'cropperjs/dist/cropper.css';

const EditProfileImage = () => {
  const [image, setImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const cropperRef = useRef();
  const buttonClasses = () => {
    if(!croppedImage){
        return "w-[80%] mx-auto mt-[100px] p-2 bg-[#1C1B1F1F] text-[#1D1D00] font-semibold  rounded-[100px]"
    } 
    return "w-[80%] mx-auto mt-[100px] p-2 bg-[#4E802A] text-white font-semibold  rounded-[100px]"
  }

  const handleDrop = (acceptedFiles) => {
    setImage(URL.createObjectURL(acceptedFiles[0]));
  };

  const handleCrop = () => {
    if (cropperRef.current && typeof cropperRef.current?.cropper?.getCroppedCanvas === 'function') {
        const canvas = cropperRef.current.cropper.getCroppedCanvas();
        canvas.toBlob((blob) => {
            setCroppedImage(blob);
        });
    }
  };

  const onSave = () => {
    setNewProfileImage(croppedImage)
    setPreviewURL(URL.createObjectURL(croppedImage));
  }

  

  const handleSave = () => {
    // Here you can save the cropped image to Firestore or do any other processing
    onSave();
    // Reset state
    setImage(null);
    // setCroppedImage(null);
  };

  return (
    <div className='flex flex-col'>
      <h2 className='text-[#034792] text-center text-2xl font-bold my-[64px]'>Add a profile avatar</h2>
      {!image ? (
      <Dropzone onDrop={handleDrop}>
        {({ getRootProps, getInputProps }) => (
          <section>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <p className='bg-[#65B427] rounded-[50%] h-[220px] w-[220px] mx-auto cursor-pointer flex flex-center'>
                {newProfileImage ? (
                    <img src={previewURL} className='m-auto my-auto rounded-[50%]' />
                ) : (
                    <img src='/cameraicon.png' className='m-auto my-auto' />
                )}
            </p>
            </div>
          </section>
        )}
      </Dropzone>

      ) : (
            <div>
              <h3>Preview</h3>
              <Cropper
                src={image}
                style={{ height: 400, width: '100%'}}
                aspectRatio={1}
                guides={true}
                crop={handleCrop}
                ref={cropperRef}
                viewMode={1}
              />
              <br />
              <button onClick={handleSave}>Save</button>
            </div>
      )}
      <button className={buttonClasses()}>Continue</button>
      <button className='text-black font-semibold mt-[14px] mb-[40px]'>Skip for now</button>
    </div>
  );
};

export default EditProfileImage;
