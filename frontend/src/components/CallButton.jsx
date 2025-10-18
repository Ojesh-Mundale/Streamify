import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall, joiningCall = false, targetUserName }) {
  return (
    <div className="fixed top-0 left-0 right-0 p-3 border-b flex items-center justify-between w-full z-50 bg-base-100 shadow-sm">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-base-content">{targetUserName}</h2>
      </div>
      <button
        onClick={handleVideoCall}
        disabled={joiningCall}
        className="btn btn-success btn-sm text-white text-base"
      >
        {joiningCall ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <VideoIcon className="size-5" />
        )}
      </button>
    </div>
  );
}

export default CallButton;
