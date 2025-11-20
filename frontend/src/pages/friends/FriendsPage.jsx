import React, { useEffect, useState, useRef } from "react";
import { api } from "../../api";

import Tabs from "./Tabs";
import FriendsList from "./FriendsList";
import RequestsList from "./RequestsList";
import SearchSection from "./SearchSection";
import SearchResults from "./SearchResults";

import CategoryModal from "../../components/CategoryModal";
import FriendDetailModal from "../../components/FriendDetailModal";

export default function FriendsPage() {
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

    // -------------------- LOAD DATA --------------------
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

    // -------------------- ACTIONS --------------------
    const sendRequest = async (id) => {
        try {
            await api.post(`/friends/request/${id}`);
            setSentRequests((prev) => [...prev, id]);
        } catch (e) {
            console.error("sendRequest error:", e);
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

            // กรองเพื่อนออก (ไม่ให้ขึ้นในผลลัพธ์)
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
        new Map(friends.map(f => [f.id, f])).values()
    );

    return (
        <main className="flex justify-center items-center px-16 py-12 bg-[#E9FBFF]">
            <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-4xl border border-[#d0f6ff]">

                {/* ⭐ Tabs */}
                <Tabs tab={tab} setTab={setTab} />

                {/* ⭐ Friends */}
                {tab === "friends" && (
                    <FriendsList
                        friends={uniqueFriends}
                        onOpenDetail={(f) => {
                            setSelectedFriend(f);
                            setShowFriendModal(true);
                        }}
                        onToggleFavorite={toggleFavorite}
                        onRemoveFriend={removeFriend}
                    />
                )}

                {/* ⭐ Requests */}
                {tab === "requests" && (
                    <RequestsList
                        requests={requests}
                        onAccept={acceptRequest}
                        onDecline={declineRequest}
                        onOpenDetail={(f) => {
                            setSelectedFriend(f);
                            setShowFriendModal(true);
                        }}
                    />
                )}

                {/* ⭐ Search */}
                {tab === "search" && (
                    <>
                        <SearchSection
                            setShowCategoryModal={setShowCategoryModal}
                            setSelectedCategories={setSelectedCategories}
                            doSearch={doSearch}
                        />
                        <SearchResults
                            loading={loading}
                            results={searchResults}
                            sentRequests={sentRequests}
                            onSendRequest={sendRequest}
                            onOpenDetail={(f) => {
                                setSelectedFriend(f);
                                setShowFriendModal(true);
                            }}
                        />
                    </>
                )}
            </div>

            {/* Modal: Category */}
            {showCategoryModal && (
                <CategoryModal
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    onClose={() => setShowCategoryModal(false)}
                />
            )}

            {/* Modal: Friend detail */}
            {showFriendModal && (
                <FriendDetailModal
                    friend={selectedFriend}
                    onClose={() => setShowFriendModal(false)}
                    onToggleFavorite={toggleFavorite}
                    onRemoveFriend={removeFriend}
                    onAddFriend={sendRequest}
                />
            )}
        </main>
    );
}
