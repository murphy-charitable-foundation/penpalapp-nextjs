import Cropper from 'react-cropper';
import Dropzone from 'react-dropzone';
import 'cropperjs/dist/cropper.css';

const SelectProfileImage = ({ image, handleSave, newProfileImage, previewURL, buttonClasses, handleDrop, handleCrop, cropperRef, updateStage }) => {
	return (
		<div className='flex flex-col'>
			<h2 className='text-[#034792] text-center text-2xl font-bold my-[64px]'>Add a profile avatar</h2>
			{/* {stage === 0 ? ()} */}
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
						style={{ height: 400, width: '100%' }}
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
			<button className={buttonClasses()} onClick={() => updateStage(1, false)}>Continue</button>
			<button className='text-black font-semibold mt-[14px] mb-[40px]' onClick={() => updateStage(1, true)}>Skip for now</button>
		</div>
	);
};

export default SelectProfileImage;
