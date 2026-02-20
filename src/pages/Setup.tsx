import { ProfileSetup } from "@/components/ProfileSetup";
import { useNavigate } from "react-router-dom";

const Setup = () => {
  const navigate = useNavigate();
  return <ProfileSetup onComplete={() => navigate("/view")} />;
};

export default Setup;
