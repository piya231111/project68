import React, { useEffect, useState } from "react";
import { api } from "../../api";
import { useNavigate } from "react-router-dom";

import Tabs from "./Tabs";
import FriendsList from "./FriendsList";
import RequestsList from "./RequestsList";
import SearchSection from "./SearchSection";
import SearchResults from "./SearchResults";

import CategoryModal from "../../components/CategoryModal";
import FriendDetailModal from "../../components/FriendDetailModal";

export default function FriendsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState("friends");

    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    const [selectedFriend, setSelectedFriend] = useState(null);
    const [showFriendModal, setShowFriendModal] = useState(false);

    // โหลดข้อมูล
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [f, r, s] = await Promise.all([
                api.get("/friends"),
                api.get("/friends/requests"),
                api.get("/friends/sent"),
            ]);

            const normalized = (f.data.friends || []).map((x) => ({
                ...x,
                is_favorite: x.is_favorite === true || x.is_favorite === "true",
            }));

            setFriends(normalized);
            setRequests(r.data.requests || []);
            setSentRequests(s.data.sent || []);
        } catch (e) {
            console.error("load friends error:", e);
        }
    };

    const sendRequest = async (id) => {
        try {
            const res = await api.post(`/friends/request/${id}`);
            console.log("sendRequest OK:", res.data);
            setSentRequests((prev) => [...prev, id]);
        } catch (e) {
            console.error("sendRequest error:", e.response?.data || e);
        }
    };

    const acceptRequest = async (id) => {
        await api.post(`/friends/accept/${id}`);
        loadData();
    };

    const declineRequest = async (id) => {
        await api.post(`/friends/decline/${id}`);
        loadData();
    };

    const toggleFavorite = async (id) => {
        await api.put(`/friends/${id}/favorite`);
        loadData();
    };

    const removeFriend = async (id) => {
        await api.delete(`/friends/${id}`);
        loadData();
    };

    const doSearch = async (params) => {
        setLoading(true);
        try {
            const res = await api.get(`/friends/search?${params}`);
            const results = res.data.results || [];

            const friendIds = new Set(friends.map((f) => f.id));
            const filtered = results.filter((u) => !friendIds.has(u.id));

            setSearchResults(filtered);
        } catch (e) {
            console.error("search error:", e);
        } finally {
            setLoading(false);
        }
    };

    const uniqueFriends = Array.from(
        new Map(friends.map((f) => [f.id, f])).values()
    );

    return (
        <main className="flex justify-center items-start px-16 py-12 bg-[#E9FBFF] overflow-visible">
            <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-4xl border border-[#d0f6ff] relative overflow-visible z-[20]">

                <Tabs tab={tab} setTab={setTab} />

                {tab === "friends" && (
                    <FriendsList
                        friends={uniqueFriends}
                        onOpenDetail={(f) => {
                            setSelectedFriend({ ...f, isFriend: true });
                            setShowFriendModal(true);
                        }}
                        onToggleFavorite={toggleFavorite}
                        onRemoveFriend={removeFriend}
                    />
                )}

                {tab === "requests" && (
                    <RequestsList
                        requests={requests}
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                        onOpenDetail={(f) => {
                            setSelectedFriend({
                                ...f,
                                isFriend: false,  // ยังไม่ใช่เพื่อน
                            });
                            setShowFriendModal(true);
                        }}
                    />
                )}

                {tab === "search" && (
                    <>
                        <SearchSection
                            setShowCategoryModal={setShowCategoryModal}
                            setSelectedCategories={setSelectedCategories}
                            selectedCategories={selectedCategories}
                            doSearch={doSearch}
                        />
                        <SearchResults
                            loading={loading}
                            results={searchResults}
                            sentRequests={sentRequests}
                            incomingRequests={requests.map(r => r.id)}
                            onSendRequest={sendRequest}
                            onAccept={acceptRequest}
                            onDecline={declineRequest}
                            onOpenDetail={(f) => {
                                setSelectedFriend({ ...f, isFriend: false });
                                setShowFriendModal(true);
                            }}
                        />
                    </>
                )}
            </div>

            {showCategoryModal && (
                <CategoryModal
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}

            {showFriendModal && (
                <FriendDetailModal
                    friend={selectedFriend}
                    onClose={() => {
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                    }}

                    onAcceptRequest={(id) => {
                        acceptRequest(id);
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                    }}

                    onDeclineRequest={(id) => {
                        declineRequest(id);
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                    }}

                    onToggleFavorite={(id) => {
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                        toggleFavorite(id);     // ยิง API ทีหลัง ไม่ block UI
                    }}

                    onRemoveFriend={(id) => {
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                        removeFriend(id);
                    }}

                    onAddFriend={(id) => {
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                        sendRequest(id);
                    }}

                    onChat={(id) => {
                        setShowFriendModal(false);
                        setSelectedFriend(null);
                        navigate(`/chat/${id}`);
                    }}

                    onBlockUser={async (id) => {
                        await api.post(`/friends/${id}/block`);

                        // อัปเดต list ทั้งหมด
                        await loadData();

                        // ลบออกจากผลค้นหา
                        setSearchResults(prev => prev.filter(u => u.id !== id));

                        setShowFriendModal(false);
                        setSelectedFriend(null);
                    }}
                />
            )}
        </main>
    );
}
