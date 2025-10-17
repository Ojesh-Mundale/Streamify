import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    console.log("ChatPage useEffect triggered");
    console.log("authUser:", authUser);
    console.log("tokenData:", tokenData);
    console.log("tokenLoading:", tokenLoading);
    console.log("tokenError:", tokenError);
    console.log("targetUserId:", targetUserId);

    const initChat = async () => {
      if (tokenLoading) {
        console.log("Token is still loading, waiting...");
        return;
      }

      if (tokenError) {
        console.log("Token fetch error:", tokenError);
        setLoading(false);
        return;
      }

      if (!tokenData?.token || !authUser) {
        console.log("Missing token or authUser, setting loading to false");
        setLoading(false);
        return;
      }

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        console.log("User connected to Stream");

        const channelId = [authUser._id, targetUserId].sort().join("-");
        console.log("Channel ID:", channelId);

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        console.log("Channel watched successfully");

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, tokenLoading, tokenError, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      // Use current origin for local development (works on mobile), deployed URL for production
      const baseUrl = import.meta.env.DEV ? window.location.origin : 'https://streamify-gktv.onrender.com';
      const callUrl = `${baseUrl}/call/${channel.id}`;

      // Open the call in the same tab on mobile, new tab on desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = callUrl;
      } else {
        window.open(callUrl, '_blank');
      }

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-screen w-full flex flex-col overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="flex-1 w-full relative overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
            <CallButton handleVideoCall={handleVideoCall} />
            <Window className="h-full overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
