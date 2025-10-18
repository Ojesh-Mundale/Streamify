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
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoClient, setVideoClient] = useState(null);
  const [call, setCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [joiningCall, setJoiningCall] = useState(false);

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
    console.log("STREAM_API_KEY:", STREAM_API_KEY);

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

        console.log("Connecting user to chat client...");

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        console.log("User connected successfully");

        const channelId = [authUser._id, targetUserId].sort().join("-");
        console.log("Channel ID:", channelId);

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        console.log("Watching channel...");

        await currChannel.watch();

        console.log("Channel watched successfully");

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        console.error("Error details:", error.message, error.stack);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, tokenLoading, tokenError, authUser, targetUserId]);

  const handleVideoCall = async () => {
    if (!tokenData?.token || !authUser || !channel) {
      console.log("Missing required data for call:", { token: !!tokenData?.token, authUser: !!authUser, channel: !!channel });
      return;
    }

    setJoiningCall(true);
    try {
      console.log("Initializing Stream video client...");

      const user = {
        id: authUser._id,
        name: authUser.fullName,
        image: authUser.profilePic,
      };

      console.log("Creating video client with user:", user);

      const videoClientInstance = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user,
        token: tokenData.token,
      });

      console.log("Video client created, creating call instance...");

      const callInstance = videoClientInstance.call("default", channel.id);

      console.log("Call instance created, attempting to join...");

      await callInstance.join({ create: true });

      console.log("Joined call successfully");

      setVideoClient(videoClientInstance);
      setCall(callInstance);
      setInCall(true);

      // Send message to other participant
      channel.sendMessage({
        text: `📞 Video call started!`,
      });

      toast.success("Video call started!");
    } catch (error) {
      console.error("Error joining call:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error("Could not start the call. Please try again.");
    } finally {
      setJoiningCall(false);
    }
  };

  const handleEndCall = () => {
    if (call) {
      call.leave();
      setInCall(false);
      setCall(null);
      setVideoClient(null);
      toast.success("Call ended");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-screen w-full flex flex-col overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {inCall && videoClient && call ? (
        <StreamVideo client={videoClient}>
          <StreamCall call={call}>
            <CallContent onEndCall={handleEndCall} />
          </StreamCall>
        </StreamVideo>
      ) : (
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="flex-1 w-full relative overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
              <CallButton handleVideoCall={handleVideoCall} joiningCall={joiningCall} />
              <Window className="h-full overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      )}
    </div>
  );
};

const CallContent = ({ onEndCall }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      onEndCall();
    }
  }, [callingState, onEndCall]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default ChatPage;
