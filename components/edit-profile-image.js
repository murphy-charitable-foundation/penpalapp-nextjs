import { Cropper } from "react-cropper"
import Dropzone from "react-dropzone"
import 'cropperjs/dist/cropper.css';

const EditProfileImage = ({ image, newProfileImage, previewURL, handleDrop, handleCrop, cropperRef }) => {
	return (
		<>
			{!image ? (
				<Dropzone onDrop={handleDrop}>
					{({ getRootProps, getInputProps }) => (
						<section>
							<div {...getRootProps()}>
								<input {...getInputProps()} />
								<p className={`bg-[${newProfileImage ? '' : '#65B427' }] rounded-[50%] h-[220px] w-[220px] mx-auto cursor-pointer flex flex-center border-4 border-darkgray `}>
									{newProfileImage ? (
										<img src={previewURL} className='m-auto my-auto rounded-[50%]' />
									) : (
										<img src='/blackcameraicon.svg' className='m-auto w-10 h-10 my-auto' />
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
					
				</div>
			)}
		</>
	)
}

export default EditProfileImage