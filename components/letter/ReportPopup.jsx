import Button from "../Button";
import {useEffect, useState} from "react"

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import * as Sentry from "@sentry/nextjs";


const ReportPopup = ({ setShowPopup, setShowConfirmReportPopup, sender, content}) => {

  const [data, setData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pathParams, setPathParams] = useState('');
  const auth = getAuth();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setPathParams(path); // Get the path parameters
    }
  }, []);

  const fetchUserData = async (user) => {
    try {
      // Step 1: Fetch the user document using the reference
      const userRef = doc(db, "users", user); // Replace "users" with your actual collection name
    
      const userSnapshot = await getDoc(userRef);
  
      // Step 2: Check if the document exists
      if (!userSnapshot.exists()) {
        Sentry.captureException("User document does not exist");
        return;
      }
  
      
      const userData = userSnapshot.data();
  
      return userData; 
    } catch (error) {
      Sentry.captureException(error);
    }
  };
  const userInfo = fetchUserData(sender);
  const receiver_email = auth.currentUser.email;
  const currentUrl = `${window.location.origin}${pathParams}`;
  

  async function handleButtonClick(content) {
    try {
      const excerpt = content.substring(0, 100) + '...';
      const message = `Hello, the user with the email: ${receiver_email}, reported this message: ${currentUrl} sent by a user with the email: ${userInfo.email}. Here is a brief excerpt from the reported message, "${excerpt}"`
      
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }), // Send data as JSON
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
     
    } catch (error) {
      Sentry.captureException("Could not send request to SendGrid" + error);
    }
  }

  return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
        <div className="bg-white space-y-4 shadow-md w-[300px] rounded-md p-4 flex flex-col items-center">
          <h1 className="font-semibold text-sm text-red-500">
            Are you sure that you want to report this letter?
          </h1>
          <p className="text-gray-700 text-sm">
            This action will not be undone afterwards.
          </p>
          <div className="flex justify-between gap-2 w-full">
            <Button onClick={() => setShowPopup(false)} type="info" size="sm">
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleButtonClick(content);
                setShowPopup(false);
                setShowConfirmReportPopup(true);
              }}
              type="success"
              size="sm"
            >
              Report
            </Button>
          </div>
        </div>
      </div>
    );
  
};

export default ReportPopup;
