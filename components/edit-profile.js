import { useState, useRef, useEffect } from 'react';
import SelectProfileImage from './select-profile-image';
import SelectProfileLocation from './select-location';
import { auth, db, storage } from '@/app/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from '@firebase/storage';

const EditProfileImage = ({ router }) => {
	const [image, setImage] = useState(null);
	const [croppedImage, setCroppedImage] = useState(null);
	const [newProfileImage, setNewProfileImage] = useState(null);
	const [previewURL, setPreviewURL] = useState(null);
	const [stage, setStage] = useState(0);
	const [storageUrl, setStorageUrl] = useState(null)
	const [location, setLocation] = useState(null)
	const cropperRef = useRef();

	const buttonClasses = () => {
		if (!previewURL) {
			return "w-[80%] mx-auto mt-[100px] p-2 bg-[#1C1B1F1F] text-[#1D1D00] font-semibold  rounded-[100px]"
		}
		return "w-[80%] mx-auto mt-[100px] p-2 bg-[#4E802A] text-white font-semibold  rounded-[100px]"
	}
	const [countries, setCountries] = useState([]);

	useEffect(() => {
		const fetchCountries = async () => {
			const res = await fetch("https://countriesnow.space/api/v0.1/countries/iso");
			const data = await res.json();
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

	const updateStage = async (stage, skip = false) => {
		if (skip) {
			resetAll()
		}
		const uid = auth.currentUser?.uid
		if (stage === 1) {
			// const uid = user.uid; // Get the user ID from the created user
			console.log(auth.currentUser?.uid)
			// Create a document in Firestore in "users" collection with UID as the document key
			if (previewURL) {
				const storageRef = ref(storage, `profile/${previewURL}`);
				const uploadTask = uploadBytesResumable(storageRef, previewURL);
				uploadTask.on('state_changed',
					(snapshot) => {
						// const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						// setUploadProgress(progress);
					},
					(error) => {
						console.error('Upload error:', error);
					},
					async () => {
						const url = await getDownloadURL(uploadTask.snapshot.ref);
						setStorageUrl(url)
					}
				);
				await updateDoc(doc(db, "users", uid), {
					photo_uri: storageUrl
				});
			}
		}
		if (stage === 2) {
			if(location){
				await updateDoc(doc(db, "users", uid), {
					country: location
				});
			}
			router.push("/profile");
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
				<SelectProfileLocation countries={countries} updateStage={updateStage} location={location} setLocation={setLocation} />
			)}
		</div>
	);
};

export default EditProfileImage;
