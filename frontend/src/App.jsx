// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SelectCountry from "./pages/setup/Country";
import Avatar from "./pages/setup/Avatar";
import Items from "./pages/setup/Items";
import Category from "./pages/setup/Category";
import Lobby from "./pages/Lobby";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import ProfileView from "./pages/profile/ProfileView";
import ProfileEdit from "./pages/profile/ProfileEdit";
import AvatarSelect from "./pages/profile/AvatarSelect";
import ItemSelect from "./pages/profile/ItemSelect";
import FriendsPage from "./pages/friends/FriendsPage";
import ManageFriends from "./pages/friends/ManageFriends";
import Notifications from "./pages/Notifications";
import ChatRoom from "./pages/chat/ChatRoom";
import RandomChatWaiting from "./pages/RandomChatWaiting";
import RandomChatRoom from "./pages/RandomChatRoom";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ หน้า Auth (ไม่มี Header) */}
        <Route path="/" element={
          localStorage.getItem("access")
            ? <Navigate to="/home" />
            : <Navigate to="/login" />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/lobby" element={<Lobby />} />

        <Route path="/chat/:friendId" element={<ChatRoom />} />

        <Route path="/chat/random/wait" element={<RandomChatWaiting me={JSON.parse(localStorage.getItem("user"))} />} />
        <Route path="/chat/random/room/:roomId" element={<RandomChatRoom />} />

        {/* ✅ กลุ่ม “หลัง login” มี Header */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/profile/avatar" element={<AvatarSelect />} />
          <Route path="/profile/item" element={<ItemSelect />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/friends/manage" element={<ManageFriends />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* ✅ กลุ่ม Setup (ไม่มี Header) */}
        <Route path="/setup/country" element={<SelectCountry />} />
        <Route path="/setup/avatar" element={<Avatar />} />
        <Route path="/setup/items" element={<Items />} />
        <Route path="/setup/category" element={<Category />} />

      </Routes>
    </Router>
  );
}

export default App;
