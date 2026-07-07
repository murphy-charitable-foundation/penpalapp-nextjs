import { getUserPfp } from "./uploadFile";

export async function refreshCachedUserPhoto(uid, updateCachedUserLogin) {
  const photo = await getUserPfp(uid);

  updateCachedUserLogin(uid, {
    photo_uri: photo || "",
  });
}