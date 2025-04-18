import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuthGuard(): boolean {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setChecked(true);
    }
  }, [navigate]);

  return checked;
}
