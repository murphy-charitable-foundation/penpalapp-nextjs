import { useState, useRef, useEffect } from 'react';
import SelectProfileImage from './select-profile-image';
import SelectProfileLocation from './select-location';

const EditProfileImage = ({ }) => {
	// console.log("C", countries)
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
	const [countries, setCountries] = useState([]);

	useEffect(() => {
		const fetchCountries = async () => {
			const res = await fetch("https://countriesnow.space/api/v0.1/countries/iso");
			const data = await res.json();
			console.log(data)
			setCountries(data.data)
		}
		fetchCountries()
	}, [stage])

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

	const updateStage = (stage, skip = false) => {
		if (skip) {
			resetAll()
		}
		setStage(stage)
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
				<SelectProfileLocation countries={countries} />
			)}
		</div>
	);
};

// export async function getStaticProps() {
// 	// Fetch options from an API
// 	const res = await fetch("https://countriesnow.space/api/v0.1/countries/iso");
// 	const countries = await res.json();

// 	// Pass options to the page component as props
// 	return {
// 		props: {
// 			countries: countries.data ?? [],
// 		},
// 	};
// }

export default EditProfileImage;
