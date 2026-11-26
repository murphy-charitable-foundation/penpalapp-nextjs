const DB_NAME = 'penpal-cache-crypto';
const STORE_NAME = 'keys';
const KEY_ID = 'session-cache-key';

const generateKey = async () => {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Open the IndexedDB database used to store
 * the non-extractable encryption key.
 */
const openKeyDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Retrieve the existing encryption key or create one.
 * Use a read/write transaction to prevent competing
 * browser tabs from storing different keys.
 */
const getOrCreateKey = async () => {
  const db = await openKeyDB();

  try {
    const candidateKey = await generateKey();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_ID);

      let key;

      request.onsuccess = () => {
        if (request.result) {
          key = request.result;
        } else {
          key = candidateKey;
          store.add(key, KEY_ID);
        }
      };

      transaction.oncomplete = () => resolve(key);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
};

/**
 * Encrypt data using AES-GCM with a fresh IV.
 */
export const encryptData = async (data, uid) => {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: encoder.encode(uid),
    },
    key,
    plaintext
  );

  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext)),
  };
};

/**
 * Decrypt an AES-GCM encrypted cache payload.
 */
export const decryptData = async (encrypted, uid) => {
  const key = await getOrCreateKey();

  const iv = new Uint8Array(encrypted.iv);
  const ciphertext = new Uint8Array(encrypted.ciphertext);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(uid),
    },
    key,
    ciphertext
  );

  return JSON.parse(new TextDecoder().decode(plaintext));
};