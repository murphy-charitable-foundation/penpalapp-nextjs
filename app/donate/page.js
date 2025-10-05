"use client";

// pages/donate.js
import Link from 'next/link';
import BottomNavBar from '../../components/bottom-nav-bar';
import Button from '../../components/general/Button';
import { BackButton } from '../../components/general/BackButton';
import { PageBackground } from '../../components/general/PageBackground';
import { PageContainer } from '../../components/general/PageContainer';
export default function Donate() {
  const details = [
    { label: "Account Name", value: "Murphy Charitable Foundation" },
    { label: "Account Number", value: "01113657970966" },
    { label: "Bank Name", value: "Dfcu Bank Uganda" },
    { label: "Swift Code", value: "DFCUUGKA" },
  ];

    return (
        <PageBackground className="w-full flex flex-col items-center justify-center p-4 pb-20">
            <PageContainer maxWidth="xxl">
                <BackButton />
                
                <h1 className="text-center text-black font-medium">Sponsor a Child</h1>
                <div>
                    <p className="mb-2">
                        Your generosity makes our work possible. Whether you contribute financially or as advocate for good, you make a real difference.
                    </p>
                    <p className="text-gray-700 text-xs italic">
                        You may include a note to indicate your preferred category:
                    </p>
                    <p className="text-gray-700 text-xs italic">
                        Education, Beddings & Clothing, Medical Care, or Scholastic Materials.
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        href="https://www.every.org/murphy-charitable-foundation-uganda?utm_campaign=donate-link#/donate/card"
                        target="_blank"
                    >
                        <Button
                            btnText="Sponsor Now"
                        />
                    </Link>
                </div>

                {/* Payment Details Section */}
                <div className="bg-secondary rounded-lg shadow-lg p-6 max-w-2xl w-full">
                    <h2 className="text-center text-3xl text-white font-bold mb-6">Payment Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {details.map((detail, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                                <h3 className="text-lg text-secondary font-bold">{detail.label}</h3>
                                <p className="text-md mt-2 text-gray-800">{detail.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            <BottomNavBar />
            </PageContainer>
    
                
        
        </PageBackground>
        
        
    );
}
