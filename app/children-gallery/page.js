"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileImage from "../../components/general/ProfileImage";
import Button from "../../components/general/Button";
import { PageBackground } from "../../components/general/PageBackground";
import { PageContainer } from "../../components/general/PageContainer";
import { useCachedUsers } from "../contexts/CachedUserContext";
import LoadingSpinner from "../../components/loading/LoadingSpinner";

export default function ChildrenGallery() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const router = useRouter();
  const { cachedUsers, hydrated } = useCachedUsers();

  // Load cached users
  useEffect(() => {
    if (!hydrated) return;

    if (!cachedUsers || cachedUsers.length === 0) {
      router.replace("/login");
      return;
    }

    setUsers(cachedUsers);
    setIsLoading(false);
  }, [hydrated, cachedUsers, router]);

  // Handle login with selected cached account
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const isMatch = await bcrypt.compare(
        passwordInput,
        selectedUser.passwordHash
      );

      if (!isMatch) {
        alert("Incorrect password. Please try again.");
        setPasswordInput("");
        return;
      }

      // Store active user in localStorage
      localStorage.setItem(
        "activeUser",
        JSON.stringify({
          id: selectedUser.id,
          first_name: selectedUser.first_name,
          last_name: selectedUser.last_name,
          photo_uri: selectedUser.photo_uri,
        })
      );

      setSelectedUser(null);
      setPasswordInput("");
      setError("");

      router.push("/letterhome");
    } catch (err) {
      console.error(err);
      alert("Error logging in.");
      setPasswordInput("");
    }
  };

  if (isLoading) return <LoadingSpinner />;

  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <PageBackground>
      <PageContainer max-width="md" padding="p-8">
        <section className="p-4 max-w-[300px] m-auto">
          <div className="flex flex-col gap-2 items-center justify-center">
            <h1 className="font-bold text-xl text-center">
              Welcome Back!
            </h1>
            <p className="text-gray-600 text-center text-sm">
              Choose a profile to log in
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-6">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border border-gray-200 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden">
                    <ProfileImage
                      photo_uri={user.photo_uri}
                      first_name={user.first_name}
                    />
                  </div>
                </div>

                <p className="mt-3 font-semibold text-sm text-gray-900 text-center">
                  {user.first_name} {user.last_name}
                </p>

                <span className="text-xs text-gray-500 mt-1">
                  Tap to log in
                </span>
              </button>
            ))}
          </div>
        </section>
      </PageContainer>

      {/* Unlock Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="flex flex-col items-center">
              <div className="h-20 w-20 rounded-full overflow-hidden mb-3">
                <ProfileImage
                  photo_uri={selectedUser.photo_uri}
                  first_name={selectedUser.first_name}
                />
              </div>

              <h2 className="font-semibold text-lg text-center">
                {selectedUser.first_name} {selectedUser.last_name}
              </h2>

              <p className="text-sm text-gray-500 mb-4 text-center">
                Enter your password to continue
              </p>

              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative mb-4">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password"
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {passwordVisible ? "Hide" : "Show"}
                  </button>
                </div>

                <Button
                  color="green"
                  btnText="Log in"
                  btnType="submit"
                  fullWidth
                />
              </form>
            </div>
          </div>
        </div>
      )}
    </PageBackground>
  );
}
