import { getUserPfp } from "./conversationsFunctions";

export async function refreshCachedUserPhoto(uid, updateCachedUserLogin) {
  const photo = await getUserPfp(uid);

  updateCachedUserLogin(uid, {
    photo_uri: photo || "",
  });
}