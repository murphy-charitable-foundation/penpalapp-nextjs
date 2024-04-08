import EditProfileImage from './edit-profile-image';

const SelectProfileImage = ({ image, handleSave, newProfileImage, previewURL, buttonClasses, handleDrop, handleCrop, cropperRef, updateStage }) => {
	return (
		<div className='flex flex-col'>
			<h2 className='text-[#034792] text-center text-2xl font-bold my-[64px]'>Add a profile avatar</h2>
			{/* {stage === 0 ? ()} */}
			<EditProfileImage
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
			{/* {!image ? (
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
				<div className='flex flex-col'>
					<Cropper
						src={image}
						style={{ height: 400, width: '100%' }}
						aspectRatio={1}
						guides={true}
						crop={handleCrop}
						ref={cropperRef}
						viewMode={1}
					/>
					<br />
					<button className='w-[80%] mx-auto mt-[100px] p-2 bg-[#034792] text-[#ffffff] font-semibold  rounded-[100px]' onClick={handleSave}>Save</button>
				</div>
			)} */}
			<button className={buttonClasses()} disabled={!previewURL} onClick={() => updateStage(2, false)}>Continue</button>
			<button className='text-black font-semibold mt-[14px] mb-[40px]' onClick={() => updateStage(2, true)}>Skip for now</button>
		</div>
	);
};

export default SelectProfileImage;
