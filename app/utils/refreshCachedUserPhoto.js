import { getUserPfp } from "./avatarUtils";

export async function refreshCachedUserPhoto(uid, updateCachedUserLogin) {
  const photo = await getUserPfp(uid);

  updateCachedUserLogin(uid, {
    photo_uri: photo || "",
  });
}