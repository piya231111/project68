import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Notifications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/notifications");
    setList(res.data.notifications);

    // mark read
    res.data.notifications.forEach(n => {
      if (!n.is_read) {
        api.post(`/notifications/${n.id}/read`);
      }
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">แจ้งเตือน</h1>

      {list.length === 0 && (
        <p className="text-gray-500">ยังไม่มีแจ้งเตือน</p>
      )}

      <ul className="space-y-4">
        {list.map(n => (
          <li
            key={n.id}
            className="bg-white p-4 rounded-xl shadow border cursor-pointer"
          >
            <p className="font-semibold">{n.title}</p>
            <p className="text-gray-500 text-sm">{n.body}</p>
            <p className="text-gray-400 text-xs mt-1">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
