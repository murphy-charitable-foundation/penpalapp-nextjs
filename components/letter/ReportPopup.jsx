import Button from "../Button";
import {useEffect, useState} from "react"
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../app/firebaseConfig"; // Adjust this path as necessary


const ReportPopup = ({ setShowPopup, setShowConfirmReportPopup, user, content, id }) => {

  const [data, setData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const [pathParams, setPathParams] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setPathParams(path); // Get the path parameters
    }
  }, []);

  const fetchUserData = async (userRef) => {
    try {
      // Step 1: Fetch the user document using the reference
      const userSnapshot = await getDoc(userRef);
  
      // Step 2: Check if the document exists
      if (!userSnapshot.exists()) {
        console.error("User document does not exist");
        return;
      }
  
      
      const userData = userSnapshot.data();
      console.log("User Data:", userData);
  
      return userData; 
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };
  const userInfo = fetchUserData(user);
  const currentUrl = `${window.location.origin}${pathParams}`;
  

  async function handleButtonClick( user, content) {
    try {
      const excerpt = content.substring(0, 100) + '...';
      const message = `Hello, the user ${userInfo.first_name} ${userInfo.last_name}, reported this message: ${currentUrl}. Here is a brief excerpt from the reported message, "${excerpt}"`
      
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
      console.error(error);
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
                handleButtonClick(user, content);
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
