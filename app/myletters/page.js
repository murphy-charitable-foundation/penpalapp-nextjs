import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Placeholder icons
import UserIcon from '/public/usericon.png';
import MailIcon from '/public/lettericon.png';

const InboxPage = () => {
    const letters = [
        {
            id: 1,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },

        {
            id: 2,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },

        {
            id: 3,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },


        {
            id: 4,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },


        {
            id: 5,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },



        {
            id: 6,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },

        {
            id: 7,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },

        {
            id: 8,
            from: 'John Doe',
            preview: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
            received: '2h ago',
            unread: true,
            image: '/usericon.png',
        },


        // Add more letters as needed
    ];

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-lg mx-auto bg-white shadow-lg rounded-lg overflow-hidden">

                <Link href="/login">

                    <button>
                        <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </Link>
                {/* Page Header */}
                <header className="flex justify-between items-center bg-[#F8F8F8] p-4 border-b border-gray-300">
                    <Link href="/">
                        <button className="flex items-center">
                            <Image src={MailIcon} alt="Inbox" width={40} height={40} />
                            <span className="ml-2 text-xl font-semibold text-gray-600">Inbox</span>
                        </button>
                    </Link>
                </header>

                {/* Letters List */}
                <main className="p-4">
                    {letters.map((letter) => (
                        <div key={letter.id} className={`flex items-center p-3 mb-2 rounded-lg ${letter.unread ? 'bg-[#e0f7fa]' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-300`}>
                            <div className="w-12 h-12 relative mr-4">
                                <Image src={letter.image || UserIcon} alt={letter.from} layout="fill" className="rounded-full" />
                                {letter.unread && <span className="absolute bottom-0 right-0 block h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-800">{letter.from}</h3>
                                <p className="text-gray-500">{letter.preview}</p>
                                <span className="text-xs text-gray-400">{letter.received}</span>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default InboxPage;
