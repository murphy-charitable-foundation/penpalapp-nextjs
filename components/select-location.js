import { useState } from "react";

const SelectProfileLocation = ({ updateStage, countries }) => {
	const [location, setLocation] = useState(null)
	const buttonClasses = () => {
		if (!location) { 
			return "w-[80%] mx-auto mt-[100px] p-2 bg-[#1C1B1F1F] text-[#1D1D00] font-semibold  rounded-[100px]"
		}
		return "w-[80%] mx-auto mt-[100px] p-2 bg-[#4E802A] text-white font-semibold  rounded-[100px]"
	}
	return (
		<div className='flex flex-col'>
			<h2 className='text-[#034792] text-center text-2xl font-bold my-[64px]'>Where are you located?</h2>
			<div>
				<label htmlFor="location" className="text-sm font-medium text-gray-700 block mb-2">Country</label>
				<select
					id="location"
					value={location}
					onChange={(e) => setLocation(e.target.value)}
					className="w-full p-3 border border-gray-300 rounded-md text-black"
				>
					{countries?.length && countries.map(c => (
						<option value={c.name}>{c.name}</option>
					))}
				</select>
			</div>
			<button className={buttonClasses()} onClick={() => updateStage(2, false)}>Continue</button>
			<button className='text-black font-semibold mt-[14px] mb-[40px]' onClick={() => updateStage(2, true)}>Skip for now</button>
		</div>
	);
};

export default SelectProfileLocation;
