"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, setDoc } from "firebase/firestore"
import { db } from '../../app/firebaseConfig'
import { PageContainer } from '../../components/general/PageContainer'
import { PageHeader } from '../../components/general/PageHeader'
import { PageBackground } from '../../components/general/PageBackground'
import Input from '../../components/general/Input'
import Button from '../../components/general/Button'
import TextArea from '../../components/general/TextArea'
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
    <PageBackground>
      <PageContainer maxWidth="lg">
        <PageHeader title="Import User Data"/>

        <form onSubmit={handleSubmit} className="space-y-6  p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <Input
                type="text"
                id="first-name"
                name="firstName"
                label="First Name"
                required={true}
              />
            </div>

            <div>
              <Input
                type="text"
                id="last-name"
                name="lastName"
                label="Last Name"
                required={true}
              />
            </div>

            <div>
              <Input
                type="email"
                name="email"
                id="email"
                label="Email"
                required={true}                
              />
            </div>

            <div>
              <Input
                type="date"
                id="birthday"
                name="birthday"
                label="birthday"
                required={true}
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
              <Input
                type="text"
                name="country"
                id="country"
                label="Country"
                required={true}
                
              />
            </div>

            <div>
              <Input
                type="text"
                id="village"
                name="village"
                label="Village"
                required={true}
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
              <Input
                type="text"
                name="dreamJob"
                id="dream-job"
                label="Dream Job"
                require={true}
              />
            </div>

            <div>              
              <Input
                type="text"
                id="hobby"
                name="hobby"
                label="Hobby"
                required={true}
              />
            </div>

            <div>
              <Input
                type="text"
                name="favoriteColor"
                id="favorite-color"
                label="Favorite Color"
                required={true}
              />
            </div>
          </div>

          <div className="col-span-2">
            
            <TextArea
              name="bio"
              rows={3}
              maxLength={50}
              label="Bio/Challenges Faced"
            />
          </div>

          <div className="flex justify-center">
            <Button 
              type="submit"
              disabled={isSubmitting}
              btnText={isSubmitting ? 'Importing...' : 'Import User Data'}
            />
          </div>
        </form>
      </PageContainer>
    </PageBackground>
  )
}