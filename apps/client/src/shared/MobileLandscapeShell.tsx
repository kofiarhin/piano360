import { useEffect, useState, type ReactNode } from "react";

export const PHONE_VIEWPORT_QUERY =
  "((max-width: 767px) and (max-height: 1024px)), " +
  "((max-height: 767px) and (max-width: 1024px))";

const getIsPhoneViewport = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(PHONE_VIEWPORT_QUERY).matches;
};

export const useMobileLandscapeMode = () => {
  const [isActive, setIsActive] = useState(getIsPhoneViewport);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(PHONE_VIEWPORT_QUERY);
    const syncActiveState = () => setIsActive(mediaQuery.matches);

    syncActiveState();
    mediaQuery.addEventListener("change", syncActiveState);
    window.addEventListener("resize", syncActiveState);
    window.addEventListener("orientationchange", syncActiveState);

    return () => {
      mediaQuery.removeEventListener("change", syncActiveState);
      window.removeEventListener("resize", syncActiveState);
      window.removeEventListener("orientationchange", syncActiveState);
    };
  }, []);

  return isActive;
};

type MobileLandscapeShellProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
  testId?: string;
};

export const MobileLandscapeShell = ({
  active,
  children,
  className,
  testId
}: MobileLandscapeShellProps) => {
  const detectedActive = useMobileLandscapeMode();
  const isActive = active ?? detectedActive;

  useEffect(() => {
    document.body.classList.toggle("piano360-mobile-landscape", isActive);

    return () => document.body.classList.remove("piano360-mobile-landscape");
  }, [isActive]);

  return (
    <div
      data-testid={testId}
      data-mobile-landscape-shell={isActive ? "active" : "inactive"}
      className={[
        "mobile-landscape-shell",
        isActive ? "mobile-landscape-shell--active" : "",
        className ?? ""
      ].join(" ")}
    >
      {children}
    </div>
  );
};
