import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <div className="p-3 border-b flex items-center justify-end w-full absolute top-0 z-10 bg-base-100">
      <button onClick={handleVideoCall} className="btn btn-success btn-sm text-white text-base">
        <VideoIcon className="size-5" />
      </button>
    </div>
  );
}

export default CallButton;
