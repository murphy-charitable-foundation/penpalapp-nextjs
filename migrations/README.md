# Data Migrations

We use data migration recipes here for modifying our data model in Firestore and other places we hold the data of the app. This 

## Firestore Data
We implemented and documented how to migrate firestore in `bulk_writer_migrate_collection.js`

## Cloud Storage Data
To sync the Firebase's Cloud Storages, we can remote sync as below:
```bash
gsutil -q -m rsync -r gs://penpalmagicapp.appspot.com gs://penpalmagicapp-dev.firebasestorage.app
```

## Authentication Data
Here's how to migrate users of authentication service
```bash
npm install -g firebase-tools
firebase login
firebase auth:export AllUsers.json --project penpalmagicapp
firebase auth:import AllUsers.json --project penpalmagicapp-dev
```
