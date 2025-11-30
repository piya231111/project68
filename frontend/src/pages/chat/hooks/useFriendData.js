import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api";

export default function useFriendData() {
  const { friendId } = useParams();

  const [friend, setFriend] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [item, setItem] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  /* โหลดข้อมูลเพื่อน */
  useEffect(() => {
    if (!friendId) return;

    api.get(`/friends/${friendId}`)
      .then((res) => setFriend(res.data.friend))
      .catch((err) => console.error("Load friend failed:", err));

  }, [friendId]);

  /* โหลด avatar/item/online */
  useEffect(() => {
    if (!friend) return;

    // avatar
    if (friend.avatar_id) {
      api.get(`/avatars/${friend.avatar_id}`)
        .then((res) => setAvatar(res.data));
    }

    // item
    if (friend.item_id) {
      api.get(`/items/${friend.item_id}`)
        .then((res) => setItem(res.data));
    }

    // online status
    api.get(`/friends/${friend.id}/status`)
      .then((res) => setIsOnline(res.data.is_online))
      .catch(() => {});
  }, [friend]);

  return {
    friendId,
    friend,
    avatar,
    item,
    isOnline,
  };
}
