import EditProfileImage from './edit-profile-image';

const SelectProfileImage = ({ image, handleSave, newProfileImage, previewURL, buttonClasses, handleDrop, handleCrop, cropperRef, updateStage }) => {
	return (
		<div className='flex flex-col'>
			<h2 className='text-[#034792] text-center text-2xl font-bold my-[64px]'>Add a profile avatar</h2>
			<EditProfileImage
				image={image}
				handleSave={handleSave}
				newProfileImage={newProfileImage}
				previewURL={previewURL}
				handleDrop={handleDrop}
				handleCrop={handleCrop}
				cropperRef={cropperRef}
			/>
			<button className={buttonClasses()} disabled={!previewURL} onClick={() => updateStage(2, false)}>Continue</button>
			<button className='text-black font-semibold mt-[14px] mb-[40px]' onClick={() => updateStage(2, true)}>Skip for now</button>
		</div>
	);
};

export default SelectProfileImage;
