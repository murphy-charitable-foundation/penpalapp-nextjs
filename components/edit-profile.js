import { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import Dropzone from 'react-dropzone';
import 'cropperjs/dist/cropper.css';
import SelectProfileImage from './select-profile-image';

const EditProfileImage = () => {
	const [image, setImage] = useState(null);
	const [croppedImage, setCroppedImage] = useState(null);
	const [newProfileImage, setNewProfileImage] = useState(null);
	const [previewURL, setPreviewURL] = useState(null);
	const [stage, setStage] = useState(0);
	const cropperRef = useRef();
	const buttonClasses = () => {
		if (!croppedImage) {
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
		onSave();
		// Reset state
		setImage(null);
	};

	const resetAll = () => {
		setImage(null)
		setNewProfileImage(null)
		setCroppedImage(null)
		setPreviewURL(null)
	}

	const updateStage = (skip=false) => {
		if(skip){
			resetAll()
		}
		setStage(1)
	}

	return (
		<div className='flex flex-col'>
			{stage === 0 && (
				<SelectProfileImage 
					image={image}
					handleSave={handleSave}
					newProfileImage={newProfileImage}
					previewURL={previewURL}
					buttonClasses={buttonClasses}
					handleDrop={handleDrop}
					handleCrop={handleCrop}
					cropperRef={cropperRef}
					updateStage={updateStage}
				/>
			)}
			{stage === 1 && (
				<></>
			)}
		</div>
	);
};

export default EditProfileImage;
