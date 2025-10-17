import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

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
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const handleJoinCall = async () => {
    console.log("CallPage handleJoinCall triggered");
    console.log("authUser:", authUser);
    console.log("tokenData:", tokenData);
    console.log("tokenLoading:", tokenLoading);
    console.log("tokenError:", tokenError);
    console.log("callId:", callId);
    console.log("STREAM_API_KEY:", STREAM_API_KEY);

    if (tokenLoading) {
      console.log("Token is still loading, cannot join call yet");
      return;
    }

    if (tokenError) {
      console.log("Token fetch error:", tokenError);
      toast.error("Failed to authenticate for call. Please try again.");
      return;
    }

    if (!tokenData?.token || !authUser || !callId) {
      console.log("Missing required data for call:", { token: !!tokenData?.token, authUser: !!authUser, callId: !!callId });
      return;
    }

    setJoining(true);
    try {
      console.log("Initializing Stream video client...");

      const user = {
        id: authUser._id,
        name: authUser.fullName,
        image: authUser.profilePic,
      };

      console.log("Creating video client with user:", user);

      const videoClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user,
        token: tokenData.token,
      });

      console.log("Video client created, creating call instance...");

      const callInstance = videoClient.call("default", callId);

      console.log("Call instance created, attempting to join...");

      await callInstance.join({ create: true });

      console.log("Joined call successfully");

      setClient(videoClient);
      setCall(callInstance);
      setJoined(true);
    } catch (error) {
      console.error("Error joining call:", error);
      console.error("Error details:", error.message, error.stack);
      toast.error("Could not join the call. Please check permissions and try again.");
    } finally {
      setJoining(false);
    }
  };

  if (isLoading && !joined) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {!joined ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <h2 className="text-2xl font-bold">Ready to join the call?</h2>
            <p className="text-center">Make sure to allow camera and microphone permissions when prompted.</p>
            <button
              onClick={handleJoinCall}
              disabled={joining}
              className="btn btn-primary btn-lg"
            >
              {joining ? "Joining..." : "Join Call"}
            </button>
          </div>
        ) : client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;
