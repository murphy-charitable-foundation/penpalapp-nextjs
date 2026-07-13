# Data Migrations

We use data migration recipes here for modifying our data model in Firestore and other places we hold the data of the app. This 

## Firestore Data
We implemented and documented how to migrate firestore in each file of in the `migrations` folder. Remember that you would need to update the firestore access rules separately.

## Firestore Indices Data
For indices, we should use the following:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore --project penpalmagicapp-dev # and Go through its prompts
firebase firestore:indexes --project penpalmagicapp > firestore.indexes.json
firebase deploy --only firestore:indexes --project penpalmagicapp-dev
```

## Cloud Storage Data
To sync the Firebase's Cloud Storages, we can remote sync as below:
```bash
gsutil -q -m rsync -r gs://penpalmagicapp.appspot.com gs://penpalmagicapp-dev.firebasestorage.app
```
Remember that you would need to update the cloud storage access rules separately.

## Authentication Data
Here's how to migrate users of authentication service
```bash
firebase auth:export AllUsers.json --project penpalmagicapp
firebase auth:import AllUsers.json --project penpalmagicapp-dev
```
