"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, setDoc } from "firebase/firestore"
import { db } from '../../app/firebaseConfig'
import * as Sentry from "@sentry/nextjs"

export default function UserDataImport() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const userData = {
        first_name: formData.get('firstName'),
        last_name: formData.get('lastName'),
        email: formData.get('email'),
        birthday: formData.get('birthday'),
        country: formData.get('country'),
        village: formData.get('village'),
        bio: formData.get('bio'),
        education_level: formData.get('educationLevel'),
        is_orphan: formData.get('isOrphan') === 'Yes',
        gaurdian: formData.get('guardian'),
        dream_job: formData.get('dreamJob'),
        hobby: formData.get('hobby'),
        favorite_color: formData.get('favoriteColor'),
        gender: formData.get('gender'),
      }

      // Generate a unique ID for the user
      const userId = crypto.randomUUID()
      await setDoc(doc(db, "users", userId), userData)
      
      // Reset form
      e.currentTarget.reset()
      alert('User data imported successfully!')
    } catch (error) {
      Sentry.captureException("Error importing user data: " + error)
      alert('Error importing user data')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import User Data</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Birthday</label>
              <input
                type="date"
                name="birthday"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Village</label>
              <input
                type="text"
                name="village"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Education Level</label>
              <select
                name="educationLevel"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              >
                <option value="">Select level</option>
                <option value="Elementary">Elementary</option>
                <option value="Middle">Middle</option>
                <option value="High School">High School</option>
                <option value="College/University">College/University</option>
                <option value="No Grade">No Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Is Orphan</label>
              <select
                name="isOrphan"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Guardian</label>
              <select
                name="guardian"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              >
                <option value="">Select guardian</option>
                <option value="Parents">Parents</option>
                <option value="AdoptiveParents">Adoptive Parents</option>
                <option value="Aunt/Uncle">Aunt/Uncle</option>
                <option value="Grandparents">Grandparents</option>
                <option value="Other Family">Other Family</option>
                <option value="Friends">Friends</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Dream Job</label>
              <input
                type="text"
                name="dreamJob"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Hobby</label>
              <input
                type="text"
                name="hobby"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Favorite Color</label>
              <input
                type="text"
                name="favoriteColor"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              />
            </div>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Bio/Challenges Faced</label>
            <textarea
              name="bio"
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700"
              maxLength={50}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Importing...' : 'Import User Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}