import EditProfileImage from './edit-profile-image';
import Button from './general/Button';

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
			<Button
				btnType="button"
				btnText="Continue"
				color={buttonClasses()}
				disabled={!previewURL}
				onClick={() => updateStage(2, false)}
			/>
			<Button
				btnType="button"
				btnText="Skip for now"
				color="bg-transparent"
				textColor="text-black"
				onClick={() => updateStage(2, true)}
			/>
		</div>
	);
};

export default SelectProfileImage;
