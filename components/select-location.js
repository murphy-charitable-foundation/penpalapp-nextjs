import Button from "./general/Button";

const SelectProfileLocation = ({ updateStage, countries, location, setLocation }) => {
	const buttonClasses = () => {
		if (!location) { 
			return "w-[80%] mx-auto mt-[100px] p-2 bg-[#1C1B1F1F] text-[#1D1D00] font-semibold  rounded-[100px]"
		}
		return "w-[80%] mx-auto mt-[100px] p-2 bg-dark-green text-white font-semibold  rounded-[100px]"
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
					{countries?.length && countries.map(c, index => (
						<option key={index} value={c.name}>{c.name}</option>
					))}
				</select>
			</div>
			<Button
				btnType="button"
				btnText="Continue"
				color={buttonClasses()}
				onClick={() => updateStage(3, false)}
			/>
			<Button
				btnType="button"
				btnText="Skip for now"
				color="bg-transparent"
				textColor="text-black"
				onClick={() => updateStage(3, true)}
			/>
		</div>
	);
};

export default SelectProfileLocation;
