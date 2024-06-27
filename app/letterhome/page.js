"use client"


// pages/index.js
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '../firebaseConfig'; // Adjust the import path as necessary
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { differenceInCalendarYears } from 'date-fns';
import BottomNavBar from '@/components/bottom-nav-bar';



import { FaUserCircle, FaRegEnvelope, FaCompass, FaInfoCircle, FaPhone, FaDonate, FaCog, FaBell, FaPen, FaUserAlt, FaHandHoldingHeart, FaInfo, FaEnvelopeOpenText } from 'react-icons/fa';
import { fetchData, fetchRecipients } from '../utils/firestore';



export default function Home() {
	const [userName, setUserName] = useState('');
	const [country, setCountry] = useState('');
	const [letters, setLetters] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchUserData = async () => {
			if (auth.currentUser) {
				const uid = auth.currentUser.uid;
				const docRef = doc(db, "users", uid);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const userData = docSnap.data();
					setUserName(userData.first_name || 'Unknown User');
					setCountry(userData.country || 'Unknown Country');
				} else {
					console.log("No such document!");
				}
			} else {
				console.log("No user logged in");
			}
		};

		fetchUserData();
	}, []);

	useEffect(() => {
		setIsLoading(true);
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const letters = await fetchData()
				// this will be slow but may be the only way
				for await (const l of letters) {
					const rec = await fetchRecipients(l.letterboxId)
					l.recipients = rec
				}
				console.log(letters)
				setLetters(letters)

			} else {
				setError('No user logged in.');
				setIsLoading(false);
			}
		});

		return () => unsubscribe();
	}, []);

	return (
		<div className="bg-gray-100 min-h-screen py-6">
			<div className="max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
				<header className="flex justify-between items-center bg-blue-100 p-5 border-b border-gray-200">

					<Link href="/profile">
						<button className="flex items-center text-gray-700">
							<FaUserCircle className="h-8 w-8" />
							<div className="ml-3">
								<div className="font-semibold text-lg">{userName}</div>
								<div className="text-sm text-gray-600">{country}</div>
							</div>
						</button>
					</Link>

					<div className="flex items-center space-x-4">
						<Link href="/settings">
							<button className="text-gray-700 hover:text-blue-600"><FaCog className="h-7 w-7" /></button>
						</Link>
						<Link href="/discover">
							<button className="text-gray-700 hover:text-blue-600"><FaBell className="h-7 w-7" /></button>
						</Link>
						<Link href="/letterwrite">
							<button className="text-gray-700 hover:text-blue-600"><FaPen className="h-7 w-7" /></button>
						</Link>
					</div>
				</header>
				<main className="p-6">
					<section className="mt-8">
						<h2 className="font-bold text-xl mb-4 text-gray-800 flex justify-between items-center">
							Last letters
							<Link href="/letterhome">
								<button className="px-3 py-1 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300">Show more</button>
							</Link>
						</h2>
						{letters.length > 0 ? (
							letters.map((letter, i) => (
								<a key={letter.id + '_' + i} href={`/letters/${letter.letterboxId}`} className="flex items-center p-4 mb-3 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
									<div className="flex-grow">
										{letter.recipients?.map(rec => (
											<div key={rec.first_name + '_' + rec.last_name} className='flex'>
												<div className="w-12 h-12 relative mr-4">
												{rec?.profile_picture ? (
													<img src={rec?.profile_picture} class="w-full h-full object-cover" />
												) : (
													<span className="text-xl text-gray-600">
														{rec?.first_name?.[0]}
													</span>
												)}
												</div>
												<h3 className="font-semibold text-gray-800">{rec.first_name} {rec.last_name}</h3>
											</div>
										))}
										<p className="text-gray-600 truncate">{letter.content}</p>
										<span className="text-xs text-gray-400">{letter.received}</span>
									</div>
								</a>
							))
						) : (
							<p className="text-gray-500">No letters found.</p>
						)}
					</section>

				</main>
				<BottomNavBar />
			</div>
		</div>
	);
}
