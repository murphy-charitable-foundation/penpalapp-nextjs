import { Cropper } from "react-cropper"
import Dropzone from "react-dropzone"
import 'cropperjs/dist/cropper.css';

const EditProfileImage = ({ image, handleSave, newProfileImage, previewURL, buttonClasses, handleDrop, handleCrop, cropperRef, updateStage }) => {
    return (
        <>
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
            )}
        </>
    )
}

export default EditProfileImage