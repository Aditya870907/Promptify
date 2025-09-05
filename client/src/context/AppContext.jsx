// Updated AppContextProvider.js (Add full address structure to initial formData)
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [user, setUser] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [credit, setCredit] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: "full",
    emiDuration: 0,
    billingDetails: {
      fullName: "",
      email: "",
      phone: "",
      address: { street: "", city: "", state: "", postalCode: "", country: "" },
    },
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const loadCreditsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/credits", {
        headers: { token },
      });

      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const generateImage = async (prompt) => {
    try {
      console.log("Sending req to backend with prompt", prompt);
      const { data } = await axios.post(
        backendUrl + "/api/image/generate-image",
        { prompt },
        { headers: { token } }
      );
      console.log("API Response", data);

      if (data.success) {
        loadCreditsData();
        console.log("Generated Image URL", data.resultImage);
        return data.resultImage;
      } else {
        toast.error(data.message);
        loadCreditsData();
        if (data.creditBalance === 0) {
          navigate("/buy");
        }
        return null;
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    // Reset formData on logout
    setFormData({
      paymentMethod: "full",
      emiDuration: 0,
      billingDetails: {
        fullName: "",
        email: "",
        phone: "",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      },
    });
  };

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
    localStorage.setItem("formData", JSON.stringify(newData));
  };

  useEffect(() => {
    if (token) {
      loadCreditsData();
    }
    const savedFormData = localStorage.getItem("formData");
    if (savedFormData) {
      setFormData((prev) => ({ ...prev, ...JSON.parse(savedFormData) }));
    } else {
      // Reset localStorage if invalid
      localStorage.removeItem("formData");
    }
  }, [token]);

  const value = {
    user,
    setUser,
    showLogin,
    setShowLogin,
    backendUrl,
    token,
    setToken,
    credit,
    setCredit,
    loadCreditsData,
    logout,
    generateImage,
    formData,
    updateFormData,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
