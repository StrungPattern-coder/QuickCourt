import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppError from "@/components/AppError";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <AppError
      code="404"
      title="This court is out of play."
      description="The route you opened does not match an active QuickCourt page. Head home or browse available venues."
      path={location.pathname}
    />
  );
};

export default NotFound;
