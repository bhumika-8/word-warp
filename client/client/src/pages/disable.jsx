import { useEffect } from "react";

const useDisableBackButton = () => {
  useEffect(() => {
    const handlePopState = () => {
      // Push the current state again, effectively disabling back
      window.history.pushState(null, "", window.location.href);
    };

    // Initial push to trap the user
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
};

export default useDisableBackButton;
